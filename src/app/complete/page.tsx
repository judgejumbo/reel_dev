"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useVideoWorkflowStore } from "@/lib/stores/video-workflow-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  Download,
  RotateCcw,
  Play,
  Image as ImageIcon,
  ArrowLeft,
  ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function CompletePage() {
  const router = useRouter()
  const { processingJob, projectName, resetWorkflow } = useVideoWorkflowStore()
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [redirectTimeout, setRedirectTimeout] = useState<NodeJS.Timeout | null>(null)

  // Redirect if no completed job, but with a delay to allow state to load
  useEffect(() => {
    if (!processingJob) {
      // Give it 2 seconds for the state to potentially load from persistence
      const timeout = setTimeout(() => {
        router.push("/create")
      }, 2000)
      setRedirectTimeout(timeout)
      return () => clearTimeout(timeout)
    }

    if (processingJob.status !== "completed") {
      router.push("/create")
      return
    }

    // Clear any existing redirect timeout
    if (redirectTimeout) {
      clearTimeout(redirectTimeout)
      setRedirectTimeout(null)
    }
  }, [processingJob, router]) // Removed redirectTimeout from dependencies to prevent infinite loop

  const handleRestart = () => {
    // Reset workflow state first, then navigate
    resetWorkflow()
    // Use replace instead of push to prevent back button issues
    router.replace("/create")
  }

  const handleBackToWorkflow = () => {
    router.push("/create")
  }

  // Show loading state while waiting for processingJob to load
  if (!processingJob) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    )
  }

  if (processingJob.status !== "completed") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Processing job is not completed. Redirecting...</p>
        </div>
      </div>
    )
  }

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Video Processing Complete!</h1>
                <p className="text-muted-foreground">
                  Your vertical video has been successfully generated
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              ✨ Ready for Download
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleBackToWorkflow}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Workflow
            </Button>
            <Button
              variant="outline"
              onClick={handleRestart}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Create Another Project
            </Button>
          </div>
        </div>

        {/* Project Info */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Project: {projectName || "Untitled"}</h2>
          <p className="text-sm text-muted-foreground">
            Processed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Player */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Your Vertical Video
              </CardTitle>
              <CardDescription>
                1080x1920 optimized for social media platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden mb-4 max-w-xs mx-auto">
                {processingJob.outputUrl ? (
                  <video
                    src={processingJob.outputUrl}
                    controls
                    preload="metadata"
                    onLoadedData={() => setVideoLoaded(true)}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white">
                    <div className="text-center">
                      <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm opacity-75">Video not available</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  asChild
                  className="flex-1"
                  disabled={!processingJob.outputUrl}
                >
                  <a
                    href={processingJob.outputUrl}
                    download={`${projectName || 'video'}.mp4`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Video
                  </a>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  asChild
                  disabled={!processingJob.outputUrl}
                >
                  <a
                    href={processingJob.outputUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Thumbnail */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Video Thumbnail
              </CardTitle>
              <CardDescription>
                Preview image extracted from your video
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden mb-4 max-w-xs mx-auto">
                {processingJob.thumbnailUrl ? (
                  <img
                    src={processingJob.thumbnailUrl}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">Thumbnail not available</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  asChild
                  className="flex-1"
                  disabled={!processingJob.thumbnailUrl}
                >
                  <a
                    href={processingJob.thumbnailUrl}
                    download={`${projectName || 'thumbnail'}.jpg`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Thumbnail
                  </a>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  asChild
                  disabled={!processingJob.thumbnailUrl}
                >
                  <a
                    href={processingJob.thumbnailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Processing Details */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Processing Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Status</p>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mt-1">
                  Completed
                </Badge>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Progress</p>
                <p className="font-mono mt-1">100%</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Format</p>
                <p className="mt-1">MP4 (1080x1920)</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Job ID</p>
                <p className="font-mono text-xs mt-1 truncate" title={processingJob.id}>
                  {processingJob.id.split('-')[0]}...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Download className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-medium mb-1">Download & Share</h3>
                <p className="text-sm text-muted-foreground">
                  Save your video and thumbnail locally or share directly
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <RotateCcw className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-medium mb-1">Create Another</h3>
                <p className="text-sm text-muted-foreground">
                  Start a new project with different settings
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Play className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-medium mb-1">Upload to Social</h3>
                <p className="text-sm text-muted-foreground">
                  Perfect for YouTube Shorts, TikTok, and Instagram Reels
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}