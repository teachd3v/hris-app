'use server';

import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { employees, attendances, leave_requests, holidays } from '@/lib/db/schema';
import { eq, and, isNull, gte, lte } from 'drizzle-orm';
import { uploadToStorage, deleteFromStorage } from '@/lib/storage';
import { validateUpload, IMAGE_KINDS, MB } from '@/lib/upload';
import { todayWIB } from '@/lib/time';
import { dayStatus, type DayStatus } from '@/lib/attendance-status';
import { parseIsoDate } from '@/lib/leave';
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

export interface AttendanceHistoryDay {
  date: string;
  /** TIDAK_ADA = hari kerja tanpa catatan presensi (netral, bukan tuduhan tidak hadir) */
  status: DayStatus | 'TIDAK_ADA';
  detail: string | null;
  clock_in: string | null;
  clock_out: string | null;
  duration_hours: number | null;
}

export interface AttendanceHistory {
  days: AttendanceHistoryDay[]; // terbaru dulu, sampai hari ini
  summary: { presentDays: number; totalHours: number; avgHours: number | null; leaveDays: number; missingClockOut: number };
  error?: string;
}

/** Riwayat presensi milik sendiri untuk satu bulan (jam masuk/pulang, durasi, status). */
export async function getMyAttendanceHistory(year: number, month: number): Promise<AttendanceHistory> {
  const empty = { days: [], summary: { presentDays: 0, totalHours: 0, avgHours: null, leaveDays: 0, missingClockOut: 0 } };
  const ctx = await currentEmployee();
  if (!ctx) return { ...empty, error: 'Not authenticated' };
  if (!Number.isInteger(year) || year < 2020 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
    return { ...empty, error: 'Bulan tidak valid' };
  }
  const { db, employee } = ctx;

  const mm = String(month).padStart(2, '0');
  const from = `${year}-${mm}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const to = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;
  const today = todayWIB();
  if (from > today) return empty;

  const [atts, leaves, hols] = await Promise.all([
    db.select({ date: attendances.date, clock_in: attendances.clock_in, clock_out: attendances.clock_out, duration_hours: attendances.duration_hours })
      .from(attendances)
      .where(and(eq(attendances.employee_id, employee.id), gte(attendances.date, from), lte(attendances.date, to))),
    db.select({ start: leave_requests.start_date, end: leave_requests.end_date, type: leave_requests.leave_type })
      .from(leave_requests)
      .where(and(eq(leave_requests.employee_id, employee.id), eq(leave_requests.status, 'APPROVED'), lte(leave_requests.start_date, to), gte(leave_requests.end_date, from))),
    db.select({ date: holidays.date, name: holidays.name }).from(holidays).where(and(gte(holidays.date, from), lte(holidays.date, to))),
  ]);

  const attBy = new Map(atts.map((a) => [a.date, a]));
  const holBy = new Map(hols.map((h) => [h.date, h.name]));
  const days: AttendanceHistoryDay[] = [];
  const last = to < today ? to : today;

  for (let d = Number(last.slice(8)); d >= 1; d--) {
    const date = `${year}-${mm}-${String(d).padStart(2, '0')}`;
    const dow = parseIsoDate(date)!.getUTCDay();
    const holiday = holBy.get(date) ?? null;
    const offDay = dow === 0 || dow === 6 || Boolean(holiday);
    const a = attBy.get(date);
    const leave = leaves.find((l) => l.start && l.end && l.start <= date && l.end >= date);
    const r = dayStatus({
      date, today, offDay, offLabel: holiday ?? (dow === 0 ? 'Minggu' : 'Sabtu'),
      clockIn: a?.clock_in, clockOut: a?.clock_out, leaveType: offDay ? undefined : leave?.type, // cuti hanya berlaku di hari kerja
    });
    days.push({
      date,
      status: r.status === 'TIDAK_HADIR' ? 'TIDAK_ADA' : r.status,
      detail: r.detail,
      clock_in: a?.clock_in ?? null,
      clock_out: a?.clock_out ?? null,
      duration_hours: a?.duration_hours != null ? Number(a.duration_hours) : null,
    });
  }

  const present = days.filter((x) => x.status === 'HADIR' || x.status === 'BELUM_PULANG' || x.status === 'TIDAK_CLOCK_OUT');
  const withHours = days.filter((x) => x.status === 'HADIR' && x.duration_hours != null);
  const totalHours = withHours.reduce((sum, x) => sum + (x.duration_hours ?? 0), 0);
  return {
    days,
    summary: {
      presentDays: present.length,
      totalHours,
      avgHours: withHours.length > 0 ? totalHours / withHours.length : null,
      leaveDays: days.filter((x) => x.status === 'CUTI').length,
      missingClockOut: days.filter((x) => x.status === 'TIDAK_CLOCK_OUT').length,
    },
  };
}
