"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
// Removed router - no longer needed for Process button
import {
  Search,
  Plus,
  Download,
  Trash2,
  Eye,
  Filter,
  CheckSquare,
  Square,
  Video,
  Clock,
  Calendar,
  HardDrive,
  AlertCircle,
  Loader2,
  Play,
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

// Component to display video with presigned URL and toggle
function VideoPlayerWithToggle({
  video,
  getPresignedUrl
}: {
  video: any
  getPresignedUrl: (url: string) => Promise<string>
}) {
  const hasCompletedVideo = video.status === "completed" && video.outputUrl
  const [showingSource, setShowingSource] = useState(false) // Always start with completed if available
  const [sourceUrl, setSourceUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [videoError, setVideoError] = useState(false)

  // Load source URL once when component mounts
  useEffect(() => {
    let mounted = true

    const loadSourceVideo = async () => {
      // Always load the source URL if available
      if (video.mainVideoUrl) {
        try {
          const presignedUrl = await getPresignedUrl(video.mainVideoUrl)
          if (mounted) {
            setSourceUrl(presignedUrl)
            setVideoError(false) // Reset error state
          }
        } catch (error) {
          console.error("Error loading source video:", error)
          if (mounted) {
            setSourceUrl("") // Clear on error
          }
        }
      }
    }

    loadSourceVideo()

    return () => {
      mounted = false
    }
  }, [video.mainVideoUrl, getPresignedUrl]) // Only reload if video changes

  // Determine which URL to show
  let displayUrl = ""
  if (hasCompletedVideo && !showingSource) {
    displayUrl = video.outputUrl || ""
    console.log("Showing completed video:", displayUrl)
  } else if (showingSource && sourceUrl) {
    displayUrl = sourceUrl
    console.log("Showing source video:", displayUrl)
  } else if (!hasCompletedVideo && sourceUrl) {
    displayUrl = sourceUrl // Show source if no completed video
    console.log("Showing source (no completed):", displayUrl)
  } else {
    console.log("No video URL available", { hasCompletedVideo, showingSource, sourceUrl, outputUrl: video.outputUrl })
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
      {/* Toggle buttons if completed video exists */}
      {hasCompletedVideo && (
        <div className="absolute top-2 left-2 right-2 z-20 flex bg-black/70 rounded-lg p-1">
          <button
            onClick={() => {
              console.log("Switching to source video")
              setShowingSource(true)
            }}
            className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
              showingSource
                ? "bg-white text-black"
                : "text-white hover:bg-white/20"
            }`}
          >
            Source
          </button>
          <button
            onClick={() => {
              console.log("Switching to completed video")
              setShowingSource(false)
            }}
            className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
              !showingSource
                ? "bg-white text-black"
                : "text-white hover:bg-white/20"
            }`}
          >
            Completed
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : videoError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-4">
          <Video className="w-8 h-8 text-slate-500 mb-2" />
          <p className="text-xs text-slate-400 text-center">Unable to load video</p>
          <button
            onClick={() => {
              setVideoError(false)
              // Try to reload by toggling
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
          key={displayUrl} // Force reload when URL changes
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
            console.log("Failed URL:", displayUrl)
            setVideoError(true)
          }}
          onLoadedMetadata={() => {
            console.log("Video loaded successfully:", displayUrl)
            setVideoError(false)
          }}
          onCanPlay={() => {
            console.log("Video ready to play:", displayUrl)
          }}
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

export default function VideoLibrary({ userId }: { userId: string }) {
  const [videos, setVideos] = useState<VideoProject[]>([])
  const [isLoading, setIsLoading] = useState(false) // Don't block initial render
  const [dataLoaded, setDataLoaded] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState<VideoProject | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [previewVideo, setPreviewVideo] = useState<VideoProject | null>(null)
  const [presignedUrls, setPresignedUrls] = useState<Map<string, string>>(new Map())

  // Function to get presigned URL for private videos
  const getPresignedUrl = useCallback(async (url: string): Promise<string> => {
    // Check if we already have a presigned URL cached
    const cached = presignedUrls.get(url)
    if (cached) return cached

    try {
      const response = await fetch(`/api/videos/proxy?url=${encodeURIComponent(url)}`)
      if (response.ok) {
        const data = await response.json()
        // Cache the presigned URL
        setPresignedUrls(prev => new Map(prev).set(url, data.url))
        return data.url
      }
    } catch (error) {
      console.error("Error getting presigned URL:", error)
    }
    return url // Fallback to original URL
  }, [presignedUrls])

  // Fetch videos on mount
  useEffect(() => {
    if (userId && !dataLoaded) {
      fetchVideos()
    }
  }, [userId, dataLoaded])

  const fetchVideos = async () => {
    console.log("Fetching videos for user:", userId)
    setIsLoading(true)
    try {
      const response = await fetch(`/api/videos?userId=${userId}`)
      console.log("Response status:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("Fetched videos:", data)
        // Log first video details to debug
        if (data.length > 0) {
          console.log("First video details:", {
            id: data[0].id,
            projectName: data[0].projectName,
            thumbnailUrl: data[0].thumbnailUrl,
            outputUrl: data[0].outputUrl,
            mainVideoUrl: data[0].mainVideoUrl,
            status: data[0].status
          })
        }
        setVideos(data)
        setDataLoaded(true)
      } else {
        console.error("Failed to fetch videos:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Failed to fetch videos:", error)
    } finally {
      console.log("Setting loading to false")
      setIsLoading(false)
    }
  }

  // Filter videos based on search and status
  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.projectName
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || video.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Toggle video selection
  const toggleVideoSelection = (videoId: string) => {
    const newSelection = new Set(selectedVideos)
    if (newSelection.has(videoId)) {
      newSelection.delete(videoId)
    } else {
      newSelection.add(videoId)
    }
    setSelectedVideos(newSelection)
  }

  // Select all/none
  const toggleSelectAll = () => {
    if (selectedVideos.size === filteredVideos.length) {
      setSelectedVideos(new Set())
    } else {
      setSelectedVideos(new Set(filteredVideos.map((v) => v.id)))
    }
  }

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

  // Delete single video
  const handleDeleteVideo = async (video: VideoProject) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setVideos(videos.filter((v) => v.id !== video.id))
        setDeleteDialogOpen(false)
        setVideoToDelete(null)
      } else {
        console.error("Failed to delete video")
      }
    } catch (error) {
      console.error("Error deleting video:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Bulk delete videos
  const handleBulkDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch("/api/videos/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoIds: Array.from(selectedVideos) }),
      })
      if (response.ok) {
        setVideos(videos.filter((v) => !selectedVideos.has(v.id)))
        setSelectedVideos(new Set())
        setBulkDeleteDialogOpen(false)
      } else {
        console.error("Failed to delete videos")
      }
    } catch (error) {
      console.error("Error deleting videos:", error)
    } finally {
      setIsDeleting(false)
    }
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

  // Always render the page structure
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Video Library
              </h1>
              <p className="text-slate-600 mt-1">
                Manage your repurposed video projects
              </p>
            </div>
            <Link href="/create">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Create New Project
              </Button>
            </Link>
          </div>

          {/* Filters and Search */}
          <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search by project name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Videos</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bulk Actions */}
              {filteredVideos.length > 0 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleSelectAll}
                      className="text-slate-600"
                    >
                      {selectedVideos.size === filteredVideos.length ? (
                        <CheckSquare className="w-4 h-4 mr-2" />
                      ) : (
                        <Square className="w-4 h-4 mr-2" />
                      )}
                      Select All
                    </Button>
                    {selectedVideos.size > 0 && (
                      <span className="text-sm text-slate-600">
                        {selectedVideos.size} selected
                      </span>
                    )}
                  </div>
                  {selectedVideos.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setBulkDeleteDialogOpen(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selected
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Videos Grid */}
          {isLoading && videos.length === 0 ? (
            <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Loading your videos...
                </h3>
                <p className="text-slate-600 text-center max-w-sm">
                  Please wait while we fetch your video library
                </p>
              </CardContent>
            </Card>
          ) : filteredVideos.length === 0 ? (
            <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Video className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {searchTerm || statusFilter !== "all"
                    ? "No videos found"
                    : "No videos yet"}
                </h3>
                <p className="text-slate-600 text-center max-w-sm mb-6">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Start by creating your first video repurposing project"}
                </p>
                {!searchTerm && statusFilter === "all" && videos.length === 0 && (
                  <Link href="/create">
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Project
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredVideos.map((video) => (
                <Card
                  key={video.id}
                  className={`border-emerald-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow ${
                    selectedVideos.has(video.id) ? "ring-2 ring-emerald-500" : ""
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Checkbox
                        checked={selectedVideos.has(video.id)}
                        onCheckedChange={() => toggleVideoSelection(video.id)}
                        className="mt-1"
                      />
                      <Badge className={getStatusColor(video.status)}>
                        {video.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
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
                  <CardFooter className="pt-3 flex justify-between gap-2">
                    {video.status === "completed" && video.outputUrl ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            // Open video in new tab for full view
                            window.open(video.outputUrl, '_blank')
                          }}
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
                          // Get presigned URL and open in new tab for download
                          const presignedUrl = await getPresignedUrl(video.mainVideoUrl)
                          window.open(presignedUrl, '_blank')
                        }}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download Source
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setVideoToDelete(video)
                        setDeleteDialogOpen(true)
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Single Video Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;
              <span className="font-semibold">{videoToDelete?.projectName}</span>
              &quot;? This will permanently remove the video from your library and
              storage. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => videoToDelete && handleDeleteVideo(videoToDelete)}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Videos</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedVideos.size} video
              {selectedVideos.size > 1 ? "s" : ""}? This will permanently remove
              them from your library and storage. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                `Delete ${selectedVideos.size} Video${
                  selectedVideos.size > 1 ? "s" : ""
                }`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}