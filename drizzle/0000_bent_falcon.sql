CREATE TABLE `events` (
	`userId` text NOT NULL,
	`noteId` text NOT NULL,
	`kind` text NOT NULL,
	`bucket` integer NOT NULL,
	`createdAt` integer NOT NULL,
	PRIMARY KEY(`userId`, `noteId`, `kind`, `bucket`),
	FOREIGN KEY (`noteId`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_events_created` ON `events` (`createdAt`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`joinedAt` integer NOT NULL,
	`lastSeen` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_members_last_seen` ON `members` (`lastSeen`);--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`topic` text NOT NULL,
	`date` text DEFAULT '' NOT NULL,
	`week` integer DEFAULT 0 NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`driveUrl` text DEFAULT '' NOT NULL,
	`handwrittenUrl` text DEFAULT '' NOT NULL,
	`codeUrl` text DEFAULT '' NOT NULL,
	`fileKey` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_notes_status_date` ON `notes` (`status`,`date`);--> statement-breakpoint
CREATE TABLE `reading` (
	`userId` text NOT NULL,
	`noteId` text NOT NULL,
	`saved` integer DEFAULT 0 NOT NULL,
	`completed` integer DEFAULT 0 NOT NULL,
	`lastPage` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`userId`, `noteId`),
	FOREIGN KEY (`noteId`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
