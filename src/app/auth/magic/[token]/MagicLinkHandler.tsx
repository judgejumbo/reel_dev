"use client"

import { useEffect, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

interface MagicLinkHandlerProps {
  token: string
}

type Status = "loading" | "success" | "error" | "invalid"

export default function MagicLinkHandler({ token }: MagicLinkHandlerProps) {
  const [status, setStatus] = useState<Status>("loading")
  const [error, setError] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    const handleMagicLink = async () => {
      try {
        // Validate and consume the magic link token
        const response = await fetch("/api/auth/magic-link", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Invalid or expired magic link")
        }

        // Token is valid, sign the user in
        const signInResult = await signIn("credentials", {
          email: result.email,
          magicLinkToken: token,
          redirect: false,
        })

        if (signInResult?.error) {
          throw new Error("Failed to sign in")
        }

        setStatus("success")

        // Redirect to dashboard after a brief success message
        setTimeout(() => {
          router.push("/dashboard")
          router.refresh()
        }, 2000)

      } catch (err) {
        console.error("Magic link error:", err)
        setStatus("error")
        setError(err instanceof Error ? err.message : "An unexpected error occurred")
      }
    }

    if (token) {
      handleMagicLink()
    } else {
      setStatus("invalid")
      setError("No magic link token provided")
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
            <CardTitle className="text-center">Verifying your magic link...</CardTitle>
            <CardDescription className="text-center">
              Please wait while we sign you in.
            </CardDescription>
          </>
        )

      case "success":
        return (
          <>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-center text-green-600">Success!</CardTitle>
            <CardDescription className="text-center">
              You&apos;ve been signed in successfully. Redirecting to your dashboard...
            </CardDescription>
          </>
        )

      case "error":
      case "invalid":
        return (
          <>
            <div className="flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-center text-red-600">Invalid Magic Link</CardTitle>
            <CardDescription className="text-center">
              {error || "This magic link is invalid or has expired."}
            </CardDescription>
            <CardFooter className="flex flex-col space-y-2 pt-4">
              <Button
                onClick={() => router.push("/login")}
                className="w-full"
              >
                Back to Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/login")}
                className="w-full"
              >
                Request New Magic Link
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
      {status === "success" && (
        <CardContent>
          <div className="text-center text-sm text-muted-foreground">
            Welcome back! You&apos;ll be redirected shortly.
          </div>
        </CardContent>
      )}
    </Card>
  )
}