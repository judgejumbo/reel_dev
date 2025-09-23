"use client"

import { useState, useEffect } from "react"
import { useVideoWorkflowStore, ClipSettings } from "@/lib/stores/video-workflow-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Scissors, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import VideoPreview from "./VideoPreview"

interface TimelineSelectorProps {
  className?: string
}

export default function TimelineSelector({ className }: TimelineSelectorProps) {
  const { mainVideo, clipSettings, setClipSettings } = useVideoWorkflowStore()
  const [localStartTime, setLocalStartTime] = useState(0)
  const [localEndTime, setLocalEndTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Initialize values when video is loaded or clipSettings change
  useEffect(() => {
    if (mainVideo?.duration) {
      setDuration(mainVideo.duration)

      if (clipSettings) {
        setLocalStartTime(clipSettings.startTime)
        setLocalEndTime(clipSettings.endTime)
      } else {
        // Default to full video
        setLocalStartTime(0)
        setLocalEndTime(mainVideo.duration)
      }
    }
  }, [mainVideo?.duration, clipSettings])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = (seconds % 60).toFixed(1)
    return `${mins}:${secs.padStart(4, "0")}`
  }

  const parseTimeInput = (timeString: string): number => {
    const parts = timeString.split(':')
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0
      const seconds = parseFloat(parts[1]) || 0
      return minutes * 60 + seconds
    }
    return parseFloat(timeString) || 0
  }

  const handleTimelineChange = ([start, end]: number[]) => {
    setLocalStartTime(start)
    setLocalEndTime(end)
    updateClipSettings(start, end)
  }

  const handleStartTimeInput = (value: string) => {
    const time = parseTimeInput(value)
    const validTime = Math.max(0, Math.min(time, localEndTime - 0.1))
    setLocalStartTime(validTime)
    updateClipSettings(validTime, localEndTime)
  }

  const handleEndTimeInput = (value: string) => {
    const time = parseTimeInput(value)
    const validTime = Math.min(duration, Math.max(time, localStartTime + 0.1))
    setLocalEndTime(validTime)
    updateClipSettings(localStartTime, validTime)
  }

  const updateClipSettings = (startTime: number, endTime: number) => {
    const settings: ClipSettings = {
      startTime,
      endTime,
      duration: endTime - startTime,
    }
    setClipSettings(settings)
  }

  const handlePresetLength = (lengthInSeconds: number) => {
    const start = localStartTime
    const end = Math.min(duration, start + lengthInSeconds)
    setLocalEndTime(end)
    updateClipSettings(start, end)
  }

  const clipDuration = localEndTime - localStartTime

  if (!mainVideo?.url) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="p-8 text-center">
            <Scissors className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload a Video First</h3>
            <p className="text-muted-foreground">
              Please upload a main video to start selecting clip segments
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Video Preview */}
      <VideoPreview />

      {/* Timeline Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Scissors className="mr-2 h-5 w-5" />
            Clip Selection
          </CardTitle>
          <CardDescription>
            Select the start and end points for your video clip with 0.1 second precision
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Time Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                placeholder="0:00.0"
                value={formatTime(localStartTime)}
                onChange={(e) => handleStartTimeInput(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                placeholder="0:30.0"
                value={formatTime(localEndTime)}
                onChange={(e) => handleEndTimeInput(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="flex items-center h-9 px-3 border border-input bg-muted rounded-md font-mono text-sm">
                <Clock className="mr-2 h-4 w-4" />
                {formatTime(clipDuration)}
              </div>
            </div>
          </div>

          {/* Timeline Slider */}
          <div className="space-y-4">
            <Label>Timeline</Label>
            <div className="space-y-2">
              <Slider
                value={[localStartTime, localEndTime]}
                onValueChange={handleTimelineChange}
                max={duration}
                step={0.1}
                className="w-full"
                minStepsBetweenThumbs={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0:00.0</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <Label>Quick Presets</Label>
            <div className="flex flex-wrap gap-2">
              {[15, 30, 60, 90, 120].map((seconds) => (
                <Button
                  key={seconds}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetLength(seconds)}
                  disabled={localStartTime + seconds > duration}
                >
                  {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
                </Button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Clip Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Start:</span>
                <span className="ml-2 font-mono">{formatTime(localStartTime)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">End:</span>
                <span className="ml-2 font-mono">{formatTime(localEndTime)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Length:</span>
                <span className="ml-2 font-mono">{formatTime(clipDuration)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}