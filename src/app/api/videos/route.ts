import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { secureQueries } from "@/lib/security/queries"
import { auditLogger } from "@/lib/security/audit"

// Convert private R2 URLs to public URLs for display
function convertToPublicUrl(privateUrl: string | null): string | null {
  if (!privateUrl) return null

  // Don't convert - source videos stay private, processed videos are already public
  // The N8N workflow handles making processed videos public
  return privateUrl
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication using NextAuth.js
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create secure context for database operations
    const context = secureQueries.createContext(userId, requestId)

    // Use secure queries with automatic userId filtering
    const videoUploadsList = await secureQueries.find("video", context)
    const processingJobsList = await secureQueries.find("job", context)

    // Since we don't have a direct foreign key relationship,
    // we'll match based on creation time proximity and user
    // A processing job created shortly after a video upload likely belongs to it
    const formattedVideos = videoUploadsList.map((video) => {
      // Find processing jobs created within 5 minutes after this video upload
      const matchingJob = processingJobsList.find(job => {
        const videoTime = video.createdAt.getTime()
        const jobTime = job.createdAt.getTime()
        const timeDiff = jobTime - videoTime
        // Job created 0-5 minutes after video upload
        return timeDiff >= 0 && timeDiff <= 5 * 60 * 1000
      })

      return {
        id: video.id,
        projectName: matchingJob?.projectName || `Project-${video.id.slice(0, 8)}`,
        status: matchingJob?.status || video.status || "pending",
        thumbnailUrl: matchingJob?.thumbnailUrl, // Already public from N8N
        outputUrl: matchingJob?.outputUrl, // Already public from N8N
        mainVideoFilename: video.mainVideoFilename,
        mainVideoSize: video.mainVideoSize,
        duration: video.duration ? parseFloat(video.duration) : undefined,
        createdAt: video.createdAt.toISOString(),
        mainVideoUrl: video.mainVideoUrl, // Keep private - source file
        overlayVideoUrl: video.overlayVideoUrl, // Keep private - source file
        processingJobId: matchingJob?.id || null,
      }
    })

    // Log successful video access
    await auditLogger.logSuccess(
      userId,
      "READ",
      "video",
      undefined, // No specific video ID for list operation
      requestId,
      { operation: 'list_videos', count: formattedVideos.length }
    )

    return NextResponse.json(formattedVideos)
  } catch (error) {
    console.error("Error fetching videos:", error)
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    )
  }
}