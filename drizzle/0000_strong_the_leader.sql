CREATE TABLE `achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text,
	`title` text,
	`level` text,
	`date` text,
	`description` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `assessment_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`category` text,
	`description` text,
	`opening_text` text,
	`schema` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `attendances` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text,
	`date` text,
	`clock_in` text,
	`clock_in_lat` text,
	`clock_in_lng` text,
	`clock_in_photo_url` text,
	`clock_out` text,
	`clock_out_lat` text,
	`clock_out_lng` text,
	`clock_out_photo_url` text,
	`duration_hours` numeric,
	`face_match_score` text,
	`status` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `career_interests` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text,
	`position` text,
	`department` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `committee_experiences` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text,
	`event` text,
	`role` text,
	`year` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `educations` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text,
	`institution` text,
	`level` text,
	`field` text,
	`year` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `emergency_contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text,
	`name` text,
	`relationship` text,
	`phone` text,
	`address` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `employee_assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text,
	`template_id` text,
	`status` text,
	`deadline` text,
	`answers` text,
	`score` numeric,
	`feedback` text,
	`submitted_at` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `employee_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text,
	`title` text,
	`type` text,
	`size` text,
	`date` text,
	`category` text,
	`sub_category` text,
	`file_url` text,
	`created_at` text,
	`files` text
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_code` text,
	`name` text,
	`email` text,
	`phone` text,
	`nik` text,
	`birth_date` text,
	`gender` text,
	`nationality` text,
	`marital_status` text,
	`religion` text,
	`address` text,
	`city` text,
	`province` text,
	`postal_code` text,
	`country` text,
	`title` text,
	`dept` text,
	`level` text,
	`status` text,
	`join_date` text,
	`tenure` text,
	`manager` text,
	`bank` text,
	`leave_total` numeric,
	`leave_used` numeric,
	`attendance_present` integer,
	`attendance_late` integer,
	`photo_url` text,
	`created_at` text,
	`updated_at` text,
	`blood_type` text,
	`role` text,
	`ktp_address` text,
	`manager_id` text,
	`leave_ganti_hari` text
);
--> statement-breakpoint
CREATE TABLE `family_members` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text,
	`relationship` text,
	`name` text,
	`birth_date` text,
	`occupation` text,
	`phone` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `languages` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text,
	`name` text,
	`proficiency` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `non_formal_educations` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text,
	`name` text,
	`institution` text,
	`year` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `org_experiences` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text,
	`organization` text,
	`role` text,
	`period` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `promotion_histories` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text,
	`date` text,
	`type` text,
	`from_position` text,
	`to_position` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text,
	`name` text,
	`proficiency` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `social_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text,
	`activity` text,
	`organization` text,
	`role` text,
	`start_date` text,
	`end_date` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `trainings` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text,
	`name` text,
	`provider` text,
	`date` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `work_experiences` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text,
	`company` text,
	`position` text,
	`start_date` text,
	`end_date` text,
	`description` text,
	`created_at` text
);
