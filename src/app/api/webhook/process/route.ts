import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { processingJobs } from "@/lib/schema"
import { eq } from "drizzle-orm"

const N8N_WEBHOOK_URL = "https://n8n.srv888156.hstgr.cloud/webhook-test/reelrift"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { payload, projectName } = body

    // Validate payload
    if (!payload || !projectName) {
      return NextResponse.json(
        { error: "Missing required fields: payload, projectName" },
        { status: 400 }
      )
    }

    // Save processing job to database
    await db.insert(processingJobs).values({
      id: payload.jobId,
      userId: session.user.id,
      projectName: projectName,
      status: "pending",
      progress: 0,
      mainVideoUrl: payload.videoUrl,
      overlayMediaUrl: payload.overlayUrl || null,
      clipSettings: payload.clipSettings,
      overlaySettings: payload.overlayConfig,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Send payload to N8N webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`N8N webhook failed: ${response.status} ${response.statusText}`)
    }

    const n8nResponse = await response.json()

    // Update job status to processing
    await db
      .update(processingJobs)
      .set({
        status: "processing",
        progress: 10,
        updatedAt: new Date(),
      })
      .where(eq(processingJobs.id, payload.jobId))

    return NextResponse.json({
      success: true,
      jobId: payload.jobId,
      n8nResponse,
    })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json(
      { error: "Failed to start processing" },
      { status: 500 }
    )
  }
}