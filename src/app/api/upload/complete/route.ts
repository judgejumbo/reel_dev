import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { secureQueries } from "@/lib/security/queries"
import { auditLogger } from "@/lib/security/audit"
import { db } from "@/lib/db"
import { usageTracking } from "@/lib/schema"
import { eq, and } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    // Check authentication using NextAuth.js
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

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
      projectName, // Project name from Zustand store
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

      if (!insertResult || !insertResult.id) {
        return NextResponse.json(
          { error: "Failed to create video record" },
          { status: 500 }
        )
      }

      recordId = insertResult.id

      // Update usage tracking
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

      if (!updateResult) {
        return NextResponse.json(
          { error: "Failed to update video record or access denied" },
          { status: 403 }
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
    console.error("=== UPLOAD COMPLETE ERROR ===")
    console.error("Error type:", error?.constructor?.name)
    console.error("Error message:", (error as Error)?.message)
    console.error("Error stack:", (error as Error)?.stack)
    console.error("Full error:", error)
    console.error("=== END ERROR ===")
    return NextResponse.json(
      { error: "Failed to record upload" },
      { status: 500 }
    )
  }
}