import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/middleware/auth-guard"
import { secureQueries } from "@/lib/security/queries"
import { auditLogger } from "@/lib/security/audit"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    // Use enhanced authentication with rate limiting
    const authResult = await requireAuth(request)
    if (authResult.response) {
      return authResult.response
    }

    const { userId, requestId } = authResult

    const { jobId } = await params

    // Use secure queries to get processing job with automatic ownership verification
    const context = secureQueries.createContext(userId, requestId)
    const job = await secureQueries.findById("processingJob", context, jobId)

    if (!job) {
      return NextResponse.json({ error: "Job not found or access denied" }, { status: 404 })
    }

    // Log successful job status access
    await auditLogger.logSuccess(
      userId,
      "READ",
      "processingJob",
      jobId,
      requestId,
      { operation: 'get_job_status', status: job.status }
    )

    return NextResponse.json({
      id: job.id,
      status: job.status,
      progress: job.progress,
      outputUrl: job.outputUrl,
      thumbnailUrl: job.thumbnailUrl,
      error: job.error,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    })
  } catch (error) {
    console.error("Error fetching job status:", error)
    return NextResponse.json(
      { error: "Failed to fetch job status" },
      { status: 500 }
    )
  }
}