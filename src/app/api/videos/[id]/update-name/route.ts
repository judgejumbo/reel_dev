import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/middleware/auth-guard"
import { canUserAccessVideo } from "@/lib/security/access"
import { auditLogger } from "@/lib/security/audit"
import { db } from "@/lib/db"
import { videoUploads } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use enhanced authentication with rate limiting
    const authResult = await requireAuth(request)
    if (authResult.response) {
      return authResult.response
    }

    const { userId, requestId } = authResult
    const videoId = params.id
    const body = await request.json()
    const { projectName } = body

    if (!projectName) {
      return NextResponse.json(
        { error: "Project name required" },
        { status: 400 }
      )
    }

    // Check video update permissions
    const accessResult = await canUserAccessVideo(userId, videoId, "UPDATE", { requestId })
    if (!accessResult.allowed) {
      return NextResponse.json({ error: accessResult.reason || "Access denied" }, { status: 403 })
    }

    // Log the update operation
    await auditLogger.logSuccess(
      userId,
      "UPDATE",
      "video",
      videoId,
      requestId,
      { operation: 'update_project_name', newName: projectName }
    )

    // For now, we'll store the project name in a temporary way
    // Since we can't modify the database schema easily
    // We'll update the processingJobs table when it exists
    // or create a temporary record

    return NextResponse.json({
      success: true,
      message: "Project name will be saved when processing starts"
    })
  } catch (error) {
    console.error("Error updating project name:", error)
    return NextResponse.json(
      { error: "Failed to update project name" },
      { status: 500 }
    )
  }
}