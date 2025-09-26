import { NextRequest, NextResponse } from "next/server"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { auth } from "@/lib/auth"
import { auditLogger } from "@/lib/security/audit"

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Required for R2
})

export async function GET(request: NextRequest) {
  try {
    // Check authentication using NextAuth.js
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const { searchParams } = new URL(request.url)
    const url = searchParams.get("url")

    if (!url) {
      return NextResponse.json(
        { error: "URL required" },
        { status: 400 }
      )
    }

    let key: string

    // Extract key from the R2 URL and validate access
    try {
      const urlObj = new URL(url)
      // Remove leading slash from pathname to get the key
      key = urlObj.pathname.substring(1)

      console.log("🔍 Proxy Debug - URL:", url)
      console.log("🔍 Proxy Debug - Extracted key:", key)
      console.log("🔍 Proxy Debug - UserId:", userId)
      console.log("🔍 Proxy Debug - Expected pattern:", `uploads/${userId}/`)

      // Validate that the URL belongs to the authenticated user
      if (!key.includes(`uploads/${userId}/`)) {
        console.log("❌ Proxy Debug - Access denied for key:", key)
        await auditLogger.logViolation(
          "UNAUTHORIZED_ACCESS",
          "READ",
          "video",
          `User ${userId} attempted to access file not owned by them: ${key}`,
          userId,
          undefined,
          requestId
        )
        return NextResponse.json(
          { error: "Access denied - file not owned by user" },
          { status: 403 }
        )
      }

      console.log("✅ Proxy Debug - Access granted for key:", key)
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      )
    }

    // Generate a presigned URL for GET request
    const command = new GetObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
      Key: key,
    })

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 1800, // 30 minutes expiry for better security
    })

    // Log successful access
    await auditLogger.logSuccess(
      userId,
      "READ",
      "video",
      key,
      requestId,
      { operation: 'presigned_url_generation', expiresIn: 1800 }
    )

    // Return the presigned URL
    return NextResponse.json({
      url: presignedUrl,
      expires: new Date(Date.now() + 1800 * 1000).toISOString(),
    })
  } catch (error) {
    console.error("Error generating presigned URL:", error)
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    )
  }
}