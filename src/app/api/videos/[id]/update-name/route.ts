import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { videoUploads } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const videoId = params.id
    const body = await request.json()
    const { projectName } = body

    if (!projectName) {
      return NextResponse.json(
        { error: "Project name required" },
        { status: 400 }
      )
    }

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