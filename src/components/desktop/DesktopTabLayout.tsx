"use client"

import { ReactNode, useEffect, useState } from "react"
import { useVideoWorkflowStore, WorkflowStep } from "@/lib/stores/video-workflow-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Scissors, Settings, Zap, ArrowLeft, ArrowRight, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

const steps = [
  {
    id: "upload" as WorkflowStep,
    title: "Upload Videos",
    description: "Upload your main video and overlay media",
    icon: Upload,
  },
  {
    id: "clip" as WorkflowStep,
    title: "Clip Length",
    description: "Select video segment and timing",
    icon: Scissors,
  },
  {
    id: "settings" as WorkflowStep,
    title: "Animation Settings",
    description: "Configure overlay and effects",
    icon: Settings,
  },
  {
    id: "process" as WorkflowStep,
    title: "Processing",
    description: "Generate your final video",
    icon: Zap,
  },
]

interface DesktopTabLayoutProps {
  children: ReactNode
  className?: string
}

export default function DesktopTabLayout({ children, className }: DesktopTabLayoutProps) {
  const [isHydrated, setIsHydrated] = useState(false)
  const {
    currentStep,
    canProceedToStep,
    nextStep,
    previousStep,
    setCurrentStep,
    resetWorkflow
  } = useVideoWorkflowStore()

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep)
  const currentStepData = steps[currentStepIndex]

  const canGoNext = () => {
    if (!isHydrated) return false
    const nextIndex = currentStepIndex + 1
    if (nextIndex >= steps.length) return false
    return canProceedToStep(steps[nextIndex].id)
  }

  const canGoPrevious = () => {
    if (!isHydrated) return false
    return currentStepIndex > 0
  }

  return (
    <div className={cn("container mx-auto py-8 space-y-8", className)}>
      {/* Page Header */}
      <div className="text-center space-y-2 relative">
        <h1 className="text-3xl font-bold">Video Repurposing Workflow</h1>
        <p className="text-muted-foreground">
          Convert your horizontal videos to vertical format for social media
        </p>
        {/* Restart Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (confirm("Are you sure you want to restart the workflow? This will clear all current progress.")) {
              resetWorkflow()
            }
          }}
          className="absolute top-0 right-0"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Restart
        </Button>
      </div>

      {/* Tab Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
          <CardDescription>
            Complete each step to process your video
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = index < currentStepIndex
              const isCurrent = index === currentStepIndex
              const isAccessible = isHydrated ? canProceedToStep(step.id) : index <= 0

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => isAccessible ? setCurrentStep(step.id) : undefined}
                    disabled={!isAccessible}
                    className={cn(
                      "flex flex-col items-center space-y-2 p-4 rounded-lg transition-colors",
                      isCurrent
                        ? "bg-primary/10 text-primary"
                        : isCompleted
                        ? "text-green-600 hover:bg-green-50"
                        : isAccessible
                        ? "text-muted-foreground hover:text-foreground hover:bg-muted"
                        : "text-muted-foreground/50 cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                        ? "bg-green-100 text-green-600"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {isCompleted ? (
                        "✓"
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm">{step.title}</p>
                      <p className="text-xs text-muted-foreground hidden lg:block">
                        {step.description}
                      </p>
                    </div>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </button>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-4",
                      index < currentStepIndex ? "bg-primary" : "bg-muted"
                    )} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                {currentStepData && (
                  <>
                    <currentStepData.icon className="mr-2 h-5 w-5" />
                    {currentStepData.title}
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {currentStepData?.description}
              </CardDescription>
            </div>
            <Badge variant="outline">
              Step {currentStepIndex + 1} of {steps.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {children}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={previousStep}
              disabled={!canGoPrevious()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              onClick={nextStep}
              disabled={!canGoNext()}
            >
              {currentStepIndex === steps.length - 1 ? (
                "Complete"
              ) : (
                <>
                  Next: {steps[currentStepIndex + 1]?.title}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}