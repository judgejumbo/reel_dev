import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/middleware/auth-guard"
import { secureDb, withSecureContext, createSecurityContext } from "@/lib/db-secure"
import { auditLogger } from "@/lib/security/audit"

export async function GET(request: NextRequest) {
  try {
    // Test authentication and rate limiting
    const authResult = await requireAuth(request)

    if (authResult.response) {
      // Authentication failed or rate limited
      return authResult.response
    }

    const { userId, requestId } = authResult

    // Test secure database operations
    const securityContext = createSecurityContext(
      userId,
      "READ",
      "video",
      requestId
    )

    const result = await withSecureContext(securityContext, async () => {
      // Test secure video query
      const videos = await secureDb.videos.findAll()

      // Test usage query
      const usage = await secureDb.usage.getCurrentMonthUsage()

      return {
        videosCount: videos.length,
        usage: usage ? {
          uploadsCount: usage.uploadsCount,
          totalProcessingTime: usage.totalProcessingTime,
        } : null,
      }
    })

    // Test audit logging
    await auditLogger.logSuccess(
      userId,
      "READ",
      "video",
      undefined,
      requestId,
      { testEndpoint: true, result }
    )

    return NextResponse.json({
      success: true,
      requestId,
      userId,
      data: result,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error("Test security endpoint error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Test with strict rate limiting
    const authResult = await requireAuth(request, {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 3, // Only 3 requests per 5 minutes
    })

    if (authResult.response) {
      return authResult.response
    }

    const { userId, requestId } = authResult

    // Test audit logging for violations
    await auditLogger.logViolation(
      "SUSPICIOUS_ACTIVITY",
      "CREATE",
      "video",
      "Test security violation",
      userId,
      "test-resource-id",
      requestId
    )

    return NextResponse.json({
      success: true,
      message: "Security test POST endpoint with strict rate limiting",
      requestId,
      userId,
      rateLimitInfo: "3 requests per 5 minutes",
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}