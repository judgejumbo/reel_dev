"use client"

import { useVideoWorkflowStore } from "@/lib/stores/video-workflow-store"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import useResponsiveWorkflow from "@/hooks/useResponsiveWorkflow"
import VideoUploader from "./VideoUploader"
import MediaUploader from "./MediaUploader"
import TimelineSelector from "@/components/workflow/TimelineSelector"
import OverlaySettings from "@/components/workflow/OverlaySettings"
import ProcessingStep from "@/components/workflow/ProcessingStep"

export default function UploadPage() {
  const {
    currentStep,
    mainVideo,
    overlayMedia,
    uploadMode,
    setUploadMode
  } = useVideoWorkflowStore()

  const { WorkflowComponent } = useResponsiveWorkflow()

  const renderStepContent = () => {
    switch (currentStep) {
      case "upload":
        return (
          <div className="space-y-6">
            {/* Upload Mode Toggle */}
            <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
              <Switch
                id="large-mode"
                checked={uploadMode === "large"}
                onCheckedChange={(checked) => setUploadMode(checked ? "large" : "standard")}
              />
              <Label htmlFor="large-mode" className="text-sm">
                Large File Mode (up to 2GB)
              </Label>
            </div>

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
                        {mainVideo.duration && ` • ${Math.round(mainVideo.duration)}s`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium capitalize">{mainVideo.status}</p>
                      {mainVideo.status === "uploading" && (
                        <div className="mt-1 space-y-1">
                          <Progress value={mainVideo.uploadProgress} className="w-20" />
                          <p className="text-xs text-muted-foreground">
                            {mainVideo.uploadProgress}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Overlay Media Upload */}
            <div>
              <MediaUploader
                label="Overlay Media (Optional)"
                description="Add an image or video overlay to your main video"
                mediaTypes={["image", "video"]}
              />
            </div>
          </div>
        )

      case "clip":
        return <TimelineSelector />

      case "settings":
        return <OverlaySettings />

      case "process":
        return <ProcessingStep />

      default:
        return <div>Unknown step</div>
    }
  }

  return (
    <WorkflowComponent>
      {renderStepContent()}
    </WorkflowComponent>
  )
}