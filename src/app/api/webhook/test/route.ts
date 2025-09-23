import { NextRequest, NextResponse } from "next/server"

const N8N_WEBHOOK_URL = "https://n8n.srv888156.hstgr.cloud/webhook-test/reelrift"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { payload, projectName } = body

    // Validate payload
    if (!payload || !projectName) {
      return NextResponse.json(
        { error: "Missing required fields: payload, projectName" },
        { status: 400 }
      )
    }

    console.log("Testing N8N webhook with payload:", payload)

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

    const n8nResponse = await response.text()
    console.log("N8N Response:", n8nResponse)

    return NextResponse.json({
      success: true,
      jobId: payload.jobId,
      n8nStatus: response.status,
      n8nResponse: n8nResponse,
      message: "Successfully sent to N8N webhook"
    })
  } catch (error) {
    console.error("Error testing N8N webhook:", error)
    return NextResponse.json(
      {
        error: "Failed to send to N8N webhook",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}