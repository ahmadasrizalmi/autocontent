-- Autocontent Database Schema for PostgreSQL/Supabase
-- Generated for deployment

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  "loginMethod" VARCHAR(64),
  role VARCHAR(20) DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "lastSignedIn" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  "postId" VARCHAR(255) NOT NULL UNIQUE,
  niche VARCHAR(100) NOT NULL,
  caption TEXT NOT NULL,
  "mediaUrl" TEXT NOT NULL,
  keywords JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' NOT NULL,
  "circloPostId" VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "publishedAt" TIMESTAMP
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  "jobId" VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  "totalPosts" INTEGER DEFAULT 0 NOT NULL,
  "postsCreated" INTEGER DEFAULT 0 NOT NULL,
  "currentStep" TEXT,
  "currentAgent" VARCHAR(100),
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'idle' NOT NULL,
  description TEXT,
  "lastActive" TIMESTAMP,
  "tasksCompleted" INTEGER DEFAULT 0 NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  "videoId" VARCHAR(255) NOT NULL UNIQUE,
  "postId" VARCHAR(255),
  niche VARCHAR(100) NOT NULL,
  prompt TEXT NOT NULL,
  "storyScript" TEXT,
  scenes JSONB,
  "videoUrl" TEXT,
  "thumbnailUrl" TEXT,
  duration INTEGER,
  status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  metadata JSONB,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "completedAt" TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_niche ON posts(niche);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts("createdAt");
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_niche ON videos(niche);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos("createdAt");

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default agents
INSERT INTO agents (name, status, description, "tasksCompleted")
VALUES 
  ('Content Creator', 'idle', 'Generates engaging captions and content ideas', 0),
  ('Image Generator', 'idle', 'Creates stunning visuals using AI', 0),
  ('Video Storyboard', 'idle', 'Creates video storyboards with multiple scenes', 0),
  ('Video Generator', 'idle', 'Generates multi-angle story videos', 0),
  ('Video Prompter', 'idle', 'AI-powered video prompt generator', 0)
ON CONFLICT (name) DO NOTHING;

-- Grant permissions (adjust based on your RLS policies)
-- For now, we'll keep it simple and grant all to authenticated users
-- You can add Row Level Security (RLS) policies later

COMMENT ON TABLE users IS 'Core user table backing auth flow';
COMMENT ON TABLE posts IS 'Stores all generated content';
COMMENT ON TABLE jobs IS 'Tracks content creation processes';
COMMENT ON TABLE agents IS 'Monitors AI agent status';
COMMENT ON TABLE videos IS 'Stores generated videos with multi-angle scenes';
