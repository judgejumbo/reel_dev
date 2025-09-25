"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Download,
  Trash2,
  Eye,
  Video,
  Clock,
  Calendar,
  HardDrive,
  AlertCircle,
  Loader2,
} from "lucide-react"

interface VideoProject {
  id: string
  projectName: string
  status: "pending" | "processing" | "completed" | "failed" | "uploaded"
  thumbnailUrl?: string
  outputUrl?: string
  mainVideoUrl?: string
  overlayVideoUrl?: string
  mainVideoFilename: string
  mainVideoSize: number
  duration?: number
  createdAt: string
  selected?: boolean
}

interface VideoCardProps {
  video: VideoProject
  isSelected?: boolean
  showCheckbox?: boolean
  onToggleSelection?: (videoId: string) => void
  onDelete?: (video: VideoProject) => void
  getPresignedUrl: (url: string) => Promise<string>
}

// Component to display video with presigned URL and toggle
function VideoPlayerWithToggle({
  video,
  getPresignedUrl
}: {
  video: VideoProject
  getPresignedUrl: (url: string) => Promise<string>
}) {
  const hasCompletedVideo = video.status === "completed" && video.outputUrl
  const [showingSource, setShowingSource] = useState(!hasCompletedVideo)
  const [sourceUrl, setSourceUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [videoError, setVideoError] = useState(false)

  // Load source URL once when component mounts
  useEffect(() => {
    let mounted = true

    const loadSourceVideo = async () => {
      if (video.mainVideoUrl) {
        try {
          const presignedUrl = await getPresignedUrl(video.mainVideoUrl)
          if (mounted) {
            setSourceUrl(presignedUrl)
            setVideoError(false)
          }
        } catch (error) {
          console.error("Error loading source video:", error)
          if (mounted) {
            setSourceUrl("")
          }
        }
      }
    }

    loadSourceVideo()

    return () => {
      mounted = false
    }
  }, [video.mainVideoUrl, getPresignedUrl])

  // Determine which URL to show
  let displayUrl = ""
  if (hasCompletedVideo && !showingSource) {
    displayUrl = video.outputUrl || ""
  } else if (showingSource && sourceUrl) {
    displayUrl = sourceUrl
  } else if (!hasCompletedVideo && sourceUrl) {
    displayUrl = sourceUrl
  }

  // Reset error state when switching videos
  useEffect(() => {
    setVideoError(false)
  }, [showingSource, displayUrl])

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Toggle buttons - show when either source or completed video exists */}
      {(video.mainVideoUrl || hasCompletedVideo) && (
        <div className="absolute top-2 left-2 right-2 z-20 flex bg-black/70 rounded-lg p-1">
          {video.mainVideoUrl && (
            <button
              onClick={() => setShowingSource(true)}
              className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                showingSource || !hasCompletedVideo
                  ? "bg-white text-black"
                  : "text-white hover:bg-white/20"
              }`}
            >
              Source
            </button>
          )}
          {hasCompletedVideo && (
            <button
              onClick={() => setShowingSource(false)}
              className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                !showingSource
                  ? "bg-white text-black"
                  : "text-white hover:bg-white/20"
              }`}
            >
              Completed
            </button>
          )}
        </div>
      )}

      {videoError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-4">
          <Video className="w-8 h-8 text-slate-500 mb-2" />
          <p className="text-xs text-slate-400 text-center">Unable to load video</p>
          <button
            onClick={() => {
              setVideoError(false)
              setShowingSource(!showingSource)
              setTimeout(() => setShowingSource(showingSource), 100)
            }}
            className="mt-2 text-xs text-emerald-500 hover:text-emerald-400"
          >
            Retry
          </button>
        </div>
      ) : displayUrl ? (
        <video
          key={displayUrl}
          src={displayUrl}
          controls
          controlsList="nodownload"
          preload="metadata"
          className="absolute inset-0 w-full h-full object-contain bg-black rounded"
          style={{
            maxHeight: '100%',
            WebkitBorderRadius: '0.5rem',
            WebkitMaskImage: '-webkit-radial-gradient(white, black)'
          }}
          onError={(e) => {
            console.error("Video playback error:", e)
            setVideoError(true)
          }}
          onLoadedMetadata={() => setVideoError(false)}
          playsInline
          muted
          autoPlay={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <Video className="w-12 h-12 text-slate-500" />
        </div>
      )}
    </div>
  )
}

export default function VideoCard({
  video,
  isSelected = false,
  showCheckbox = true,
  onToggleSelection,
  onDelete,
  getPresignedUrl,
}: VideoCardProps) {
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card
      className={`border-emerald-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow ${
        isSelected ? "ring-2 ring-emerald-500" : ""
      }`}
    >
      <CardHeader className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between">
          {showCheckbox && onToggleSelection && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelection(video.id)}
              className="mt-1"
            />
          )}
          <Badge className={getStatusColor(video.status)}>
            {video.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 space-y-3">
        {/* Project Name */}
        <div className="pb-2">
          <h3 className="font-semibold text-lg text-slate-900">
            {video.projectName}
          </h3>
          <div className="flex items-center text-xs text-slate-500 mt-1 space-x-4">
            <span className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(video.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center">
              <HardDrive className="w-3 h-3 mr-1" />
              {formatFileSize(video.mainVideoSize)}
            </span>
          </div>
        </div>

        {/* Vertical Video Preview (9:16 aspect ratio) */}
        <div className="relative bg-black rounded-lg overflow-hidden mx-auto" style={{ maxWidth: '200px', minHeight: '356px' }}>
          <div className="aspect-[9/16] relative bg-slate-900">
            <VideoPlayerWithToggle
              video={video}
              getPresignedUrl={getPresignedUrl}
            />
            {video.duration && (
              <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-30">
                {formatDuration(video.duration)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-3 px-4 pb-4 flex justify-between gap-2">
        {video.status === "completed" && video.outputUrl ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.open(video.outputUrl, '_blank')}
            >
              <Eye className="w-3 h-3 mr-1" />
              View Full
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              asChild
            >
              <a href={video.outputUrl} download target="_blank" rel="noopener noreferrer">
                <Download className="w-3 h-3 mr-1" />
                Download
              </a>
            </Button>
          </>
        ) : video.status === "processing" ? (
          <Button variant="outline" size="sm" className="flex-1" disabled>
            <Clock className="w-3 h-3 mr-1 animate-spin" />
            Processing...
          </Button>
        ) : video.status === "failed" ? (
          <Button variant="outline" size="sm" className="flex-1">
            <AlertCircle className="w-3 h-3 mr-1" />
            Retry
          </Button>
        ) : video.status === "uploaded" && video.mainVideoUrl ? (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={async () => {
              const presignedUrl = await getPresignedUrl(video.mainVideoUrl!)
              window.open(presignedUrl, '_blank')
            }}
          >
            <Download className="w-3 h-3 mr-1" />
            Download Source
          </Button>
        ) : null}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(video)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}