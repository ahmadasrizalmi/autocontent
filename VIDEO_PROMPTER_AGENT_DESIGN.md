# Video Prompter Agent Design

## Overview

Video Prompter Agent adalah AI agent yang otomatis generate video prompts berdasarkan niche dan user preferences dari GetCirclo. Agent ini akan membuat prompts yang detailed, cinematic, dan include audio descriptions untuk Gemini Veo 3.1.

## Purpose

Menghilangkan kebutuhan user untuk manually write video prompts. Agent akan:
1. Analyze user's niche dan preferences
2. Generate creative video concepts
3. Create detailed prompts dengan audio descriptions
4. Ensure prompts are optimized untuk Veo 3.1

## Input

### From GetCirclo User Preferences
- `preferredNiches`: Array of niches (e.g., ["Tech Reviewer", "Foodie"])
- `preferredKeywords`: Array of keywords
- `visualRepresentationAffinities`: Visual style preferences
- `preferredGenders`: Gender preferences for characters
- `negativeSignals`: Things to avoid

### From User
- Niche selection (dropdown atau auto-detect)
- Optional: Topic atau theme
- Optional: Mood/tone (energetic, calm, dramatic, etc.)

## Output

### Video Prompt Structure
```
{
  "concept": "Brief concept description",
  "prompt": "Detailed video prompt with audio",
  "niche": "Selected niche",
  "visualStyle": "white_aesthetic",
  "estimatedScenes": 3,
  "suggestedDuration": 30
}
```

### Example Output

**For Tech Reviewer Niche:**
```
Concept: "Unboxing and First Impressions of New Smartphone"

Prompt: "A medium shot of a tech reviewer's hands carefully opening a sleek 
black box on a minimalist white desk. The camera slowly zooms in as the 
reviewer lifts a premium smartphone, revealing its glossy screen and metal 
edges. Soft natural lighting from a window creates elegant reflections. 
The reviewer rotates the phone, showing all angles. Audio: Crisp unboxing 
sounds, gentle rustling of packaging, subtle 'wow' reaction, soft 
background music with modern electronic beats."
```

**For Foodie Niche:**
```
Concept: "Artisanal Coffee Brewing Process"

Prompt: "A cinematic close-up of hands pouring hot water over freshly ground 
coffee in a pour-over setup. Steam rises gracefully as the water blooms the 
grounds. The camera pulls back to reveal a cozy cafe setting with warm 
lighting. Cut to a medium shot of the barista carefully swirling the kettle. 
Final shot: the rich, dark coffee dripping into a ceramic cup. Audio: 
Gentle water pouring, coffee brewing sounds, soft cafe ambiance, light 
jazz music in background."
```

## Agent Workflow

### Step 1: Analyze Preferences
```typescript
const preferences = await getCircloAPI.getUserPreferences(userId);
const primaryNiche = preferences.preferredNiches[0];
const visualStyle = preferences.visualRepresentationAffinities[0];
const keywords = preferences.preferredKeywords;
```

### Step 2: Generate Concept
Using LLM to create video concept based on:
- Niche-specific content types
- Trending topics in that niche
- Visual style preferences
- Keywords

### Step 3: Create Detailed Prompt
LLM generates:
- Scene descriptions
- Camera movements
- Lighting and atmosphere
- Character/object details
- Audio descriptions (dialogue, sound effects, music)

### Step 4: Optimize for Veo 3.1
Ensure prompt includes:
- Clear visual descriptions
- Specific audio elements
- Appropriate duration (8 seconds per scene)
- Cinematic language

## Niche-Specific Templates

### Tech Reviewer
- Unboxing videos
- Product reviews
- Comparison shots
- Feature demonstrations
- Setup/installation guides

### Foodie
- Recipe tutorials
- Cooking processes
- Food styling shots
- Restaurant reviews
- Ingredient close-ups

### Travel
- Destination showcases
- Journey montages
- Cultural experiences
- Landscape panoramas
- Adventure activities

### Lifestyle
- Morning routines
- Wellness activities
- Home organization
- Daily vlogs
- Self-care moments

### Fashion
- Outfit transitions
- Styling sessions
- Accessory close-ups
- Runway-style walks
- Wardrobe tours

### Fitness
- Workout demonstrations
- Exercise form guides
- Transformation montages
- Gym environments
- Nutrition prep

## LLM Prompt Template

```
You are a creative video director specializing in {NICHE} content.

User Preferences:
- Niche: {NICHE}
- Visual Style: {VISUAL_STYLE}
- Keywords: {KEYWORDS}
- Avoid: {NEGATIVE_SIGNALS}

Task: Create a detailed video prompt for Gemini Veo 3.1 that will generate 
an 8-second video scene.

Requirements:
1. The video should be relevant to {NICHE} content creators
2. Match the {VISUAL_STYLE} aesthetic
3. Include specific audio descriptions (dialogue, sound effects, music)
4. Be cinematic and engaging
5. Suitable for social media (Instagram, TikTok, YouTube Shorts)

Output Format (JSON):
{
  "concept": "Brief 1-sentence concept",
  "prompt": "Detailed video prompt with camera angles, lighting, actions, and audio descriptions",
  "visualStyle": "{VISUAL_STYLE}",
  "suggestedScenes": 3,
  "mood": "energetic|calm|dramatic|playful"
}

Generate a creative and detailed video prompt now.
```

## API Design

### Service: VideoPrompterService

```typescript
class VideoPrompterService {
  async generatePrompt(options: {
    niche: string;
    userId?: string;
    topic?: string;
    mood?: string;
  }): Promise<{
    concept: string;
    prompt: string;
    visualStyle: string;
    suggestedScenes: number;
    suggestedDuration: number;
  }>;
  
  async generateMultiplePrompts(options: {
    niche: string;
    count: number;
  }): Promise<Array<VideoPrompt>>;
}
```

### tRPC Route

```typescript
videoPrompter: {
  generate: protectedProcedure
    .input(z.object({
      niche: z.string(),
      topic: z.string().optional(),
      mood: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await videoPrompterService.generatePrompt(input);
    }),
    
  getSuggestions: protectedProcedure
    .input(z.object({
      niche: z.string(),
      count: z.number().default(3),
    }))
    .query(async ({ input }) => {
      return await videoPrompterService.generateMultiplePrompts(input);
    }),
}
```

## UI Integration

### Auto-Generate Button
- Button: "Generate Prompt from Niche"
- Dropdown: Select niche
- Optional: Topic input
- Optional: Mood selector

### Workflow
1. User selects niche from dropdown
2. (Optional) User enters topic or selects mood
3. User clicks "Generate Prompt"
4. Loading state while AI generates
5. Prompt appears in textarea
6. User can edit or regenerate
7. User clicks "Generate Video"

### UI Mockup
```
┌─────────────────────────────────────┐
│ Generate Video                      │
├─────────────────────────────────────┤
│                                     │
│ Niche: [Tech Reviewer ▼]           │
│                                     │
│ Topic (Optional):                   │
│ [e.g., smartphone review]           │
│                                     │
│ Mood: [Energetic ▼]                │
│                                     │
│ [✨ Generate Prompt]  [🔄 Regenerate]│
│                                     │
│ Video Prompt:                       │
│ ┌─────────────────────────────────┐ │
│ │ A medium shot of a tech...      │ │
│ │ [AI-generated prompt appears]   │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Number of Scenes: [3] ━━━━●━━━━    │
│                                     │
│ [Generate Video]                    │
└─────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Backend Service
1. Create `VideoPrompterService` class
2. Implement LLM-based prompt generation
3. Add niche-specific templates
4. Create tRPC routes

### Phase 2: Frontend UI
1. Add niche dropdown
2. Add "Generate Prompt" button
3. Add loading states
4. Add regenerate functionality

### Phase 3: Integration
1. Connect to GetCirclo preferences
2. Auto-detect user's niche
3. Pre-fill based on preferences

### Phase 4: Enhancement
1. Add prompt history
2. Add favorite prompts
3. Add prompt templates library
4. Add A/B testing for prompts

## Success Metrics

- User adoption: % of users using auto-generate
- Prompt quality: User satisfaction ratings
- Video generation success rate
- Time saved per user
- Engagement with generated videos

## Future Enhancements

1. **Learning from Feedback**
   - Track which prompts lead to successful videos
   - Improve generation based on user edits

2. **Trending Topics Integration**
   - Pull trending topics from GetCirclo
   - Generate prompts based on viral content

3. **Multi-Language Support**
   - Generate prompts in different languages
   - Localize content for different regions

4. **Collaboration Features**
   - Share prompt templates
   - Community-contributed prompts

5. **Advanced Customization**
   - Fine-tune visual style
   - Adjust camera movements
   - Customize audio preferences
