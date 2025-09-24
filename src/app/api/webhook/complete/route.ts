import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { processingJobs } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, status, progress, resultUrl, metadata, error } = body

    // Validate required fields
    if (!jobId) {
      return NextResponse.json(
        { error: "Missing required field: jobId" },
        { status: 400 }
      )
    }

    // Update processing job in database
    const updateData: {
      status?: string
      progress?: number
      outputUrl?: string
      thumbnailUrl?: string
      error?: string
      updatedAt: Date
    } = {
      updatedAt: new Date(),
    }

    // Set status if provided
    if (status) {
      updateData.status = status
      // Auto-set progress based on status if not explicitly provided
      if (progress === undefined) {
        updateData.progress = status === "completed" ? 100 : status === "processing" ? 10 : 0
      }
    }

    // Set progress if provided
    if (progress !== undefined) {
      updateData.progress = Math.max(0, Math.min(100, progress))
    }

    if (resultUrl) {
      updateData.outputUrl = resultUrl
    }

    if (metadata?.thumbnailUrl) {
      updateData.thumbnailUrl = metadata.thumbnailUrl
    }

    if (error) {
      updateData.error = error
    }

    const result = await db
      .update(processingJobs)
      .set(updateData)
      .where(eq(processingJobs.id, jobId))

    // Check if job was found and updated
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      )
    }

    // Log update for debugging
    console.log(`Processing job ${jobId} updated:`, { status, progress, resultUrl, thumbnailUrl: metadata?.thumbnailUrl, error })

    return NextResponse.json({
      success: true,
      jobId,
      status,
    })
  } catch (error) {
    console.error("Error updating processing job:", error)
    return NextResponse.json(
      { error: "Failed to update processing job" },
      { status: 500 }
    )
  }
}