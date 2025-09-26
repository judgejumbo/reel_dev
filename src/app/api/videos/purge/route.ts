import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/middleware/auth-guard"
import { secureQueries } from "@/lib/security/queries"
import { auditLogger } from "@/lib/security/audit"
import { db } from "@/lib/db"
import { videoUploads, processingJobs, clipSettings } from "@/lib/schema"
import { eq, inArray } from "drizzle-orm"

export async function DELETE(request: NextRequest) {
  try {
    // Use enhanced authentication with rate limiting
    const authResult = await requireAuth(request)
    if (authResult.response) {
      return authResult.response
    }

    const { userId, requestId } = authResult

    console.log(`🗑️  Starting database purge for user: ${userId}`)

    // Log critical operation
    await auditLogger.logSuccess(
      userId,
      "DELETE",
      "video",
      undefined,
      requestId,
      { operation: 'purge_all_user_data', severity: 'critical' }
    )

    // Use secure context for bulk operations
    const context = secureQueries.createContext(userId, requestId)

    // Get all user's videos for bulk deletion
    const userVideos = await secureQueries.find("video", context)

    if (userVideos.length > 0) {
      const videoIds = userVideos.map(v => v.id)
      const bulkResult = await secureQueries.bulkDelete("video", context, videoIds)

      console.log(`✓ Deleted ${bulkResult.deletedCount} videos and related records`)
      if (bulkResult.failedIds.length > 0) {
        console.log(`⚠️  Failed to delete ${bulkResult.failedIds.length} videos`)
      }
    } else {
      console.log("✓ No videos found for user")
    }

    console.log(`✅ Database purge complete for user: ${userId}`)

    return NextResponse.json({
      success: true,
      message: "All your video-related data has been purged from the database"
    })
  } catch (error) {
    console.error("❌ Error purging user database:", error)

    // Log failure
    try {
      const { userId, requestId } = await requireAuth(request)
      await auditLogger.logFailure(
        "DELETE",
        "video",
        error instanceof Error ? error.message : "Purge operation failed",
        userId,
        undefined,
        undefined,
        requestId
      )
    } catch {
      // Ignore audit errors during error handling
    }

    return NextResponse.json(
      { error: "Failed to purge database" },
      { status: 500 }
    )
  }
}