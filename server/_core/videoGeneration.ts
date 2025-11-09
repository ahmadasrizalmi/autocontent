/**
 * Video generation helper using Runway Gen-3 API
 * 
 * Example usage:
 *   const { videoUrl } = await generateVideo({
 *     prompt: "A person walking through a forest, camera following from behind"
 *   });
 */
import { storagePut } from "server/storage";
import { ENV } from "./env";

export type GenerateVideoOptions = {
  prompt: string;
  duration?: number; // Duration in seconds (default: 5)
  imageUrl?: string; // Optional starting image
};

export type GenerateVideoResponse = {
  videoUrl?: string;
  taskId?: string;
};

/**
 * Generate a single video scene using Runway Gen-3
 */
export async function generateVideo(
  options: GenerateVideoOptions
): Promise<GenerateVideoResponse> {
  if (!ENV.videoApiUrl) {
    throw new Error("VIDEO_API_URL is not configured");
  }
  if (!ENV.videoApiKey) {
    throw new Error("VIDEO_API_KEY is not configured");
  }

  const provider = ENV.videoApiProvider || 'runway';

  if (provider === 'runway') {
    return await generateVideoRunway(options);
  } else {
    throw new Error(`Unsupported video provider: ${provider}`);
  }
}

/**
 * Generate video using Runway Gen-3 API
 */
async function generateVideoRunway(
  options: GenerateVideoOptions
): Promise<GenerateVideoResponse> {
  const duration = options.duration || 5;

  // Step 1: Create generation task
  const createResponse = await fetch(`${ENV.videoApiUrl}/v1/generate`, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "authorization": `Bearer ${ENV.videoApiKey}`,
    },
    body: JSON.stringify({
      prompt: options.prompt,
      duration: duration,
      image_url: options.imageUrl,
      model: "gen3a_turbo",
    }),
  });

  if (!createResponse.ok) {
    const detail = await createResponse.text().catch(() => "");
    throw new Error(
      `Video generation request failed (${createResponse.status} ${createResponse.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const createResult = await createResponse.json() as { id: string };
  const taskId = createResult.id;

  // Step 2: Poll for completion
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max (5 seconds interval)
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    const statusResponse = await fetch(`${ENV.videoApiUrl}/v1/tasks/${taskId}`, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "authorization": `Bearer ${ENV.videoApiKey}`,
      },
    });

    if (!statusResponse.ok) {
      throw new Error(`Failed to check video status: ${statusResponse.statusText}`);
    }

    const statusResult = await statusResponse.json() as {
      status: string;
      output?: string[];
      failure?: string;
    };

    if (statusResult.status === 'SUCCEEDED' && statusResult.output && statusResult.output.length > 0) {
      const videoUrl = statusResult.output[0];
      
      // Download and upload to S3
      const videoResponse = await fetch(videoUrl);
      if (!videoResponse.ok) {
        throw new Error('Failed to download generated video');
      }

      const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
      const { url } = await storagePut(
        `videos/${Date.now()}.mp4`,
        videoBuffer,
        'video/mp4'
      );

      return { videoUrl: url, taskId };
    } else if (statusResult.status === 'FAILED') {
      throw new Error(`Video generation failed: ${statusResult.failure || 'Unknown error'}`);
    }

    attempts++;
  }

  throw new Error('Video generation timeout');
}

/**
 * Combine multiple video URLs into a single video
 * This is a placeholder - actual implementation would use ffmpeg or video processing service
 */
export async function combineVideos(videoUrls: string[]): Promise<string> {
  // For now, we'll just return the first video
  // In production, you would use ffmpeg to concatenate videos
  // Example: ffmpeg -i "concat:video1.mp4|video2.mp4|video3.mp4" -c copy output.mp4
  
  if (videoUrls.length === 0) {
    throw new Error('No videos to combine');
  }

  if (videoUrls.length === 1) {
    return videoUrls[0];
  }

  // TODO: Implement actual video concatenation using ffmpeg
  // For MVP, we'll return the first video
  console.warn('[VideoGeneration] Video combining not yet implemented, returning first video');
  return videoUrls[0];
}
