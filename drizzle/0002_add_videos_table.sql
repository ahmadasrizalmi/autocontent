-- Add videos table for video generation feature
CREATE TABLE `videos` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `videoId` varchar(255) NOT NULL UNIQUE,
  `postId` varchar(255),
  `niche` varchar(100) NOT NULL,
  `prompt` text NOT NULL,
  `storyScript` text,
  `scenes` json,
  `videoUrl` text,
  `thumbnailUrl` text,
  `duration` int,
  `status` varchar(50) DEFAULT 'pending' NOT NULL,
  `metadata` json,
  `errorMessage` text,
  `createdAt` timestamp DEFAULT (now()) NOT NULL,
  `completedAt` timestamp
);

-- Add index for faster queries
CREATE INDEX `idx_videos_status` ON `videos` (`status`);
CREATE INDEX `idx_videos_created_at` ON `videos` (`createdAt`);
