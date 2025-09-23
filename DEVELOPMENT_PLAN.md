# Development Plan - Video Repurposing SaaS

## Project Overview

**Goal**: Build a professional video repurposing SaaS application that converts horizontal videos to 1080x1920 vertical format for social platforms like YouTube Shorts and TikTok.

**Tech Stack**: Next.js 15, TypeScript, Tailwind CSS v4, NextAuth.js, Neon PostgreSQL, shadcn/ui, Zustand

**Implementation Strategy**: Incremental phase-based development with validation checkpoints
**Target Timeline**: 8 Phases (MVP with authentication, video processing, and user management)

---

## ✅ PHASE 1: Core Foundation with Email/Password Auth - COMPLETED

**Objective**: Establish solid foundation with basic authentication and database integration using incremental approach.

**End Goal**: Working email/password authentication with persistent sessions and plugin-ready architecture for future OAuth providers.

### Step 1.1: Install Core Dependencies (Phase 1 Focus)

**Deliverables**:

- Core authentication and database packages installed
- Package.json updated with essential dependencies
- Architecture prepared for future OAuth plugins

**Commands**:

```bash
# Authentication & Database (Core)
npm install next-auth drizzle-orm @neondatabase/serverless drizzle-kit @auth/drizzle-adapter
npm install @paralleldrive/cuid2 zod
npm install react-hook-form @hookform/resolvers
npm install next-themes sonner

# Development dependencies
npm install -D @types/node

# Note: OAuth providers (Google, Apple) and email service (Resend)
# will be added in Phase 3 - OAuth Integration
```

**Acceptance Criteria**:

- [x] All packages install without conflicts ✅ COMPLETED
- [x] No TypeScript errors after installation ✅ COMPLETED
- [x] Package.json reflects all new dependencies ✅ COMPLETED

**Status**: ✅ **COMPLETED** - Core dependencies installed successfully

---

### Step 1.2: Database Setup (Neon + Drizzle)

**Deliverables**:

- Neon PostgreSQL database connected and configured
- Drizzle ORM integration with complete schema
- Database migrations and environment setup

**Database Schema Created**:

- `users` - User accounts
- `subscription_plans` & `user_subscriptions` - Subscription management
- `video_uploads` - Step 1: Video file uploads (main + overlay)
- `clip_settings` - Steps 2 & 3: Clip length selection + FFMPEG parameters
- `processing_jobs` - Step 4: N8N webhook processing
- `usage_tracking` - Subscription limits monitoring

**Files Created**:

- `src/lib/db.ts` - Database connection
- `src/lib/schema.ts` - Complete database schema
- `drizzle.config.ts` - Migration configuration
- `.env.local` - Database connection string

**NPM Scripts Added**:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

**Acceptance Criteria**:

- [x] Neon database project connected ✅ COMPLETED
- [x] Drizzle ORM installed and configured ✅ COMPLETED
- [x] Complete database schema created for video workflow ✅ COMPLETED
- [x] Database migrations successful ✅ COMPLETED
- [x] All tables created in Neon database ✅ COMPLETED

**Status**: ✅ **COMPLETED** - Database foundation established with video processing schema

---

### Step 1.3: Basic Environment Setup (Phase 1)

**Deliverables**:

- `.env.local` file with core configuration
- Plugin-ready structure for future providers

**File**: `.env.local`

```env
# Neon Database Configuration
DATABASE_URL="postgresql://neondb_owner:***@ep-summer-mountain-adn3clyx-pooler.c-2.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"

# NextAuth.js Configuration
AUTH_SECRET="your-super-secret-key-min-32-chars-long-please-make-it-really-long"
NEXTAUTH_URL="http://localhost:3000"

# Cloudflare R2 Configuration (for direct application access)
CLOUDFLARE_R2_ENDPOINT="https://b0dab97b1660fae762e45a9287ab4430.r2.cloudflarestorage.com"
CLOUDFLARE_R2_ACCESS_KEY_ID="***"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="***"
CLOUDFLARE_R2_BUCKET="reel-video-storage"

# Future OAuth Providers (Phase 3 - commented out for now)
# GOOGLE_CLIENT_ID="your-google-client-id.googleusercontent.com"
# GOOGLE_CLIENT_SECRET="your-google-client-secret"
# APPLE_CLIENT_ID="your.app.bundle.id"

# Future Email Service (Phase 3 - Magic Links)
# RESEND_API_KEY="re_your-resend-api-key"
# FROM_EMAIL="noreply@yourdomain.com"

# N8N Webhook Configuration (ADDED)
N8N_WEBHOOK_URL="https://n8n.srv888156.hstgr.cloud/webhook-test/reelrift"
```

**Acceptance Criteria**:

- [x] Environment file contains all required variables ✅ COMPLETED
- [x] Variables follow security best practices ✅ COMPLETED
- [x] Template ready for production deployment ✅ COMPLETED
- [x] Database connection string configured ✅ COMPLETED
- [x] Cloudflare R2 integration ready ✅ COMPLETED

**Status**: ✅ **COMPLETED** - Environment setup with database and R2 storage

---

### Step 1.4: NextAuth.js Configuration (Email/Password Only) ✅ COMPLETED

**Deliverables**:

- NextAuth.js v5 configuration with credentials provider
- Drizzle adapter for database integration
- Session management with JWT strategy

**Files Created**:

- `src/lib/auth.ts` - NextAuth.js configuration
- `src/app/api/auth/[...nextauth]/route.ts` - API route handlers
- `src/app/actions/auth.ts` - Server action for user registration
- `src/components/providers.tsx` - SessionProvider wrapper

**Features Implemented**:

- Email/password authentication with bcrypt hashing
- Database user verification and storage
- JWT session strategy for scalability
- Real-time session state management
- Secure password validation and error handling

**Acceptance Criteria**:

- [x] Auth configuration compiles successfully ✅ COMPLETED
- [x] Credentials provider properly configured ✅ COMPLETED
- [x] Database authentication integration working ✅ COMPLETED
- [x] Session management optimized for UX ✅ COMPLETED

**Status**: ✅ **COMPLETED** - NextAuth.js fully configured with database integration

---

### Step 1.5: Enhanced Auth Client ✅ COMPLETED

**Deliverables**:

- NextAuth.js React integration
- Client-side session management
- Type-safe authentication hooks

**Implementation**:

- `useSession()` hook for client components
- `signIn()` and `signOut()` functions
- SessionProvider for application-wide state
- Server-side `auth()` function for protected routes

**Acceptance Criteria**:

- [x] Client exports all required auth methods ✅ COMPLETED
- [x] TypeScript types properly inferred ✅ COMPLETED
- [x] Session hooks available and functional ✅ COMPLETED

**Status**: ✅ **COMPLETED** - NextAuth.js React integration working

---

### Step 1.6: Login Form Component ✅ COMPLETED

**Deliverables**:

- Professional login form with NextAuth.js integration
- Error handling and loading states
- Responsive shadcn/ui design

**File**: `src/components/auth/LoginForm.tsx`

**Features Implemented**:

- Email/password sign-in with NextAuth.js
- Form validation with react-hook-form + zod
- Loading states during authentication
- Error handling with user-friendly messages
- Responsive shadcn/ui components (Card, Input, Button, Form)
- Automatic redirect to dashboard on success

**Acceptance Criteria**:

- [x] Email/password authentication working ✅ COMPLETED
- [x] Form validation implemented ✅ COMPLETED
- [x] Responsive design on all devices ✅ COMPLETED
- [x] Error states properly handled ✅ COMPLETED
- [x] Success redirects functional ✅ COMPLETED

**Status**: ✅ **COMPLETED** - Login form fully functional with NextAuth.js

---

### Step 1.7: Registration Form Component ✅ COMPLETED

**Deliverables**:

- Registration form with server action integration
- Email/password registration with auto-login
- User-friendly onboarding flow

**Files**:

- `src/components/auth/RegisterForm.tsx` - Registration form component
- `src/app/actions/auth.ts` - Server action for user creation

**Features Implemented**:

- Email/password registration with password confirmation
- Server action for secure user creation with bcrypt
- Automatic login after successful registration
- Form validation with react-hook-form + zod
- Error handling and loading states
- Consistent shadcn/ui design with login form
- Auto-redirect to dashboard after registration

**Acceptance Criteria**:

- [x] Registration flow complete ✅ COMPLETED
- [x] User creation with server actions ✅ COMPLETED
- [x] Form validation active ✅ COMPLETED
- [x] Consistent with login form UX ✅ COMPLETED
- [x] Auto-login after registration ✅ COMPLETED

**Status**: ✅ **COMPLETED** - Registration form fully functional with auto-login

---

### Step 1.8: Database Migration and Testing ✅ COMPLETED

**Deliverables**:

- Database schema deployed to Neon with NextAuth.js tables
- All authentication methods tested via Playwright
- Protected routes functional with session management

**Commands Executed**:

```bash
# Applied database schema changes
npm run db:push

# Started development server
npm run dev
```

**Testing Completed (Playwright MCP)**:

- [x] Email/password registration works ✅ TESTED
- [x] User creation in database confirmed ✅ TESTED
- [x] Automatic login after registration ✅ TESTED
- [x] Protected dashboard access enforced ✅ TESTED
- [x] Session persistence and management ✅ TESTED
- [x] Logout functionality working ✅ TESTED
- [x] Login with existing credentials ✅ TESTED
- [x] Responsive design on all devices ✅ TESTED

**Database Issues Resolved**:

- Fixed Neon serverless compatibility by switching to `drizzle-orm/neon-http`
- Updated users table schema for NextAuth.js compatibility
- Verified all authentication flows working end-to-end

**Acceptance Criteria**:

- [x] All authentication flows tested and working ✅ COMPLETED
- [x] Database properly configured with test users ✅ COMPLETED
- [x] No console errors during authentication ✅ COMPLETED
- [x] Professional UI/UX experience ✅ COMPLETED

**Status**: ✅ **COMPLETED** - Full authentication system tested and verified

---

## 🚀 Phase 1 Success Metrics

**End of Phase 1 Result**: Complete authentication system with database and storage integration:

✅ **Core Dependencies**: All packages installed and configured
✅ **Neon Database Integration**: Complete database schema with video processing workflow
✅ **Drizzle ORM**: Migration system and database operations ready
✅ **Cloudflare R2 Storage**: Video storage bucket configured and tested
✅ **Environment Setup**: Production-ready configuration structure
✅ **NextAuth.js Authentication**: Full email/password authentication system
✅ **User Registration**: Secure user creation with bcrypt password hashing
✅ **User Login**: Database-verified credential authentication
✅ **Session Management**: JWT-based sessions with persistent state
✅ **Protected Routes**: Dashboard access control and session validation
✅ **Authentication Forms**: Professional login/register forms with shadcn/ui
✅ **Database Schema**: NextAuth.js compatible users table with workflow schema
✅ **End-to-End Testing**: Full authentication flow verified with Playwright
✅ **MCP Integrations**: Cloudflare, shadcn/ui, and Playwright tools verified working

**Current Status**: ✅ **PHASE 1 COMPLETE** - Full authentication system operational and tested.

**Foundation Quality**: Complete production-ready authentication system with database integration. Users can register, login, access protected content, and manage sessions. Ready for video processing workflow implementation.

---

## ✅ PHASE 2: Basic Upload Page - COMPLETED

**Objective**: Implement core video upload functionality with authenticated users

**Key Features Implemented**:
- ✅ File upload interface with native HTML5 drag & drop support
- ✅ Video file validation and storage to Cloudflare R2
- ✅ Database integration with `video_uploads` table
- ✅ Workflow stepper (Step 1 of 4: Upload → Clip → Process → Download)
- ✅ Professional UI using shadcn/ui components

**Tech Integration Completed**:
- **State Management**: ✅ Zustand store implemented for video workflow state
- **File Upload**: ✅ Native HTML5 drag & drop (replaced Uppy.io for better performance)
- **Storage**: ✅ Cloudflare R2 integration with presigned URLs (1 week expiry)
- **Database**: ✅ Neon PostgreSQL with video upload records

**Implementation Details**:

**Files Created/Modified**:
- `src/lib/stores/video-workflow-store.ts` - Zustand store for video state management
- `src/app/upload/page.tsx` - Protected upload page with authentication
- `src/components/upload/UploadPage.tsx` - Main upload interface
- `src/components/upload/VideoUploader.tsx` - Drag & drop video upload component
- `src/components/upload/WorkflowStepper.tsx` - Visual workflow progress indicator
- `src/lib/utils/video-utils.ts` - Video validation and metadata extraction
- `src/app/api/upload/presigned-url/route.ts` - Generate R2 presigned URLs
- `src/app/api/upload/complete/route.ts` - Record upload completion in database

**Key Technical Decisions**:
1. **Replaced Uppy.io with Native HTML5**: Simpler, more reliable drag & drop
2. **UUID Generation**: Fixed CUID2/UUID mismatch using `crypto.randomUUID()`
3. **URL Storage**: Store compact R2 URLs instead of full presigned URLs
4. **File Organization**: `uploads/[user-id]/[type]/[file-id].ext` structure

**Issues Resolved**:
- ✅ Fixed drag & drop files opening in new tabs
- ✅ Resolved UUID/CUID2 database type mismatches
- ✅ Fixed URL column length limits (500 char varchar)
- ✅ Increased presigned URL expiry from 1 hour to 1 week

**Testing Completed**:
- ✅ User authentication verified (ID: xf6ht0cm9cfi22wtp2ero4x0)
- ✅ File upload to R2 confirmed (9c0c4cfe-2d79-4a1d-adbe-cf6ab6eb66f6.m4v)
- ✅ Database record creation verified (ID: 1716b1c0-0733-46fd-ad10-3926200ea23e)
- ✅ End-to-end upload workflow functional

**Deliverables Completed**:
- ✅ `/upload` page with protected route requiring authentication
- ✅ Video file upload with real-time progress feedback
- ✅ File metadata storage (size, duration, format, resolution)
- ✅ Workflow navigation system with step indicators

**Status**: ✅ **COMPLETED** - Full video upload functionality operational and tested

---

## 🚀 Phase 2 Success Metrics

**End of Phase 2 Result**: Complete video upload system with Cloudflare R2 integration:

✅ **Zustand State Management**: Global video workflow state with persistence
✅ **Protected Upload Route**: Authentication-required `/upload` page
✅ **Native Drag & Drop**: Reliable HTML5 file upload without external dependencies
✅ **Video Validation**: File type, size, and metadata extraction
✅ **Cloudflare R2 Storage**: Presigned URLs with 1-week expiry
✅ **Database Integration**: Video upload records with metadata
✅ **Workflow UI**: Step-by-step progress indicator
✅ **Error Handling**: User-friendly error messages and recovery
✅ **File Organization**: Structured storage paths by user and type
✅ **End-to-End Testing**: Upload flow verified from UI to R2 to database

**Current Status**: ✅ **PHASE 2 COMPLETE** - Full video upload system operational and tested.

**Upload Quality**: Production-ready upload system with drag & drop, validation, and cloud storage. Users can upload main and overlay videos with progress tracking and database persistence. Ready for clip selection implementation.

---

## ✅ PHASE 3: Clip Selection Interface - COMPLETED

**Objective**: Complete video repurposing workflow with mobile-first design and N8N integration

**Key Features Implemented**:
- ✅ Mobile-first responsive workflow with automatic viewport detection
- ✅ Video timeline controls with 0.1-second precision clip selection
- ✅ Enhanced MediaUploader supporting both images and videos for overlays
- ✅ FFMPEG overlay settings mapped directly to N8N workflow parameters
- ✅ Complete processing pipeline with N8N webhook integration
- ✅ Chunked upload support for large files (up to 2GB)

**Tech Integration Completed**:
- **State Management**: ✅ Enhanced Zustand store with N8N payload generation
- **Video Player**: ✅ react-player integration with custom timeline controls
- **Mobile Design**: ✅ Responsive layouts (mobile vs desktop) with useMediaQuery
- **File Upload**: ✅ Enhanced to support images and videos with large file mode
- **N8N Integration**: ✅ Direct webhook communication tested and working

**Implementation Details**:

**Files Created/Modified**:
- `src/lib/stores/video-workflow-store.ts` - Enhanced with N8N payload structure
- `src/lib/utils/video-utils.ts` - Added image validation and large file support
- `src/components/upload/MediaUploader.tsx` - New component for image/video overlay uploads
- `src/components/mobile/MobileStepLayout.tsx` - Mobile-first full-screen step layout
- `src/components/desktop/DesktopTabLayout.tsx` - Desktop tab-based layout
- `src/hooks/useResponsiveWorkflow.ts` - Viewport detection and layout switching
- `src/components/workflow/VideoPreview.tsx` - Video player with custom controls
- `src/components/workflow/TimelineSelector.tsx` - 0.1s precision timeline controls
- `src/components/workflow/OverlaySettings.tsx` - FFMPEG parameters mapped to N8N
- `src/components/workflow/ProcessingStep.tsx` - N8N webhook integration
- `src/components/upload/UploadPage.tsx` - Updated with responsive workflow
- `src/app/api/webhook/process/route.ts` - N8N webhook processing endpoint
- `src/app/api/webhook/complete/route.ts` - N8N completion callback endpoint
- `src/app/api/webhook/test/route.ts` - Webhook testing endpoint
- `src/app/api/upload/chunked/route.ts` - Chunked upload for large files
- Enhanced `src/app/api/upload/presigned-url/route.ts` - Support for overlay media

**Key Technical Features**:
1. **Mobile-First Design**: Automatic detection and layout switching between mobile and desktop
2. **Timeline Precision**: Dual-handle slider with 0.1-second accuracy for clip selection
3. **N8N Integration**: Direct mapping of UI controls to N8N workflow parameters
4. **Large File Support**: Chunked uploads for files over 100MB, up to 2GB
5. **Overlay Media**: Support for both image and video overlays with validation
6. **Real-time Preview**: Video player with scrubbing and timeline visualization

**Dependencies Added**:
```bash
npm install react-player @radix-ui/react-slider
# Note: Created custom useMediaQuery hook instead of external dependency
```

**N8N Webhook Integration**:
- **Endpoint**: `https://n8n.srv888156.hstgr.cloud/webhook-test/reelrift`
- **Status**: ✅ Tested and confirmed working (200 OK response)
- **Payload Structure**: Complete mapping from UI controls to N8N parameters
- **Response**: `{"message":"Workflow was started"}` - Workflow triggering confirmed

**Issues Resolved**:
- ✅ Added missing shadcn/ui components (slider, progress, dialog, alert-dialog, label, select, separator, alert, switch)
- ✅ Created custom type definitions for react-player
- ✅ Fixed mobile viewport detection and responsive layouts
- ✅ Implemented proper state persistence with Zustand
- ✅ Resolved N8N webhook communication and payload structure

**Testing Completed**:
- ✅ Mobile responsive design verified across viewports
- ✅ Timeline controls tested with 0.1s precision
- ✅ Video player functionality confirmed
- ✅ Overlay media upload (images + videos) tested
- ✅ N8N webhook communication verified (test payload successful)
- ✅ Large file mode and chunked upload preparation tested
- ✅ Complete workflow state management verified

**Deliverables Completed**:
- ✅ Complete 4-step video workflow: Upload → Clip → Settings → Process
- ✅ Mobile-first responsive design with automatic layout switching
- ✅ Timeline selector with precise clip boundary controls
- ✅ FFMPEG overlay settings with real-time preview
- ✅ N8N webhook integration with tested communication
- ✅ Enhanced upload system supporting images and large files
- ✅ Professional UI using shadcn/ui components throughout

**Status**: ✅ **COMPLETED** - Complete video repurposing workflow operational and N8N integration verified

---

## 🚀 Phase 3 Success Metrics

**End of Phase 3 Result**: Complete mobile-first video repurposing workflow with N8N integration:

✅ **Mobile-First Design**: Responsive layouts with automatic viewport detection
✅ **Timeline Controls**: 0.1-second precision clip selection with dual-handle slider
✅ **Video Player Integration**: react-player with custom controls and scrubbing
✅ **Overlay Media Support**: Image and video overlay uploads with validation
✅ **FFMPEG Parameter Mapping**: UI controls directly mapped to N8N workflow parameters
✅ **N8N Webhook Integration**: Tested and confirmed working webhook communication
✅ **Large File Support**: Chunked uploads for files up to 2GB
✅ **State Management**: Enhanced Zustand store with N8N payload generation
✅ **Professional UI**: Complete shadcn/ui component integration
✅ **End-to-End Workflow**: 4-step process from upload to N8N processing trigger

**Current Status**: ✅ **PHASE 3 COMPLETE** - Full video repurposing workflow operational with N8N integration tested.

**Workflow Quality**: Production-ready mobile-first video repurposing system. Users can upload videos and overlays, select precise clip boundaries, configure FFMPEG parameters, and trigger N8N processing workflows. Ready for enhanced authentication and subscription management.

---

## 📋 Next Phases

### PHASE 4: Enhanced Auth Experience

**Objective**: Polish authentication UX and user management

- **Focus**: User management, password reset, profile management

### PHASE 5: OAuth Integration

**Objective**: Add Google OAuth with modular provider system

- **Focus**: Google Sign In, Apple Sign In, Magic Links

### PHASE 6: Video Processing Pipeline

**Objective**: N8N integration and processing workflow

- **Focus**: Processing jobs, status tracking, webhook integration

### PHASE 7: Dashboard and Management

**Objective**: User dashboard with video library and processing status

- **Focus**: Data visualization, job monitoring, user experience

### PHASE 8: Subscription System

**Objective**: Tiered subscription model with usage tracking

- **Focus**: Payment integration, usage limits, plan management

---

## 📝 Notes for Implementation

**When referencing this plan**:

- Use "implement Step X from DEVELOPMENT_PLAN.md" format
- Each step is self-contained with clear acceptance criteria
- Dependencies are listed for each major section
- Testing checkpoints ensure quality at each stage

**Development Approach**:

- Follow the step-by-step order within each day
- Complete all acceptance criteria before moving to next step
- Test thoroughly at each checkpoint
- Document any deviations or issues encountered

**Quality Standards**:

- All code must follow TypeScript strict mode
- UI components must be responsive and accessible
- Error handling required for all user-facing features
- Performance considerations for video processing workflows
