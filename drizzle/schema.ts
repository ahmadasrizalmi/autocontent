import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Posts table - stores all generated content
 */
export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  postId: varchar("postId", { length: 255 }).notNull().unique(),
  niche: varchar("niche", { length: 100 }).notNull(),
  caption: text("caption").notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  keywords: json("keywords").$type<string[]>().notNull(),
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
export const jobs = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  jobId: varchar("jobId", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  totalPosts: int("totalPosts").default(0).notNull(),
  postsCreated: int("postsCreated").default(0).notNull(),
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
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  status: varchar("status", { length: 50 }).default("idle").notNull(),
  description: text("description"),
  lastActive: timestamp("lastActive"),
  tasksCompleted: int("tasksCompleted").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;
