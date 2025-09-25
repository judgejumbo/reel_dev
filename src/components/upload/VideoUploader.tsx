"use client"

import { useState, useRef } from "react"
import { useVideoWorkflowStore } from "@/lib/stores/video-workflow-store"
import { validateVideoFile, getVideoMetadata, isVideoSuitableForConversion } from "@/lib/utils/video-utils"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"

interface VideoUploaderProps {
  type: "main" | "overlay"
  label: string
  accept?: string[]
}

export default function VideoUploader({ type, label, accept = ["video/*"] }: VideoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { setMainVideo, setOverlayMedia, updateVideoProgress, updateVideoStatus, uploadMode, projectName } = useVideoWorkflowStore()

  const handleFileSelection = async (file: File) => {
    // Validate file
    const validation = validateVideoFile(file, uploadMode)
    if (!validation.isValid) {
      toast.error(validation.error)
      return
    }

    try {
      setIsUploading(true)

      // Extract video metadata
      const metadata = await getVideoMetadata(file)

      // Check if video is suitable for conversion (only for main video)
      if (type === "main") {
        const suitability = isVideoSuitableForConversion(metadata)
        if (!suitability.suitable && suitability.issues) {
          // Show warnings but don't block upload
          suitability.issues.forEach(issue => {
            toast.warning(issue)
          })
        }
      }

      const videoFile = {
        id: `${type}-${Date.now()}`, // Simple ID generation
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        duration: metadata.duration,
        uploadProgress: 0,
        status: "pending" as const,
      }

      if (type === "main") {
        setMainVideo(videoFile)
      } else {
        // Convert to MediaFile format for overlay
        const mediaFile = {
          ...videoFile,
          mediaType: "video" as const
        }
        setOverlayMedia(mediaFile)
      }

      toast.success(`Video selected: ${file.name}`)

      // Start upload process
      await uploadToR2(videoFile)

    } catch (error) {
      console.error("Error processing video file:", error)
      toast.error("Failed to process video file. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const uploadToR2 = async (videoFile: any) => {
    try {
      updateVideoStatus(videoFile.id, "uploading")

      // Get presigned URL
      const response = await fetch("/api/upload/presigned-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: videoFile.name,
          contentType: videoFile.type,
          type: type,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get upload URL")
      }

      const { uploadURL, key, fileId } = await response.json()

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()

      // Set up progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          updateVideoProgress(videoFile.id, percentComplete)
        }
      })

      // Upload file to R2 with progress tracking
      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        }

        xhr.onerror = () => reject(new Error('Upload failed'))

        xhr.open('PUT', uploadURL)
        xhr.setRequestHeader('Content-Type', videoFile.type)
        xhr.send(videoFile.file)
      })

      await uploadPromise
      updateVideoStatus(videoFile.id, "uploaded")
      updateVideoProgress(videoFile.id, 100)

      // Record upload completion in database
      const completeResponse = await fetch("/api/upload/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: type,
          fileId: fileId,
          filename: videoFile.name,
          fileSize: videoFile.size,
          duration: videoFile.duration,
          format: videoFile.type,
          resolution: "1920x1080", // We'll get this from metadata later
          fileKey: key,
          projectName: projectName, // Include the project name from Zustand store
        }),
      })

      if (completeResponse.ok) {
        const result = await completeResponse.json()
        if (type === "main" && result.videoUploadId) {
          // Update the main video with the database record ID
          // Remove the File object to prevent ReactPlayer from creating blob URLs
          const updatedVideo = {
            ...videoFile,
            file: undefined, // Remove File object after upload
            url: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://pub-472f1ec592164dbf9983c4030ee2b224.r2.dev'}/${key}`,
            videoUploadId: result.videoUploadId,
            status: "uploaded" as const
          }
          setMainVideo(updatedVideo)
        }
        toast.success(`${type} video uploaded successfully!`)
      } else {
        console.error("Failed to record upload in database")
        toast.warning("Upload completed but failed to save to database")
      }

    } catch (error) {
      console.error("Upload error:", error)
      updateVideoStatus(videoFile.id, "error")
      toast.error("Upload failed. Please try again.")
    }
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
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">{label}</h3>
        <p className="text-sm text-muted-foreground">
          Select a video file to upload
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!isUploading ? handleClick : undefined}
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
            MP4, MOV, AVI up to {uploadMode === "large" ? "2GB" : "500MB"}
          </p>
        </div>
      </div>

      {!isUploading && (
        <Button
          variant="outline"
          onClick={handleClick}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          Choose Video File
        </Button>
      )}
    </div>
  )
}