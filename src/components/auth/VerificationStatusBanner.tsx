"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, CheckCircle2, AlertCircle } from "lucide-react"
import { resendEmailVerification } from "@/app/actions/auth-tokens"

interface VerificationStatusBannerProps {
  user: {
    id: string
    email: string
    emailVerified: Date | null
  }
  onResendSuccess?: () => void
}

export function VerificationStatusBanner({ user, onResendSuccess }: VerificationStatusBannerProps) {
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  // Don't show banner if email is already verified
  if (user.emailVerified) {
    return null
  }

  const handleResendVerification = async () => {
    setIsResending(true)
    setResendError(null)
    setResendSuccess(false)

    try {
      await resendEmailVerification(user.id)
      setResendSuccess(true)
      onResendSuccess?.()

      // Hide success message after 3 seconds
      setTimeout(() => setResendSuccess(false), 3000)
    } catch (error) {
      setResendError(error instanceof Error ? error.message : "Failed to resend email")
    } finally {
      setIsResending(false)
    }
  }

  if (resendSuccess) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700">
          Verification email sent successfully! Please check your inbox.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="border-yellow-200 bg-yellow-50">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-700">
        <div className="flex items-center justify-between">
          <div>
            <strong>Please verify your email address.</strong>
            <p className="text-sm mt-1">
              We sent a verification email to <span className="font-medium">{user.email}</span>.
              Click the link in the email to verify your account.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResendVerification}
            disabled={isResending}
            className="ml-4 whitespace-nowrap"
          >
            <Mail className="h-4 w-4 mr-2" />
            {isResending ? "Sending..." : "Resend Email"}
          </Button>
        </div>
        {resendError && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
            {resendError}
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}