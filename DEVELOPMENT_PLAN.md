# Development Plan - Video Repurposing SaaS

## Project Overview
Video repurposing SaaS application that converts horizontal videos to 1080x1920 vertical format for social platforms like YouTube Shorts and TikTok.

## ✅ COMPLETED PHASES (Current Status)

### Phase 1: Core Authentication & Database ✅
**Status**: Complete
- NextAuth.js v5 with credentials provider + Drizzle adapter
- Neon PostgreSQL database with complete schema
- User registration and login functionality
- Protected routes and session management
- Database tables: `users`, `accounts`, `sessions`, `verificationTokens`

### Phase 2: File Upload Infrastructure ✅
**Status**: Complete
- Multi-part chunked upload with Uppy.js
- Cloudflare R2 storage integration with presigned URLs
- Video and overlay media file handling
- Upload progress tracking and error handling
- API routes: `/api/upload/presigned-url`, `/api/upload/chunked`, `/api/upload/complete`

### Phase 3: Video Processing Workflow ✅
**Status**: Complete
- 4-step workflow: Upload → Clip → Settings → Process
- Timeline-based video segment selection
- FFMPEG parameter configuration (overlay settings)
- Zustand state management with localStorage persistence
- Workflow stepper UI with step validation

### Phase 4: Video Processing Integration ✅
**Status**: Complete
- N8N webhook integration for video processing
- Processing job management and status tracking
- Webhook endpoints: `/api/webhook/process`, `/api/webhook/complete`
- Real-time processing progress updates
- Database table: `processing_jobs`

### Phase 5: User Experience & Video Management ✅
**Status**: Complete
- Professional dashboard with navigation
- Video library with source/completed toggles
- Video streaming via R2 proxy (`/api/videos/proxy`)
- Mobile-responsive design with desktop/mobile layouts
- Project creation and video CRUD operations
- Complete workflow results page

**Key Features Delivered:**
- Full video processing pipeline (horizontal → vertical 1080x1920)
- Subscription system foundation (`subscription_plans`, `user_subscriptions`, `usage_tracking` tables)
- Professional UI/UX with shadcn/ui components
- Complete API infrastructure for video management

---

## 🚧 PRODUCTION MVP ROADMAP

### Phase 6: Enhanced Authentication Experience 📋 NEXT
**Priority**: High - Essential for production
**Timeline**: 5-7 days on localhost
**Approach**: Three auth features using shared infrastructure

#### 6.1 Setup & Infrastructure (Day 1) ✅
- [x] Create Resend account at resend.com
- [x] Get API key from Resend dashboard
- [x] Install dependencies: `npm install resend nodemailer @react-email/components`
- [x] Add Resend environment variables to .env.local
- [x] Create `authTokens` database table in schema.ts
- [x] Run database migration: `npm run db:push`
- [x] Create src/lib/email.ts for Resend client wrapper
- [x] Create src/lib/tokens.ts for token utilities
- [x] Set up test email addresses for development

#### 6.2 Password Reset Flow (Day 2-3) ✅
- [x] Create /forgot-password page with email form
- [x] Create server action for password reset request
- [x] Implement token generation and hashing
- [x] Create password reset email template with React Email
- [x] Create /reset-password/[token] page
- [x] Implement token validation logic
- [x] Create new password form with confirmation
- [x] Implement password update server action
- [x] Add success/error messaging
- [x] Test full flow with verified@resend.dev
- [x] Fix Next.js 15 async params issue
- [x] Fix Drizzle NULL checks with isNull()

#### 6.3 Magic Links Implementation (Day 3-4)
- [ ] Update /login page with "Email me a login link" option
- [ ] Create toggle between password and magic link modes
- [ ] Create server action for magic link generation
- [ ] Create magic link email template
- [ ] Create /auth/magic/[token] handler page
- [ ] Implement auto-login on valid token
- [ ] Add token expiration (15 minutes for magic links)
- [ ] Handle used token rejection
- [ ] Add rate limiting for magic link requests
- [ ] Test magic link flow end-to-end

#### 6.4 Email Verification (Day 4-5)
- [ ] Update registration flow to send verification email
- [ ] Create verification email template
- [ ] Set emailVerified to null on new registration
- [ ] Create /verify-email/[token] page
- [ ] Implement email verification logic
- [ ] Update user.emailVerified timestamp on success
- [ ] Add "Resend verification email" functionality
- [ ] Create verification status banner component
- [ ] Add verification check middleware (optional)
- [ ] Test verification flow with new registrations

#### 6.5 Profile Management Updates (Day 5-6)
- [ ] Update /settings page with email section
- [ ] Add "Change password" form (requires current password)
- [ ] Implement password change server action
- [ ] Add "Change email" with re-verification flow
- [ ] Add "Resend verification email" button
- [ ] Create account security section
- [ ] Show last password change date
- [ ] Add email verification status display
- [ ] Implement success toast notifications
- [ ] Test all profile update flows

#### 6.6 Testing & Polish (Day 6-7)
- [ ] Test all flows with Resend test addresses
- [ ] Implement rate limiting on all token endpoints
- [ ] Add comprehensive error handling
- [ ] Create loading states for all actions
- [ ] Style all email templates for major clients
- [ ] Add email preview functionality (dev only)
- [ ] Test token expiration scenarios
- [ ] Test concurrent token scenarios
- [ ] Create token cleanup job (delete expired)
- [ ] Document all new auth endpoints

#### 6.7 Production Preparation
- [ ] Update EMAIL_FROM to production domain
- [ ] Verify domain in Resend dashboard (for production)
- [ ] Update email templates with production branding
- [ ] Configure production rate limits
- [ ] Set appropriate token expiration times
- [ ] Add monitoring for email delivery
- [ ] Create runbook for common issues
- [ ] Test with real email addresses

**Test Email Addresses for Development**:
```
delivered@resend.dev              # Successful delivery
delivered+reset@resend.dev        # Password reset testing
delivered+magic@resend.dev        # Magic link testing
delivered+verify@resend.dev       # Verification testing
bounced@resend.dev               # Test bounce handling
complained@resend.dev            # Test spam handling
```

**Success Criteria**:
- [ ] Password reset works end-to-end on localhost
- [ ] Magic links provide one-click authentication
- [ ] Email verification completes successfully
- [ ] All emails sent via Resend API
- [ ] Professional email templates render correctly
- [ ] Tokens are secure (hashed, expiring, single-use)
- [ ] Clear user feedback for all states
- [ ] Rate limiting prevents abuse
- [ ] Ready for production deployment

**Estimated Completion**: 5-7 days development + 1-2 days production setup

### Phase 7: Payment & Subscription System 📋
**Priority**: High - Revenue generation
- [ ] Stripe payment integration
- [ ] Subscription plan management UI
- [ ] Usage tracking and limits enforcement
- [ ] Plan upgrade/downgrade workflows
- [ ] Billing history and invoices

**Estimated**: 2-3 weeks

### Phase 8: Production Infrastructure 📋
**Priority**: High - Deployment ready
- [ ] Vercel deployment configuration
- [ ] Environment variable management
- [ ] Error tracking (Sentry integration)
- [ ] Performance monitoring
- [ ] Database optimization and indexing
- [ ] CDN optimization for video delivery

**Estimated**: 1-2 weeks

### Phase 9: OAuth Integration 📋
**Priority**: Medium - User convenience
- [ ] Google Sign In
- [ ] Apple Sign In
- [ ] Magic link authentication
- [ ] Modular authentication provider system

**Estimated**: 1-2 weeks

### Phase 10: Analytics & Insights 📋
**Priority**: Medium - User engagement
- [ ] Video analytics dashboard
- [ ] Processing success/failure metrics
- [ ] User engagement tracking
- [ ] Performance insights

**Estimated**: 2-3 weeks

---

## 🎯 PRODUCTION MVP DEFINITION

### Core MVP Requirements (Must Have)
1. ✅ **Video Processing Pipeline** - Complete
2. ✅ **User Authentication** - Complete
3. ✅ **File Upload & Storage** - Complete
4. ✅ **Video Management** - Complete
5. 📋 **Email Verification** - Phase 6
6. 📋 **Password Reset** - Phase 6
7. 📋 **Payment System** - Phase 7
8. 📋 **Production Deployment** - Phase 8

### Success Metrics for MVP Launch
- User registration and onboarding flow (< 2 minutes)
- Video processing success rate (> 95%)
- End-to-end processing time (< 5 minutes for typical video)
- System uptime (> 99.5%)
- Payment conversion rate tracking

### Technical Debt & Optimization
- [ ] Add comprehensive error boundaries
- [ ] Implement retry logic for failed uploads
- [ ] Add video processing queue management
- [ ] Database query optimization
- [ ] Add comprehensive logging

---

## 📊 CURRENT ARCHITECTURE SUMMARY

### Technology Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend**: Next.js API routes, NextAuth.js v5
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Storage**: Cloudflare R2
- **Processing**: N8N webhooks + FFMPEG
- **State**: Zustand with persistence

### Database Schema (Complete)
- Authentication tables (NextAuth.js compatible)
- Subscription system tables
- Video workflow tables (`video_uploads`, `clip_settings`, `processing_jobs`)
- Usage tracking for limits

### API Infrastructure (Complete)
- Upload endpoints with chunked upload support
- Video CRUD operations with R2 integration
- Processing webhook endpoints
- User management endpoints

---

## 🚀 DEPLOYMENT STRATEGY

### Phase 8 Production Deployment Plan
1. **Environment Setup**
   - Vercel project configuration
   - Production database (Neon)
   - Cloudflare R2 production bucket
   - N8N production webhook URLs

2. **Security Hardening**
   - Environment variable audit
   - CORS configuration
   - Rate limiting implementation
   - Input validation strengthening

3. **Monitoring Setup**
   - Error tracking (Sentry)
   - Performance monitoring
   - Database query monitoring
   - Video processing success rates

4. **Testing Strategy**
   - End-to-end testing for critical workflows
   - Load testing for video upload/processing
   - Payment integration testing

### Estimated Timeline to Production MVP
**Total**: 4-7 weeks from current state
- Phase 6 (Auth): 1-2 weeks
- Phase 7 (Payments): 2-3 weeks
- Phase 8 (Deploy): 1-2 weeks

**Minimum Viable Timeline**: 4 weeks (focusing only on essential features)