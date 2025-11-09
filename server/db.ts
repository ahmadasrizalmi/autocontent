import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, posts, InsertPost, Post, jobs, InsertJob, Job, agents, InsertAgent, Agent, videos, InsertVideo, Video } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Posts helpers
export async function createPost(post: InsertPost): Promise<Post> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(posts).values(post);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(posts).where(eq(posts.id, insertedId)).limit(1);
  return created[0];
}

export async function getAllPosts(limit: number = 20, offset: number = 0): Promise<Post[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(posts).orderBy(desc(posts.createdAt)).limit(limit).offset(offset);
}

export async function getPostById(id: number): Promise<Post | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return result[0];
}

export async function updatePostStatus(postId: string, status: string, circloPostId?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  if (status === 'published') {
    updateData.publishedAt = new Date();
  }
  if (circloPostId) {
    updateData.circloPostId = circloPostId;
  }

  await db.update(posts).set(updateData).where(eq(posts.postId, postId));
}

// Jobs helpers
export async function createJob(job: InsertJob): Promise<Job> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(jobs).values(job);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(jobs).where(eq(jobs.id, insertedId)).limit(1);
  return created[0];
}

export async function getJobByJobId(jobId: string): Promise<Job | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(jobs).where(eq(jobs.jobId, jobId)).limit(1);
  return result[0];
}

export async function getLatestRunningJob(): Promise<Job | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(jobs).where(eq(jobs.status, 'running')).orderBy(desc(jobs.startedAt)).limit(1);
  return result[0];
}

export async function updateJob(jobId: string, updates: Partial<InsertJob>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(jobs).set(updates).where(eq(jobs.jobId, jobId));
}

// Agents helpers
export async function upsertAgent(agent: InsertAgent): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(agents).values(agent).onDuplicateKeyUpdate({
    set: {
      status: agent.status,
      lastActive: agent.lastActive || new Date(),
      tasksCompleted: agent.tasksCompleted,
    },
  });
}

export async function getAllAgents(): Promise<Agent[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(agents);
}

export async function updateAgentStatus(name: string, status: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(agents).set({
    status,
    lastActive: new Date(),
  }).where(eq(agents.name, name));
}

export async function incrementAgentTasks(name: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const agent = await db.select().from(agents).where(eq(agents.name, name)).limit(1);
  if (agent[0]) {
    await db.update(agents).set({
      tasksCompleted: agent[0].tasksCompleted + 1,
    }).where(eq(agents.name, name));
  }
}

// Videos helpers
export async function createVideo(video: InsertVideo): Promise<Video> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(videos).values(video);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(videos).where(eq(videos.id, insertedId)).limit(1);
  return created[0];
}

export async function getAllVideos(limit: number = 20, offset: number = 0): Promise<Video[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(videos).orderBy(desc(videos.createdAt)).limit(limit).offset(offset);
}

export async function getVideoById(id: number): Promise<Video | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  return result[0];
}

export async function getVideoByVideoId(videoId: string): Promise<Video | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(videos).where(eq(videos.videoId, videoId)).limit(1);
  return result[0];
}

export async function updateVideo(videoId: string, updates: Partial<InsertVideo>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(videos).set(updates).where(eq(videos.videoId, videoId));
}

export async function updateVideoStatus(
  videoId: string, 
  status: string, 
  videoUrl?: string,
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  
  if (status === 'completed') {
    updateData.completedAt = new Date();
    if (videoUrl) {
      updateData.videoUrl = videoUrl;
    }
  }
  
  if (status === 'failed' && errorMessage) {
    updateData.errorMessage = errorMessage;
    updateData.completedAt = new Date();
  }

  await db.update(videos).set(updateData).where(eq(videos.videoId, videoId));
}
