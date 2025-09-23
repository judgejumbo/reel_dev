"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useVideoWorkflowStore } from "@/lib/stores/video-workflow-store"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactPlayer from "react-player"

interface VideoPreviewProps {
  className?: string
  onTimeUpdate?: (currentTime: number) => void
}

export default function VideoPreview({ className, onTimeUpdate }: VideoPreviewProps) {
  const { mainVideo } = useVideoWorkflowStore()

  // Extract only the URL string to prevent ReactPlayer from using File object
  const videoUrl = useMemo(() => {
    if (mainVideo?.url && typeof mainVideo.url === 'string' && mainVideo.url.startsWith('https://')) {
      console.log('VideoPreview - Generated URL:', mainVideo.url)
      return mainVideo.url
    }
    console.log('VideoPreview - No valid URL:', mainVideo?.url)
    return null
  }, [mainVideo?.url])

  // Debug logging (reduced frequency)
  useEffect(() => {
    console.log('VideoPreview - mainVideo:', mainVideo)
    console.log('VideoPreview - videoUrl:', videoUrl)
    console.log('VideoPreview - mainVideo.file:', mainVideo?.file)
  }, [mainVideo?.id, videoUrl])
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [seeking, setSeeking] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [useNativePlayer, setUseNativePlayer] = useState(true) // Start with native player for .m4v files
  const playerRef = useRef<ReactPlayer>(null)
  const nativeVideoRef = useRef<HTMLVideoElement>(null)

  // Handle video player errors silently
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.name === 'AbortError') {
        event.preventDefault() // Prevent AbortError from showing in console
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  const handlePlayPause = async () => {
    if (isToggling) return // Prevent rapid toggling

    setIsToggling(true)

    try {
      if (useNativePlayer && nativeVideoRef.current) {
        // Native video element
        const video = nativeVideoRef.current
        if (playing) {
          video.pause()
        } else {
          await video.play().catch(() => {
            console.log('Native video play failed')
          })
        }
      } else {
        // ReactPlayer - use state-based approach
        if (playing) {
          setPlaying(false)
        } else {
          setPlaying(true)
        }
      }
    } catch (error) {
      console.log('Play/pause error:', error)
    }

    setTimeout(() => {
      setIsToggling(false)
    }, 200)
  }

  const handleSeek = (time: number) => {
    setSeeking(true)
    setCurrentTime(time)

    if (useNativePlayer && nativeVideoRef.current) {
      nativeVideoRef.current.currentTime = time
    } else if (playerRef.current) {
      playerRef.current.seekTo(time, "seconds")
    }

    setTimeout(() => setSeeking(false), 100)
  }

  const handleProgress = ({ playedSeconds }: { playedSeconds: number }) => {
    if (!seeking) {
      setCurrentTime(playedSeconds)
      onTimeUpdate?.(playedSeconds)
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

  if (!videoUrl) {
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
        {!useNativePlayer ? (
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            playing={playing}
            onProgress={handleProgress}
            onReady={(player) => {
              console.log('ReactPlayer ready, player:', player)
              const duration = player.getDuration()
              console.log('ReactPlayer duration:', duration)
              if (duration) {
                handleDuration(duration)
              }
            }}
            onError={(error) => {
              console.error('ReactPlayer error:', error)
              console.log('Switching to native HTML5 video player')
              setUseNativePlayer(true)
            }}
            onStart={() => {
              console.log('ReactPlayer started')
            }}
            onPause={() => {
              console.log('ReactPlayer paused')
              if (playing) {
                setPlaying(false)
              }
            }}
            onPlay={() => {
              console.log('ReactPlayer playing')
              if (!playing) {
                setPlaying(true)
              }
            }}
            width="100%"
            height="100%"
            controls={false}
            light={false}
            pip={false}
            config={{
              file: {
                attributes: {
                  controlsList: 'nodownload',
                  preload: 'metadata',
                  crossOrigin: 'anonymous'
                },
                forceHLS: false,
                forceVideo: true,
                forceSafariHLS: false
              }
            }}
          />
        ) : (
          <video
            ref={nativeVideoRef}
            src={videoUrl || undefined}
            className="w-full h-full object-contain"
            preload="metadata"
            onLoadedMetadata={() => {
              const video = nativeVideoRef.current
              if (video) {
                setDuration(video.duration)
                console.log('Native video loaded, duration:', video.duration)
              }
            }}
            onTimeUpdate={() => {
              const video = nativeVideoRef.current
              if (video && !seeking) {
                setCurrentTime(video.currentTime)
                onTimeUpdate?.(video.currentTime)
              }
            }}
            onPlay={() => {
              console.log('Native video playing')
              setPlaying(true)
            }}
            onPause={() => {
              console.log('Native video paused')
              setPlaying(false)
            }}
          />
        )}

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