import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { processingJobs } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { withWebhookAuth, checkWebhookRateLimit } from "@/lib/webhook-security"

export const POST = withWebhookAuth(async (request: NextRequest, body: any) => {
  try {
    // Rate limiting: 5 requests per minute per IP
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    if (!checkWebhookRateLimit(clientIP, 5, 60000)) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      )
    }

    // Log the entire webhook payload for debugging
    console.log("🔵 WEBHOOK COMPLETE - Full payload:", JSON.stringify(body, null, 2))

    // Try multiple possible field names N8N might use
    const jobId = body.jobId
    const status = body.status
    const progress = body.progress
    const resultUrl = body.resultUrl || body.result_url || body.outputUrl || body.output_url || body.url
    const metadata = body.metadata
    const error = body.error

    // Log what we extracted
    console.log("🟡 Extracted values:", { jobId, status, resultUrl })

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
})