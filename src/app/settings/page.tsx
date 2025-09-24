"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import {
  User,
  Crown,
  ArrowLeft,
  Camera,
  Shield,
  CreditCard,
  LogOut,
} from "lucide-react"

export default function SettingsPage() {
  const { data: session, status } = useSession()

  // Generate user initials for avatar fallback
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-emerald-600 rounded-full animate-pulse"></div>
          <p className="text-slate-600">Loading settings...</p>
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

  const user = session.user

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-emerald-700 hover:text-emerald-800">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Account Settings</h1>
              <p className="text-slate-600 mt-1">Manage your profile and preferences</p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Profile Overview */}
            <Card className="lg:col-span-1 border-emerald-200 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="relative mx-auto">
                  <Avatar className="h-20 w-20 mx-auto">
                    <AvatarImage src={user?.image || undefined} alt={user?.name || "User"} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg font-medium">
                      {user?.name ? getUserInitials(user.name) : <User className="w-8 h-8" />}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                  >
                    <Camera className="h-3 w-3" />
                  </Button>
                </div>
                <CardTitle className="text-emerald-800">{user?.name || "User"}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                    Free Plan
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade Plan
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>

            {/* Settings Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Information */}
              <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-emerald-800">
                    <User className="mr-2 h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        defaultValue={user?.name || ""}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue={user?.email || ""}
                        placeholder="Enter your email"
                        disabled
                        className="bg-slate-50"
                      />
                      <p className="text-xs text-slate-500">Email changes require verification</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name (Optional)</Label>
                    <Input
                      id="company"
                      placeholder="Enter your company name"
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500">This will appear on your invoices</p>
                  </div>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    Save Changes
                  </Button>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-emerald-800">
                    <Shield className="mr-2 h-5 w-5" />
                    Security & Password
                  </CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  <Button variant="outline">
                    Update Password
                  </Button>
                </CardContent>
              </Card>

              {/* Billing & Subscription */}
              <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-emerald-800">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Billing & Subscription
                  </CardTitle>
                  <CardDescription>Manage your subscription and billing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Crown className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="font-medium text-slate-900">Free Plan</p>
                        <p className="text-sm text-slate-600">5 videos per month</p>
                      </div>
                    </div>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      Upgrade Now
                    </Button>
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <h4 className="font-medium text-slate-900">Billing History</h4>
                    <p className="text-sm text-slate-600">No billing history available for free accounts.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-red-200 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-red-700">Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions for your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                      <h4 className="font-medium text-red-900 mb-2">Delete Account</h4>
                      <p className="text-sm text-red-700 mb-3">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}