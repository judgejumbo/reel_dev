import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { videoUploads, usageTracking } from "@/lib/schema"
import { eq, and } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
      // Create new video upload record for main video
      const [newRecord] = await db
        .insert(videoUploads)
        .values({
          userId: session.user.id,
          mainVideoUrl: `${process.env.CLOUDFLARE_R2_ENDPOINT}/${fileKey}`,
          mainVideoFilename: filename,
          mainVideoSize: fileSize,
          duration: duration ? duration.toString() : null,
          originalFormat: format,
          originalResolution: resolution,
          status: "uploaded",
        })
        .returning({ id: videoUploads.id })

      recordId = newRecord.id

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
            eq(usageTracking.userId, session.user.id),
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
          userId: session.user.id,
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

      await db
        .update(videoUploads)
        .set({
          overlayVideoUrl: `${process.env.CLOUDFLARE_R2_ENDPOINT}/${fileKey}`,
          overlayVideoFilename: filename,
          overlayVideoSize: fileSize,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(videoUploads.id, videoUploadId),
            eq(videoUploads.userId, session.user.id) // Ensure user owns the record
          )
        )

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
            eq(usageTracking.userId, session.user.id),
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