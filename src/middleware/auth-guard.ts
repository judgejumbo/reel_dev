import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// Rate limiting storage (in-memory for development, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limit configuration
export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string // Custom key generation
}

// Default rate limit: 100 requests per 15 minutes per user
const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
}

// Auth guard result
export interface AuthGuardResult {
  success: boolean
  userId?: string
  requestId: string
  error?: string
  rateLimited?: boolean
}

// Session cache for performance (cache sessions for 1 minute)
const sessionCache = new Map<string, { session: any; expires: number }>()
const SESSION_CACHE_TTL = 60 * 1000 // 1 minute

/**
 * Enhanced authentication guard with rate limiting and caching
 */
export class AuthGuard {
  /**
   * Validate request authentication and apply rate limiting
   */
  static async validateRequest(
    request: NextRequest,
    rateLimitConfig: RateLimitConfig = DEFAULT_RATE_LIMIT
  ): Promise<AuthGuardResult> {
    const requestId = generateRequestId()

    try {
      // Step 1: Get and validate session
      const session = await this.getSessionWithCache(request)

      if (!session?.user?.id) {
        return {
          success: false,
          requestId,
          error: "Unauthorized - No valid session",
        }
      }

      const userId = session.user.id

      // Step 2: Apply rate limiting
      const rateLimitResult = this.applyRateLimit(userId, rateLimitConfig)

      if (!rateLimitResult.allowed) {
        return {
          success: false,
          userId,
          requestId,
          error: "Rate limit exceeded",
          rateLimited: true,
        }
      }

      // Step 3: Success
      return {
        success: true,
        userId,
        requestId,
      }

    } catch (error) {
      return {
        success: false,
        requestId,
        error: error instanceof Error ? error.message : "Authentication failed",
      }
    }
  }

  /**
   * Get session with caching for performance
   */
  private static async getSessionWithCache(request: NextRequest): Promise<any> {
    // Extract session token from cookies or headers
    const sessionToken = this.extractSessionToken(request)

    if (!sessionToken) {
      return null
    }

    // Check cache first
    const cached = sessionCache.get(sessionToken)
    if (cached && cached.expires > Date.now()) {
      return cached.session
    }

    // Get fresh session
    const session = await auth()

    // Cache the session
    if (session) {
      sessionCache.set(sessionToken, {
        session,
        expires: Date.now() + SESSION_CACHE_TTL,
      })
    }

    return session
  }

  /**
   * Extract session token from request
   */
  private static extractSessionToken(request: NextRequest): string | null {
    // Try to get session token from cookies
    const cookies = request.cookies
    const sessionToken = cookies.get("next-auth.session-token")?.value ||
                        cookies.get("__Secure-next-auth.session-token")?.value

    return sessionToken || null
  }

  /**
   * Apply rate limiting based on user ID
   */
  private static applyRateLimit(
    userId: string,
    config: RateLimitConfig
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const key = config.keyGenerator ? config.keyGenerator({} as NextRequest) : userId
    const now = Date.now()

    // Get current rate limit state
    let limitState = rateLimitStore.get(key)

    // Initialize or reset if window expired
    if (!limitState || now > limitState.resetTime) {
      limitState = {
        count: 0,
        resetTime: now + config.windowMs,
      }
    }

    // Check if limit exceeded
    if (limitState.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: limitState.resetTime,
      }
    }

    // Increment counter
    limitState.count++
    rateLimitStore.set(key, limitState)

    return {
      allowed: true,
      remaining: config.maxRequests - limitState.count,
      resetTime: limitState.resetTime,
    }
  }

  /**
   * Clean up expired rate limit entries (call periodically)
   */
  static cleanupRateLimitStore() {
    const now = Date.now()
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }

  /**
   * Clean up expired session cache entries
   */
  static cleanupSessionCache() {
    const now = Date.now()
    for (const [key, value] of sessionCache.entries()) {
      if (now > value.expires) {
        sessionCache.delete(key)
      }
    }
  }

  /**
   * Get rate limit status for a user
   */
  static getRateLimitStatus(userId: string): {
    remaining: number
    resetTime: number
    isLimited: boolean
  } {
    const limitState = rateLimitStore.get(userId)

    if (!limitState) {
      return {
        remaining: DEFAULT_RATE_LIMIT.maxRequests,
        resetTime: Date.now() + DEFAULT_RATE_LIMIT.windowMs,
        isLimited: false,
      }
    }

    const remaining = Math.max(0, DEFAULT_RATE_LIMIT.maxRequests - limitState.count)
    const isLimited = remaining === 0

    return {
      remaining,
      resetTime: limitState.resetTime,
      isLimited,
    }
  }
}

/**
 * Express-style middleware for API routes
 */
export async function requireAuth(
  request: NextRequest,
  rateLimitConfig?: RateLimitConfig
): Promise<{ response?: NextResponse; userId?: string; requestId: string }> {
  const result = await AuthGuard.validateRequest(request, rateLimitConfig)

  if (!result.success) {
    const status = result.rateLimited ? 429 : 401
    const message = result.error || "Authentication failed"

    return {
      response: NextResponse.json(
        {
          error: message,
          requestId: result.requestId,
          ...(result.rateLimited && { retryAfter: 900 }) // 15 minutes in seconds
        },
        { status }
      ),
      requestId: result.requestId,
    }
  }

  return {
    userId: result.userId!,
    requestId: result.requestId,
  }
}

/**
 * Generate unique request ID for tracing
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Cleanup timers (run every 5 minutes)
if (typeof window === "undefined") {
  setInterval(() => {
    AuthGuard.cleanupRateLimitStore()
    AuthGuard.cleanupSessionCache()
  }, 5 * 60 * 1000)
}

// Export configuration for different endpoints
export const RATE_LIMITS = {
  // Strict limits for sensitive operations
  STRICT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
  },
  // Normal limits for regular API calls
  NORMAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
  // Lenient limits for read-only operations
  LENIENT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 500,
  },
  // Upload operations (fewer but larger requests)
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
  },
} as const