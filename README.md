# TEACH Portal — HRIS App

Sistem Informasi SDM internal untuk **TEACH GREAT Edunesia**: profil karyawan, presensi, cuti, dokumen, dan asesmen.
Berjalan penuh di ekosistem **Cloudflare** — produksi: <https://hrteach.site>.

## Tech stack

| Lapisan | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Runtime / hosting | Cloudflare Workers lewat [OpenNext](https://opennext.js.org/cloudflare) (`@opennextjs/cloudflare`) |
| Database | Cloudflare D1 (SQLite) + Drizzle ORM |
| File | Cloudflare R2 — bucket **privat**, hanya diakses lewat route `/storage/*` yang mewajibkan login |
| Auth | NextAuth v5 (Credentials: email + password, sesi JWT). Hash password PBKDF2 (WebCrypto) |
| Styling | Tailwind CSS v4 |
| CI | GitHub Actions (typecheck, lint, build produksi, cek drift migrasi) |

## Peran

- **Karyawan** — mengelola profil/dokumen sendiri, presensi, mengajukan cuti, mengisi asesmen.
- **Atasan langsung** — setiap karyawan wajib punya atasan (`employees.manager_id`) kecuali pucuk pimpinan (Haryo Mojopahit). Atasan menyetujui cuti bawahan di tahap pertama.
- **Admin / HC** — setiap admin adalah HC: persetujuan akhir cuti, jatah cuti, atasan, tambah/reset/hapus karyawan. Admin = `employees.role = 'Admin'` **atau** email ada di `lib/admins.ts`.
- **Super admin** — `hudagraph@gmail.com` (lihat `lib/admins.ts`). Satu-satunya yang boleh memberi/mencabut peran admin serta mengubah, mereset, dan menghapus akun admin lain. Akun super admin tidak dapat diubah siapa pun dari panel.

Aturan admin/super admin hanya didefinisikan di `lib/admins.ts` dan dihitung di server (`session.user.isAdmin`, `isSuperAdmin`).

## Login

Email + password. **Password awal semua akun: `HR@2026!`** (bisa diubah lewat env `DEFAULT_PASSWORD`). Karyawan mengganti sendiri dari menu Profil; admin dapat mereset ke default dari halaman detail karyawan. 5 kali salah → akun terkunci 15 menit. Akun baru dibuat admin lewat **Tambah Karyawan** (tidak ada pendaftaran mandiri).

## Pengembangan lokal

Prasyarat: Node.js 20+ (disarankan 22). Di Windows, build OpenNext lebih andal lewat **WSL**.

```bash
git clone https://github.com/teachd3v/hris-app.git
cd hris-app
npm ci
cp .env.example .env.local       # untuk `npm run dev` — isi AUTH_SECRET
cp .env.example .dev.vars        # untuk `npm run preview` / build Cloudflare (isi yang sama)
```

Siapkan D1 lokal (berkas migrasi berurutan, lihat bagian Migrasi) lalu isi satu admin uji:

```bash
for f in 0000_strong_the_leader 0001_acoustic_silver_fox 0002_strange_scrambler \
         0003_employee_credentials 0004_leave_quotas 0005_attendance_unique \
         0006_unique_emails 0007_drop_google_auth_tables; do
  npx wrangler d1 execute hris-teachapp-db --local --file=drizzle/$f.sql
done

npx wrangler d1 execute hris-teachapp-db --local --command \
  "INSERT INTO employees (id,name,email,role,approval_status,profile_completed) VALUES ('a1','Admin Uji','admin@test.com','Admin','Approved',1)"

npm run dev        # http://localhost:3000 — login admin@test.com / HR@2026!
                   # (D1 & R2 lokal dipasang otomatis oleh OpenNext di mode dev)
```

Perintah lain:

| Perintah | Fungsi |
|---|---|
| `npm run typecheck` / `npm run lint` | Pemeriksaan statis |
| `npm run preview` | Build OpenNext + jalankan di runtime Workers lokal (workerd). **Gunakan ini untuk menguji perubahan server action** — beberapa error hanya muncul di build produksi |
| `npm run deploy` | Build + deploy ke Cloudflare (butuh `wrangler login`) |
| `npm run db:generate` | Buat migrasi Drizzle dari perubahan `lib/db/schema.ts` |

## Migrasi database

Migrasi ada di `drizzle/` dan dijalankan **manual** dengan `wrangler d1 execute --file`. Jangan memakai `wrangler d1 migrations apply` — database produksi belum punya tabel pelacak migrasi sehingga akan mengulang dari awal.

```bash
# produksi
npx wrangler d1 execute hris-teachapp-db --remote --file=drizzle/<berkas>.sql
```

Urutan untuk database baru: `0000` → `0007`. Berkas `custom_migration_institutional_email.sql` adalah sisa lama (sudah tercakup `0002`), **jangan** dijalankan di database baru. `drizzle/manual/` berisi SQL pendukung:

- `check_duplicates.sql` — jalankan sebelum menambah indeks unik (`0005`, `0006`).
- `create_leave_requests.sql` — membuat `leave_requests` bila belum ada (database lama).

`0007_drop_google_auth_tables.sql` menghapus tabel sisa login Google (`user`, `account`, `session`, `verificationToken`); aman dijalankan kapan saja setelah deploy versi login email+password.

Setiap perubahan `lib/db/schema.ts` wajib disertai migrasi (`npm run db:generate`); CI akan gagal bila ada selisih.

## Deploy & konfigurasi Cloudflare

Binding di `wrangler.jsonc`: `DB` (D1), `STORAGE` (R2 file karyawan), `NEXT_INC_CACHE_R2_BUCKET` (cache OpenNext), `ASSETS`, `IMAGES`, `WORKER_SELF_REFERENCE`. Akses hanya lewat domain kustom (`workers_dev` dan preview URL dimatikan).

Secret produksi (`npx wrangler secret put <NAMA>`): `AUTH_SECRET`, `AUTH_TRUST_HOST=true`. Opsional: `DEFAULT_PASSWORD`, `ATTENDANCE_ENFORCE_GEOFENCE=true`.

Setelah deploy: pastikan akses publik (`r2.dev`) bucket `hris-teachapp-storage` **nonaktif**.

## Struktur

```
app/admin/*          halaman admin (karyawan, asesmen, pengajuan cuti, kuota cuti)
app/employee/*       halaman karyawan (dashboard, profil, presensi, cuti, dokumen, asesmen)
app/storage/*        route file R2 (wajib login, cek kepemilikan)
auth.ts              NextAuth (Credentials + JWT)
lib/admins.ts        definisi admin & super admin
lib/auth-guard.ts    penjaga halaman/aksi server
lib/leave*.ts        aturan cuti & perhitungan jatah
lib/upload.ts        validasi unggahan (ukuran, magic bytes)
lib/db/schema.ts     skema Drizzle (sumber migrasi)
drizzle/             migrasi SQL
```

Rencana awal fitur presensi & cuti: `MASTER_PLAN_PRESENSI_CUTI.md`.
