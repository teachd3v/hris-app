-- Email dipakai untuk login: tidak boleh ada dua karyawan dengan email yang sama (tanpa membedakan huruf besar/kecil).
-- Baris dengan email kosong/NULL diabaikan.
CREATE UNIQUE INDEX IF NOT EXISTS `employees_email_unique` ON `employees` (lower(`email`)) WHERE `email` IS NOT NULL AND `email` <> '';
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `employees_institutional_email_unique` ON `employees` (lower(`institutional_email`)) WHERE `institutional_email` IS NOT NULL AND `institutional_email` <> '';
