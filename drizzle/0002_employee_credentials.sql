CREATE TABLE `employee_credentials` (
	`employee_id` text PRIMARY KEY NOT NULL,
	`password_hash` text,
	`password_changed_at` text,
	`failed_attempts` integer DEFAULT 0 NOT NULL,
	`locked_until` text
);
