CREATE TABLE `leave_quotas` (
	`employee_id` text NOT NULL,
	`leave_type` text NOT NULL,
	`year` integer NOT NULL,
	`quota` numeric NOT NULL,
	`updated_at` text,
	PRIMARY KEY(`employee_id`, `leave_type`, `year`)
);
