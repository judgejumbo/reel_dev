"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import VideoCard from "@/components/videos/VideoCard"
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
import {
  Search,
  Plus,
  Trash2,
  Filter,
  CheckSquare,
  Square,
  Video,
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

interface VideoLibraryProps {
  limit?: number
  compact?: boolean
}

export default function VideoLibrary({ limit, compact = false }: VideoLibraryProps) {
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
    if (!dataLoaded) {
      fetchVideos()
    }
  }, [dataLoaded])

  const fetchVideos = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/videos')
      if (response.ok) {
        const data = await response.json()
        setVideos(data)
        setDataLoaded(true)
      } else {
        console.error("Failed to fetch videos:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Failed to fetch videos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter videos based on search and status
  let filteredVideos = videos.filter((video) => {
    const matchesSearch = video.projectName
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || video.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Apply limit if specified
  if (limit) {
    filteredVideos = filteredVideos.slice(0, limit)
  }

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


  // Always render the page structure
  return (
    <div className={compact ? "" : "min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30"}>
      <div className={compact ? "" : "max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8"}>
        <div className="space-y-8">
          {/* Header - only show in non-compact mode */}
          {!compact && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Video Library
              </h1>
              <p className="text-slate-600 mt-1">
                Manage your repurposed video projects
              </p>
            </div>
          )}

          {/* Filters and Search - only show in non-compact mode */}
          {!compact && (
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
          )}

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
            <div className={compact ? 'flex flex-wrap gap-6 justify-center' : 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}>
              {filteredVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  isSelected={selectedVideos.has(video.id)}
                  showCheckbox={!compact}
                  onToggleSelection={!compact ? toggleVideoSelection : undefined}
                  onDelete={(video) => {
                    setVideoToDelete(video)
                    setDeleteDialogOpen(true)
                  }}
                  getPresignedUrl={getPresignedUrl}
                />
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