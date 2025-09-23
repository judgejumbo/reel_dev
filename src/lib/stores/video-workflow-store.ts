import { create } from "zustand"
import { persist } from "zustand/middleware"

export type WorkflowStep = "upload" | "clip" | "process" | "download"

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
}

export interface ClipSettings {
  startTime: number
  endTime: number
  duration: number
  outputFormat: "mp4" | "mov"
  quality: "720p" | "1080p" | "4k"
}

export interface ProcessingJob {
  id: string
  status: "pending" | "processing" | "completed" | "error"
  progress: number
  outputUrl?: string
  error?: string
}

interface VideoWorkflowState {
  // Current workflow step
  currentStep: WorkflowStep

  // Video files
  mainVideo: VideoFile | null
  overlayVideo: VideoFile | null

  // Clip settings
  clipSettings: ClipSettings | null

  // Processing
  processingJob: ProcessingJob | null

  // Actions
  setCurrentStep: (step: WorkflowStep) => void
  setMainVideo: (video: VideoFile | null) => void
  setOverlayVideo: (video: VideoFile | null) => void
  updateVideoProgress: (videoId: string, progress: number) => void
  updateVideoStatus: (videoId: string, status: VideoFile["status"]) => void
  setClipSettings: (settings: ClipSettings) => void
  setProcessingJob: (job: ProcessingJob | null) => void
  updateProcessingProgress: (progress: number) => void
  resetWorkflow: () => void

  // Navigation helpers
  canProceedToStep: (step: WorkflowStep) => boolean
  nextStep: () => void
  previousStep: () => void
}

const initialState = {
  currentStep: "upload" as WorkflowStep,
  mainVideo: null,
  overlayVideo: null,
  clipSettings: null,
  processingJob: null,
}

export const useVideoWorkflowStore = create<VideoWorkflowState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentStep: (step) => set({ currentStep: step }),

      setMainVideo: (video) => set({ mainVideo: video }),

      setOverlayVideo: (video) => set({ overlayVideo: video }),

      updateVideoProgress: (videoId, progress) =>
        set((state) => {
          const updatedState = { ...state }
          if (state.mainVideo?.id === videoId) {
            updatedState.mainVideo = { ...state.mainVideo, uploadProgress: progress }
          }
          if (state.overlayVideo?.id === videoId) {
            updatedState.overlayVideo = { ...state.overlayVideo, uploadProgress: progress }
          }
          return updatedState
        }),

      updateVideoStatus: (videoId, status) =>
        set((state) => {
          const updatedState = { ...state }
          if (state.mainVideo?.id === videoId) {
            updatedState.mainVideo = { ...state.mainVideo, status }
          }
          if (state.overlayVideo?.id === videoId) {
            updatedState.overlayVideo = { ...state.overlayVideo, status }
          }
          return updatedState
        }),

      setClipSettings: (settings) => set({ clipSettings: settings }),

      setProcessingJob: (job) => set({ processingJob: job }),

      updateProcessingProgress: (progress) =>
        set((state) => ({
          processingJob: state.processingJob
            ? { ...state.processingJob, progress }
            : null,
        })),

      resetWorkflow: () => set(initialState),

      canProceedToStep: (step) => {
        const state = get()
        switch (step) {
          case "upload":
            return true
          case "clip":
            return state.mainVideo?.status === "uploaded"
          case "process":
            return state.clipSettings !== null
          case "download":
            return state.processingJob?.status === "completed"
          default:
            return false
        }
      },

      nextStep: () => {
        const state = get()
        const steps: WorkflowStep[] = ["upload", "clip", "process", "download"]
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
        const steps: WorkflowStep[] = ["upload", "clip", "process", "download"]
        const currentIndex = steps.indexOf(state.currentStep)
        const previousIndex = currentIndex - 1

        if (previousIndex >= 0) {
          set({ currentStep: steps[previousIndex] })
        }
      },
    }),
    {
      name: "video-workflow-storage",
      partialize: (state) => ({
        currentStep: state.currentStep,
        mainVideo: state.mainVideo,
        overlayVideo: state.overlayVideo,
        clipSettings: state.clipSettings,
        processingJob: state.processingJob,
      }),
    }
  )
)