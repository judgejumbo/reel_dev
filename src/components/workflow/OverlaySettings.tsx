"use client"

import { useState, useEffect } from "react"
import { useVideoWorkflowStore, OverlaySettings } from "@/lib/stores/video-workflow-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Settings, Image, Clock, Move, Palette } from "lucide-react"
import { cn } from "@/lib/utils"

interface OverlaySettingsProps {
  className?: string
}

const positionPresets = {
  "top-left": { x: 10, y: 10 },
  "top-center": { x: 50, y: 10 },
  "top-right": { x: 90, y: 10 },
  "center-left": { x: 10, y: 50 },
  "center": { x: 50, y: 50 },
  "center-right": { x: 90, y: 50 },
  "bottom-left": { x: 10, y: 90 },
  "bottom-center": { x: 50, y: 90 },
  "bottom-right": { x: 90, y: 90 },
}

const movementPresets = {
  "static": { horizontal: 0, vertical: 0 },
  "left-to-right": { horizontal: 50, vertical: 0 },
  "right-to-left": { horizontal: -50, vertical: 0 },
  "top-to-bottom": { horizontal: 0, vertical: 50 },
  "bottom-to-top": { horizontal: 0, vertical: -50 },
  "diagonal-tl-br": { horizontal: 25, vertical: 25 },
  "diagonal-tr-bl": { horizontal: -25, vertical: 25 },
}

export default function OverlaySettings({ className }: OverlaySettingsProps) {
  const { overlayMedia, clipSettings, overlaySettings, setOverlaySettings } = useVideoWorkflowStore()

  // Local state for real-time updates
  const [settings, setSettings] = useState<OverlaySettings>({
    appearAtSecond: 0,
    animationDuration: 5,
    startPositionXPercent: 50,
    startPositionYPercent: 50,
    horizontalSpeedPercent: 0,
    verticalSpeedPercent: 0,
    imageScale: 1.0,
    imageOpacity: 1.0,
  })

  // Initialize from store or defaults
  useEffect(() => {
    if (overlaySettings) {
      setSettings(overlaySettings)
    } else if (clipSettings) {
      // Default animation duration to clip duration or 5 seconds, whichever is less
      const defaultDuration = Math.min(clipSettings.duration, 5)
      setSettings(prev => ({
        ...prev,
        animationDuration: defaultDuration
      }))
    }
  }, [overlaySettings, clipSettings])

  // Update store when local settings change
  useEffect(() => {
    setOverlaySettings(settings)
  }, [settings, setOverlaySettings])

  const updateSetting = <K extends keyof OverlaySettings>(
    key: K,
    value: OverlaySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handlePositionPreset = (preset: string) => {
    const position = positionPresets[preset as keyof typeof positionPresets]
    if (position) {
      setSettings(prev => ({
        ...prev,
        startPositionXPercent: position.x,
        startPositionYPercent: position.y,
      }))
    }
  }

  const handleMovementPreset = (preset: string) => {
    const movement = movementPresets[preset as keyof typeof movementPresets]
    if (movement) {
      setSettings(prev => ({
        ...prev,
        horizontalSpeedPercent: movement.horizontal,
        verticalSpeedPercent: movement.vertical,
      }))
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = (seconds % 60).toFixed(1)
    return `${mins}:${secs.padStart(4, "0")}`
  }

  const maxAppearTime = clipSettings ? clipSettings.duration - 1 : 60
  const maxAnimationDuration = clipSettings ? clipSettings.duration - settings.appearAtSecond : 60

  if (!overlayMedia) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="p-8 text-center">
            <Image className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload Overlay Media First</h3>
            <p className="text-muted-foreground">
              Please upload an overlay image or video to configure settings
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Overlay Settings
          </CardTitle>
          <CardDescription>
            Configure how your overlay {overlayMedia.mediaType} appears and moves in the video
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Animation Timing */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <Label className="text-base font-semibold">Animation Timing</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appearAt">Appear at (seconds)</Label>
                <div className="space-y-2">
                  <Slider
                    value={[settings.appearAtSecond]}
                    onValueChange={([value]) => updateSetting("appearAtSecond", value)}
                    max={maxAppearTime}
                    step={0.1}
                    className="w-full"
                  />
                  <Input
                    id="appearAt"
                    type="number"
                    value={settings.appearAtSecond}
                    onChange={(e) => updateSetting("appearAtSecond", parseFloat(e.target.value) || 0)}
                    step={0.1}
                    min={0}
                    max={maxAppearTime}
                    className="font-mono"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Time: {formatTime(settings.appearAtSecond)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Animation Duration (seconds)</Label>
                <div className="space-y-2">
                  <Slider
                    value={[settings.animationDuration]}
                    onValueChange={([value]) => updateSetting("animationDuration", value)}
                    max={maxAnimationDuration}
                    step={0.1}
                    min={0.1}
                    className="w-full"
                  />
                  <Input
                    id="duration"
                    type="number"
                    value={settings.animationDuration}
                    onChange={(e) => updateSetting("animationDuration", parseFloat(e.target.value) || 0.1)}
                    step={0.1}
                    min={0.1}
                    max={maxAnimationDuration}
                    className="font-mono"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Duration: {formatTime(settings.animationDuration)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Position Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Move className="h-4 w-4" />
              <Label className="text-base font-semibold">Position & Movement</Label>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Position Presets</Label>
                <Select onValueChange={handlePositionPreset}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose starting position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-left">Top Left</SelectItem>
                    <SelectItem value="top-center">Top Center</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="center-left">Center Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="center-right">Center Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="bottom-center">Bottom Center</SelectItem>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>X Position (%)</Label>
                  <Slider
                    value={[settings.startPositionXPercent]}
                    onValueChange={([value]) => updateSetting("startPositionXPercent", value)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {settings.startPositionXPercent}% from left
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Y Position (%)</Label>
                  <Slider
                    value={[settings.startPositionYPercent]}
                    onValueChange={([value]) => updateSetting("startPositionYPercent", value)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {settings.startPositionYPercent}% from top
                  </p>
                </div>
              </div>

              <div>
                <Label>Movement Presets</Label>
                <Select onValueChange={handleMovementPreset}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose movement pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">Static (No Movement)</SelectItem>
                    <SelectItem value="left-to-right">Left to Right</SelectItem>
                    <SelectItem value="right-to-left">Right to Left</SelectItem>
                    <SelectItem value="top-to-bottom">Top to Bottom</SelectItem>
                    <SelectItem value="bottom-to-top">Bottom to Top</SelectItem>
                    <SelectItem value="diagonal-tl-br">Diagonal (↘)</SelectItem>
                    <SelectItem value="diagonal-tr-bl">Diagonal (↙)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horizontal Speed (%/sec)</Label>
                  <Slider
                    value={[settings.horizontalSpeedPercent]}
                    onValueChange={([value]) => updateSetting("horizontalSpeedPercent", value)}
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {settings.horizontalSpeedPercent > 0 ? "→" : settings.horizontalSpeedPercent < 0 ? "←" : "—"} {Math.abs(settings.horizontalSpeedPercent)}%/sec
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Vertical Speed (%/sec)</Label>
                  <Slider
                    value={[settings.verticalSpeedPercent]}
                    onValueChange={([value]) => updateSetting("verticalSpeedPercent", value)}
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {settings.verticalSpeedPercent > 0 ? "↓" : settings.verticalSpeedPercent < 0 ? "↑" : "—"} {Math.abs(settings.verticalSpeedPercent)}%/sec
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Visual Properties */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Palette className="h-4 w-4" />
              <Label className="text-base font-semibold">Visual Properties</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scale</Label>
                <Slider
                  value={[settings.imageScale]}
                  onValueChange={([value]) => updateSetting("imageScale", value)}
                  min={0.1}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  {Math.round(settings.imageScale * 100)}% of original size
                </p>
              </div>

              <div className="space-y-2">
                <Label>Opacity</Label>
                <Slider
                  value={[settings.imageOpacity]}
                  onValueChange={([value]) => updateSetting("imageOpacity", value)}
                  min={0.0}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  {Math.round(settings.imageOpacity * 100)}% opacity
                </p>
              </div>
            </div>
          </div>

          {/* Preview Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Animation Preview</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Appears:</span>
                <span className="ml-2">{formatTime(settings.appearAtSecond)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <span className="ml-2">{formatTime(settings.animationDuration)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Position:</span>
                <span className="ml-2">{settings.startPositionXPercent}%, {settings.startPositionYPercent}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Movement:</span>
                <span className="ml-2">
                  {settings.horizontalSpeedPercent === 0 && settings.verticalSpeedPercent === 0
                    ? "Static"
                    : `${settings.horizontalSpeedPercent}% H, ${settings.verticalSpeedPercent}% V`}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Scale:</span>
                <span className="ml-2">{Math.round(settings.imageScale * 100)}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Opacity:</span>
                <span className="ml-2">{Math.round(settings.imageOpacity * 100)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}