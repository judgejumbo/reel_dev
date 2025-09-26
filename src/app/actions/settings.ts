"use server"

import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { sendEmailVerification } from "./auth-tokens"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

/**
 * Change user password - requires current password verification
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { error: "Not authenticated" }
    }

    // Validate inputs
    if (newPassword !== confirmPassword) {
      return { error: "New passwords do not match" }
    }

    if (newPassword.length < 8) {
      return { error: "New password must be at least 8 characters long" }
    }

    // Get current user
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (userResults.length === 0) {
      return { error: "User not found" }
    }

    const user = userResults[0]

    // Verify current password
    if (!user.password) {
      return { error: "No password set for this account" }
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return { error: "Current password is incorrect" }
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    // Update password and passwordChangedAt
    await db
      .update(users)
      .set({
        password: hashedNewPassword,
        passwordChangedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))

    revalidatePath("/settings")
    return { success: true, message: "Password updated successfully" }
  } catch (error) {
    console.error("Password change error:", error)
    return { error: "Failed to change password" }
  }
}

/**
 * Update user profile information (name)
 */
export async function updateProfile(name: string) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { error: "Not authenticated" }
    }

    if (!name.trim()) {
      return { error: "Name is required" }
    }

    // Update user name
    await db
      .update(users)
      .set({ name: name.trim() })
      .where(eq(users.id, session.user.id))

    revalidatePath("/settings")
    return { success: true, message: "Profile updated successfully" }
  } catch (error) {
    console.error("Profile update error:", error)
    return { error: "Failed to update profile" }
  }
}

/**
 * Request email change - sends verification to new email
 */
export async function requestEmailChange(newEmail: string, currentPassword: string) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { error: "Not authenticated" }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      return { error: "Invalid email address" }
    }

    // Get current user
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (userResults.length === 0) {
      return { error: "User not found" }
    }

    const user = userResults[0]

    // Verify current password
    if (user.password) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
      if (!isPasswordValid) {
        return { error: "Current password is incorrect" }
      }
    }

    // Check if new email already exists
    const existingEmailUser = await db
      .select()
      .from(users)
      .where(eq(users.email, newEmail))
      .limit(1)

    if (existingEmailUser.length > 0) {
      return { error: "Email address is already in use" }
    }

    // Send verification email to new address
    // Note: This would normally store a pending email change token
    // For now, we'll use the existing email verification system
    try {
      await sendEmailVerification(newEmail, session.user.id)
      return {
        success: true,
        message: `Verification email sent to ${newEmail}. Please verify to complete the email change.`
      }
    } catch (emailError) {
      console.error("Email send error:", emailError)
      return { error: "Failed to send verification email" }
    }
  } catch (error) {
    console.error("Email change error:", error)
    return { error: "Failed to request email change" }
  }
}

/**
 * Resend email verification
 */
export async function resendEmailVerification() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { error: "Not authenticated" }
    }

    if (!session.user.email) {
      return { error: "No email address found" }
    }

    // Check if already verified
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (userResults.length === 0) {
      return { error: "User not found" }
    }

    const user = userResults[0]
    if (user.emailVerified) {
      return { error: "Email is already verified" }
    }

    // Send verification email
    try {
      await sendEmailVerification(session.user.email, session.user.id)
      return { success: true, message: "Verification email sent successfully" }
    } catch (emailError) {
      console.error("Email send error:", emailError)
      return { error: "Failed to send verification email" }
    }
  } catch (error) {
    console.error("Email verification resend error:", error)
    return { error: "Failed to resend verification email" }
  }
}