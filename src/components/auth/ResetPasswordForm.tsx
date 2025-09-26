"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, CheckCircle, Lock } from "lucide-react"
import { resetPasswordWithToken } from "@/app/actions/auth-tokens"
import { useRouter } from "next/navigation"

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

interface ResetPasswordFormProps {
  token: string
  userId: string
}

export function ResetPasswordForm({ token, userId }: ResetPasswordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const password = watch("password")

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsSubmitting(true)
    setError("")

    try {
      // Reset password with token validation
      await resetPasswordWithToken(token, data.password)

      setSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login?message=password-reset-success")
      }, 3000)

    } catch (error) {
      console.error("Password reset failed:", error)
      setError(
        error instanceof Error
          ? error.message
          : "Failed to reset password. Please try again."
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
            <strong>Password Reset Successful!</strong>
            <br />
            Your password has been updated. Redirecting to sign in...
          </AlertDescription>
        </Alert>

        <div className="text-center">
          <div className="inline-flex items-center text-sm text-gray-600">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redirecting in a few seconds...
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            {...register("password")}
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your new password"
            className="pl-10 pr-10"
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        )}

        {/* Password strength indicator */}
        {password && (
          <div className="text-xs space-y-1">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className={`h-1 w-6 rounded ${password.length >= 6 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                <div className={`h-1 w-6 rounded ${password.length >= 8 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                <div className={`h-1 w-6 rounded ${/[A-Z]/.test(password) ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                <div className={`h-1 w-6 rounded ${/[0-9]/.test(password) ? 'bg-emerald-500' : 'bg-gray-200'}`} />
              </div>
              <span className="text-gray-500">Password strength</span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            {...register("confirmPassword")}
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your new password"
            className="pl-10 pr-10"
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
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
            Updating Password...
          </>
        ) : (
          "Update Password"
        )}
      </Button>

      <div className="text-xs text-gray-500 text-center">
        Your new password will be encrypted and stored securely
      </div>
    </form>
  )
}