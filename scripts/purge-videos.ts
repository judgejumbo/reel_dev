import "dotenv/config"
import { db } from "@/lib/db"
import { videoUploads, processingJobs, clipSettings } from "@/lib/schema"

async function purgeAllVideos() {
  console.log("🗑️  Starting database purge of all video-related data...")

  try {
    // Delete all clip settings first (has foreign key to videoUploads)
    const deletedClips = await db.delete(clipSettings)
    console.log("✓ Deleted all clip settings")

    // Delete all processing jobs
    const deletedJobs = await db.delete(processingJobs)
    console.log("✓ Deleted all processing jobs")

    // Delete all video uploads
    const deletedUploads = await db.delete(videoUploads)
    console.log("✓ Deleted all video uploads")

    console.log("✅ Database purge complete! All video-related data has been removed.")
    console.log("You can now start fresh with new video uploads.")

    process.exit(0)
  } catch (error) {
    console.error("❌ Error purging database:", error)
    process.exit(1)
  }
}

// Run the purge
purgeAllVideos()