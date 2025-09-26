"use server"

import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { createId } from "@paralleldrive/cuid2"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { sendEmailVerification } from "./auth-tokens"

export async function registerUser(email: string, password: string, name: string) {
  try {
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email))

    if (existingUser.length > 0) {
      return { error: "User already exists" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user in database with hashed password (emailVerified = null)
    const newUser = await db.insert(users).values({
      id: createId(),
      email,
      name,
      password: hashedPassword,
      emailVerified: null, // Explicitly set to null - user must verify email
    }).returning()

    // Send verification email
    try {
      await sendEmailVerification(email, newUser[0].id)
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError)
      // Don't fail registration if email fails - user can resend later
    }

    return { success: true, user: { id: newUser[0].id, email: newUser[0].email, name: newUser[0].name }, emailSent: true }
  } catch (error) {
    console.error("Registration error:", error)
    return { error: "Failed to register user" }
  }
}