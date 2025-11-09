import { callGemini, convertToGeminiMessages } from '../_core/gemini.js';

export interface VideoPromptOptions {
  niche: string;
  topic?: string;
  mood?: 'energetic' | 'calm' | 'dramatic' | 'playful' | 'professional' | 'casual';
  visualStyle?: string;
  keywords?: string[];
}

export interface VideoPromptResult {
  concept: string;
  prompt: string;
  visualStyle: string;
  suggestedScenes: number;
  suggestedDuration: number;
  mood: string;
}

// Niche-specific content types and themes
const NICHE_TEMPLATES = {
  'Tech Reviewer': {
    contentTypes: ['unboxing', 'product review', 'comparison', 'feature demo', 'setup guide', 'hands-on'],
    visualStyles: ['minimalist', 'modern', 'white_aesthetic', 'professional'],
    commonElements: ['product close-ups', 'hands interacting', 'screen displays', 'tech workspace'],
    audioElements: ['unboxing sounds', 'device clicks', 'keyboard typing', 'modern electronic music'],
  },
  'Foodie': {
    contentTypes: ['recipe tutorial', 'cooking process', 'food styling', 'restaurant review', 'ingredient showcase'],
    visualStyles: ['warm', 'appetizing', 'rustic', 'elegant'],
    commonElements: ['ingredient close-ups', 'cooking actions', 'plating', 'steam and sizzle'],
    audioElements: ['sizzling', 'chopping', 'pouring', 'soft background music', 'satisfied reactions'],
  },
  'Travel': {
    contentTypes: ['destination showcase', 'journey montage', 'cultural experience', 'landscape panorama', 'adventure'],
    visualStyles: ['cinematic', 'vibrant', 'natural', 'wanderlust'],
    commonElements: ['sweeping landscapes', 'local culture', 'transportation', 'iconic landmarks'],
    audioElements: ['ambient sounds', 'local music', 'nature sounds', 'travel vlog narration'],
  },
  'Lifestyle': {
    contentTypes: ['morning routine', 'wellness activity', 'home organization', 'daily vlog', 'self-care'],
    visualStyles: ['cozy', 'minimalist', 'white_aesthetic', 'warm'],
    commonElements: ['home interiors', 'personal moments', 'lifestyle products', 'natural lighting'],
    audioElements: ['soft music', 'ambient home sounds', 'gentle narration', 'calming background'],
  },
  'Fashion': {
    contentTypes: ['outfit transition', 'styling session', 'accessory showcase', 'runway walk', 'wardrobe tour'],
    visualStyles: ['chic', 'elegant', 'trendy', 'bold'],
    commonElements: ['outfit details', 'mirror shots', 'clothing textures', 'accessories'],
    audioElements: ['upbeat music', 'fabric sounds', 'confident footsteps', 'fashion commentary'],
  },
  'Fitness': {
    contentTypes: ['workout demo', 'exercise form', 'transformation', 'gym environment', 'nutrition prep'],
    visualStyles: ['energetic', 'motivational', 'dynamic', 'powerful'],
    commonElements: ['exercise movements', 'gym equipment', 'body form', 'sweat and effort'],
    audioElements: ['workout music', 'breathing', 'equipment sounds', 'motivational cues'],
  },
  'Beauty': {
    contentTypes: ['makeup tutorial', 'skincare routine', 'product review', 'transformation', 'get ready with me'],
    visualStyles: ['glam', 'soft', 'bright', 'elegant'],
    commonElements: ['close-up face shots', 'product application', 'before/after', 'mirror reflection'],
    audioElements: ['soft music', 'product sounds', 'gentle narration', 'satisfying application sounds'],
  },
  'Gaming': {
    contentTypes: ['gameplay highlight', 'reaction', 'tutorial', 'review', 'setup showcase'],
    visualStyles: ['dynamic', 'vibrant', 'dark_aesthetic', 'neon'],
    commonElements: ['screen capture', 'controller close-ups', 'gaming setup', 'player reactions'],
    audioElements: ['game sounds', 'commentary', 'keyboard/controller clicks', 'energetic music'],
  },
};

export class VideoPrompterService {
  /**
   * Generate a detailed video prompt based on niche and preferences
   */
  async generatePrompt(options: VideoPromptOptions): Promise<VideoPromptResult> {
    const { niche, topic, mood = 'professional', visualStyle, keywords = [] } = options;

    // Get niche template or use default
    const nicheTemplate = NICHE_TEMPLATES[niche as keyof typeof NICHE_TEMPLATES] || {
      contentTypes: ['showcase', 'tutorial', 'review', 'behind the scenes'],
      visualStyles: ['professional', 'clean', 'modern'],
      commonElements: ['close-ups', 'wide shots', 'detail shots'],
      audioElements: ['background music', 'ambient sounds', 'narration'],
    };

    // Build system prompt
    const systemPrompt = `You are a creative video director and scriptwriter specializing in ${niche} content for social media platforms like Instagram, TikTok, and YouTube Shorts.

Your task is to create detailed, cinematic video prompts that will be used with Gemini Veo 3.1, Google's state-of-the-art video generation AI.

Key Requirements:
1. Each video scene is 8 seconds long
2. Include specific camera angles and movements
3. Describe lighting and atmosphere in detail
4. Include comprehensive audio descriptions (dialogue, sound effects, music)
5. Make it engaging and suitable for ${niche} audience
6. Match the ${mood} mood/tone
7. Use ${visualStyle || nicheTemplate.visualStyles[0]} visual aesthetic

Content Types for ${niche}:
${nicheTemplate.contentTypes.map(type => `- ${type}`).join('\n')}

Common Visual Elements:
${nicheTemplate.commonElements.map(el => `- ${el}`).join('\n')}

Audio Elements to Consider:
${nicheTemplate.audioElements.map(el => `- ${el}`).join('\n')}`;

    const userPrompt = `Create a detailed video prompt for a ${niche} video${topic ? ` about "${topic}"` : ''}.

${keywords.length > 0 ? `Incorporate these keywords naturally: ${keywords.join(', ')}` : ''}

Output your response as a JSON object with this exact structure:
{
  "concept": "A brief 1-2 sentence description of the video concept",
  "prompt": "The detailed video prompt with camera angles, lighting, actions, and comprehensive audio descriptions. This should be 3-5 sentences describing an 8-second scene in vivid detail.",
  "visualStyle": "${visualStyle || nicheTemplate.visualStyles[0]}",
  "suggestedScenes": 3,
  "mood": "${mood}"
}

Make the prompt cinematic, specific, and optimized for AI video generation. Include audio descriptions in the format: 'Audio: [description of sounds, dialogue, music]'`;

    try {
      const geminiMessages = convertToGeminiMessages([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      const response = await callGemini(geminiMessages, {
        temperature: 0.8,
        maxTokens: 1024
      });

      const result = JSON.parse(response);

      return {
        concept: result.concept,
        prompt: result.prompt,
        visualStyle: result.visualStyle || visualStyle || nicheTemplate.visualStyles[0],
        suggestedScenes: result.suggestedScenes || 3,
        suggestedDuration: (result.suggestedScenes || 3) * 8, // 8 seconds per scene
        mood: result.mood || mood,
      };
    } catch (error) {
      console.error('[VideoPrompter] Error generating prompt:', error);
      throw new Error('Failed to generate video prompt');
    }
  }

  /**
   * Generate multiple prompt suggestions
   */
  async generateMultiplePrompts(
    options: VideoPromptOptions,
    count: number = 3
  ): Promise<VideoPromptResult[]> {
    const prompts: VideoPromptResult[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const prompt = await this.generatePrompt(options);
        prompts.push(prompt);
      } catch (error) {
        console.error(`[VideoPrompter] Error generating prompt ${i + 1}:`, error);
      }
    }

    return prompts;
  }

  /**
   * Get available niches
   */
  getAvailableNiches(): string[] {
    return Object.keys(NICHE_TEMPLATES);
  }

  /**
   * Get niche template info
   */
  getNicheInfo(niche: string) {
    return NICHE_TEMPLATES[niche as keyof typeof NICHE_TEMPLATES] || null;
  }
}
