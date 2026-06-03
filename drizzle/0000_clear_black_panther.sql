CREATE TABLE `embedding_stage_results` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`modality` text NOT NULL,
	`vector` blob NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `job_journal_jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `embedding_stage_results_job_modality_idx` ON `embedding_stage_results` (`job_id`,`modality`);--> statement-breakpoint
CREATE TABLE `job_journal_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`image_uri` text NOT NULL,
	`image_hash` text NOT NULL,
	`status` text NOT NULL,
	`vector_required` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `job_journal_jobs_image_hash_unique` ON `job_journal_jobs` (`image_hash`);--> statement-breakpoint
CREATE TABLE `keyword_stage_results` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`keyword` text NOT NULL,
	`type` text NOT NULL,
	`score` real NOT NULL,
	`positions_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `job_journal_jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `keyword_stage_results_job_keyword_idx` ON `keyword_stage_results` (`job_id`,`keyword`);--> statement-breakpoint
CREATE TABLE `metadata_stage_results` (
	`job_id` text PRIMARY KEY NOT NULL,
	`width` integer,
	`height` integer,
	`file_size` integer,
	`file_exists` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `job_journal_jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ocr_postprocess_stage_results` (
	`job_id` text PRIMARY KEY NOT NULL,
	`text` text,
	`blocks_json` text,
	`language` text,
	`block_count` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `job_journal_jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ocr_stage_results` (
	`job_id` text PRIMARY KEY NOT NULL,
	`text` text,
	`blocks_json` text,
	`language` text,
	`confidence` real,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `job_journal_jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `search_readiness` (
	`job_id` text PRIMARY KEY NOT NULL,
	`fts_ready` integer DEFAULT false NOT NULL,
	`vector_ready` integer DEFAULT false NOT NULL,
	`keywords_ready` integer DEFAULT false NOT NULL,
	`indexed_at` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `job_journal_jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `stage_checkpoints` (
	`job_id` text NOT NULL,
	`stage` text NOT NULL,
	`output_path` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`job_id`, `stage`),
	FOREIGN KEY (`job_id`) REFERENCES `job_journal_jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `stage_executions` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`stage` text NOT NULL,
	`attempt` integer DEFAULT 0 NOT NULL,
	`status` text NOT NULL,
	`lease_until` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`last_error` text,
	`last_error_code` text,
	`last_error_message` text,
	FOREIGN KEY (`job_id`) REFERENCES `job_journal_jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stage_executions_job_stage_idx` ON `stage_executions` (`job_id`,`stage`);--> statement-breakpoint
CREATE INDEX `stage_executions_status_created_idx` ON `stage_executions` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `stage_executions_running_lease_idx` ON `stage_executions` (`status`,`lease_until`);