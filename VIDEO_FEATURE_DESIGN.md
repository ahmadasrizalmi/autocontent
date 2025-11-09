# Desain Fitur Video Generation

## Overview
Menambahkan kemampuan untuk menghasilkan video multi-angle dengan story lengkap ke dalam aplikasi autocontent. Video yang dihasilkan akan berupa satu adegan lengkap dengan serangkaian aktivitas/story dan multi-angle shots.

## Analisis Aplikasi Existing

### Struktur Saat Ini
- **Frontend**: React + TypeScript dengan Vite
- **Backend**: Express + tRPC
- **Database**: MySQL dengan Drizzle ORM
- **Real-time**: Socket.IO untuk status updates
- **Media Generation**: Sudah ada integrasi dengan Forge API untuk image generation

### Workflow Existing (Content Factory)
1. **Trend Explorer** - Mencari trending topics
2. **Showrunner** - Membuat content plan
3. **Image Generator** - Generate gambar
4. **Caption Writer** - Menulis caption
5. **Publisher** - Publish ke GetCirclo

## Desain Arsitektur Video Generation

### 1. Database Schema Extension

Menambahkan tabel baru untuk video:

```sql
CREATE TABLE videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  videoId VARCHAR(255) NOT NULL UNIQUE,
  postId VARCHAR(255), -- Link to posts table (optional)
  niche VARCHAR(100) NOT NULL,
  prompt TEXT NOT NULL,
  storyScript TEXT NOT NULL, -- Full story script
  scenes JSON NOT NULL, -- Array of scene descriptions
  videoUrl TEXT, -- Final video URL
  thumbnailUrl TEXT, -- Video thumbnail
  duration INT, -- Duration in seconds
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  metadata JSON, -- Additional metadata (resolution, format, etc)
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completedAt TIMESTAMP
);
```

### 2. Backend Services

#### VideoGenerationService
Service baru untuk menangani video generation dengan multi-scene support.

**Responsibilities:**
- Membuat story script lengkap dengan multiple scenes
- Generate video untuk setiap scene dengan different angles
- Menggabungkan scenes menjadi satu video lengkap
- Menyimpan video ke S3 storage

**API Integration:**
Menggunakan salah satu dari:
- **Runway Gen-3** (Recommended) - Untuk video realistis dengan multi-shot capability
- **Luma AI Dream Machine** - Alternatif dengan quality tinggi
- **Pika Labs** - Untuk style yang lebih artistic

#### StoryboardAgent
Agent baru untuk membuat storyboard video.

**Responsibilities:**
- Membuat script lengkap untuk video
- Memecah story menjadi multiple scenes (3-5 scenes)
- Menentukan camera angles untuk setiap scene
- Menentukan transitions antar scenes

### 3. Video Generation Workflow

```
User Input (Topic/Prompt)
    ↓
StoryboardAgent: Create Story Script
    ↓
StoryboardAgent: Break into Scenes (3-5 scenes)
    ↓
For Each Scene:
    ↓
    VideoGenerationService: Generate Scene Video
    ↓
VideoGenerationService: Combine All Scenes
    ↓
VideoGenerationService: Upload to S3
    ↓
Save to Database
    ↓
Broadcast to Frontend
```

### 4. Scene Structure

Setiap scene akan memiliki:
```typescript
interface Scene {
  sceneNumber: number;
  description: string;
  cameraAngle: 'wide' | 'medium' | 'close-up' | 'overhead' | 'pov';
  duration: number; // seconds
  action: string; // What happens in this scene
  transition: 'cut' | 'fade' | 'dissolve' | 'wipe';
}

interface VideoStory {
  title: string;
  niche: string;
  overallPrompt: string;
  totalDuration: number;
  scenes: Scene[];
}
```

### 5. API Routes (tRPC)

```typescript
video: router({
  // Start video generation
  generate: publicProcedure
    .input(z.object({
      prompt: z.string(),
      niche: z.string().optional(),
      sceneCount: z.number().min(1).max(5).default(3),
      duration: z.number().min(15).max(60).default(30) // seconds
    }))
    .mutation(async ({ input }) => {
      // Start video generation workflow
    }),

  // Get video status
  status: publicProcedure
    .input(z.object({
      videoId: z.string()
    }))
    .query(async ({ input }) => {
      // Return video generation status
    }),

  // List all videos
  list: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0)
    }).optional())
    .query(async ({ input }) => {
      // Return list of videos
    }),

  // Get single video
  get: publicProcedure
    .input(z.object({
      videoId: z.string()
    }))
    .query(async ({ input }) => {
      // Return video details
    })
})
```

### 6. Frontend Components

#### VideoGenerator Component
- Input form untuk video prompt
- Scene count selector
- Duration selector
- Generate button

#### VideoGallery Component
- Grid view untuk semua generated videos
- Video player dengan controls
- Status indicators (processing, completed, failed)
- Download button

#### VideoProgress Component
- Real-time progress untuk video generation
- Scene-by-scene progress indicator
- Current scene preview
- Estimated time remaining

### 7. Environment Variables

Menambahkan ke `.env`:
```
# Video Generation API (Runway/Luma/Pika)
VIDEO_API_URL=
VIDEO_API_KEY=
VIDEO_API_PROVIDER=runway # runway | luma | pika
```

### 8. Socket.IO Events

Events baru untuk real-time updates:
```typescript
// Server to Client
'video_generation_started' - Video generation dimulai
'video_scene_processing' - Scene sedang diproses
'video_scene_completed' - Scene selesai
'video_combining_scenes' - Menggabungkan scenes
'video_completed' - Video selesai
'video_failed' - Video generation gagal

// Client to Server
'subscribe_video_updates' - Subscribe ke video updates
'unsubscribe_video_updates' - Unsubscribe
```

## Implementation Plan

### Phase 1: Backend Foundation
1. ✅ Buat migration untuk tabel videos
2. ✅ Buat VideoGenerationService
3. ✅ Buat StoryboardAgent
4. ✅ Tambahkan video routes ke tRPC router
5. ✅ Implementasi video API integration

### Phase 2: Video Processing
1. ✅ Implementasi scene generation
2. ✅ Implementasi video combining
3. ✅ Setup S3 upload untuk videos
4. ✅ Implementasi error handling

### Phase 3: Frontend UI
1. ✅ Buat VideoGenerator component
2. ✅ Buat VideoGallery component
3. ✅ Buat VideoProgress component
4. ✅ Integrasi dengan Socket.IO

### Phase 4: Testing & Polish
1. ✅ Test end-to-end workflow
2. ✅ Optimize video quality settings
3. ✅ Add loading states
4. ✅ Error handling UI

## Technical Considerations

### Video API Selection
**Runway Gen-3** dipilih karena:
- Support untuk multi-shot sequences
- High quality output
- Good control over camera movements
- Reasonable pricing

### Performance
- Video generation akan async (background job)
- Progress updates via WebSocket
- Videos disimpan di S3 dengan CDN
- Thumbnail generation untuk preview

### Storage
- Videos: S3 bucket dengan lifecycle policy
- Estimated size: 5-20MB per 30-second video
- Retention: 30 days default

### Cost Estimation
- Per video (30 seconds, 3 scenes): ~$0.50-$2.00
- Monthly (100 videos): ~$50-$200
- Storage (S3): ~$0.023 per GB

## Success Metrics
- Video generation success rate > 90%
- Average generation time < 5 minutes
- User satisfaction with video quality
- Integration with existing content factory workflow
