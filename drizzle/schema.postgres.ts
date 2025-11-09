import { pgTable, serial, varchar, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Posts table - stores all generated content
 */
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  postId: varchar("postId", { length: 255 }).notNull().unique(),
  niche: varchar("niche", { length: 100 }).notNull(),
  caption: text("caption").notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  keywords: jsonb("keywords").$type<string[]>().notNull(),
  status: varchar("status", { length: 50 }).default("draft").notNull(),
  circloPostId: varchar("circloPostId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  publishedAt: timestamp("publishedAt"),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

/**
 * Jobs table - tracks content creation processes
 */
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  jobId: varchar("jobId", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  totalPosts: integer("totalPosts").default(0).notNull(),
  postsCreated: integer("postsCreated").default(0).notNull(),
  currentStep: text("currentStep"),
  currentAgent: varchar("currentAgent", { length: 100 }),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

/**
 * Agents table - monitors AI agent status
 */
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  status: varchar("status", { length: 50 }).default("idle").notNull(),
  description: text("description"),
  lastActive: timestamp("lastActive"),
  tasksCompleted: integer("tasksCompleted").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

/**
 * Videos table - stores generated videos
 */
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  videoId: varchar("videoId", { length: 255 }).notNull().unique(),
  postId: varchar("postId", { length: 255 }),
  niche: varchar("niche", { length: 100 }).notNull(),
  prompt: text("prompt").notNull(),
  storyScript: text("storyScript"),
  scenes: jsonb("scenes").$type<Scene[]>(),
  videoUrl: text("videoUrl"),
  thumbnailUrl: text("thumbnailUrl"),
  duration: integer("duration"),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  metadata: jsonb("metadata").$type<VideoMetadata>(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

export interface Scene {
  sceneNumber: number;
  description: string;
  cameraAngle: 'wide' | 'medium' | 'close-up' | 'overhead' | 'pov';
  duration: number;
  action: string;
  transition: 'cut' | 'fade' | 'dissolve' | 'wipe';
  videoUrl?: string;
}

export interface VideoMetadata {
  resolution?: string;
  format?: string;
  fps?: number;
  totalScenes?: number;
  provider?: string;
}
