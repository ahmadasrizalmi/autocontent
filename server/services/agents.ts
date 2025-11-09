import { invokeLLM } from '../_core/llm';
import { generateImage } from '../_core/imageGeneration';

// Available niches for content creation (must match GetCirclo profiles)
export const NICHES = [
  'Art & Design',
  'Business',
  'Entertainment',
  'Finance',
  'Fitness',
  'Gaming',
  'Health & Wellness',
  'Lifestyle',
  'Music',
  'Sports',
  'Technology',
  'Travel'
];

export interface Topic {
  niche: string;
  keywords: string[];
  trendScore: number;
}

export interface ContentPlan {
  niche: string;
  keywords: string[];
  imagePrompt: string;
  captionStyle: string;
  hashtags: string[];
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

/**
 * Trend Explorer Service
 * Finds trending topics based on niches
 */
export class TrendExplorerService {
  async findTopic(): Promise<Topic> {
    try {
      // Select random niche
      const niche = NICHES[Math.floor(Math.random() * NICHES.length)];
      
      // Use LLM to generate trending keywords for the niche
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'You are a social media trend expert. Generate trending keywords and topics for the given niche. Return JSON only.'
          },
          {
            role: 'user',
            content: `Generate 3-5 trending keywords for the "${niche}" niche. Return as JSON: {"keywords": ["keyword1", "keyword2", ...]}`
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'trending_keywords',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                keywords: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of trending keywords'
                }
              },
              required: ['keywords'],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const result = JSON.parse(typeof content === 'string' ? content : '{"keywords": []}');
      
      return {
        niche,
        keywords: result.keywords || [],
        trendScore: 0.8
      };
    } catch (error) {
      console.error('[TrendExplorer] Error:', error);
      // Fallback to random niche with generic keywords
      const niche = NICHES[Math.floor(Math.random() * NICHES.length)];
      return {
        niche,
        keywords: ['trending', 'viral', 'popular'],
        trendScore: 0.5
      };
    }
  }
}

/**
 * Showrunner Service
 * Orchestrates the content creation workflow
 */
export class ShowrunnerService {
  async createPlan(topic: Topic): Promise<ContentPlan> {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'You are a content strategist. Create a detailed content plan for social media posts.'
          },
          {
            role: 'user',
            content: `Create a content plan for a ${topic.niche} post about ${topic.keywords.join(', ')}. Include an image prompt and caption style. Return JSON: {"imagePrompt": "...", "captionStyle": "casual/professional/inspirational"}`
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'content_plan',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                imagePrompt: { type: 'string', description: 'Detailed prompt for image generation' },
                captionStyle: { type: 'string', description: 'Style of caption: casual, professional, or inspirational' }
              },
              required: ['imagePrompt', 'captionStyle'],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const result = JSON.parse(typeof content === 'string' ? content : '{}');
      
      return {
        niche: topic.niche,
        keywords: topic.keywords,
        imagePrompt: result.imagePrompt || `A beautiful ${topic.niche.toLowerCase()} scene featuring ${topic.keywords.join(', ')}`,
        captionStyle: result.captionStyle || 'casual',
        hashtags: ['#DNA']
      };
    } catch (error) {
      console.error('[Showrunner] Error:', error);
      return {
        niche: topic.niche,
        keywords: topic.keywords,
        imagePrompt: `A beautiful ${topic.niche.toLowerCase()} scene featuring ${topic.keywords.join(', ')}`,
        captionStyle: 'casual',
        hashtags: ['#DNA']
      };
    }
  }
}

/**
 * Image Generator Service
 * Creates realistic images using DALL-E
 */
export class ImageGeneratorService {
  async generate(plan: ContentPlan): Promise<GeneratedImage> {
    try {
      // Enhance prompt for realistic iPhone-style photos
      const enhancedPrompt = `${plan.imagePrompt}. Realistic iPhone photo style, natural lighting, high quality, professional photography, candid moment, authentic, 3:4 aspect ratio.`;
      
      const result = await generateImage({
        prompt: enhancedPrompt
      });
      
      if (!result.url) {
        throw new Error('Image generation failed: no URL returned');
      }
      
      return {
        url: result.url,
        prompt: enhancedPrompt
      };
    } catch (error) {
      console.error('[ImageGenerator] Error:', error);
      throw new Error(`Failed to generate image: ${error}`);
    }
  }
}

/**
 * Caption Writer Service
 * Writes engaging captions for posts
 */
export class CaptionWriterService {
  async write(plan: ContentPlan): Promise<string> {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `You are a social media caption writer. Write engaging, authentic captions in a ${plan.captionStyle} style.`
          },
          {
            role: 'user',
            content: `Write a ${plan.captionStyle} caption for a ${plan.niche} post about ${plan.keywords.join(', ')}. Keep it concise (2-3 sentences), engaging, and authentic. Do not include hashtags in the caption.`
          }
        ]
      });

      const content = response.choices[0].message.content;
      let caption = typeof content === 'string' ? content : 'Check this out!';
      
      // Add hashtags at the end
      caption += ` ${plan.hashtags.join(' ')}`;
      
      return caption;
    } catch (error) {
      console.error('[CaptionWriter] Error:', error);
      return `Discover the best of ${plan.niche}! ${plan.keywords.join(', ')} ${plan.hashtags.join(' ')}`;
    }
  }
}
