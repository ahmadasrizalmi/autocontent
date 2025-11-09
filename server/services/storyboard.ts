import { invokeLLM } from '../_core/llm';
import type { Scene } from '../../drizzle/schema';

export interface VideoStory {
  title: string;
  niche: string;
  overallPrompt: string;
  totalDuration: number;
  scenes: Scene[];
}

export interface StoryboardOptions {
  prompt: string;
  niche?: string;
  sceneCount?: number;
  totalDuration?: number;
}

export class StoryboardAgent {
  /**
   * Create a complete video storyboard with multiple scenes
   */
  async createStoryboard(options: StoryboardOptions): Promise<VideoStory> {
    const sceneCount = options.sceneCount || 3;
    const totalDuration = options.totalDuration || 30;
    const durationPerScene = Math.floor(totalDuration / sceneCount);

    const systemPrompt = `You are a professional video storyboard creator. Create engaging, cinematic video stories with multiple camera angles and smooth transitions.`;

    const userPrompt = `Create a video storyboard for the following:

Topic: ${options.prompt}
${options.niche ? `Niche: ${options.niche}` : ''}
Number of scenes: ${sceneCount}
Total duration: ${totalDuration} seconds

Requirements:
1. Create a compelling story that flows naturally across ${sceneCount} scenes
2. Each scene should have a clear action and purpose
3. Use varied camera angles (wide, medium, close-up, overhead, pov)
4. Choose appropriate transitions between scenes
5. Make it visually engaging and dynamic

Return a JSON object with this exact structure:
{
  "title": "Video title",
  "niche": "Content niche",
  "overallPrompt": "Overall description of the video",
  "scenes": [
    {
      "sceneNumber": 1,
      "description": "Detailed visual description of the scene",
      "cameraAngle": "wide|medium|close-up|overhead|pov",
      "duration": ${durationPerScene},
      "action": "What happens in this scene",
      "transition": "cut|fade|dissolve|wipe"
    }
  ]
}`;

    const response = await invokeLLM({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content as string);

    return {
      title: result.title,
      niche: result.niche || options.niche || 'general',
      overallPrompt: result.overallPrompt,
      totalDuration,
      scenes: result.scenes.map((scene: any, index: number) => ({
        sceneNumber: index + 1,
        description: scene.description,
        cameraAngle: scene.cameraAngle,
        duration: scene.duration || durationPerScene,
        action: scene.action,
        transition: scene.transition
      }))
    };
  }

  /**
   * Generate a detailed video prompt for a single scene
   */
  generateScenePrompt(scene: Scene, previousScene?: Scene): string {
    let prompt = scene.description;

    // Add camera angle instruction
    const cameraInstructions = {
      'wide': 'Wide angle shot, showing the full environment',
      'medium': 'Medium shot, balanced view of subject and surroundings',
      'close-up': 'Close-up shot, focusing on details',
      'overhead': 'Overhead shot, bird\'s eye view',
      'pov': 'Point of view shot, first-person perspective'
    };

    prompt += `. ${cameraInstructions[scene.cameraAngle]}.`;

    // Add action
    prompt += ` ${scene.action}.`;

    // Add cinematic quality instructions
    prompt += ' Cinematic lighting, high quality, professional video production.';

    return prompt;
  }
}
