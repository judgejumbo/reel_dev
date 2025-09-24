import { create } from "zustand"
import { persist } from "zustand/middleware"

export type WorkflowStep = "upload" | "clip" | "settings" | "process"

export interface VideoFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  duration?: number
  url?: string
  uploadProgress: number
  status: "pending" | "uploading" | "uploaded" | "error"
  videoUploadId?: string // Database record ID from upload completion
}

export interface MediaFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  mediaType: "image" | "video"
  duration?: number
  url?: string
  uploadProgress: number
  status: "pending" | "uploading" | "uploaded" | "error"
}

export interface ClipSettings {
  startTime: number
  endTime: number
  duration: number
}

export interface OverlaySettings {
  // Animation timing
  appearAtSecond: number
  animationDuration: number

  // Position (0-100 percentages)
  startPositionXPercent: number
  startPositionYPercent: number

  // Movement speed (percent per second)
  horizontalSpeedPercent: number
  verticalSpeedPercent: number

  // Visual properties
  imageScale: number      // 0.1 to 2.0
  imageOpacity: number    // 0.0 to 1.0
}

export interface ProcessingJob {
  id: string
  status: "pending" | "processing" | "completed" | "error"
  progress: number
  outputUrl?: string
  thumbnailUrl?: string
  error?: string
  projectName?: string
}

// N8N Webhook Payload Interface
export interface N8NWebhookPayload {
  jobId: string
  userId: string
  webhookUrl: string

  videoSegment: {
    startTime: number
    endTime: number
  }

  overlayConfig: {
    startVideoUrl: string
    overlayImageUrl: string
    appearAtSecond: number
    animationDuration: number
    startPositionXPercent: number
    startPositionYPercent: number
    horizontalSpeedPercent: number
    verticalSpeedPercent: number
    imageScale: number
    imageOpacity: number
  }
}

interface VideoWorkflowState {
  // Current workflow step
  currentStep: WorkflowStep

  // Video files
  mainVideo: VideoFile | null
  overlayMedia: MediaFile | null

  // Upload settings
  uploadMode: "standard" | "large"

  // Clip settings
  clipSettings: ClipSettings | null

  // Overlay settings (FFMPEG parameters)
  overlaySettings: OverlaySettings | null

  // Processing
  processingJob: ProcessingJob | null
  projectName: string

  // Actions
  setCurrentStep: (step: WorkflowStep) => void
  setMainVideo: (video: VideoFile | null) => void
  setOverlayMedia: (media: MediaFile | null) => void
  setUploadMode: (mode: "standard" | "large") => void
  updateVideoProgress: (videoId: string, progress: number) => void
  updateVideoStatus: (videoId: string, status: VideoFile["status"]) => void
  updateMediaProgress: (mediaId: string, progress: number) => void
  updateMediaStatus: (mediaId: string, status: MediaFile["status"]) => void
  setClipSettings: (settings: ClipSettings) => void
  setOverlaySettings: (settings: OverlaySettings) => void
  setProcessingJob: (job: ProcessingJob | null) => void
  setProjectName: (name: string) => void
  updateProcessingProgress: (progress: number) => void
  resetWorkflow: () => void

  // Navigation helpers
  canProceedToStep: (step: WorkflowStep) => boolean
  nextStep: () => void
  previousStep: () => void

  // N8N payload generation
  generateN8NPayload: (userId: string, webhookUrl: string) => N8NWebhookPayload | null
}

const initialState = {
  currentStep: "upload" as WorkflowStep,
  mainVideo: null,
  overlayMedia: null,
  uploadMode: "standard" as const,
  clipSettings: null,
  overlaySettings: null,
  processingJob: null,
  projectName: "",
}

export const useVideoWorkflowStore = create<VideoWorkflowState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentStep: (step) => set({ currentStep: step }),

      setMainVideo: (video) => set({ mainVideo: video }),

      setOverlayMedia: (media) => set({ overlayMedia: media }),

      setUploadMode: (mode) => set({ uploadMode: mode }),

      updateVideoProgress: (videoId, progress) =>
        set((state) => {
          const updatedState = { ...state }
          if (state.mainVideo?.id === videoId) {
            updatedState.mainVideo = { ...state.mainVideo, uploadProgress: progress }
          }
          return updatedState
        }),

      updateVideoStatus: (videoId, status) =>
        set((state) => {
          const updatedState = { ...state }
          if (state.mainVideo?.id === videoId) {
            updatedState.mainVideo = { ...state.mainVideo, status }
          }
          return updatedState
        }),

      updateMediaProgress: (mediaId, progress) =>
        set((state) => {
          const updatedState = { ...state }
          if (state.overlayMedia?.id === mediaId) {
            updatedState.overlayMedia = { ...state.overlayMedia, uploadProgress: progress }
          }
          return updatedState
        }),

      updateMediaStatus: (mediaId, status) =>
        set((state) => {
          const updatedState = { ...state }
          if (state.overlayMedia?.id === mediaId) {
            updatedState.overlayMedia = { ...state.overlayMedia, status }
          }
          return updatedState
        }),

      setClipSettings: (settings) => set({ clipSettings: settings }),

      setOverlaySettings: (settings) => set({ overlaySettings: settings }),

      setProcessingJob: (job) => set({ processingJob: job }),

      setProjectName: (name) => set({ projectName: name }),

      updateProcessingProgress: (progress) =>
        set((state) => ({
          processingJob: state.processingJob
            ? { ...state.processingJob, progress }
            : null,
        })),

      resetWorkflow: () => {
        // Clear localStorage persisted data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('video-workflow-storage')
        }
        // Reset state to initial
        set(initialState)
      },

      canProceedToStep: (step) => {
        const state = get()
        switch (step) {
          case "upload":
            return true
          case "clip":
            return state.mainVideo?.status === "uploaded"
          case "settings":
            return state.clipSettings !== null
          case "process":
            return state.overlaySettings !== null
          default:
            return false
        }
      },

      nextStep: () => {
        const state = get()
        const steps: WorkflowStep[] = ["upload", "clip", "settings", "process"]
        const currentIndex = steps.indexOf(state.currentStep)
        const nextIndex = currentIndex + 1

        if (nextIndex < steps.length) {
          const nextStep = steps[nextIndex]
          if (state.canProceedToStep(nextStep)) {
            set({ currentStep: nextStep })
          }
        }
      },

      previousStep: () => {
        const state = get()
        const steps: WorkflowStep[] = ["upload", "clip", "settings", "process"]
        const currentIndex = steps.indexOf(state.currentStep)
        const previousIndex = currentIndex - 1

        if (previousIndex >= 0) {
          set({ currentStep: steps[previousIndex] })
        }
      },

      generateN8NPayload: (userId, webhookUrl) => {
        const state = get()

        if (!state.mainVideo?.url || !state.clipSettings || !state.overlaySettings) {
          return null
        }

        return {
          jobId: crypto.randomUUID(),
          userId,
          webhookUrl,
          videoSegment: {
            startTime: state.clipSettings.startTime,
            endTime: state.clipSettings.endTime,
          },
          overlayConfig: {
            startVideoUrl: state.mainVideo.url,
            overlayImageUrl: state.overlayMedia?.url || "",
            appearAtSecond: state.overlaySettings.appearAtSecond,
            animationDuration: state.overlaySettings.animationDuration,
            startPositionXPercent: state.overlaySettings.startPositionXPercent,
            startPositionYPercent: state.overlaySettings.startPositionYPercent,
            horizontalSpeedPercent: state.overlaySettings.horizontalSpeedPercent,
            verticalSpeedPercent: state.overlaySettings.verticalSpeedPercent,
            imageScale: state.overlaySettings.imageScale,
            imageOpacity: state.overlaySettings.imageOpacity,
          },
        }
      },
    }),
    {
      name: "video-workflow-storage",
      partialize: (state) => ({
        currentStep: state.currentStep,
        mainVideo: state.mainVideo,
        overlayMedia: state.overlayMedia,
        uploadMode: state.uploadMode,
        clipSettings: state.clipSettings,
        overlaySettings: state.overlaySettings,
        processingJob: state.processingJob,
        projectName: state.projectName,
      }),
    }
  )
)