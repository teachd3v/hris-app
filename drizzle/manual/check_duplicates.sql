-- Jalankan SEBELUM migrasi 0005 dan 0006. Semua query harus mengembalikan 0 baris.

-- (0005) presensi ganda per karyawan per hari
SELECT employee_id, date, count(*) AS jumlah FROM attendances GROUP BY employee_id, date HAVING count(*) > 1;

-- (0006) email utama ganda
SELECT lower(email) AS email, count(*) AS jumlah FROM employees WHERE email IS NOT NULL AND email <> '' GROUP BY lower(email) HAVING count(*) > 1;

-- (0006) email lembaga ganda
SELECT lower(institutional_email) AS email, count(*) AS jumlah FROM employees WHERE institutional_email IS NOT NULL AND institutional_email <> '' GROUP BY lower(institutional_email) HAVING count(*) > 1;
