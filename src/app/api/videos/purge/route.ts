import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { videoUploads, processingJobs, clipSettings } from "@/lib/schema"
import { eq, inArray } from "drizzle-orm"

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`🗑️  Starting database purge for user: ${session.user.id}`)

    // Delete all clip settings for this user's videos first
    const userVideos = await db
      .select({ id: videoUploads.id })
      .from(videoUploads)
      .where(eq(videoUploads.userId, session.user.id))

    if (userVideos.length > 0) {
      const videoIds = userVideos.map(v => v.id)
      await db.delete(clipSettings).where(inArray(clipSettings.videoUploadId, videoIds))
    }
    console.log("✓ Deleted user's clip settings")

    // Delete all processing jobs for this user
    await db.delete(processingJobs).where(eq(processingJobs.userId, session.user.id))
    console.log("✓ Deleted user's processing jobs")

    // Delete all video uploads for this user
    await db.delete(videoUploads).where(eq(videoUploads.userId, session.user.id))
    console.log("✓ Deleted user's video uploads")

    console.log(`✅ Database purge complete for user: ${session.user.id}`)

    return NextResponse.json({
      success: true,
      message: "All your video-related data has been purged from the database"
    })
  } catch (error) {
    console.error("❌ Error purging user database:", error)
    return NextResponse.json(
      { error: "Failed to purge database" },
      { status: 500 }
    )
  }
}