import { v4 as uuidv4 } from 'uuid';
import { StoryboardAgent } from './storyboard';
import { generateVideo, combineVideos } from '../_core/videoGeneration';
import {
  createVideo,
  updateVideo,
  updateVideoStatus,
  getVideoByVideoId
} from '../db';
import { broadcastEvent } from '../_core/socket';
import type { Scene } from '../../drizzle/schema';

export interface VideoGenerationConfig {
  prompt: string;
  niche?: string;
  sceneCount?: number;
  totalDuration?: number;
}

export interface VideoGenerationStatus {
  videoId: string;
  status: string;
  progress: number;
  currentScene?: number;
  totalScenes?: number;
  videoUrl?: string;
  errorMessage?: string;
}

export class VideoService {
  private storyboardAgent: StoryboardAgent;
  private runningJobs: Map<string, boolean>;

  constructor() {
    this.storyboardAgent = new StoryboardAgent();
    this.runningJobs = new Map();
  }

  /**
   * Start video generation process
   */
  async generateVideo(config: VideoGenerationConfig): Promise<{ videoId: string }> {
    const videoId = uuidv4();

    // Create video record
    await createVideo({
      videoId,
      niche: config.niche || 'general',
      prompt: config.prompt,
      status: 'pending',
      duration: config.totalDuration || 30
    });

    // Mark as running
    this.runningJobs.set(videoId, true);

    // Start generation workflow asynchronously
    this.executeVideoGeneration(videoId, config).catch(async (error) => {
      console.error('[VideoService] Generation error:', error);
      await this.handleError(videoId, error);
    });

    return { videoId };
  }

  /**
   * Execute the complete video generation workflow
   */
  private async executeVideoGeneration(
    videoId: string,
    config: VideoGenerationConfig
  ): Promise<void> {
    try {
      // Check if job was stopped
      if (!this.runningJobs.get(videoId)) {
        console.log(`[VideoService] Job ${videoId} was stopped`);
        return;
      }

      // Step 1: Create storyboard
      await updateVideoStatus(videoId, 'processing');
      broadcastEvent('video_generation_started', {
        videoId,
        progress: 0,
        currentStep: 'Creating storyboard'
      });

      const storyboard = await this.storyboardAgent.createStoryboard({
        prompt: config.prompt,
        niche: config.niche,
        sceneCount: config.sceneCount || 3,
        totalDuration: config.totalDuration || 30
      });

      await updateVideo(videoId, {
        storyScript: storyboard.overallPrompt,
        scenes: storyboard.scenes,
        niche: storyboard.niche
      });

      broadcastEvent('video_storyboard_created', {
        videoId,
        progress: 20,
        storyboard
      });

      // Step 2: Generate each scene
      const sceneVideos: string[] = [];
      const totalScenes = storyboard.scenes.length;

      for (let i = 0; i < totalScenes; i++) {
        if (!this.runningJobs.get(videoId)) {
          console.log(`[VideoService] Job ${videoId} was stopped`);
          return;
        }

        const scene = storyboard.scenes[i];
        const progress = 20 + ((i / totalScenes) * 60); // 20-80% for scene generation

        broadcastEvent('video_scene_processing', {
          videoId,
          progress,
          currentScene: i + 1,
          totalScenes,
          sceneDescription: scene.description
        });

        // Generate scene prompt
        const scenePrompt = this.storyboardAgent.generateScenePrompt(
          scene,
          i > 0 ? storyboard.scenes[i - 1] : undefined
        );

        // Generate video for this scene
        const { videoUrl } = await generateVideo({
          prompt: scenePrompt,
          duration: scene.duration
        });

        if (videoUrl) {
          sceneVideos.push(videoUrl);
          
          // Update scene with video URL
          const updatedScenes = [...storyboard.scenes];
          updatedScenes[i] = { ...scene, videoUrl };
          await updateVideo(videoId, { scenes: updatedScenes });

          broadcastEvent('video_scene_completed', {
            videoId,
            progress,
            sceneNumber: i + 1,
            totalScenes,
            sceneVideoUrl: videoUrl
          });
        }
      }

      // Step 3: Combine scenes (if multiple)
      broadcastEvent('video_combining_scenes', {
        videoId,
        progress: 85,
        currentStep: 'Combining scenes'
      });

      let finalVideoUrl: string;
      if (sceneVideos.length > 1) {
        finalVideoUrl = await combineVideos(sceneVideos);
      } else {
        finalVideoUrl = sceneVideos[0];
      }

      // Step 4: Finalize
      await updateVideoStatus(videoId, 'completed', finalVideoUrl);

      broadcastEvent('video_completed', {
        videoId,
        progress: 100,
        videoUrl: finalVideoUrl
      });

      this.runningJobs.delete(videoId);
      console.log(`[VideoService] Video ${videoId} completed successfully`);

    } catch (error) {
      console.error(`[VideoService] Error generating video ${videoId}:`, error);
      throw error;
    }
  }

  /**
   * Get video generation status
   */
  async getStatus(videoId: string): Promise<VideoGenerationStatus | null> {
    const video = await getVideoByVideoId(videoId);
    
    if (!video) {
      return null;
    }

    const totalScenes = video.scenes?.length || 0;
    const completedScenes = video.scenes?.filter(s => s.videoUrl).length || 0;
    
    let progress = 0;
    if (video.status === 'completed') {
      progress = 100;
    } else if (video.status === 'processing' && totalScenes > 0) {
      progress = 20 + ((completedScenes / totalScenes) * 60);
    }

    return {
      videoId: video.videoId,
      status: video.status,
      progress,
      currentScene: completedScenes + 1,
      totalScenes,
      videoUrl: video.videoUrl || undefined,
      errorMessage: video.errorMessage || undefined
    };
  }

  /**
   * Cancel video generation
   */
  async cancelGeneration(videoId: string): Promise<void> {
    this.runningJobs.set(videoId, false);
    await updateVideoStatus(videoId, 'cancelled');
    
    broadcastEvent('video_cancelled', { videoId });
    console.log(`[VideoService] Video ${videoId} cancelled`);
  }

  /**
   * Handle errors during generation
   */
  private async handleError(videoId: string, error: Error): Promise<void> {
    await updateVideoStatus(videoId, 'failed', undefined, error.message);

    broadcastEvent('video_failed', {
      videoId,
      error: error.message
    });

    this.runningJobs.delete(videoId);
  }
}
