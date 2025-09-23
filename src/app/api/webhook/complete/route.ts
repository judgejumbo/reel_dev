import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { processingJobs } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, status, outputUrl, thumbnailUrl, error } = body

    // Validate required fields
    if (!jobId || !status) {
      return NextResponse.json(
        { error: "Missing required fields: jobId, status" },
        { status: 400 }
      )
    }

    // Update processing job in database
    const updateData: any = {
      status: status,
      progress: status === "completed" ? 100 : 0,
      updatedAt: new Date(),
    }

    if (outputUrl) {
      updateData.outputUrl = outputUrl
    }

    if (thumbnailUrl) {
      updateData.thumbnailUrl = thumbnailUrl
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

    // Log completion for debugging
    console.log(`Processing job ${jobId} completed with status: ${status}`)

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