import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { videoUploads, processingJobs, clipSettings } from "@/lib/schema"

export async function DELETE() {
  try {
    console.log("🗑️  Starting database purge of all video-related data...")

    // Delete all clip settings first (has foreign key to videoUploads)
    await db.delete(clipSettings)
    console.log("✓ Deleted all clip settings")

    // Delete all processing jobs
    await db.delete(processingJobs)
    console.log("✓ Deleted all processing jobs")

    // Delete all video uploads
    await db.delete(videoUploads)
    console.log("✓ Deleted all video uploads")

    console.log("✅ Database purge complete! All video-related data has been removed.")

    return NextResponse.json({
      success: true,
      message: "All video-related data has been purged from the database"
    })
  } catch (error) {
    console.error("❌ Error purging database:", error)
    return NextResponse.json(
      { error: "Failed to purge database" },
      { status: 500 }
    )
  }
}