import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { secureQueries } from "@/lib/security/queries"
import { auditLogger } from "@/lib/security/audit"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    // Check authentication using NextAuth.js
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const { jobId } = await params

    // Use secure queries to get processing job with automatic ownership verification
    const context = secureQueries.createContext(userId, requestId)
    const jobs = await secureQueries.find("job", context, { id: jobId })
    const job = jobs[0]

    if (!job) {
      return NextResponse.json({ error: "Job not found or access denied" }, { status: 404 })
    }

    // Log successful job status access
    await auditLogger.logSuccess(
      userId,
      "READ",
      "job",
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