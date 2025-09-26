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
import { useState, useEffect } from "react"
import { changePassword, updateProfile, requestEmailChange, resendEmailVerification } from "@/app/actions/settings"
import toast, { Toaster } from "react-hot-toast"
import {
  User,
  Crown,
  ArrowLeft,
  Camera,
  Shield,
  CreditCard,
  LogOut,
  Mail,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react"

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const [profileName, setProfileName] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [emailChangePassword, setEmailChangePassword] = useState("")
  const [isLoading, setIsLoading] = useState({
    profile: false,
    password: false,
    email: false,
    verification: false,
  })

  // Initialize profile name when user data is available
  useEffect(() => {
    if (session?.user?.name) {
      setProfileName(session.user.name)
    }
  }, [session?.user])

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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(prev => ({ ...prev, profile: true }))

    try {
      const result = await updateProfile(profileName)
      if (result.success) {
        toast.success(result.message)
        await update() // Refresh session
      } else {
        toast.error(result.error || "Failed to update profile")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(prev => ({ ...prev, profile: false }))
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(prev => ({ ...prev, password: true }))

    try {
      const result = await changePassword(currentPassword, newPassword, confirmPassword)
      if (result.success) {
        toast.success(result.message)
        // Clear form
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast.error(result.error || "Failed to change password")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(prev => ({ ...prev, password: false }))
    }
  }

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(prev => ({ ...prev, email: true }))

    try {
      const result = await requestEmailChange(newEmail, emailChangePassword)
      if (result.success) {
        toast.success(result.message)
        setNewEmail("")
        setEmailChangePassword("")
      } else {
        toast.error(result.error || "Failed to request email change")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(prev => ({ ...prev, email: false }))
    }
  }

  const handleResendVerification = async () => {
    setIsLoading(prev => ({ ...prev, verification: true }))

    try {
      const result = await resendEmailVerification()
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.error || "Failed to send verification email")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(prev => ({ ...prev, verification: false }))
    }
  }

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
              {/* Email Verification Status */}
              {user?.emailVerified === null && (
                <Card className="border-amber-200 bg-amber-50/80 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <div>
                          <p className="font-medium text-amber-900">Email Verification Required</p>
                          <p className="text-sm text-amber-700">Please verify your email address to secure your account</p>
                        </div>
                      </div>
                      <Button
                        onClick={handleResendVerification}
                        disabled={isLoading.verification}
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        {isLoading.verification ? "Sending..." : "Resend Email"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Profile Information */}
              <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-emerald-800">
                    <User className="mr-2 h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading.profile}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isLoading.profile ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Email Management */}
              <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-emerald-800">
                    <Mail className="mr-2 h-5 w-5" />
                    Email Settings
                  </CardTitle>
                  <CardDescription>Manage your email address and verification status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Current Email */}
                  <div className="space-y-2">
                    <Label>Current Email Address</Label>
                    <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <span className="flex-1">{user?.email}</span>
                      {user?.emailVerified ? (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-amber-600">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-medium">Unverified</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Change Email */}
                  <form onSubmit={handleEmailChange} className="space-y-4">
                    <h4 className="font-medium text-slate-900">Change Email Address</h4>
                    <div className="space-y-2">
                      <Label htmlFor="new-email">New Email Address</Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Enter new email address"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-password">Current Password</Label>
                      <Input
                        id="email-password"
                        type="password"
                        value={emailChangePassword}
                        onChange={(e) => setEmailChangePassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading.email}
                      variant="outline"
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                      {isLoading.email ? "Sending Verification..." : "Change Email"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-emerald-800">
                    <Shield className="mr-2 h-5 w-5" />
                    Security & Password
                  </CardTitle>
                  <CardDescription>Manage your account security and password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Password Last Changed */}
                  {user?.passwordChangedAt && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <Clock className="h-4 w-4" />
                        <span>Password last changed: {new Date(user.passwordChangedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Change Password Form */}
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <h4 className="font-medium text-slate-900">Change Password</h4>
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          minLength={8}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          minLength={8}
                          required
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">Password must be at least 8 characters long</p>
                    <Button
                      type="submit"
                      disabled={isLoading.password}
                      variant="outline"
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                      {isLoading.password ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
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
      <Toaster position="top-right" />
    </div>
  )
}