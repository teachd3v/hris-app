'use server';

import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { employees, attendances } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { uploadToStorage, deleteFromStorage } from '@/lib/storage';
import { validateUpload, IMAGE_KINDS, MB } from '@/lib/upload';
import { todayWIB } from '@/lib/time';
import { getDistanceFromLatLonInKm, OFFICE_LAT, OFFICE_LNG, MAX_RADIUS_KM } from '@/lib/geo';

// Pembatasan lokasi di server aktif jika ATTENDANCE_ENFORCE_GEOFENCE=true (default mati selama masa uji coba)
const enforceGeofence = () => process.env.ATTENDANCE_ENFORCE_GEOFENCE === 'true';

async function currentEmployee() {
  const session = await auth();
  const employeeId = session?.user?.id;
  if (!session?.user?.email || !employeeId) return null;
  const db = getDb();
  const [employee] = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
  return employee ? { db, employee } : null;
}

export async function fetchAttendanceData() {
  const ctx = await currentEmployee();
  if (!ctx) return { error: 'Not authenticated' };
  const { db, employee } = ctx;

  const attRecords = await db.select()
    .from(attendances)
    .where(and(
      eq(attendances.employee_id, employee.id),
      eq(attendances.date, todayWIB())
    ))
    .limit(1);

  return {
    employee,
    attendanceToday: attRecords.length > 0 ? attRecords[0] : null
  };
}

export async function submitAttendance(type: 'in' | 'out', formData: FormData) {
  const ctx = await currentEmployee();
  if (!ctx) return { error: 'Not authenticated' };
  const { db, employee } = ctx;

  if (type !== 'in' && type !== 'out') return { error: 'Jenis presensi tidak valid' };

  const lat = Number(formData.get('lat'));
  const lng = Number(formData.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return { error: 'Lokasi tidak valid' };
  }
  if (enforceGeofence()) {
    const dist = getDistanceFromLatLonInKm(lat, lng, OFFICE_LAT, OFFICE_LNG);
    if (dist > MAX_RADIUS_KM) return { error: `Anda berada di luar area kantor (${Math.round(dist * 1000)} m dari lokasi)` };
  }

  // Validasi foto sebelum menyentuh data
  const file = formData.get('file');
  let photo: Awaited<ReturnType<typeof validateUpload>> | null = null;
  if (file instanceof Blob && file.size > 0) {
    photo = await validateUpload(file, { maxBytes: 5 * MB, kinds: IMAGE_KINDS, name: 'Foto presensi' });
    if (!photo.ok) return { error: photo.error };
  }

  const today = todayWIB();
  const [existing] = await db.select().from(attendances)
    .where(and(eq(attendances.employee_id, employee.id), eq(attendances.date, today)))
    .limit(1);

  if (type === 'in' && existing) return { error: 'Anda sudah melakukan clock-in hari ini' };
  if (type === 'out') {
    if (!existing?.clock_in) return { error: 'Anda belum melakukan clock-in hari ini' };
    if (existing.clock_out) return { error: 'Anda sudah melakukan clock-out hari ini' };
  }

  let photoKey: string | null = null;
  if (photo?.ok) {
    photoKey = `attendances/${employee.id}/${Date.now()}_${type}.${photo.ext}`;
    await uploadToStorage(photoKey, photo.buffer, photo.contentType);
  }
  const publicUrl = photoKey ? `/storage/${photoKey}` : null;
  const now = new Date().toISOString();

  try {
    if (type === 'in') {
      await db.insert(attendances).values({
        id: crypto.randomUUID(),
        employee_id: employee.id,
        date: today,
        clock_in: now,
        clock_in_lat: String(lat),
        clock_in_lng: String(lng),
        clock_in_photo_url: publicUrl,
        status: 'PRESENT',
        created_at: now
      });
    } else {
      const durationHours = (new Date(now).getTime() - new Date(existing!.clock_in!).getTime()) / (1000 * 60 * 60);
      // Bersyarat: hanya jika belum clock-out (cegah balapan dua permintaan sekaligus)
      await db.update(attendances).set({
        clock_out: now,
        clock_out_lat: String(lat),
        clock_out_lng: String(lng),
        clock_out_photo_url: publicUrl,
        duration_hours: durationHours.toString()
      }).where(and(eq(attendances.id, existing!.id), isNull(attendances.clock_out)));
    }
  } catch (e) {
    if (photoKey) await deleteFromStorage(photoKey).catch(() => {});
    if (String((e as Error)?.message).includes('UNIQUE')) return { error: 'Anda sudah melakukan clock-in hari ini' };
    throw e;
  }

  return { success: true };
}
