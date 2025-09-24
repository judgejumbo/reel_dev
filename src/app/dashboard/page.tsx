"use client"

import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import {
  Upload,
  Play,
  Settings,
  Download,
  VideoIcon,
  HardDrive,
  Clock,
  Crown,
  TrendingUp,
  ArrowUpRight
} from "lucide-react"

export default function DashboardPage() {
  const { data: session, status } = useSession()

  // Mock data - replace with actual database queries
  const dashboardData = {
    videosProcessed: 12,
    storageUsed: 2.1, // GB
    storageLimit: 5.0, // GB
    timeSaved: 47, // minutes
    currentPlan: "Free",
    uploadsThisMonth: 3,
    uploadLimit: 5,
    daysUntilReset: 18
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-emerald-600 rounded-full animate-pulse"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 flex items-center justify-center">
        <Card className="w-full max-w-md border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-800">Access Denied</CardTitle>
            <CardDescription>
              You must be signed in to view this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = "/login"} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const storagePercentage = (dashboardData.storageUsed / dashboardData.storageLimit) * 100
  const uploadsPercentage = (dashboardData.uploadsThisMonth / dashboardData.uploadLimit) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Welcome back, {session.user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-slate-600 mt-1">
              Here&apos;s how your video repurposing is going
            </p>
          </div>

          {/* Overview Metrics Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Videos Processed */}
            <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Videos Processed</CardTitle>
                <VideoIcon className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{dashboardData.videosProcessed}</div>
                <div className="flex items-center text-xs text-emerald-600">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  +2 this week
                </div>
              </CardContent>
            </Card>

            {/* Storage Used */}
            <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Storage Used</CardTitle>
                <HardDrive className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {dashboardData.storageUsed} GB
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Progress value={storagePercentage} className="flex-1 h-2" />
                  <span className="text-xs text-slate-500">{dashboardData.storageLimit} GB</span>
                </div>
              </CardContent>
            </Card>

            {/* Time Saved */}
            <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Time Saved</CardTitle>
                <Clock className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{dashboardData.timeSaved} min</div>
                <p className="text-xs text-slate-500">
                  vs manual editing
                </p>
              </CardContent>
            </Card>

            {/* Current Plan */}
            <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Current Plan</CardTitle>
                <Crown className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                    {dashboardData.currentPlan}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {dashboardData.currentPlan === "Free" ? "Upgrade for more features" : "Active subscription"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Status & Quick Actions Row */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Subscription Status Card */}
            <Card className="lg:col-span-2 border-emerald-200 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-emerald-800">Subscription Status</CardTitle>
                    <CardDescription>Your usage and limits</CardDescription>
                  </div>
                  {dashboardData.currentPlan === "Free" && (
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      <Crown className="mr-2 h-4 w-4" />
                      Upgrade
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Monthly Uploads</span>
                    <span className="text-slate-900 font-medium">
                      {dashboardData.uploadsThisMonth} of {dashboardData.uploadLimit}
                    </span>
                  </div>
                  <Progress value={uploadsPercentage} className="h-3" />
                  {uploadsPercentage > 80 && (
                    <p className="text-xs text-amber-600 mt-1">
                      You&apos;re approaching your monthly limit
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-slate-900">{dashboardData.daysUntilReset}</div>
                    <div className="text-xs text-slate-500">Days until reset</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-emerald-600">Unlimited</div>
                    <div className="text-xs text-slate-500">Pro plan feature</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-800">Quick Actions</CardTitle>
                <CardDescription>Get started quickly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/upload" className="block">
                  <Button className="w-full justify-start bg-emerald-600 hover:bg-emerald-700">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload New Video
                  </Button>
                </Link>

                <Button variant="outline" className="w-full justify-start" disabled>
                  <Play className="mr-2 h-4 w-4" />
                  View All Videos
                </Button>

                <Button variant="outline" className="w-full justify-start" disabled>
                  <Settings className="mr-2 h-4 w-4" />
                  Templates
                </Button>

                <div className="pt-3 border-t">
                  <Link href="/settings" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      Account Settings
                      <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-emerald-800">Recent Activity</CardTitle>
              <CardDescription>Your latest video processing activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Empty state for now */}
                <div className="text-center py-8">
                  <VideoIcon className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                  <p className="text-slate-600 font-medium">No videos processed yet</p>
                  <p className="text-slate-500 text-sm">Upload your first video to get started</p>
                  <Link href="/upload">
                    <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Video
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}