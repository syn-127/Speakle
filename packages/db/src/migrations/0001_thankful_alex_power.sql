CREATE TABLE `login_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`created_at` integer NOT NULL
);
