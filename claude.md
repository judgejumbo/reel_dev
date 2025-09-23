# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Video repurposing SaaS application built with Next.js 15 that converts horizontal videos to 1080x1920 vertical format for social platforms like YouTube Shorts and TikTok.

## Tech Stack

- **Framework**: Next.js 15 with App Router and TypeScript 5
- **Authentication**: NextAuth.js v5 with credentials provider
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS v4 with custom CSS variables
- **UI Components**: shadcn/ui components (MCP configured)
- **Package Manager**: npm

## Development Commands

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production with Turbopack
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run db:push      # Push database schema changes
npm run db:studio    # Open Drizzle Studio
```

## Current Implementation Status

✅ **Authentication System**: Complete NextAuth.js setup with email/password
✅ **Database Schema**: Neon PostgreSQL with video processing workflow
✅ **Protected Routes**: Dashboard with session management
✅ **UI Components**: Login/register forms with shadcn/ui

## Key Architecture

**Authentication**: NextAuth.js with credentials provider + Drizzle adapter
**Database**: `users`, `video_uploads`, `clip_settings`, `processing_jobs` tables
**Video Workflow**: Upload → Clip → Process → Download (4-step pipeline)
**Storage**: Cloudflare R2 configured for video files

## Code Conventions

- **TypeScript**: Strict mode, `@/*` import aliases
- **Styling**: Tailwind CSS v4, use `cn()` utility for conditional classes
- **Components**: Use shadcn/ui via MCP when possible
- **Formatting**: Prettier (no semicolons, double quotes, 2-space tabs)

## Important Notes

- Always use shadcn MCP for UI components when building features
- Database uses NextAuth.js compatible schema
- Authentication routes: `/login`, `/register`, `/dashboard`
- N8N webhook configured for video processing
