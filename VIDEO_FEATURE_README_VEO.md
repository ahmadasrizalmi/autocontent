# Video Generation Feature (Gemini Veo 3.1)

## Overview
Fitur untuk menghasilkan video multi-angle dengan story lengkap menggunakan **Gemini Veo 3.1**, Google's state-of-the-art video generation model. Video yang dihasilkan terdiri dari beberapa scene dengan camera angle yang berbeda-beda, membentuk satu cerita yang utuh dengan native audio generation.

## Features

### 1. Multi-Scene Video Generation
- Generate video dengan 1-5 scenes
- Setiap scene memiliki camera angle yang berbeda (wide, medium, close-up, overhead, POV)
- Durasi per scene: 8 detik (Veo 3.1 standard)
- Total durasi video: 8-40 detik (tergantung jumlah scenes)
- **Native audio generation** - Veo 3.1 automatically generates audio

### 2. AI-Powered Storyboarding
- AI membuat script lengkap dari prompt user
- Memecah story menjadi multiple scenes
- Menentukan camera angles optimal untuk setiap scene
- Smooth transitions antar scenes

### 3. Real-time Progress Tracking
- WebSocket-based progress updates
- Scene-by-scene generation tracking
- Status notifications
- Estimated time remaining

### 4. Video Gallery
- Browse semua generated videos
- Video player dengan controls
- Download functionality
- Status filtering

## Technology Stack

### Video Generation: Gemini Veo 3.1

**Veo 3.1** adalah model video generation terbaru dari Google dengan capabilities:
- ✅ High-fidelity 8-second videos (720p/1080p)
- ✅ Native audio generation (dialogue, sound effects, music)
- ✅ Stunning realism and cinematic quality
- ✅ Text-to-video generation
- ✅ Image-to-video generation
- ✅ Video extension capabilities
- ✅ Reference image support (up to 3 images)

### API Integration

Video generation menggunakan **Forge API** yang sama dengan image generation:
- Endpoint: `videos.v1.VideoService/GenerateVideo`
- Model: `veo-3.1-generate-preview`
- Authentication: Bearer token (same as Forge API)
- No separate API key needed

## Setup Instructions

### 1. Database Migration

Run migration untuk membuat tabel videos:

```bash
cd /home/ubuntu/autocontent
pnpm db:push
```

### 2. Environment Variables

Tambahkan ke `.env`:

```env
# Forge API (supports both Image and Video generation)
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your_forge_api_key_here
```

**Note:** Video generation menggunakan Forge API yang sama dengan image generation. Tidak perlu API key terpisah.

### 3. Start Development Server

```bash
pnpm install
pnpm dev
```

### 4. Access Video Studio

Navigate to: `http://localhost:5000/videos`

## Usage Guide

### Generating a Video

1. **Navigate to Video Studio**
   - Click "Video Studio" button di homepage
   - Atau akses `/videos` route

2. **Enter Video Prompt**
   - Describe the video story you want
   - Be specific about scenes, actions, dialogue, and audio
   - Example: "A chef preparing a gourmet meal in a professional kitchen, with sizzling sounds and soft background music"

3. **Configure Settings**
   - Choose number of scenes (1-5)
   - Each scene will be 8 seconds (Veo 3.1 standard)
   - Optionally add niche

4. **Generate**
   - Click "Generate Video"
   - Watch real-time progress
   - Wait for completion (40-60 seconds per scene)

5. **View & Download**
   - Video appears in gallery when complete
   - Play directly in browser
   - Download for offline use

### Best Practices for Prompts

✅ **Good Prompts with Audio:**
- "A detective interrogates a nervous-looking rubber duck. 'Where were you on the night of the bubble bath?!' he quacks. Audio: Detective's stern quack, nervous squeaks from rubber duck."
- "A wise old owl and a nervous badger sit on a moonlit forest path. Audio: Owl hooting, badger's nervous chitters, rustling leaves, crickets."
- "A cat 'singing' opera with full orchestra, looking surprisingly profound. Audio: Cat meowing operatically, full orchestral accompaniment."

✅ **Cinematic Prompts:**
- "A follow shot of a wise old owl high in the air, peeking through the clouds in a moonlit sky above a forest. Audio: wings flapping, birdsong, pleasant wind rustling."
- "Medium shot of a cartographer in a cluttered study, poring over an ancient map. Warm lamplight illuminates the scene. Audio: Paper rustling, pen scratching."

❌ **Avoid:**
- Too vague: "Make a video"
- No audio description: Missing opportunity for Veo's native audio
- Too complex for 8 seconds: Keep each scene focused

### Audio Generation

Veo 3.1 includes **native audio generation**. You can specify:
- **Dialogue**: Character speech and conversations
- **Sound Effects**: Environmental sounds, object interactions
- **Music**: Background scores, orchestral pieces
- **Ambient Sounds**: Wind, water, nature sounds

Example prompt with audio:
```
"A close up of two people staring at a cryptic drawing on a wall, 
torchlight flickering. A man murmurs, 'This must be it. That's the 
secret code.' The woman looks at him and whispering excitedly, 
'What did you find?' Audio: Whispered dialogue, torch crackling, 
mysterious ambient sound."
```

## API Integration Details

### Gemini Veo 3.1 via Forge API

**Endpoint:** `videos.v1.VideoService/GenerateVideo`

**Request:**
```json
{
  "prompt": "Your detailed video prompt with audio description",
  "model": "veo-3.1-generate-preview"
}
```

**Response:**
```json
{
  "operation": {
    "name": "operations/...",
    "done": false
  }
}
```

**Polling:** `operations.v1.OperationsService/GetOperation`

**Final Response:**
```json
{
  "operation": {
    "done": true,
    "response": {
      "generated_videos": [{
        "video": {
          "b64_data": "base64_encoded_video",
          "uri": "https://..."
        }
      }]
    }
  }
}
```

## Veo 3.1 Capabilities

### Text-to-Video
Generate videos from text prompts with native audio.

### Image-to-Video
Use an image as the first frame and generate video from it.

### Video Extension
Extend previously generated videos by 7 seconds (up to 20 times).

### Reference Images
Use up to 3 reference images to guide the video content (characters, objects, styles).

### Frame Interpolation
Specify first and last frames, Veo generates the transition.

## Performance

### Generation Time
- Single scene (8 seconds): ~40-60 seconds
- 3-scene video: ~2-3 minutes
- 5-scene video: ~4-5 minutes

### Video Quality
- Resolution: 720p or 1080p
- Duration: 8 seconds per scene
- Format: MP4
- Audio: Native, high-quality

### Storage
- Average size: 5-15MB per 8-second video
- Recommended cleanup: 30-day retention

## Cost Estimation

### Gemini Veo 3.1 Pricing
- Included with Google AI Pro plan
- Higher access with Google AI Ultra plan
- Check current pricing at [Google AI Pricing](https://ai.google.dev/pricing)

### Storage (S3)
- ~5-15MB per 8-second video
- $0.023 per GB/month
- 100 videos (~1GB): ~$0.023/month

## Limitations

### Veo 3.1 Limitations
- Video length: 8 seconds per generation
- Resolution: 720p or 1080p
- Aspect ratio: 9:16 or 16:9
- Content policies apply
- Rate limits may apply

### Current Implementation
- Video combining not yet implemented (returns first scene only)
- No thumbnail generation
- No video compression
- No CDN integration

## Future Enhancements

### Planned Features
- [ ] Implement video concatenation with ffmpeg
- [ ] Video extension support (extend to 15+ seconds)
- [ ] Reference image support
- [ ] Frame interpolation
- [ ] Thumbnail generation
- [ ] Video compression
- [ ] Multiple aspect ratios
- [ ] Batch video generation

## Troubleshooting

### Video Generation Fails

1. **Check API Key**
   - Verify `BUILT_IN_FORGE_API_KEY` is set correctly
   - Check API key has Veo access

2. **Check Prompt**
   - Ensure prompt is clear and specific
   - Add audio descriptions
   - Keep within 8-second scope

3. **Check Logs**
   - Server logs: `[VideoService]` prefix
   - Browser console for frontend errors

## Resources

- [Veo 3.1 Documentation](https://ai.google.dev/gemini-api/docs/video)
- [Veo Prompt Guide](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-veo-3-1)
- [Gemini API Pricing](https://ai.google.dev/pricing)
- [Example Prompts](https://ai.google.dev/gemini-api/docs/video#example-prompts)

## Support

For issues or questions:
1. Check this documentation
2. Review [Veo documentation](https://ai.google.dev/gemini-api/docs/video)
3. Check server logs
4. Contact development team

## License

Same as main project license.
