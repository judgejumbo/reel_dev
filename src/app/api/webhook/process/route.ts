import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { processingJobs } from "@/lib/schema"
import { eq } from "drizzle-orm"

const N8N_WEBHOOK_URL = "https://n8n.srv888156.hstgr.cloud/webhook-test/reelrift"

export async function POST(request: NextRequest) {
  console.log("=== Processing API called ===")
  try {
    // Check authentication
    console.log("Checking authentication...")
    const session = await auth()
    console.log("Session:", session?.user?.id ? "Valid" : "Invalid")

    if (!session?.user?.id) {
      console.log("Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { payload, projectName, webhookUrl } = body

    // Override payload webhookUrl with the one from client (which has access to NEXT_PUBLIC_ vars)
    if (webhookUrl) {
      payload.webhookUrl = webhookUrl
    }

    console.log("Received processing request:", {
      hasPayload: !!payload,
      hasProjectName: !!projectName,
      hasWebhookUrl: !!webhookUrl,
      receivedWebhookUrl: webhookUrl,
      originalPayloadWebhookUrl: payload?.webhookUrl,
      userId: session.user.id,
      payloadKeys: payload ? Object.keys(payload) : null
    })

    // Validate payload
    if (!payload || !projectName) {
      console.error("Validation failed:", { payload: !!payload, projectName: !!projectName })
      return NextResponse.json(
        { error: "Missing required fields: payload, projectName" },
        { status: 400 }
      )
    }

    // Save processing job to database (using N8N workflow variable names)
    try {
      await db.insert(processingJobs).values({
        id: payload.jobId,
        userId: session.user.id,
        projectName: projectName,
        webhookUrl: payload.webhookUrl,
        videoSegment: payload.videoSegment,
        overlayConfig: payload.overlayConfig,
        status: "pending",
        progress: 0,
      })
      console.log("Processing job saved to database:", payload.jobId)
    } catch (dbError) {
      console.error("Database error:", dbError)
      throw new Error(`Database error: ${dbError}`)
    }

    // Send payload to N8N webhook
    console.log("Sending payload to N8N:", JSON.stringify(payload, null, 2))

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    console.log("N8N webhook response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("N8N webhook error:", errorText)
      throw new Error(`N8N webhook failed: ${response.status} ${response.statusText} - ${errorText}`)
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
    console.error("=== ERROR processing webhook ===")
    console.error("Error type:", error?.constructor?.name)
    console.error("Error message:", (error as Error)?.message)
    console.error("Error stack:", (error as Error)?.stack)
    console.error("Full error:", error)

    return NextResponse.json(
      { error: "Failed to start processing" },
      { status: 500 }
    )
  }
}