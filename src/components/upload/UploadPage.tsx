"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import WorkflowStepper from "./WorkflowStepper"
import VideoUploader from "./VideoUploader"
import { useVideoWorkflowStore } from "@/lib/stores/video-workflow-store"
import { ArrowRight, ArrowLeft } from "lucide-react"

export default function UploadPage() {
  const {
    currentStep,
    mainVideo,
    overlayVideo,
    canProceedToStep,
    nextStep,
    previousStep
  } = useVideoWorkflowStore()

  const canProceedToClip = mainVideo?.status === "uploaded"

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Video Repurposing Workflow</h1>
        <p className="text-muted-foreground">
          Convert your horizontal videos to vertical format for social media
        </p>
      </div>

      {/* Workflow Stepper */}
      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
          <CardDescription>
            Follow these steps to convert your video
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkflowStepper />
        </CardContent>
      </Card>

      {/* Upload Section */}
      {currentStep === "upload" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Your Videos</CardTitle>
              <CardDescription>
                Upload your main video and optionally an overlay video for your vertical conversion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Main Video Upload */}
              <div>
                <VideoUploader
                  type="main"
                  label="Main Video (Required)"
                  accept={["video/mp4", "video/mov", "video/avi"]}
                />
                {mainVideo && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{mainVideo.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(mainVideo.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium capitalize">{mainVideo.status}</p>
                        {mainVideo.status === "uploading" && (
                          <p className="text-sm text-muted-foreground">
                            {mainVideo.uploadProgress}%
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Overlay Video Upload */}
              <div>
                <VideoUploader
                  type="overlay"
                  label="Overlay Video (Optional)"
                  accept={["video/mp4", "video/mov", "video/avi"]}
                />
                {overlayVideo && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{overlayVideo.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(overlayVideo.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium capitalize">{overlayVideo.status}</p>
                        {overlayVideo.status === "uploading" && (
                          <p className="text-sm text-muted-foreground">
                            {overlayVideo.uploadProgress}%
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" disabled>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              onClick={nextStep}
              disabled={!canProceedToClip}
            >
              Next: Clip Settings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Placeholder for other steps */}
      {currentStep === "clip" && (
        <Card>
          <CardHeader>
            <CardTitle>Clip Settings</CardTitle>
            <CardDescription>
              Configure your video clip settings (Coming Soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Clip settings interface will be implemented in the next phase
              </p>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={previousStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Upload
              </Button>
              <Button disabled>
                Next: Process
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === "process" && (
        <Card>
          <CardHeader>
            <CardTitle>Processing</CardTitle>
            <CardDescription>
              Your video is being processed (Coming Soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Video processing interface will be implemented in Phase 6
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === "download" && (
        <Card>
          <CardHeader>
            <CardTitle>Download</CardTitle>
            <CardDescription>
              Download your converted video (Coming Soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Download interface will be implemented in Phase 7
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}