# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Video repurposing SaaS application built with Next.js 15 that converts horizontal videos to 1080x1920 vertical format for social platforms like YouTube Shorts and TikTok.

## Tech Stack

- **Framework**: Next.js 15 with App Router and TypeScript 5
- **Authentication**: NextAuth.js v5 with credentials provider + Drizzle adapter
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS v4 with custom CSS variables
- **UI Components**: shadcn/ui components (MCP configured)
- **State Management**: Zustand with persist middleware for video workflow state
- **File Upload**: Multi-part chunked upload with Cloudflare R2 and Uppy.js
- **Video Processing**: N8N webhook integration for FFMPEG video conversion
- **Package Manager**: npm

## Development Commands

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production with Turbopack
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run db:generate  # Generate database migrations
npm run db:migrate   # Run database migrations
npm run db:migrate   # Run database migrations
npm run db:push      # Push database schema changes
npm run db:studio    # Open Drizzle Studio
```

## Current Implementation Status

✅ **Phase 1 Complete**: Authentication system, database schema, protected routes
✅ **Phase 2 Complete**: Video upload with drag & drop, R2 storage, workflow stepper
✅ **Phase 3 Complete**: Video processing workflow with N8N integration and complete page
✅ **Phase 4 Complete**: Video library with presigned URLs and source/completed toggles

## Key Architecture

### Database Schema (src/lib/schema.ts)
- **NextAuth.js Tables**: `users`, `accounts`, `sessions`, `verificationTokens`
- **Subscription System**: `subscription_plans`, `user_subscriptions`, `usage_tracking`
- **Video Workflow**: `video_uploads`, `clip_settings`, `processing_jobs`

### Video Processing Pipeline
1. **Upload** (src/app/upload/page.tsx): Multi-part upload to Cloudflare R2
2. **Clip Selection**: Timeline-based video segment selection
3. **Overlay Settings**: FFMPEG parameters and overlay configuration
4. **Processing**: N8N webhook for video conversion (1080x1920 vertical)
5. **Complete** (src/app/complete/page.tsx): Results and download

### State Management (src/lib/stores/video-workflow-store.ts)
- Zustand store with localStorage persistence
- Workflow steps: `upload | clip | settings | process`
- File management for main video and overlay media
- N8N payload generation for webhook processing

### API Routes
- **Upload**: `/api/upload/presigned-url`, `/api/upload/chunked`, `/api/upload/complete`
- **Videos**: `/api/videos` (CRUD), `/api/videos/proxy` (R2 streaming)
- **Processing**: `/api/processing/status/[jobId]`
- **Webhooks**: `/api/webhook/process`, `/api/webhook/complete`

## Code Conventions

- **TypeScript**: Strict mode, `@/*` import aliases
- **Styling**: Tailwind CSS v4, use `cn()` utility for conditional classes
- **Components**: Use shadcn/ui via MCP when possible
- **Formatting**: Prettier (no semicolons, double quotes, 2-space tabs)

## Important Notes

- Always use shadcn MCP for UI components when building features
- Database uses NextAuth.js compatible schema with Drizzle adapter
- Authentication routes: `/login`, `/register`, `/dashboard`
- Main application routes: `/create` (project creation), `/videos` (library), `/upload` (workflow)
- N8N webhook configured at `/api/webhook/process` for video processing
- Cloudflare R2 configured for video file storage with presigned URL uploads
- **Do not run the dev server** - the user will start it manually in their terminal

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
