"use client"

import { useState, useRef, useEffect } from "react"
import { useVideoWorkflowStore } from "@/lib/stores/video-workflow-store"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactPlayer from "react-player"

interface VideoPreviewProps {
  className?: string
}

export default function VideoPreview({ className }: VideoPreviewProps) {
  const { mainVideo } = useVideoWorkflowStore()
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [seeking, setSeeking] = useState(false)
  const playerRef = useRef<ReactPlayer>(null)

  const handlePlayPause = () => {
    setPlaying(!playing)
  }

  const handleSeek = (time: number) => {
    setSeeking(true)
    setCurrentTime(time)
    playerRef.current?.seekTo(time, "seconds")
    setTimeout(() => setSeeking(false), 100)
  }

  const handleProgress = ({ playedSeconds }: { playedSeconds: number }) => {
    if (!seeking) {
      setCurrentTime(playedSeconds)
    }
  }

  const handleDuration = (duration: number) => {
    setDuration(duration)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = (seconds % 60).toFixed(1)
    return `${mins}:${secs.padStart(4, "0")}`
  }

  const handleSkipBack = () => {
    const newTime = Math.max(0, currentTime - 10)
    handleSeek(newTime)
  }

  const handleSkipForward = () => {
    const newTime = Math.min(duration, currentTime + 10)
    handleSeek(newTime)
  }

  if (!mainVideo?.url) {
    return (
      <div className={cn("bg-muted rounded-lg flex items-center justify-center h-64", className)}>
        <p className="text-muted-foreground">Upload a video to preview</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Video Player */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        <ReactPlayer
          ref={playerRef}
          url={mainVideo.url}
          playing={playing}
          onProgress={handleProgress}
          onDuration={handleDuration}
          width="100%"
          height="100%"
          controls={false}
        />

        {/* Play/Pause Overlay */}
        <button
          onClick={handlePlayPause}
          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
        >
          <div className="bg-black/50 rounded-full p-3">
            {playing ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" />
            )}
          </div>
        </button>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {/* Timeline Slider */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            onValueChange={([value]) => handleSeek(value)}
            max={duration}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleSkipBack}>
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handlePlayPause}>
            {playing ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSkipForward}>
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}