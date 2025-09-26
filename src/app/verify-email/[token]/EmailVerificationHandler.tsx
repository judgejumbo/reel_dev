"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { validateAndConsumeToken } from "@/lib/tokens"
import { verifyEmail } from "@/app/actions/auth-tokens"

interface EmailVerificationHandlerProps {
  token: string
}

type Status = "loading" | "success" | "error" | "invalid"

export default function EmailVerificationHandler({ token }: EmailVerificationHandlerProps) {
  const [status, setStatus] = useState<Status>("loading")
  const [error, setError] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Validate and consume the email verification token
        const response = await fetch("/api/auth/email-verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Invalid or expired verification link")
        }

        // Token is valid, mark email as verified
        await verifyEmail(result.userId)

        setStatus("success")

        // Redirect to login after success message
        setTimeout(() => {
          router.push("/login")
        }, 3000)

      } catch (err) {
        console.error("Email verification error:", err)
        setStatus("error")
        setError(err instanceof Error ? err.message : "An unexpected error occurred")
      }
    }

    if (token) {
      handleEmailVerification()
    } else {
      setStatus("invalid")
      setError("No verification token provided")
    }
  }, [token, router])

  const getStatusContent = () => {
    switch (status) {
      case "loading":
        return (
          <>
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
            <CardTitle className="text-center">Verifying your email...</CardTitle>
            <CardDescription className="text-center">
              Please wait while we verify your email address.
            </CardDescription>
          </>
        )

      case "success":
        return (
          <>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-center text-green-600">Email Verified!</CardTitle>
            <CardDescription className="text-center">
              Your email has been verified successfully. You can now sign in to your account.
            </CardDescription>
            <CardContent>
              <div className="text-center text-sm text-muted-foreground">
                Redirecting to login page in a few seconds...
              </div>
            </CardContent>
          </>
        )

      case "error":
      case "invalid":
        return (
          <>
            <div className="flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-center text-red-600">Verification Failed</CardTitle>
            <CardDescription className="text-center">
              {error || "This verification link is invalid or has expired."}
            </CardDescription>
            <CardFooter className="flex flex-col space-y-2 pt-4">
              <Button
                onClick={() => router.push("/login")}
                className="w-full"
              >
                Go to Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/register")}
                className="w-full"
              >
                Create New Account
              </Button>
            </CardFooter>
          </>
        )

      default:
        return null
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        {getStatusContent()}
      </CardHeader>
      {status === "loading" && (
        <CardContent>
          <div className="text-center text-sm text-muted-foreground">
            This should only take a moment...
          </div>
        </CardContent>
      )}
    </Card>
  )
}