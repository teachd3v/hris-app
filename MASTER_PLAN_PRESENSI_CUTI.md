# Master Plan Implementasi: Sistem Presensi & Cuti (HRIS TEACH)

## 1. Fitur Cuti (Multi-Stage Approval & ABAC)

### Alur Persetujuan (Approval Flow)
Setiap pengajuan cuti akan melewati maksimal 2 pintu persetujuan:
1. **Direct Manager (Atasan Langsung)**: Ditentukan berdasarkan relasi `manager_id` pada profil karyawan.
2. **Admin HC (Human Capital)**: Ditentukan berdasarkan hak akses/role (contoh: `role = 'Admin'`).

*Exception*: Jika yang mengajukan adalah pucuk pimpinan (misal: Chief TEACH), maka alur persetujuan "Direct Manager" bisa dilewati/langsung disetujui dan berlanjut ke tahap Admin HC.

### State Machine Status Cuti
Terdapat 4 status utama dalam tabel `leave_requests`:
- `PENDING_DIRECT_MANAGER`: Menunggu persetujuan atasan langsung.
- `PENDING_HC_ADMIN`: Atasan langsung menyetujui, menunggu verifikasi akhir oleh Admin HC.
- `APPROVED`: Cuti resmi disetujui, saldo cuti berkurang.
- `REJECTED`: Ditolak oleh salah satu pihak (proses langsung berhenti).

### Konsep ABAC (Transparansi Departemen)
Karyawan dengan atribut `dept` (departemen) yang sama dapat melihat jadwal cuti rekan satu timnya (yang berstatus `APPROVED`) di halaman kalender tim untuk menghindari jadwal cuti yang bertabrakan.

---

## 2. Fitur Presensi Harian (Advanced Attendance)

### Aturan Jam Kerja (Flexible Hours)
- **Clock-In (Masuk)**: Kisaran waktu `06:00` - `09:00` pagi.
- **Clock-Out (Pulang)**: Kisaran waktu `15:00` - `18:00` sore.
- **Durasi Kerja**: Fleksibel sekitar 8-9 jam sehari (Dihitung otomatis dari selisih waktu Clock-Out dan Clock-In). Jika karyawan absen masuk jam 09:00, maka wajarnya absen pulang di kisaran jam 17:00 atau 18:00.

### Geolocation Lock (Pembatasan Lokasi Absen)
Karyawan hanya dapat melakukan absen (Clock-In / Clock-Out) di lokasi kantor.
- **Titik Koordinat Lokasi Kantor**: `Latitude: -6.4733643, Longitude: 106.7274949` *(Mengacu pada tautan Maps House of Medina Wisata Djampang)*.
- **Radius Toleransi**: Maksimal **1 Kilometer (1000 meter)** dari titik koordinat di atas.
- *Teknis*: Aplikasi akan mengecek `navigator.geolocation` dari browser HP pengguna, lalu menghitung jarak menggunakan formula *Haversine* sebelum tombol absen aktif.

### Validasi Wajah (Face Recognition & Liveness)
- Saat melakukan Clock-In dan Clock-Out, user wajib melakukan **foto selfie** (menggunakan kamera *real-time*, tidak bisa unggah foto galeri).
- **Face Match Validation**: Sistem akan membandingkan foto selfie absensi dengan foto profil (*Master Photo*) karyawan yang tersimpan di database. Jika skor kemiripannya tinggi, absen divalidasi.
- *Saran Teknologi*: Bisa menggunakan integrasi API Face Recognition eksternal (seperti Face API Cloud / AWS Rekognition) atau library JS yang berjalan di sisi klien (seperti `face-api.js` untuk deteksi pola wajah).

---

## 3. Implikasi Skema Database (Supabase)

### Tabel `leave_requests` (Baru)
```sql
CREATE TABLE public.leave_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    status text DEFAULT 'PENDING_DIRECT_MANAGER', 
    manager_approved_by uuid REFERENCES public.employees(id),
    manager_approved_at timestamptz,
    hc_approved_by uuid REFERENCES public.employees(id),
    hc_approved_at timestamptz,
    created_at timestamptz DEFAULT now()
);
```

### Tabel `attendances` (Baru)
```sql
CREATE TABLE public.attendances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
    date date NOT NULL,
    clock_in timestamptz,
    clock_in_lat numeric,
    clock_in_lng numeric,
    clock_in_photo_url text,
    clock_out timestamptz,
    clock_out_lat numeric,
    clock_out_lng numeric,
    clock_out_photo_url text,
    duration_hours numeric,
    face_match_score numeric,
    status text, -- PRESENT, LEAVE, SICK, ABSENT
    created_at timestamptz DEFAULT now(),
    UNIQUE(employee_id, date)
);
```
