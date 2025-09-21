# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Video repurposing SaaS application built with Next.js 15 that converts horizontal videos to 1080x1920 vertical format for social platforms like YouTube Shorts and TikTok.

## Tech Stack
- **Framework**: Next.js 15 with App Router and TypeScript 5
- **Styling**: Tailwind CSS v4 with custom CSS variables
- **UI Components**: shadcn/ui components (MCP configured)
- **Package Manager**: npm
- **Code Quality**: ESLint + Prettier

## Development Commands

### Core Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production with Turbopack
npm start            # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run format:check # Check formatting without writing
```

## Project Structure

### App Router Structure
- Uses Next.js 15 App Router (NOT Pages Router)
- Main layout in `src/app/layout.tsx` with Geist fonts
- Global styles in `src/app/globals.css` with Tailwind v4 syntax

### Source Organization
```
src/
├── app/              # Next.js App Router pages
├── lib/              # Shared utilities and business logic
│   ├── utils.ts      # cn() utility for className merging
│   ├── constants.ts  # App constants (video formats, subscription tiers)
│   └── types.ts      # Shared TypeScript types (VideoUpload, ClipSettings, etc.)
└── types/            # Domain-specific type definitions
    ├── auth.ts       # User, Session, AuthState interfaces
    └── subscription.ts # Subscription plans and usage tracking
```

### Key Architecture Components

**Video Processing Workflow (4-step)**:
1. Video Upload (main video + overlay)
2. Clip Length Selection (0.1s precision)
3. FFMPEG Parameters
4. Processing (webhook to N8N)

**State Management**: Designed for persistent state across workflow steps using React Context or Zustand (not yet implemented).

**File Storage**: Configured for Cloudflare R2 with chunked uploads for large video files.

## Code Conventions

### TypeScript
- All files must use TypeScript
- Import aliases: `@/*` maps to `./src/*`
- Strict mode enabled

### Styling
- Tailwind CSS v4 with `@theme inline` syntax
- CSS variables for theming: `--background`, `--foreground`
- Dark mode support via `prefers-color-scheme`
- Use `cn()` utility from `src/lib/utils.ts` for conditional classes

### Code Formatting
- Prettier configuration: no semicolons, double quotes, 2-space tabs
- Arrow functions without parentheses for single params
- Trailing commas in ES5 mode

## Integration Points

### shadcn/ui Components
- MCP configured in `.mcp.json`
- Uses `clsx` and `tailwind-merge` for className utilities
- Components auto-generated in `src/components/ui/`

### External Integrations
- **Authentication**: Better-Auth (not yet implemented)
- **Database**: Neon PostgreSQL with Drizzle ORM (not yet implemented)
- **Storage**: Cloudflare R2 for video files (not yet implemented)
- **Processing**: N8N webhook endpoint for FFMPEG processing

## Video Processing Constants
- Input: Max 500MB, supports MP4/WebM/QuickTime
- Output: 1080x1920 MP4 format
- Subscription tiers: free, basic, pro, enterprise

## Development Notes
- Uses Turbopack for faster builds and dev server
- ESLint extends Next.js core-web-vitals and TypeScript configs
- Ignores standard build directories and generated files
- Font optimization with Geist Sans and Geist Mono