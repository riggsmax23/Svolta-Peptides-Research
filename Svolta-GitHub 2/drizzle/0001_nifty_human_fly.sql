CREATE TABLE `analytics_daily` (
	`day` text NOT NULL,
	`path` text NOT NULL,
	`event` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `analytics_day_path_event` ON `analytics_daily` (`day`,`path`,`event`);