import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { videoUploads, processingJobs, clipSettings } from "@/lib/schema"
import { inArray, eq } from "drizzle-orm"
import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3"

// Initialize S3 client for R2
const S3 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { videoIds } = await request.json()

    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return NextResponse.json({ error: "Invalid video IDs" }, { status: 400 })
    }

    // Fetch all videos to get file URLs
    const videos = await db
      .select({
        id: videoUploads.id,
        userId: videoUploads.userId,
        mainVideoUrl: videoUploads.mainVideoUrl,
        overlayVideoUrl: videoUploads.overlayVideoUrl,
      })
      .from(videoUploads)
      .where(inArray(videoUploads.id, videoIds))

    if (videos.length === 0) {
      return NextResponse.json({ error: "No videos found" }, { status: 404 })
    }

    // Fetch associated processing jobs
    const userIds = [...new Set(videos.map((v) => v.userId))]
    const processingJobsList = await db
      .select({
        id: processingJobs.id,
        userId: processingJobs.userId,
        outputUrl: processingJobs.outputUrl,
        thumbnailUrl: processingJobs.thumbnailUrl,
      })
      .from(processingJobs)
      .where(inArray(processingJobs.userId, userIds))

    // Collect all files to delete from R2
    const filesToDelete: string[] = []

    const extractKeyFromUrl = (url: string) => {
      try {
        if (url.startsWith("http")) {
          const urlObj = new URL(url)
          return urlObj.pathname.replace(/^\/[^\/]+\//, "").replace(/^\//, "")
        }
        return url.replace(/^\//, "")
      } catch {
        return url
      }
    }

    // Add video files
    videos.forEach((video) => {
      if (video.mainVideoUrl) {
        filesToDelete.push(extractKeyFromUrl(video.mainVideoUrl))
      }
      if (video.overlayVideoUrl) {
        filesToDelete.push(extractKeyFromUrl(video.overlayVideoUrl))
      }
    })

    // Add processing job files
    processingJobsList.forEach((job) => {
      if (job.outputUrl) {
        filesToDelete.push(extractKeyFromUrl(job.outputUrl))
      }
      if (job.thumbnailUrl) {
        filesToDelete.push(extractKeyFromUrl(job.thumbnailUrl))
      }
    })

    // Delete files from R2 in batch
    if (filesToDelete.length > 0) {
      const deleteParams = {
        Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
        Delete: {
          Objects: filesToDelete.map((key) => ({ Key: key })),
        },
      }

      try {
        const deleteCommand = new DeleteObjectsCommand(deleteParams)
        await S3.send(deleteCommand)
        console.log(`Deleted ${filesToDelete.length} files from R2`)
      } catch (r2Error) {
        console.error("Error deleting files from R2:", r2Error)
        // Continue with database deletion even if R2 deletion fails
      }
    }

    // Delete from database
    // First delete clip settings
    await db
      .delete(clipSettings)
      .where(inArray(clipSettings.videoUploadId, videoIds))

    // Delete processing jobs
    if (processingJobsList.length > 0) {
      await db
        .delete(processingJobs)
        .where(inArray(processingJobs.id, processingJobsList.map((j) => j.id)))
    }

    // Finally delete video uploads
    await db.delete(videoUploads).where(inArray(videoUploads.id, videoIds))

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${videoIds.length} videos`,
      deletedCount: videoIds.length,
    })
  } catch (error) {
    console.error("Error bulk deleting videos:", error)
    return NextResponse.json(
      { error: "Failed to delete videos" },
      { status: 500 }
    )
  }
}