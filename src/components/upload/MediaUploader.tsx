"use client"

import { useState, useRef } from "react"
import { useVideoWorkflowStore, MediaFile } from "@/lib/stores/video-workflow-store"
import { validateMediaFile, getVideoMetadata, getImageMetadata } from "@/lib/utils/video-utils"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, X, Image, Video, FileCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface MediaUploaderProps {
  label: string
  description?: string
  mediaTypes?: ("image" | "video")[]
  className?: string
}

export default function MediaUploader({
  label,
  description = "Drag and drop or click to upload",
  mediaTypes = ["image", "video"],
  className
}: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const {
    overlayMedia,
    uploadMode,
    setOverlayMedia,
    updateMediaProgress,
    updateMediaStatus
  } = useVideoWorkflowStore()

  const acceptedTypes = [
    ...(mediaTypes.includes("image") ? ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"] : []),
    ...(mediaTypes.includes("video") ? ["video/mp4", "video/mov", "video/avi"] : [])
  ]

  const handleFileSelection = async (file: File) => {
    // Determine media type
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")
    const mediaType: "image" | "video" = isImage ? "image" : "video"

    // Validate media type is allowed
    if (!mediaTypes.includes(mediaType)) {
      toast.error(`${mediaType === "image" ? "Images" : "Videos"} are not allowed for this upload`)
      return
    }

    // Validate file
    const validation = validateMediaFile(file, mediaType)
    if (!validation.isValid) {
      toast.error(validation.error)
      return
    }

    try {
      setIsUploading(true)

      // Extract metadata based on type
      let metadata: any = {}
      if (isImage) {
        metadata = await getImageMetadata(file)
      } else if (isVideo) {
        metadata = await getVideoMetadata(file)
      }

      const mediaFile: MediaFile = {
        id: `overlay-${Date.now()}`,
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        mediaType,
        duration: metadata.duration || undefined,
        uploadProgress: 0,
        status: "pending",
      }

      setOverlayMedia(mediaFile)
      toast.success(`${mediaType === "image" ? "Image" : "Video"} selected: ${file.name}`)

      // Start upload process
      await uploadToR2(mediaFile)

    } catch (error) {
      console.error("Error processing media file:", error)
      toast.error("Failed to process file. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const uploadToR2 = async (mediaFile: MediaFile) => {
    try {
      updateMediaStatus(mediaFile.id, "uploading")

      // Get presigned URL
      const response = await fetch("/api/upload/presigned-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: mediaFile.name,
          contentType: mediaFile.type,
          type: "overlay",
          mediaType: mediaFile.mediaType,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get upload URL")
      }

      const { uploadURL, key, fileId } = await response.json()

      // Simulate chunked upload for large files
      const chunkSize = 5 * 1024 * 1024 // 5MB chunks
      const file = mediaFile.file

      if (file.size > 100 * 1024 * 1024) { // 100MB+
        // Chunked upload simulation (would implement proper chunked upload here)
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100))
          updateMediaProgress(mediaFile.id, i)
        }
      }

      // Upload file to R2
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": mediaFile.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file")
      }

      updateMediaStatus(mediaFile.id, "uploaded")
      updateMediaProgress(mediaFile.id, 100)

      // Store the R2 URL in the media file
      const updatedMedia = {
        ...mediaFile,
        url: `https://pub-472f1ec592164dbf9983c4030ee2b224.r2.dev/${key}`,
        status: "uploaded" as const
      }
      setOverlayMedia(updatedMedia)

      // Record upload completion in database
      const completeResponse = await fetch("/api/upload/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "overlay",
          mediaType: mediaFile.mediaType,
          fileId: fileId,
          filename: mediaFile.name,
          fileSize: mediaFile.size,
          duration: mediaFile.duration,
          format: mediaFile.type,
          fileKey: key,
        }),
      })

      if (completeResponse.ok) {
        toast.success(`${mediaFile.mediaType === "image" ? "Image" : "Video"} uploaded successfully!`)
      } else {
        console.error("Failed to record upload in database")
        toast.warning("Upload completed but failed to save to database")
      }

    } catch (error) {
      console.error("Upload error:", error)
      updateMediaStatus(mediaFile.id, "error")
      toast.error("Upload failed. Please try again.")
    }
  }

  const handleRemoveFile = () => {
    setOverlayMedia(null)
    toast.success("File removed")
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelection(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelection(files[0])
    }
  }

  const handleClick = () => {
    if (fileInputRef.current && !isUploading) {
      fileInputRef.current.click()
    }
  }

  const getFileTypeIcon = (mediaType: "image" | "video") => {
    return mediaType === "image" ? Image : Video
  }

  const getFileTypeText = () => {
    if (mediaTypes.length === 1) {
      return mediaTypes[0] === "image" ? "Images" : "Videos"
    }
    return "Images or Videos"
  }

  const getSizeLimit = () => {
    if (mediaTypes.length === 1) {
      return mediaTypes[0] === "image" ? "up to 50MB" : "up to 100MB"
    }
    return "Images: 50MB, Videos: 100MB"
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-center">
        <h3 className="text-lg font-semibold">{label}</h3>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Upload Area */}
      {!overlayMedia && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            isUploading && "opacity-50 cursor-not-allowed"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="space-y-2">
            <div className="mx-auto h-12 w-12 text-muted-foreground">
              {isUploading ? (
                <div className="animate-spin">
                  <Upload className="h-full w-full" />
                </div>
              ) : (
                <Upload className="h-full w-full" />
              )}
            </div>
            <div className="text-sm">
              {isUploading ? (
                <span className="font-medium">Uploading...</span>
              ) : (
                <>
                  <span className="font-medium text-primary hover:text-primary/80">
                    Click to upload
                  </span>
                  {" "}or drag and drop
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {getFileTypeText()} {getSizeLimit()}
            </p>
          </div>
        </div>
      )}

      {/* File Preview */}
      {overlayMedia && (
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {overlayMedia.mediaType === "image" ? (
                  <Image className="h-8 w-8 text-blue-500" />
                ) : (
                  <Video className="h-8 w-8 text-green-500" />
                )}
              </div>
              <div>
                <p className="font-medium">{overlayMedia.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(overlayMedia.size / (1024 * 1024)).toFixed(2)} MB
                  {overlayMedia.duration && ` • ${Math.round(overlayMedia.duration)}s`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <p className="text-sm font-medium capitalize flex items-center">
                  {overlayMedia.status === "uploaded" && <FileCheck className="h-4 w-4 mr-1 text-green-500" />}
                  {overlayMedia.status}
                </p>
                {overlayMedia.status === "uploading" && (
                  <div className="mt-1">
                    <Progress value={overlayMedia.uploadProgress} className="w-20" />
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {!overlayMedia && !isUploading && (
        <Button
          variant="outline"
          onClick={handleClick}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          Choose {getFileTypeText()}
        </Button>
      )}
    </div>
  )
}