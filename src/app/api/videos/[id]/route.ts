import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { videoUploads, processingJobs, clipSettings } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { S3Client, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3"

// Initialize S3 client for R2
const S3 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

// GET endpoint to fetch a single video by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id

    if (!videoId) {
      return NextResponse.json({ error: "Video ID required" }, { status: 400 })
    }

    // Fetch the video upload
    const [video] = await db
      .select()
      .from(videoUploads)
      .where(eq(videoUploads.id, videoId))

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Try to find a matching processing job
    const processingJobsList = await db
      .select()
      .from(processingJobs)
      .where(eq(processingJobs.userId, video.userId))

    let matchingJob = null
    for (const job of processingJobsList) {
      if (job.projectName?.includes(video.id.slice(0, 8))) {
        matchingJob = job
        break
      }
    }

    // Return the formatted video data
    return NextResponse.json({
      id: video.id,
      projectName: matchingJob?.projectName || `Project-${video.id.slice(0, 8)}`,
      status: matchingJob?.status || video.status || "pending",
      thumbnailUrl: matchingJob?.thumbnailUrl,
      outputUrl: matchingJob?.outputUrl,
      mainVideoFilename: video.mainVideoFilename,
      mainVideoSize: video.mainVideoSize,
      mainVideoUrl: video.mainVideoUrl,
      overlayVideoUrl: video.overlayVideoUrl,
      duration: video.duration ? parseFloat(video.duration) : undefined,
      createdAt: video.createdAt.toISOString(),
      processingJobId: matchingJob?.id || null,
    })
  } catch (error) {
    console.error("Error fetching video:", error)
    return NextResponse.json(
      { error: "Failed to fetch video" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id

    // First, fetch the video to get file URLs and verify ownership
    const [video] = await db
      .select({
        id: videoUploads.id,
        userId: videoUploads.userId,
        mainVideoUrl: videoUploads.mainVideoUrl,
        overlayVideoUrl: videoUploads.overlayVideoUrl,
      })
      .from(videoUploads)
      .where(eq(videoUploads.id, videoId))

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Fetch associated processing job if exists
    const [processingJob] = await db
      .select({
        id: processingJobs.id,
        outputUrl: processingJobs.outputUrl,
        thumbnailUrl: processingJobs.thumbnailUrl,
      })
      .from(processingJobs)
      .where(eq(processingJobs.userId, video.userId))

    // Delete from R2 bucket
    const filesToDelete: string[] = []

    // Extract file keys from URLs
    const extractKeyFromUrl = (url: string) => {
      try {
        // Handle both full URLs and R2 paths
        if (url.startsWith("http")) {
          const urlObj = new URL(url)
          // Remove leading slash and bucket name if present
          return urlObj.pathname.replace(/^\/[^\/]+\//, "").replace(/^\//, "")
        }
        // If it's already a key, return as is
        return url.replace(/^\//, "")
      } catch {
        return url
      }
    }

    // Add main video to deletion list
    if (video.mainVideoUrl) {
      filesToDelete.push(extractKeyFromUrl(video.mainVideoUrl))
    }

    // Add overlay video if exists
    if (video.overlayVideoUrl) {
      filesToDelete.push(extractKeyFromUrl(video.overlayVideoUrl))
    }

    // Add processed output and thumbnail if exists
    if (processingJob) {
      if (processingJob.outputUrl) {
        filesToDelete.push(extractKeyFromUrl(processingJob.outputUrl))
      }
      if (processingJob.thumbnailUrl) {
        filesToDelete.push(extractKeyFromUrl(processingJob.thumbnailUrl))
      }
    }

    // Delete files from R2
    if (filesToDelete.length > 0) {
      // Delete objects in batch
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

    // Delete from database (cascade will handle related records)
    // Delete clip settings first
    await db
      .delete(clipSettings)
      .where(eq(clipSettings.videoUploadId, videoId))

    // Delete processing job if exists
    if (processingJob) {
      await db
        .delete(processingJobs)
        .where(eq(processingJobs.id, processingJob.id))
    }

    // Finally delete the video upload record
    await db.delete(videoUploads).where(eq(videoUploads.id, videoId))

    return NextResponse.json({ success: true, message: "Video deleted successfully" })
  } catch (error) {
    console.error("Error deleting video:", error)
    return NextResponse.json(
      { error: "Failed to delete video" },
      { status: 500 }
    )
  }
}