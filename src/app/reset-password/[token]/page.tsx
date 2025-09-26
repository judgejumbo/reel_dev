import { Metadata } from "next"
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { validateToken } from "@/lib/tokens"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Reset Password - ReelRift",
  description: "Set your new ReelRift account password",
}

interface ResetPasswordPageProps {
  params: {
    token: string
  }
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { token } = await params

  // Validate token on server side
  const tokenData = await validateToken(token, "PASSWORD_RESET")
  const isValidToken = !!tokenData

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Reset Password
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isValidToken
                ? "Enter your new password below"
                : "This password reset link is invalid or has expired"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isValidToken ? (
              <ResetPasswordForm token={token} userId={tokenData.userId} />
            ) : (
              <InvalidTokenContent />
            )}

            <div className="mt-6 text-center text-sm">
              <Link
                href="/login"
                className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InvalidTokenContent() {
  return (
    <div className="space-y-4">
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Invalid Reset Link</strong>
          <br />
          This password reset link is either invalid, expired, or has already been used.
        </AlertDescription>
      </Alert>

      <div className="text-sm text-gray-600 space-y-2">
        <p><strong>Why might this happen?</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>The link is older than 1 hour (expired)</li>
          <li>The link has already been used</li>
          <li>You clicked an old reset link from a previous request</li>
        </ul>
      </div>

      <Link href="/forgot-password" className="block">
        <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
          Request New Reset Link
        </button>
      </Link>
    </div>
  )
}