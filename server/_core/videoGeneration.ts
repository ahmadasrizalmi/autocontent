/**
 * Video generation helper using Gemini Veo 3.1 API
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
  duration?: number; // Duration in seconds (Veo generates 8 seconds)
  imageUrl?: string; // Optional starting image
};

export type GenerateVideoResponse = {
  videoUrl?: string;
  operationName?: string;
};

/**
 * Generate a single video scene using Gemini Veo 3.1
 */
export async function generateVideo(
  options: GenerateVideoOptions
): Promise<GenerateVideoResponse> {
  if (!ENV.forgeApiUrl) {
    throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  }
  if (!ENV.forgeApiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }

  return await generateVideoVeo(options);
}

/**
 * Generate video using Gemini Veo 3.1 API
 */
async function generateVideoVeo(
  options: GenerateVideoOptions
): Promise<GenerateVideoResponse> {
  // Build the full URL for Veo video generation
  const baseUrl = ENV.forgeApiUrl.endsWith("/")
    ? ENV.forgeApiUrl
    : `${ENV.forgeApiUrl}/`;
  const fullUrl = new URL(
    "videos.v1.VideoService/GenerateVideo",
    baseUrl
  ).toString();

  const requestBody: any = {
    prompt: options.prompt,
    model: "veo-3.1-generate-preview",
  };

  // Add image if provided
  if (options.imageUrl) {
    requestBody.image = {
      url: options.imageUrl
    };
  }

  // Step 1: Create generation request
  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "connect-protocol-version": "1",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Video generation request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const result = (await response.json()) as {
    operation: {
      name: string;
      done: boolean;
      response?: {
        generated_videos: Array<{
          video: {
            b64_data?: string;
            uri?: string;
          };
        }>;
      };
      error?: any;
    };
  };

  const operationName = result.operation.name;

  // Step 2: Poll for completion
  let attempts = 0;
  const maxAttempts = 120; // 10 minutes max (5 seconds interval)
  let operation = result.operation;
  
  while (!operation.done && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    // Poll operation status
    const statusUrl = new URL(
      `operations.v1.OperationsService/GetOperation`,
      baseUrl
    ).toString();

    const statusResponse = await fetch(statusUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "connect-protocol-version": "1",
        authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({
        name: operationName
      }),
    });

    if (!statusResponse.ok) {
      throw new Error(`Failed to check video status: ${statusResponse.statusText}`);
    }

    const statusResult = (await statusResponse.json()) as {
      operation: typeof operation;
    };

    operation = statusResult.operation;

    if (operation.error) {
      throw new Error(`Video generation failed: ${JSON.stringify(operation.error)}`);
    }

    attempts++;
  }

  if (!operation.done) {
    throw new Error('Video generation timeout');
  }

  // Step 3: Get video data
  if (!operation.response?.generated_videos?.[0]?.video) {
    throw new Error('No video in response');
  }

  const videoData = operation.response.generated_videos[0].video;
  let videoBuffer: Buffer;

  if (videoData.b64_data) {
    // Base64 encoded video
    videoBuffer = Buffer.from(videoData.b64_data, 'base64');
  } else if (videoData.uri) {
    // Download from URI
    const videoResponse = await fetch(videoData.uri);
    if (!videoResponse.ok) {
      throw new Error('Failed to download generated video');
    }
    videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
  } else {
    throw new Error('No video data in response');
  }

  // Step 4: Upload to S3
  const { url } = await storagePut(
    `videos/${Date.now()}.mp4`,
    videoBuffer,
    'video/mp4'
  );

  return { 
    videoUrl: url, 
    operationName 
  };
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
