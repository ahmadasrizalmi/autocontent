import { v4 as uuidv4 } from 'uuid';
import {
  TrendExplorerService,
  ShowrunnerService,
  ImageGeneratorService,
  CaptionWriterService
} from './agents';
import {
  createJob,
  updateJob,
  createPost,
  updatePostStatus,
  upsertAgent,
  updateAgentStatus,
  incrementAgentTasks,
  getJobByJobId,
  getLatestRunningJob
} from '../db';
import { publishToGetCirclo } from '../getcirclo';
import { broadcastEvent } from '../_core/socket';

export interface FactoryConfig {
  count: number;
}

export interface FactoryStatus {
  isRunning: boolean;
  currentJob?: {
    jobId: string;
    status: string;
    progress: number;
    postsCreated: number;
    totalPosts: number;
    currentAgent?: string;
    currentStep?: string;
    startedAt?: Date;
  };
}

export class FactoryService {
  private trendExplorer: TrendExplorerService;
  private showrunner: ShowrunnerService;
  private imageGenerator: ImageGeneratorService;
  private captionWriter: CaptionWriterService;
  private runningJobs: Map<string, boolean>;

  constructor() {
    this.trendExplorer = new TrendExplorerService();
    this.showrunner = new ShowrunnerService();
    this.imageGenerator = new ImageGeneratorService();
    this.captionWriter = new CaptionWriterService();
    this.runningJobs = new Map();
  }

  async initializeAgents(): Promise<void> {
    const agentsList = [
      { name: 'Trend Explorer', description: 'Discovering trending topics based on user preferences' },
      { name: 'Showrunner', description: 'Coordinating content creation workflow' },
      { name: 'Image Generator', description: 'Creating realistic iPhone-style photos' },
      { name: 'Caption Writer', description: 'Writing engaging captions with #DNA hashtag' }
    ];

    for (const agent of agentsList) {
      await upsertAgent({
        name: agent.name,
        status: 'idle',
        description: agent.description,
        tasksCompleted: 0
      });
    }
  }

  async startFactory(config: FactoryConfig): Promise<{ jobId: string; estimatedTime: number }> {
    // Initialize agents if not already done
    await this.initializeAgents();

    // Create job
    const jobId = uuidv4();
    await createJob({
      jobId,
      status: 'running',
      totalPosts: config.count,
      postsCreated: 0,
      startedAt: new Date()
    });

    // Mark as running
    this.runningJobs.set(jobId, true);

    // Start workflow asynchronously
    this.executeWorkflow(jobId, config).catch(async (error) => {
      console.error('[Factory] Workflow error:', error);
      await this.handleError(jobId, error);
    });

    return {
      jobId,
      estimatedTime: config.count * 30 // 30 seconds per post estimate
    };
  }

  async executeWorkflow(jobId: string, config: FactoryConfig): Promise<void> {
    const totalPosts = config.count;

    for (let i = 0; i < totalPosts; i++) {
      // Check if job was stopped
      if (!this.runningJobs.get(jobId)) {
        console.log(`[Factory] Job ${jobId} was stopped`);
        break;
      }

      try {
        const progress = (i / totalPosts) * 100;

        // Step 1: Trend Explorer - Find trending topic
        await updateAgentStatus('Trend Explorer', 'active');
        await updateJob(jobId, {
          currentStep: 'Finding trending topic',
          currentAgent: 'Trend Explorer'
        });
        broadcastEvent('status_update', {
          jobId,
          progress,
          currentStep: 'Finding trending topic',
          currentAgent: 'Trend Explorer'
        });

        const topic = await this.trendExplorer.findTopic();
        await incrementAgentTasks('Trend Explorer');
        await updateAgentStatus('Trend Explorer', 'idle');

        // Step 2: Showrunner - Create content plan
        await updateAgentStatus('Showrunner', 'active');
        await updateJob(jobId, {
          currentStep: 'Creating content plan',
          currentAgent: 'Showrunner'
        });
        broadcastEvent('status_update', {
          jobId,
          progress: ((i + 0.25) / totalPosts) * 100,
          currentStep: 'Creating content plan',
          currentAgent: 'Showrunner'
        });

        const plan = await this.showrunner.createPlan(topic);
        await incrementAgentTasks('Showrunner');
        await updateAgentStatus('Showrunner', 'idle');

        // Step 3: Image Generator - Generate image
        await updateAgentStatus('Image Generator', 'active');
        await updateJob(jobId, {
          currentStep: 'Generating image',
          currentAgent: 'Image Generator'
        });
        broadcastEvent('status_update', {
          jobId,
          progress: ((i + 0.5) / totalPosts) * 100,
          currentStep: 'Generating image',
          currentAgent: 'Image Generator'
        });

        const image = await this.imageGenerator.generate(plan);
        await incrementAgentTasks('Image Generator');
        await updateAgentStatus('Image Generator', 'idle');

        // Step 4: Caption Writer - Write caption
        await updateAgentStatus('Caption Writer', 'active');
        await updateJob(jobId, {
          currentStep: 'Writing caption',
          currentAgent: 'Caption Writer'
        });
        broadcastEvent('status_update', {
          jobId,
          progress: ((i + 0.75) / totalPosts) * 100,
          currentStep: 'Writing caption',
          currentAgent: 'Caption Writer'
        });

        const caption = await this.captionWriter.write(plan);
        await incrementAgentTasks('Caption Writer');
        await updateAgentStatus('Caption Writer', 'idle');

        // Step 5: Save post to database
        const postId = uuidv4();
        const post = await createPost({
          postId,
          niche: plan.niche,
          caption,
          mediaUrl: image.url,
          keywords: plan.keywords,
          status: 'draft'
        });

        // Step 6: Publish to GetCirclo
        await updateJob(jobId, {
          currentStep: 'Publishing to GetCirclo',
          currentAgent: 'Publisher'
        });
        broadcastEvent('status_update', {
          jobId,
          progress: ((i + 0.9) / totalPosts) * 100,
          currentStep: 'Publishing to GetCirclo',
          currentAgent: 'Publisher'
        });

        try {
          const circloResponse = await publishToGetCirclo({
            niche: plan.niche,
            mediaUrl: image.url,
            caption,
            keywords: plan.keywords
          });

          await updatePostStatus(postId, 'published', circloResponse.post.id);

          // Broadcast post created event
          broadcastEvent('post_created', {
            post: {
              ...post,
              status: 'published',
              circloPostId: circloResponse.post.id,
              publishedAt: new Date()
            }
          });
        } catch (error) {
          console.error('[Factory] Failed to publish to GetCirclo:', error);
          await updatePostStatus(postId, 'failed');
          
          broadcastEvent('error', {
            jobId,
            error: `Failed to publish post ${i + 1}: ${error}`,
            postIndex: i + 1
          });
        }

        // Update job progress
        await updateJob(jobId, {
          postsCreated: i + 1
        });

        console.log(`[Factory] Post ${i + 1}/${totalPosts} completed`);

      } catch (error) {
        console.error(`[Factory] Error creating post ${i + 1}:`, error);
        
        broadcastEvent('error', {
          jobId,
          error: `Error creating post ${i + 1}: ${error}`,
          postIndex: i + 1
        });
        
        // Continue to next post despite error
      }
    }

    // Mark job as complete
    await updateJob(jobId, {
      status: 'completed',
      completedAt: new Date(),
      currentStep: 'Completed',
      currentAgent: undefined
    });

    this.runningJobs.delete(jobId);

    const job = await getJobByJobId(jobId);
    broadcastEvent('job_complete', {
      jobId,
      postsCreated: job?.postsCreated || 0,
      success: true
    });

    console.log(`[Factory] Job ${jobId} completed successfully`);
  }

  async stopFactory(jobId: string): Promise<void> {
    this.runningJobs.set(jobId, false);

    await updateJob(jobId, {
      status: 'stopped',
      completedAt: new Date()
    });

    broadcastEvent('job_stopped', { jobId });
    console.log(`[Factory] Job ${jobId} stopped`);
  }

  async getStatus(jobId?: string): Promise<FactoryStatus> {
    let job;
    
    if (jobId) {
      job = await getJobByJobId(jobId);
    } else {
      job = await getLatestRunningJob();
    }

    if (!job) {
      return { isRunning: false };
    }

    const progress = job.totalPosts > 0 
      ? (job.postsCreated / job.totalPosts) * 100 
      : 0;

    return {
      isRunning: job.status === 'running',
      currentJob: {
        jobId: job.jobId,
        status: job.status,
        progress,
        postsCreated: job.postsCreated,
        totalPosts: job.totalPosts,
        currentAgent: job.currentAgent || undefined,
        currentStep: job.currentStep || undefined,
        startedAt: job.startedAt || undefined
      }
    };
  }

  private async handleError(jobId: string, error: Error): Promise<void> {
    await updateJob(jobId, {
      status: 'failed',
      errorMessage: error.message,
      completedAt: new Date()
    });

    broadcastEvent('error', {
      jobId,
      error: error.message
    });

    this.runningJobs.delete(jobId);
  }
}
