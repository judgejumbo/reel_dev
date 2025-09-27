import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { secureQueries } from "@/lib/security/queries"
import { db } from "@/lib/db"
import { videoUploads } from "@/lib/schema"
import { inArray, eq, and } from "drizzle-orm"
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
    // Check authentication using NextAuth.js
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const { videoIds } = await request.json()

    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return NextResponse.json({ error: "Invalid video IDs" }, { status: 400 })
    }

    // Create secure context and use bulk delete
    const context = secureQueries.createContext(userId, requestId)
    const result = await secureQueries.bulkDelete("video", context, videoIds)

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "No videos found or access denied" }, { status: 404 })
    }

    // For R2 cleanup, we still need to fetch the video details
    const videos = await db
      .select({
        id: videoUploads.id,
        userId: videoUploads.userId,
        mainVideoUrl: videoUploads.mainVideoUrl,
        overlayVideoUrl: videoUploads.overlayVideoUrl,
      })
      .from(videoUploads)
      .where(and(
        inArray(videoUploads.id, result.deletedCount > 0 ? videoIds.filter(id => !result.failedIds.includes(id)) : []),
        eq(videoUploads.userId, userId)
      ))

    // Fetch associated processing jobs using secure queries
    const processingJobsList = await secureQueries.find("job", context)

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

    // Database deletion already handled by secureQueries.bulkDelete above

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} videos`,
      deletedCount: result.deletedCount,
      failedCount: result.failedIds.length,
      failedIds: result.failedIds,
    })
  } catch (error) {
    console.error("Error bulk deleting videos:", error)
    return NextResponse.json(
      { error: "Failed to delete videos" },
      { status: 500 }
    )
  }
}