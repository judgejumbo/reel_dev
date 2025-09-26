"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, CheckCircle } from "lucide-react"
import { requestPasswordReset } from "@/app/actions/auth-tokens"

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string>("")

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsSubmitting(true)
    setError("")

    try {
      await requestPasswordReset(data.email)
      setSuccess(true)
    } catch (error) {
      console.error("Password reset request failed:", error)
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send password reset email. Please try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <Alert className="border-emerald-200 bg-emerald-50">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800">
            <strong>Check your email!</strong>
            <br />
            We've sent a password reset link to{" "}
            <span className="font-medium">{getValues("email")}</span>
          </AlertDescription>
        </Alert>

        <div className="text-sm text-gray-600 space-y-2">
          <p>• Click the link in your email to reset your password</p>
          <p>• The link will expire in 1 hour for security</p>
          <p>• Check your spam folder if you don't see it</p>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setSuccess(false)
            setError("")
          }}
        >
          Send Another Reset Link
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            {...register("email")}
            id="email"
            type="email"
            placeholder="Enter your email address"
            className="pl-10"
            disabled={isSubmitting}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending Reset Link...
          </>
        ) : (
          "Send Reset Link"
        )}
      </Button>

      <div className="text-xs text-gray-500 text-center">
        We'll email you a secure link to reset your password
      </div>
    </form>
  )
}