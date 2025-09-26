import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/middleware/auth-guard"
import { auditLogger } from "@/lib/security/audit"
// Using crypto.randomUUID() for UUID generation

// For Cloudflare R2, we'll use AWS SDK v3 compatible interface
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3Client = new S3Client({
  region: "auto", // Cloudflare R2 uses 'auto' region
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Required for R2
})

export async function POST(request: NextRequest) {
  try {
    // Use enhanced authentication with rate limiting
    const authResult = await requireAuth(request)
    if (authResult.response) {
      return authResult.response
    }

    const { userId, requestId } = authResult

    const body = await request.json()
    const { filename, contentType, type } = body

    // Validate input
    if (!filename || !contentType || !type) {
      return NextResponse.json(
        { error: "Missing required fields: filename, contentType, type" },
        { status: 400 }
      )
    }

    // Validate file type based on upload type
    let allowedTypes: string[] = []

    if (type === "main") {
      // Main video only accepts video files
      allowedTypes = ["video/mp4", "video/mov", "video/avi", "video/quicktime"]
    } else if (type === "overlay") {
      // Overlay can accept both images and videos
      allowedTypes = [
        "video/mp4", "video/mov", "video/avi", "video/quicktime",
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
      ]
    }

    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: `Invalid file type for ${type} upload. Allowed types: ${allowedTypes.join(", ")}` },
        { status: 400 }
      )
    }

    // Generate unique file key
    const fileId = crypto.randomUUID()
    const fileExtension = filename.split(".").pop()
    const key = `uploads/${userId}/${type}/${fileId}.${fileExtension}`

    // Create presigned URL for upload
    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
      Key: key,
      ContentType: contentType,
      Metadata: {
        userId: userId,
        uploadType: type,
        originalFilename: filename,
      },
    })

    const uploadURL = await getSignedUrl(s3Client, command, {
      expiresIn: 604800, // 1 week (7 days * 24 hours * 60 minutes * 60 seconds)
    })

    // Log successful presigned URL generation
    await auditLogger.logSuccess(
      userId,
      "CREATE",
      "upload",
      fileId,
      requestId,
      {
        operation: 'generate_presigned_url',
        uploadType: type,
        filename: filename,
        contentType: contentType,
        key: key
      }
    )

    return NextResponse.json({
      uploadURL,
      key,
      fileId,
    })
  } catch (error) {
    console.error("Error generating presigned URL:", error)
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    )
  }
}