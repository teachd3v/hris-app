-- Aman dijalankan berulang: hanya membuat tabel jika belum ada.
CREATE TABLE IF NOT EXISTS `leave_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text,
	`leave_type` text,
	`start_date` text,
	`end_date` text,
	`start_time` text,
	`end_time` text,
	`total_days` numeric,
	`reason` text,
	`attachment_url` text,
	`status` text,
	`manager_approved_by` text,
	`manager_approved_at` text,
	`manager_notes` text,
	`hc_approved_by` text,
	`hc_approved_at` text,
	`hc_notes` text,
	`created_at` text,
	`updated_at` text
);
