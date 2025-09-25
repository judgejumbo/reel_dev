"use client"

import { ReactNode } from "react"
import { useVideoWorkflowStore, WorkflowStep } from "@/lib/stores/video-workflow-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Upload, Scissors, Settings, Zap, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

const steps = [
  {
    id: "upload" as WorkflowStep,
    title: "Upload",
    shortTitle: "Upload",
    description: "Upload your video files",
    icon: Upload,
  },
  {
    id: "clip" as WorkflowStep,
    title: "Clip Length",
    shortTitle: "Clip",
    description: "Select video segment",
    icon: Scissors,
  },
  {
    id: "settings" as WorkflowStep,
    title: "Animation Settings",
    shortTitle: "Settings",
    description: "Configure overlay & effects",
    icon: Settings,
  },
  {
    id: "process" as WorkflowStep,
    title: "Processing",
    shortTitle: "Process",
    description: "Generate your video",
    icon: Zap,
  },
]

interface MobileStepLayoutProps {
  children: ReactNode
  className?: string
}

export default function MobileStepLayout({ children, className }: MobileStepLayoutProps) {
  const {
    currentStep,
    canProceedToStep,
    nextStep,
    previousStep,
    setCurrentStep,
    resetWorkflow
  } = useVideoWorkflowStore()

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep)
  const currentStepData = steps[currentStepIndex]
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const canGoNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex >= steps.length) return false
    return canProceedToStep(steps[nextIndex].id)
  }

  const canGoPrevious = () => {
    return currentStepIndex > 0
  }

  const handleNext = () => {
    if (canGoNext()) {
      nextStep()
    }
  }

  const handlePrevious = () => {
    if (canGoPrevious()) {
      previousStep()
    }
  }

  const handleSkip = () => {
    // Allow skipping to next step if it makes sense
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id)
    }
  }

  return (
    <div className={cn("flex flex-col h-screen bg-background", className)}>
      {/* Header - Sticky */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            disabled={!canGoPrevious()}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <div className="text-center">
            <Badge variant="secondary" className="text-xs">
              Step {currentStepIndex + 1} of {steps.length}
            </Badge>
            <h1 className="text-lg font-semibold mt-1">
              {currentStepData?.title}
            </h1>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Restart workflow? This will clear all progress.")) {
                resetWorkflow()
              }
            }}
            className="flex items-center"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pb-3">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {currentStepData?.description}
          </p>
        </div>

        {/* Tab Navigation - Horizontal Scrollable */}
        <div className="bg-muted/50 border-t">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-center min-w-max px-2 py-2">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isCompleted = index < currentStepIndex
                const isCurrent = index === currentStepIndex
                const isAccessible = canProceedToStep(step.id)

                return (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => isAccessible ? setCurrentStep(step.id) : undefined}
                      disabled={!isAccessible}
                      className={cn(
                        "flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors min-w-fit",
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : isCompleted
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : isAccessible
                          ? "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                          : "bg-background text-muted-foreground/50",
                        !isAccessible && "cursor-not-allowed"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-xs",
                        isCurrent
                          ? "bg-primary-foreground/20"
                          : isCompleted
                          ? "bg-green-600 text-white"
                          : "bg-muted-foreground/20"
                      )}>
                        {isCompleted ? (
                          "✓"
                        ) : (
                          <Icon className="w-3 h-3" />
                        )}
                      </div>
                      <span className="text-xs font-medium whitespace-nowrap">
                        {step.shortTitle}
                      </span>
                    </button>
                    {index < steps.length - 1 && (
                      <div className={cn(
                        "w-8 h-0.5 mx-1",
                        index < currentStepIndex ? "bg-primary" : "bg-muted-foreground/20"
                      )} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-auto">
        <div className="p-4">
          {children}
        </div>
      </main>

      {/* Footer - Sticky */}
      <footer className="sticky bottom-0 z-10 bg-background border-t">
        <div className="p-4 space-y-3">
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-2">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = index < currentStepIndex
              const isCurrent = index === currentStepIndex
              const isAccessible = canProceedToStep(step.id)

              return (
                <button
                  key={step.id}
                  onClick={() => isAccessible ? setCurrentStep(step.id) : undefined}
                  disabled={!isAccessible}
                  className={cn(
                    "flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors",
                    isCurrent
                      ? "bg-primary/10 text-primary"
                      : isCompleted
                      ? "text-green-600"
                      : isAccessible
                      ? "text-muted-foreground hover:text-foreground"
                      : "text-muted-foreground/50",
                    !isAccessible && "cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                      ? "bg-green-100 text-green-600"
                      : "bg-muted"
                  )}>
                    {isCompleted ? (
                      "✓"
                    ) : (
                      <Icon className="w-3 h-3" />
                    )}
                  </div>
                  <span className="text-xs font-medium">{step.shortTitle}</span>
                </button>
              )
            })}
          </div>

          {/* Action Button */}
          <Button
            onClick={handleNext}
            disabled={!canGoNext()}
            size="lg"
            className="w-full"
          >
            {currentStepIndex === steps.length - 1 ? (
              "Complete"
            ) : (
              <>
                Continue to {steps[currentStepIndex + 1]?.shortTitle}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  )
}