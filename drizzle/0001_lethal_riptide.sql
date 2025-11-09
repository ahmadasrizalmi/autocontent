CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'idle',
	`description` text,
	`lastActive` timestamp,
	`tasksCompleted` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agents_id` PRIMARY KEY(`id`),
	CONSTRAINT `agents_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` varchar(255) NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`totalPosts` int NOT NULL DEFAULT 0,
	`postsCreated` int NOT NULL DEFAULT 0,
	`currentStep` text,
	`currentAgent` varchar(100),
	`errorMessage` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `jobs_jobId_unique` UNIQUE(`jobId`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` varchar(255) NOT NULL,
	`niche` varchar(100) NOT NULL,
	`caption` text NOT NULL,
	`mediaUrl` text NOT NULL,
	`keywords` json NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'draft',
	`circloPostId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`publishedAt` timestamp,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `posts_postId_unique` UNIQUE(`postId`)
);
