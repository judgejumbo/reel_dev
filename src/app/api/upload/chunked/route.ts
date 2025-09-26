import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/middleware/auth-guard"
import { auditLogger } from "@/lib/security/audit"
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
})

// Initiate chunked upload
export async function POST(request: NextRequest) {
  try {
    // Use enhanced authentication with rate limiting
    const authResult = await requireAuth(request)
    if (authResult.response) {
      return authResult.response
    }

    const { userId, requestId } = authResult

    const body = await request.json()
    const { filename, contentType, type, chunks } = body

    if (!filename || !contentType || !type || !chunks) {
      return NextResponse.json(
        { error: "Missing required fields: filename, contentType, type, chunks" },
        { status: 400 }
      )
    }

    // Generate unique file key
    const fileId = crypto.randomUUID()
    const fileExtension = filename.split(".").pop()
    const key = `uploads/${userId}/${type}/${fileId}.${fileExtension}`

    // Create multipart upload
    const createCommand = new CreateMultipartUploadCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
      Key: key,
      ContentType: contentType,
      Metadata: {
        userId: userId,
        uploadType: type,
        originalFilename: filename,
      },
    })

    const { UploadId } = await s3Client.send(createCommand)

    if (!UploadId) {
      throw new Error("Failed to create multipart upload")
    }

    // Generate presigned URLs for each chunk
    const chunkUrls = []
    for (let i = 1; i <= chunks; i++) {
      const uploadPartCommand = new UploadPartCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
        Key: key,
        PartNumber: i,
        UploadId,
      })

      const signedUrl = await getSignedUrl(s3Client, uploadPartCommand, {
        expiresIn: 604800, // 1 week
      })

      chunkUrls.push({
        partNumber: i,
        signedUrl,
      })
    }

    // Log successful chunked upload initiation
    await auditLogger.logSuccess(
      userId,
      "CREATE",
      "upload",
      fileId,
      requestId,
      {
        operation: 'initiate_chunked_upload',
        uploadType: type,
        filename: filename,
        chunks: chunks,
        key: key
      }
    )

    return NextResponse.json({
      uploadId: UploadId,
      key,
      fileId,
      chunkUrls,
    })
  } catch (error) {
    console.error("Error creating chunked upload:", error)
    return NextResponse.json(
      { error: "Failed to create chunked upload" },
      { status: 500 }
    )
  }
}

// Complete chunked upload
export async function PUT(request: NextRequest) {
  try {
    // Use enhanced authentication with rate limiting
    const authResult = await requireAuth(request)
    if (authResult.response) {
      return authResult.response
    }

    const { userId, requestId } = authResult

    const body = await request.json()
    const { uploadId, key, parts } = body

    if (!uploadId || !key || !parts) {
      return NextResponse.json(
        { error: "Missing required fields: uploadId, key, parts" },
        { status: 400 }
      )
    }

    // Complete multipart upload
    const completeCommand = new CompleteMultipartUploadCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.map((part: { etag: string; partNumber: number }) => ({
          ETag: part.etag,
          PartNumber: part.partNumber,
        })),
      },
    })

    const result = await s3Client.send(completeCommand)

    // Log successful chunked upload completion
    await auditLogger.logSuccess(
      userId,
      "UPDATE",
      "upload",
      key,
      requestId,
      {
        operation: 'complete_chunked_upload',
        uploadId: uploadId,
        partsCount: parts.length
      }
    )

    return NextResponse.json({
      success: true,
      location: result.Location,
      key,
    })
  } catch (error) {
    console.error("Error completing chunked upload:", error)
    return NextResponse.json(
      { error: "Failed to complete chunked upload" },
      { status: 500 }
    )
  }
}

// Abort chunked upload
export async function DELETE(request: NextRequest) {
  try {
    // Use enhanced authentication with rate limiting
    const authResult = await requireAuth(request)
    if (authResult.response) {
      return authResult.response
    }

    const { userId, requestId } = authResult

    const { searchParams } = new URL(request.url)
    const uploadId = searchParams.get("uploadId")
    const key = searchParams.get("key")

    if (!uploadId || !key) {
      return NextResponse.json(
        { error: "Missing required parameters: uploadId, key" },
        { status: 400 }
      )
    }

    // Abort multipart upload
    const abortCommand = new AbortMultipartUploadCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
      Key: key,
      UploadId: uploadId,
    })

    await s3Client.send(abortCommand)

    // Log successful chunked upload abort
    await auditLogger.logSuccess(
      userId,
      "DELETE",
      "upload",
      key,
      requestId,
      {
        operation: 'abort_chunked_upload',
        uploadId: uploadId
      }
    )

    return NextResponse.json({
      success: true,
      message: "Upload aborted successfully",
    })
  } catch (error) {
    console.error("Error aborting chunked upload:", error)
    return NextResponse.json(
      { error: "Failed to abort chunked upload" },
      { status: 500 }
    )
  }
}