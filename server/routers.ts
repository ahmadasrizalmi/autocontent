import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { FactoryService } from "./services/factory";
import { getAllPosts, getPostById, getAllAgents } from "./db";

// Initialize factory service
const factoryService = new FactoryService();

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Factory control router
  factory: router({
    start: publicProcedure
      .input(z.object({
        count: z.number().min(1).max(10).default(5)
      }))
      .mutation(async ({ input }) => {
        const result = await factoryService.startFactory({
          count: input.count
        });
        return {
          success: true,
          jobId: result.jobId,
          message: 'Content factory started successfully',
          estimatedTime: result.estimatedTime
        };
      }),

    stop: publicProcedure
      .input(z.object({
        jobId: z.string()
      }))
      .mutation(async ({ input }) => {
        await factoryService.stopFactory(input.jobId);
        return {
          success: true,
          message: 'Content factory stopped'
        };
      }),

    status: publicProcedure
      .input(z.object({
        jobId: z.string().optional()
      }).optional())
      .query(async ({ input }) => {
        const status = await factoryService.getStatus(input?.jobId);
        return status;
      })
  }),

  // Posts router
  posts: router({
    list: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0)
      }).optional())
      .query(async ({ input }) => {
        const posts = await getAllPosts(
          input?.limit || 20,
          input?.offset || 0
        );
        return {
          posts,
          total: posts.length
        };
      }),

    get: publicProcedure
      .input(z.object({
        id: z.number()
      }))
      .query(async ({ input }) => {
        const post = await getPostById(input.id);
        if (!post) {
          throw new Error('Post not found');
        }
        return post;
      })
  }),

  // Agents router
  agents: router({
    list: publicProcedure
      .query(async () => {
        const agents = await getAllAgents();
        return { agents };
      })
  })
});

export type AppRouter = typeof appRouter;
