"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import UploadPage from "@/components/upload/UploadPage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import { useVideoWorkflowStore } from "@/lib/stores/video-workflow-store"

export default function CreateProject({ userId }: { userId: string }) {
  const router = useRouter()
  const [projectName, setProjectName] = useState("")
  const [projectStarted, setProjectStarted] = useState(false)
  const { setProjectName: storeSetProjectName, resetWorkflow } = useVideoWorkflowStore()

  // Generate default project name
  useEffect(() => {
    if (!projectName) {
      const now = new Date()
      const defaultName = `Project-${now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}-${now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).replace(":", "")}`
      setProjectName(defaultName)
    }
  }, [])

  const handleStartProject = () => {
    // Reset any existing workflow state first
    resetWorkflow()
    // Store project name in zustand store
    storeSetProjectName(projectName)
    setProjectStarted(true)
  }

  const handleNewProject = () => {
    // Reset the store for a new project
    resetWorkflow()
    setProjectStarted(false)
    const now = new Date()
    const defaultName = `Project-${now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}-${now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).replace(":", "")}`
    setProjectName(defaultName)
  }

  if (!projectStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
        <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-slate-900">
                Create New Video Project
              </h1>
              <p className="text-slate-600 mt-2">
                Transform your horizontal videos into vertical format for social media
              </p>
            </div>

            {/* Project Name Card */}
            <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-800">Project Details</CardTitle>
                <CardDescription>
                  Give your project a memorable name to easily find it later
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name..."
                    className="text-lg"
                  />
                  <p className="text-sm text-slate-500">
                    This name will help you identify your project in the video library
                  </p>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleStartProject}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    size="lg"
                    disabled={!projectName.trim()}
                  >
                    Start Project
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Info Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-emerald-200/50 bg-white/60">
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-emerald-600 mb-1">
                    Step 1
                  </div>
                  <p className="text-sm text-slate-600">Upload your video</p>
                </CardContent>
              </Card>
              <Card className="border-emerald-200/50 bg-white/60">
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-emerald-600 mb-1">
                    Step 2
                  </div>
                  <p className="text-sm text-slate-600">Select clip range</p>
                </CardContent>
              </Card>
              <Card className="border-emerald-200/50 bg-white/60">
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-emerald-600 mb-1">
                    Step 3
                  </div>
                  <p className="text-sm text-slate-600">Process & download</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Once project is started, show the upload workflow
  return (
    <div>
      {/* Project Header */}
      <div className="bg-white border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {projectName}
              </h2>
              <span className="text-sm text-slate-500">In Progress</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewProject}
              className="text-slate-600"
            >
              Start New Project
            </Button>
          </div>
        </div>
      </div>

      {/* Upload Workflow */}
      <UploadPage />
    </div>
  )
}