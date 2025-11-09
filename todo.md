# Content Factory - TODO

## Database Schema
- [x] Create posts table with fields: id, postId, niche, caption, mediaUrl, keywords, status, createdAt, publishedAt
- [x] Create jobs table to track content creation processes
- [x] Create agents table to monitor AI agent status
- [x] Push database schema with drizzle

## Backend API (tRPC)
- [x] Create factory router with start/stop/status procedures
- [x] Create posts router with list/get procedures
- [x] Create agents router with status procedures
- [x] Implement job queue management

## AI Agent Services
- [x] Create TrendExplorerService to find trending topics
- [x] Create ShowrunnerService to orchestrate workflow
- [x] Create ImageGeneratorService using DALL-E API
- [x] Create CaptionWriterService using GPT-4

## GetCirclo Integration
- [x] Create GetCirclo API client with authentication
- [x] Implement post publishing to GetCirclo
- [x] Handle GetCirclo API responses and errors
- [x] Store GetCirclo JWT token securely

## Frontend UI
- [x] Update Home page with factory control UI
- [x] Add Start/Stop Factory button with loading states
- [x] Display real-time progress bar
- [x] Show agent status cards
- [x] Display published posts grid
- [x] Add statistics cards (total posts, active agents, etc)
- [x] Implement toast notifications for events

## Real-time Features
- [x] Setup Socket.io for WebSocket communication
- [x] Emit status updates during content creation
- [x] Emit post created events
- [x] Emit job complete events
- [x] Handle errors via WebSocket

## Testing & Deployment
- [x] Test end-to-end content creation flow
- [x] Test GetCirclo API integration
- [x] Verify real-time updates work correctly
- [x] Create checkpoint for deployment

## Revisions
- [x] Update image generation to create realistic iPhone-style photos with humans (selfie/candid style)
- [x] Fix hashtag placement - insert #DNA between other hashtags, not at the end
