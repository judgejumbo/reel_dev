import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/middleware/auth-guard"
import { secureQueries } from "@/lib/security/queries"
import { auditLogger } from "@/lib/security/audit"
import { db } from "@/lib/db"
import { usageTracking } from "@/lib/schema"
import { eq, and } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    // Use enhanced authentication with rate limiting
    const authResult = await requireAuth(request)
    if (authResult.response) {
      return authResult.response
    }

    const { userId, requestId } = authResult

    const body = await request.json()
    const {
      type, // "main" or "overlay"
      fileId,
      filename,
      fileSize,
      duration,
      format,
      resolution,
      fileKey, // R2 file key instead of full URL
      videoUploadId, // For overlay videos, this should be the existing record ID
    } = body

    // Validate required fields
    if (!type || !fileId || !filename || !fileSize || !fileKey) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    let recordId: string

    if (type === "main") {
      // Create new video upload record for main video using secure queries
      const context = secureQueries.createContext(userId, requestId)
      const insertResult = await secureQueries.insert("video", context, {
        mainVideoUrl: `${process.env.CLOUDFLARE_R2_ENDPOINT}/${fileKey}`,
        mainVideoFilename: filename,
        mainVideoSize: fileSize,
        duration: duration ? duration.toString() : null,
        originalFormat: format,
        originalResolution: resolution,
        status: "uploaded",
      })

      if (!insertResult.success) {
        return NextResponse.json(
          { error: "Failed to create video record" },
          { status: 500 }
        )
      }

      recordId = insertResult.id!

      // Update usage tracking with secure queries
      const currentDate = new Date()
      const month = currentDate.getMonth() + 1
      const year = currentDate.getFullYear()

      // Try to update existing usage record or create new one
      const existingUsage = await db
        .select()
        .from(usageTracking)
        .where(
          and(
            eq(usageTracking.userId, userId),
            eq(usageTracking.month, month),
            eq(usageTracking.year, year)
          )
        )
        .limit(1)

      if (existingUsage.length > 0) {
        await db
          .update(usageTracking)
          .set({
            uploadsCount: existingUsage[0].uploadsCount + 1,
            totalStorageUsed: existingUsage[0].totalStorageUsed + fileSize,
            updatedAt: new Date(),
          })
          .where(eq(usageTracking.id, existingUsage[0].id))
      } else {
        await db.insert(usageTracking).values({
          userId: userId,
          month,
          year,
          uploadsCount: 1,
          totalStorageUsed: fileSize,
        })
      }
    } else if (type === "overlay") {
      // Update existing video upload record with overlay video
      if (!videoUploadId) {
        return NextResponse.json(
          { error: "videoUploadId required for overlay video" },
          { status: 400 }
        )
      }

      // Use secure queries for overlay video update
      const context = secureQueries.createContext(userId, requestId)
      const updateResult = await secureQueries.update("video", context, videoUploadId, {
        overlayVideoUrl: `${process.env.CLOUDFLARE_R2_ENDPOINT}/${fileKey}`,
        overlayVideoFilename: filename,
        overlayVideoSize: fileSize,
        updatedAt: new Date(),
      })

      if (!updateResult.success) {
        return NextResponse.json(
          { error: "Failed to update video record or access denied" },
          { status: updateResult.reason === "NOT_FOUND" ? 404 : 403 }
        )
      }

      recordId = videoUploadId

      // Update storage usage for overlay video
      const currentDate = new Date()
      const month = currentDate.getMonth() + 1
      const year = currentDate.getFullYear()

      const existingUsage = await db
        .select()
        .from(usageTracking)
        .where(
          and(
            eq(usageTracking.userId, userId),
            eq(usageTracking.month, month),
            eq(usageTracking.year, year)
          )
        )
        .limit(1)

      if (existingUsage.length > 0) {
        await db
          .update(usageTracking)
          .set({
            totalStorageUsed: existingUsage[0].totalStorageUsed + fileSize,
            updatedAt: new Date(),
          })
          .where(eq(usageTracking.id, existingUsage[0].id))
      }
    } else {
      return NextResponse.json(
        { error: "Invalid upload type. Must be 'main' or 'overlay'" },
        { status: 400 }
      )
    }

    // Log successful upload completion
    await auditLogger.logSuccess(
      userId,
      type === "main" ? "CREATE" : "UPDATE",
      "video",
      recordId,
      requestId,
      {
        operation: 'upload_complete',
        uploadType: type,
        filename: filename,
        fileSize: fileSize,
        fileKey: fileKey
      }
    )

    return NextResponse.json({
      success: true,
      videoUploadId: recordId,
      message: `${type} video upload recorded successfully`,
    })
  } catch (error) {
    console.error("Error recording upload:", error)
    return NextResponse.json(
      { error: "Failed to record upload" },
      { status: 500 }
    )
  }
}