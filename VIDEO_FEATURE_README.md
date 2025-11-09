# Video Generation Feature

## Overview
Fitur baru untuk menghasilkan video multi-angle dengan story lengkap menggunakan AI. Video yang dihasilkan terdiri dari beberapa scene dengan camera angle yang berbeda-beda, membentuk satu cerita yang utuh.

## Features

### 1. Multi-Scene Video Generation
- Generate video dengan 1-5 scenes
- Setiap scene memiliki camera angle yang berbeda (wide, medium, close-up, overhead, POV)
- Total durasi video: 15-60 detik
- Automatic storyboard creation

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

## Architecture

### Backend Components

#### 1. Database Schema
```typescript
videos table:
- id: Primary key
- videoId: Unique identifier
- niche: Content niche
- prompt: User's video prompt
- storyScript: Generated story script
- scenes: JSON array of scene objects
- videoUrl: Final video URL
- status: pending | processing | completed | failed
- metadata: Additional video metadata
```

#### 2. Services

**StoryboardAgent** (`server/services/storyboard.ts`)
- Creates video storyboard from prompt
- Breaks story into multiple scenes
- Determines camera angles and transitions

**VideoService** (`server/services/video.ts`)
- Manages video generation workflow
- Coordinates scene generation
- Handles video combining
- Broadcasts real-time updates

**VideoGeneration** (`server/_core/videoGeneration.ts`)
- Integrates with Runway Gen-3 API
- Generates individual scenes
- Handles API polling and retries

#### 3. API Routes (tRPC)

```typescript
video.generate({ prompt, niche?, sceneCount?, totalDuration? })
video.status({ videoId })
video.cancel({ videoId })
video.list({ limit?, offset? })
video.get({ videoId })
```

### Frontend Components

#### 1. VideoGenerator
Input form untuk membuat video baru:
- Prompt textarea
- Niche input (optional)
- Scene count slider (1-5)
- Duration slider (15-60s)

#### 2. VideoProgress
Real-time progress tracking:
- Progress bar
- Current step indicator
- Scene-by-scene progress
- Cancel button

#### 3. VideoGallery
Gallery untuk browse videos:
- Grid layout
- Video player
- Status badges
- Download buttons

#### 4. Videos Page
Main page dengan tabs:
- Generate tab: Form + info
- Gallery tab: All videos

## Setup Instructions

### 1. Database Migration

Run migration untuk membuat tabel videos:

```bash
cd /home/ubuntu/autocontent
pnpm db:push
```

Atau jalankan SQL migration secara manual:
```sql
-- File: drizzle/0002_add_videos_table.sql
```

### 2. Environment Variables

Tambahkan ke `.env`:

```env
# Video Generation API (Runway)
VIDEO_API_URL=https://api.runwayml.com
VIDEO_API_KEY=your_runway_api_key_here
VIDEO_API_PROVIDER=runway
```

### 3. Install Dependencies

Semua dependencies sudah ada di package.json, tidak perlu install tambahan.

### 4. Start Development Server

```bash
pnpm dev
```

### 5. Access Video Studio

Navigate to: `http://localhost:5000/videos`

## Usage Guide

### Generating a Video

1. **Navigate to Video Studio**
   - Click "Video Studio" button di homepage
   - Atau akses `/videos` route

2. **Enter Video Prompt**
   - Describe the video story you want
   - Be specific about scenes, actions, and atmosphere
   - Example: "A person walking through a beautiful forest at sunset, discovering a hidden waterfall"

3. **Configure Settings**
   - Choose number of scenes (1-5)
   - Set total duration (15-60 seconds)
   - Optionally add niche

4. **Generate**
   - Click "Generate Video"
   - Watch real-time progress
   - Wait for completion (3-5 minutes)

5. **View & Download**
   - Video appears in gallery when complete
   - Play directly in browser
   - Download for offline use

### Best Practices for Prompts

✅ **Good Prompts:**
- "A chef preparing a gourmet meal in a professional kitchen, close-ups of ingredients, wide shots of the kitchen, ending with plated dish"
- "Morning yoga routine on a beach, starting with sunrise meditation, flowing through poses, ending with relaxation"
- "Product unboxing video, hands opening package, revealing product, demonstrating features"

❌ **Avoid:**
- Too vague: "Make a video"
- Too complex: "Create a 10-minute documentary about..."
- Unrealistic: "Show me flying to the moon"

## API Integration

### Runway Gen-3 API

Current implementation uses Runway Gen-3 Turbo for video generation:

**Endpoint:** `POST /v1/generate`

**Request:**
```json
{
  "prompt": "Scene description with camera angle",
  "duration": 5,
  "model": "gen3a_turbo"
}
```

**Response:**
```json
{
  "id": "task_id"
}
```

**Polling:** `GET /v1/tasks/{task_id}`

### Alternative Providers

Code structure mendukung multiple providers. Untuk menambahkan provider lain (Luma, Pika):

1. Update `VIDEO_API_PROVIDER` env variable
2. Implement provider-specific logic di `videoGeneration.ts`

## WebSocket Events

### Server → Client

- `video_generation_started` - Generation dimulai
- `video_storyboard_created` - Storyboard selesai dibuat
- `video_scene_processing` - Scene sedang diproses
- `video_scene_completed` - Scene selesai
- `video_combining_scenes` - Menggabungkan scenes
- `video_completed` - Video selesai
- `video_failed` - Generation gagal
- `video_cancelled` - Generation dibatalkan

## File Structure

```
autocontent/
├── server/
│   ├── _core/
│   │   ├── videoGeneration.ts      # Video API integration
│   │   └── env.ts                  # Environment variables
│   ├── services/
│   │   ├── storyboard.ts           # Storyboard agent
│   │   └── video.ts                # Video service
│   ├── db.ts                       # Database functions
│   └── routers.ts                  # tRPC routes
├── client/
│   └── src/
│       ├── components/
│       │   ├── VideoGenerator.tsx   # Input form
│       │   ├── VideoProgress.tsx    # Progress tracker
│       │   └── VideoGallery.tsx     # Video gallery
│       └── pages/
│           └── Videos.tsx           # Main page
└── drizzle/
    ├── schema.ts                    # Database schema
    └── 0002_add_videos_table.sql   # Migration
```

## Troubleshooting

### Video Generation Fails

1. **Check API Key**
   - Verify `VIDEO_API_KEY` is set correctly
   - Check API key has sufficient credits

2. **Check API URL**
   - Verify `VIDEO_API_URL` is correct
   - Test API connectivity

3. **Check Logs**
   - Server logs: `[VideoService]` prefix
   - Browser console for frontend errors

### Database Errors

1. **Run Migration**
   ```bash
   pnpm db:push
   ```

2. **Check Connection**
   - Verify `DATABASE_URL` is set
   - Test database connectivity

### Frontend Issues

1. **Clear Browser Cache**
2. **Check Network Tab** for API errors
3. **Verify WebSocket Connection** (green indicator)

## Cost Estimation

### Runway Gen-3 Turbo Pricing
- ~$0.05 per second of video
- 30-second video with 3 scenes: ~$1.50
- 100 videos/month: ~$150

### Storage (S3)
- ~5-20MB per 30-second video
- $0.023 per GB/month
- 100 videos (~1GB): ~$0.023/month

## Future Enhancements

### Planned Features
- [ ] Video editing capabilities
- [ ] Multiple video styles (realistic, animated, etc)
- [ ] Audio/music integration
- [ ] Text overlay support
- [ ] Batch video generation
- [ ] Video templates
- [ ] Advanced camera movements
- [ ] Scene transitions customization

### Performance Improvements
- [ ] Implement actual video concatenation with ffmpeg
- [ ] Thumbnail generation
- [ ] Video compression
- [ ] CDN integration
- [ ] Caching strategies

## Support

For issues or questions:
1. Check this documentation
2. Review server logs
3. Check browser console
4. Contact development team

## License

Same as main project license.
