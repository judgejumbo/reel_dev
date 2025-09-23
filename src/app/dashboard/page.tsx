"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Upload, Play, Settings, Download } from "lucide-react"

export default function DashboardPage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You must be signed in to view this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = "/login"} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-6">
            {/* Welcome Card */}
            <Card>
              <CardHeader>
                <CardTitle>Welcome back, {session.user?.name}!</CardTitle>
                <CardDescription>
                  Convert your horizontal videos to vertical format for social media
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/upload">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Upload className="mr-2 h-5 w-5" />
                    Start New Video Project
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Workflow Steps */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upload</CardTitle>
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">✓</div>
                  <p className="text-xs text-muted-foreground">
                    Upload your video files
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clip</CardTitle>
                  <Play className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-muted-foreground">○</div>
                  <p className="text-xs text-muted-foreground">
                    Coming in Phase 5
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Process</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-muted-foreground">○</div>
                  <p className="text-xs text-muted-foreground">
                    Coming in Phase 6
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Download</CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-muted-foreground">○</div>
                  <p className="text-xs text-muted-foreground">
                    Coming in Phase 7
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Phase 2 features now available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/upload">
                      <Button variant="outline" className="w-full sm:w-auto">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload New Video
                      </Button>
                    </Link>
                    <Button variant="outline" disabled className="w-full sm:w-auto">
                      <Play className="mr-2 h-4 w-4" />
                      View Projects (Coming Soon)
                    </Button>
                  </div>
                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      variant="ghost"
                      size="sm"
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}