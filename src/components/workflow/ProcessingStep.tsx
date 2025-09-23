"use client"

import { useState } from "react"
import { useVideoWorkflowStore } from "@/lib/stores/video-workflow-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Zap,
  Video,
  Image,
  Clock,
  FileCheck,
  AlertCircle,
  Download,
  ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ProcessingStepProps {
  className?: string
}

export default function ProcessingStep({ className }: ProcessingStepProps) {
  const {
    mainVideo,
    overlayMedia,
    clipSettings,
    overlaySettings,
    projectName,
    setProjectName,
    processingJob,
    setProcessingJob,
    generateN8NPayload
  } = useVideoWorkflowStore()

  const [isProcessing, setIsProcessing] = useState(false)

  const canStartProcessing = () => {
    return (
      mainVideo?.url &&
      clipSettings &&
      overlaySettings &&
      projectName.trim().length > 0 &&
      !isProcessing
    )
  }

  const handleStartProcessing = async () => {
    if (!canStartProcessing()) return

    try {
      setIsProcessing(true)

      // Generate N8N webhook payload
      const payload = generateN8NPayload(
        "user-id", // Would get from auth session
        `${window.location.origin}/api/webhook/complete`
      )

      if (!payload) {
        throw new Error("Failed to generate processing payload")
      }

      // Create processing job
      const job = {
        id: payload.jobId,
        status: "pending" as const,
        progress: 0,
        projectName: projectName,
      }
      setProcessingJob(job)

      // Start processing
      const response = await fetch("/api/webhook/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload,
          projectName,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to start processing")
      }

      // Update job status
      setProcessingJob({
        ...job,
        status: "processing",
        progress: 10,
      })

      toast.success("Video processing started!")

      // Simulate progress updates (in real app, this would come from webhooks)
      simulateProgress(job.id)

    } catch (error) {
      console.error("Processing error:", error)
      toast.error("Failed to start processing")
      setProcessingJob({
        id: "error",
        status: "error",
        progress: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const simulateProgress = (jobId: string) => {
    let progress = 10
    const interval = setInterval(() => {
      progress += Math.random() * 20

      if (progress >= 100) {
        progress = 100
        setProcessingJob(prev => prev ? {
          ...prev,
          status: "completed",
          progress: 100,
          outputUrl: "https://pub-472f1ec592164dbf9983c4030ee2b224.r2.dev/processed-video.mp4",
          thumbnailUrl: "https://pub-472f1ec592164dbf9983c4030ee2b224.r2.dev/thumbnail.jpg",
        } : null)
        clearInterval(interval)
        toast.success("Video processing completed!")
      } else {
        setProcessingJob(prev => prev ? {
          ...prev,
          progress: Math.round(progress)
        } : null)
      }
    }, 1000)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = (seconds % 60).toFixed(1)
    return `${mins}:${secs.padStart(4, "0")}`
  }

  const getStatusIcon = () => {
    if (!processingJob) return <Zap className="h-5 w-5" />

    switch (processingJob.status) {
      case "completed":
        return <FileCheck className="h-5 w-5 text-green-600" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case "processing":
        return <div className="animate-spin"><Zap className="h-5 w-5 text-blue-600" /></div>
      default:
        return <Zap className="h-5 w-5" />
    }
  }

  const getStatusText = () => {
    if (!processingJob) return "Ready to Process"

    switch (processingJob.status) {
      case "completed":
        return "Processing Complete"
      case "error":
        return "Processing Failed"
      case "processing":
        return "Processing Video..."
      default:
        return "Preparing..."
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Project Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {getStatusIcon()}
            <span className="ml-2">Process Video</span>
          </CardTitle>
          <CardDescription>
            Generate your vertical video with overlay effects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              placeholder="My Vertical Video"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={isProcessing || processingJob?.status === "processing"}
            />
            <p className="text-xs text-muted-foreground">
              This will be used as the filename for your processed video
            </p>
          </div>

          {/* Processing Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Processing Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center">
                    <Video className="w-4 h-4 mr-1" />
                    Main Video:
                  </span>
                  <span className="font-medium">{mainVideo?.name || "None"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center">
                    <Image className="w-4 h-4 mr-1" />
                    Overlay:
                  </span>
                  <span className="font-medium">{overlayMedia?.name || "None"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Clip Length:
                  </span>
                  <span className="font-medium">
                    {clipSettings ? formatTime(clipSettings.duration) : "Not set"}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Start Time:</span>
                  <span className="font-medium font-mono">
                    {clipSettings ? formatTime(clipSettings.startTime) : "0:00.0"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">End Time:</span>
                  <span className="font-medium font-mono">
                    {clipSettings ? formatTime(clipSettings.endTime) : "0:00.0"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Output Format:</span>
                  <span className="font-medium">1080x1920 MP4</span>
                </div>
              </div>
            </div>
          </div>

          {/* Processing Controls */}
          {!processingJob || processingJob.status === "error" ? (
            <Button
              onClick={handleStartProcessing}
              disabled={!canStartProcessing()}
              size="lg"
              className="w-full"
            >
              <Zap className="mr-2 h-4 w-4" />
              Start Processing
            </Button>
          ) : processingJob.status === "processing" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>{getStatusText()}</span>
                <span>{processingJob.progress}%</span>
              </div>
              <Progress value={processingJob.progress} className="w-full" />
              <p className="text-xs text-muted-foreground text-center">
                This may take several minutes depending on video length and complexity
              </p>
            </div>
          ) : processingJob.status === "completed" ? (
            <div className="space-y-4">
              <Alert>
                <FileCheck className="h-4 w-4" />
                <AlertDescription>
                  Your video has been processed successfully! You can now download it.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  asChild
                  size="lg"
                  className="flex-1"
                >
                  <a
                    href={processingJob.outputUrl}
                    download={`${projectName}.mp4`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Video
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                >
                  <a
                    href={processingJob.outputUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          ) : null}

          {/* Error Display */}
          {processingJob?.status === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Processing failed: {processingJob.error || "Unknown error occurred"}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}