export interface VideoMetadata {
  duration: number
  width: number
  height: number
  format: string
  size: number
  aspectRatio: number
}

export function validateVideoFile(file: File, mode: "standard" | "large" = "standard"): { isValid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ["video/mp4", "video/mov", "video/avi", "video/quicktime"]
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Invalid file type. Please upload MP4, MOV, or AVI files only.",
    }
  }

  // Check file size based on mode
  const maxSize = mode === "large" ? 2 * 1024 * 1024 * 1024 : 500 * 1024 * 1024 // 2GB or 500MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size too large. Please upload files smaller than ${mode === "large" ? "2GB" : "500MB"}.`,
    }
  }

  // Check minimum file size (1MB)
  const minSize = 1 * 1024 * 1024 // 1MB in bytes
  if (file.size < minSize) {
    return {
      isValid: false,
      error: "File size too small. Please upload files larger than 1MB.",
    }
  }

  return { isValid: true }
}

export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Invalid file type. Please upload PNG, JPG, WEBP, or GIF files only.",
    }
  }

  // Check file size (50MB limit for images)
  const maxSize = 50 * 1024 * 1024 // 50MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "File size too large. Please upload images smaller than 50MB.",
    }
  }

  // Check minimum file size (10KB)
  const minSize = 10 * 1024 // 10KB in bytes
  if (file.size < minSize) {
    return {
      isValid: false,
      error: "File size too small. Please upload images larger than 10KB.",
    }
  }

  return { isValid: true }
}

export function validateOverlayVideoFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ["video/mp4", "video/mov", "video/avi", "video/quicktime"]
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Invalid file type. Please upload MP4, MOV, or AVI files only.",
    }
  }

  // Check file size (100MB limit for overlay videos)
  const maxSize = 100 * 1024 * 1024 // 100MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "File size too large. Please upload overlay videos smaller than 100MB.",
    }
  }

  // Check minimum file size (1MB)
  const minSize = 1 * 1024 * 1024 // 1MB in bytes
  if (file.size < minSize) {
    return {
      isValid: false,
      error: "File size too small. Please upload overlay videos larger than 1MB.",
    }
  }

  return { isValid: true }
}

export function validateMediaFile(file: File, mediaType: "image" | "video"): { isValid: boolean; error?: string } {
  if (mediaType === "image") {
    return validateImageFile(file)
  } else {
    return validateOverlayVideoFile(file)
  }
}

export function getImageMetadata(file: File): Promise<{ width: number; height: number; format: string; size: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        format: file.type,
        size: file.size,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load image metadata"))
    }

    img.src = url
  })
}

export function getVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    const url = URL.createObjectURL(file)

    video.preload = "metadata"
    video.muted = true

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)

      const metadata: VideoMetadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        format: file.type,
        size: file.size,
        aspectRatio: video.videoWidth / video.videoHeight,
      }

      resolve(metadata)
    }

    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load video metadata"))
    }

    video.src = url
  })
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

export function getVideoOrientation(aspectRatio: number): "horizontal" | "vertical" | "square" {
  if (aspectRatio > 1.1) return "horizontal"
  if (aspectRatio < 0.9) return "vertical"
  return "square"
}

export function isVideoSuitableForConversion(metadata: VideoMetadata): {
  suitable: boolean
  issues?: string[]
} {
  const issues: string[] = []

  // Check if video is horizontal (best for conversion)
  if (metadata.aspectRatio <= 1) {
    issues.push("Video is not horizontal. Horizontal videos work best for vertical conversion.")
  }

  // Check minimum resolution
  if (metadata.width < 1280 || metadata.height < 720) {
    issues.push("Video resolution is too low. Minimum recommended: 1280x720")
  }

  // Check duration (reasonable limits)
  if (metadata.duration < 5) {
    issues.push("Video is too short. Minimum duration: 5 seconds")
  }

  if (metadata.duration > 600) { // 10 minutes
    issues.push("Video is too long. Maximum duration: 10 minutes")
  }

  return {
    suitable: issues.length === 0,
    issues: issues.length > 0 ? issues : undefined,
  }
}