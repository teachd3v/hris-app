CREATE TABLE `leave_requests` (
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
--> statement-breakpoint
ALTER TABLE `employees` ADD `institutional_email` text;--> statement-breakpoint
ALTER TABLE `employees` ADD `approval_status` text;--> statement-breakpoint
ALTER TABLE `employees` ADD `profile_completed` integer;