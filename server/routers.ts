import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { FactoryService } from "./services/factory";
import { VideoService } from "./services/video";
import { VideoPrompterService } from "./services/videoPrompter";
import { getAllPosts, getPostById, getAllAgents, getAllVideos, getVideoByVideoId } from "./db";

// Initialize services
const factoryService = new FactoryService();
const videoService = new VideoService();
const videoPrompterService = new VideoPrompterService();

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
  }),

  // Video generation router
  video: router({
    generate: publicProcedure
      .input(z.object({
        prompt: z.string().min(1),
        niche: z.string().optional(),
        sceneCount: z.number().min(1).max(5).default(3),
        totalDuration: z.number().min(15).max(60).default(30)
      }))
      .mutation(async ({ input }) => {
        const result = await videoService.generateVideo({
          prompt: input.prompt,
          niche: input.niche,
          sceneCount: input.sceneCount,
          totalDuration: input.totalDuration
        });
        return {
          success: true,
          videoId: result.videoId,
          message: 'Video generation started'
        };
      }),

    status: publicProcedure
      .input(z.object({
        videoId: z.string()
      }))
      .query(async ({ input }) => {
        const status = await videoService.getStatus(input.videoId);
        if (!status) {
          throw new Error('Video not found');
        }
        return status;
      }),

    cancel: publicProcedure
      .input(z.object({
        videoId: z.string()
      }))
      .mutation(async ({ input }) => {
        await videoService.cancelGeneration(input.videoId);
        return {
          success: true,
          message: 'Video generation cancelled'
        };
      }),

    list: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0)
      }).optional())
      .query(async ({ input }) => {
        const videos = await getAllVideos(
          input?.limit || 20,
          input?.offset || 0
        );
        return {
          videos,
          total: videos.length
        };
      }),

    get: publicProcedure
      .input(z.object({
        videoId: z.string()
      }))
      .query(async ({ input }) => {
        const video = await getVideoByVideoId(input.videoId);
        if (!video) {
          throw new Error('Video not found');
        }
        return video;
      })
  }),

  // Video Prompter Agent router
  videoPrompter: router({
    generate: publicProcedure
      .input(z.object({
        niche: z.string(),
        topic: z.string().optional(),
        mood: z.enum(['energetic', 'calm', 'dramatic', 'playful', 'professional', 'casual']).optional(),
        visualStyle: z.string().optional(),
        keywords: z.array(z.string()).optional()
      }))
      .mutation(async ({ input }) => {
        const result = await videoPrompterService.generatePrompt(input);
        return {
          success: true,
          ...result
        };
      }),

    getSuggestions: publicProcedure
      .input(z.object({
        niche: z.string(),
        count: z.number().min(1).max(5).default(3),
        topic: z.string().optional(),
        mood: z.enum(['energetic', 'calm', 'dramatic', 'playful', 'professional', 'casual']).optional()
      }))
      .query(async ({ input }) => {
        const { count, ...options } = input;
        const suggestions = await videoPrompterService.generateMultiplePrompts(options, count);
        return {
          suggestions
        };
      }),

    getNiches: publicProcedure
      .query(() => {
        const niches = videoPrompterService.getAvailableNiches();
        return {
          niches
        };
      }),

    getNicheInfo: publicProcedure
      .input(z.object({
        niche: z.string()
      }))
      .query(({ input }) => {
        const info = videoPrompterService.getNicheInfo(input.niche);
        if (!info) {
          throw new Error('Niche not found');
        }
        return info;
      })
  })
});

export type AppRouter = typeof appRouter;
