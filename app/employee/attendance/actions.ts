'use server';

import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { employees, attendances } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getStorageClient, BUCKET_NAME } from '@/lib/storage';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export async function fetchAttendanceData() {
  const session = await auth();
  if (!session?.user?.email) return { error: 'Not authenticated' };

  const db = getDb();
  const empRecords = await db.select().from(employees).where(eq(employees.email, session.user.email)).limit(1);
  if (empRecords.length === 0) return { error: 'Employee not found' };
  
  const employee = empRecords[0];
  const today = new Date().toISOString().split('T')[0];

  const attRecords = await db.select()
    .from(attendances)
    .where(and(
      eq(attendances.employee_id, employee.id),
      eq(attendances.date, today)
    ))
    .limit(1);

  return {
    employee,
    attendanceToday: attRecords.length > 0 ? attRecords[0] : null
  };
}

export async function submitAttendance(type: 'in' | 'out', formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return { error: 'Not authenticated' };

  const file = formData.get('file') as Blob;
  const lat = formData.get('lat') as string;
  const lng = formData.get('lng') as string;

  const db = getDb();
  const empRecords = await db.select().from(employees).where(eq(employees.email, session.user.email)).limit(1);
  if (empRecords.length === 0) return { error: 'Employee not found' };
  const employee = empRecords[0];

  let publicUrl = null;
  if (file) {
    const s3 = getStorageClient();
    const fileName = `attendances/${employee.id}/${Date.now()}_${type}.jpg`;
    const buffer = Buffer.from(await file.arrayBuffer());
    
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: 'image/jpeg'
    }));

    // Cloudflare R2 public URL format if custom domain or dev domain is configured.
    // Replace with the actual public URL endpoint for the bucket
    publicUrl = `https://pub-your-cloudflare-r2-url.r2.dev/${fileName}`; 
    // Ideally the public R2 domain should come from env, but we'll use a placeholder or relative path
    // Actually, R2 supports public buckets, so we use a standard public URL from env.
    const r2PublicUrl = process.env.R2_PUBLIC_URL || `https://pub-placeholder.r2.dev`;
    publicUrl = `${r2PublicUrl}/${fileName}`;
  }

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  if (type === 'in') {
    await db.insert(attendances).values({
      id: crypto.randomUUID(),
      employee_id: employee.id,
      date: today,
      clock_in: now,
      clock_in_lat: lat,
      clock_in_lng: lng,
      clock_in_photo_url: publicUrl,
      status: 'PRESENT',
      created_at: now
    });
  } else {
    // Find today's record
    const attRecords = await db.select().from(attendances).where(and(eq(attendances.employee_id, employee.id), eq(attendances.date, today))).limit(1);
    if (attRecords.length > 0) {
      const att = attRecords[0];
      let durationHours = 0;
      if (att.clock_in) {
        const inTime = new Date(att.clock_in).getTime();
        const outTime = new Date(now).getTime();
        durationHours = (outTime - inTime) / (1000 * 60 * 60);
      }
      await db.update(attendances).set({
        clock_out: now,
        clock_out_lat: lat,
        clock_out_lng: lng,
        clock_out_photo_url: publicUrl,
        duration_hours: durationHours.toString()
      }).where(eq(attendances.id, att.id));
    }
  }

  return { success: true };
}
