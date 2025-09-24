"use client"

import { Check, Upload, Scissors, Settings, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useVideoWorkflowStore, WorkflowStep } from "@/lib/stores/video-workflow-store"

const steps = [
  {
    id: "upload" as WorkflowStep,
    title: "Upload",
    description: "Upload your video files",
    icon: Upload,
  },
  {
    id: "clip" as WorkflowStep,
    title: "Clip",
    description: "Select clip settings",
    icon: Scissors,
  },
  {
    id: "settings" as WorkflowStep,
    title: "Settings",
    description: "Configure overlay",
    icon: Settings,
  },
  {
    id: "process" as WorkflowStep,
    title: "Process",
    description: "Convert to vertical",
    icon: Zap,
  },
]

export default function WorkflowStepper() {
  const { currentStep, canProceedToStep } = useVideoWorkflowStore()

  const getStepStatus = (stepId: WorkflowStep) => {
    const currentStepIndex = steps.findIndex((step) => step.id === currentStep)
    const stepIndex = steps.findIndex((step) => step.id === stepId)

    if (stepIndex < currentStepIndex) {
      return "completed"
    } else if (stepIndex === currentStepIndex) {
      return "current"
    } else if (canProceedToStep(stepId)) {
      return "available"
    } else {
      return "disabled"
    }
  }

  return (
    <div className="w-full">
      <nav aria-label="Progress">
        <ol className="flex items-center justify-between">
          {steps.map((step, stepIdx) => {
            const status = getStepStatus(step.id)
            const Icon = step.icon

            return (
              <li key={step.id} className="relative flex-1">
                {/* Step connector line */}
                {stepIdx !== steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-1/2 top-5 h-0.5 w-full -translate-y-1/2 translate-x-1/2",
                      status === "completed"
                        ? "bg-primary"
                        : "bg-muted-foreground/20"
                    )}
                    aria-hidden="true"
                  />
                )}

                <div className="group relative flex flex-col items-center">
                  {/* Step circle with icon */}
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background transition-colors",
                      {
                        "border-primary bg-primary text-primary-foreground":
                          status === "completed",
                        "border-primary bg-background text-primary":
                          status === "current",
                        "border-muted-foreground/30 bg-background text-muted-foreground":
                          status === "available" || status === "disabled",
                      }
                    )}
                  >
                    {status === "completed" ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>

                  {/* Step title and description */}
                  <div className="mt-2 flex flex-col items-center">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        {
                          "text-primary": status === "current" || status === "completed",
                          "text-muted-foreground": status === "available" || status === "disabled",
                        }
                      )}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {step.description}
                    </p>
                  </div>

                  {/* Step status badge */}
                  {status === "current" && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      Current
                    </Badge>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Mobile step indicator */}
      <div className="mt-4 sm:hidden">
        <p className="text-sm text-muted-foreground">
          Step {steps.findIndex((step) => step.id === currentStep) + 1} of {steps.length}
        </p>
      </div>
    </div>
  )
}