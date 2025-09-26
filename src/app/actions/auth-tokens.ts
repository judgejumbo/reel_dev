"use server"

import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { createAuthToken, generateTokenUrls } from "@/lib/tokens"
import { sendPasswordResetEmail, sendMagicLinkEmail, sendEmailVerificationEmail } from "@/lib/email"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

// Simple in-memory rate limiting for development
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function isRateLimited(email: string): boolean {
  const now = Date.now()
  const key = email.toLowerCase()
  const limit = rateLimitMap.get(key)

  // Reset if time window has passed
  if (limit && now > limit.resetTime) {
    rateLimitMap.delete(key)
  }

  const currentLimit = rateLimitMap.get(key)
  if (!currentLimit) {
    // First request in this window
    rateLimitMap.set(key, { count: 1, resetTime: now + 60 * 60 * 1000 }) // 1 hour window
    return false
  }

  if (currentLimit.count >= 3) {
    // Max 3 requests per hour
    return true
  }

  currentLimit.count++
  return false
}

/**
 * Request password reset - sends email with reset link
 */
export async function requestPasswordReset(email: string) {
  try {
    // Find user by email
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    const user = userResults[0]

    // Always return success (security: don't reveal if email exists)
    // But only send email if user actually exists
    if (user) {
      // Generate password reset token
      const token = await createAuthToken(user.id, "PASSWORD_RESET")

      // Generate reset URL
      const resetUrl = generateTokenUrls(token, "PASSWORD_RESET")

      // Send password reset email
      await sendPasswordResetEmail(email, resetUrl)

      console.log(`Password reset email sent to ${email}`)
    } else {
      console.log(`Password reset requested for non-existent email: ${email}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Password reset request failed:", error)
    throw new Error("Failed to process password reset request")
  }
}

/**
 * Request magic link - sends email with login link
 */
export async function requestMagicLink(email: string) {
  try {
    // Check rate limiting
    if (isRateLimited(email)) {
      throw new Error("Too many requests. Please wait an hour before requesting another magic link.")
    }

    // Find user by email
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    const user = userResults[0]

    if (!user) {
      throw new Error("No account found with that email address")
    }

    // Generate magic link token
    const token = await createAuthToken(user.id, "MAGIC_LINK")

    // Generate magic link URL
    const magicUrl = generateTokenUrls(token, "MAGIC_LINK")

    // Send magic link email
    await sendMagicLinkEmail(email, magicUrl)

    console.log(`Magic link sent to ${email}`)

    return { success: true }
  } catch (error) {
    console.error("Magic link request failed:", error)
    throw error
  }
}

/**
 * Send email verification - sends email with verification link
 */
export async function sendEmailVerification(email: string, userId: string) {
  try {
    // Generate email verification token
    const token = await createAuthToken(userId, "EMAIL_VERIFY")

    // Generate verification URL
    const verifyUrl = generateTokenUrls(token, "EMAIL_VERIFY")

    // Send verification email
    await sendEmailVerificationEmail(email, verifyUrl)

    console.log(`Email verification sent to ${email}`)

    return { success: true }
  } catch (error) {
    console.error("Email verification send failed:", error)
    throw new Error("Failed to send verification email")
  }
}

/**
 * Resend email verification for current user
 */
export async function resendEmailVerification(userId: string) {
  try {
    // Get user details
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const user = userResults[0]

    if (!user) {
      throw new Error("User not found")
    }

    if (user.emailVerified) {
      throw new Error("Email is already verified")
    }

    // Send verification email
    await sendEmailVerification(user.email, userId)

    return { success: true }
  } catch (error) {
    console.error("Resend email verification failed:", error)
    throw error
  }
}

/**
 * Update user password (for password reset)
 */
export async function updatePassword(userId: string, newPassword: string) {
  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update user's password
    await db
      .update(users)
      .set({
        password: hashedPassword,
        // Don't update emailVerified here - that's separate
      })
      .where(eq(users.id, userId))

    console.log(`Password updated for user ${userId}`)

    // Revalidate relevant paths
    revalidatePath("/settings")
    revalidatePath("/login")

    return { success: true }
  } catch (error) {
    console.error("Password update failed:", error)
    throw new Error("Failed to update password")
  }
}

/**
 * Verify email address
 */
export async function verifyEmail(userId: string) {
  try {
    // Mark email as verified
    await db
      .update(users)
      .set({
        emailVerified: new Date(),
      })
      .where(eq(users.id, userId))

    console.log(`Email verified for user ${userId}`)

    // Revalidate relevant paths
    revalidatePath("/dashboard")
    revalidatePath("/settings")

    return { success: true }
  } catch (error) {
    console.error("Email verification failed:", error)
    throw new Error("Failed to verify email")
  }
}

/**
 * Reset password with token validation (client-side wrapper)
 */
export async function resetPasswordWithToken(token: string, newPassword: string) {
  try {
    // Import here to avoid server/client issues
    const { validateAndConsumeToken } = await import("@/lib/tokens")

    // Validate and consume the token
    const tokenData = await validateAndConsumeToken(token, "PASSWORD_RESET")

    if (!tokenData) {
      throw new Error("Invalid or expired reset link")
    }

    // Update the password
    await updatePassword(tokenData.userId, newPassword)

    return { success: true, userId: tokenData.userId }
  } catch (error) {
    console.error("Password reset with token failed:", error)
    throw error
  }
}