export interface VideoUpload {
  id: string
  file: File
  url?: string
  uploadProgress: number
  status: "pending" | "uploading" | "completed" | "error"
}

export interface ClipSettings {
  startTime: number
  endTime: number
  duration: number
}

export interface FFMPEGSettings {
  quality: number
  bitrate: number
  fps: number
  subtitles: {
    enabled: boolean
    text?: string
    position: "top" | "center" | "bottom"
    fontSize: number
  }
}

export interface ProcessingJob {
  id: string
  projectName: string
  mainVideoUrl: string
  overlayUrl?: string
  clipSettings: ClipSettings
  ffmpegSettings: FFMPEGSettings
  status: "pending" | "processing" | "completed" | "error"
  createdAt: Date
}