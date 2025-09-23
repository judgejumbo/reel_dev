"use server"

import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { createId } from "@paralleldrive/cuid2"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export async function registerUser(email: string, password: string, name: string) {
  try {
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email))

    if (existingUser.length > 0) {
      return { error: "User already exists" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user in database with hashed password
    const newUser = await db.insert(users).values({
      id: createId(),
      email,
      name,
      password: hashedPassword,
    }).returning()

    return { success: true, user: { id: newUser[0].id, email: newUser[0].email, name: newUser[0].name } }
  } catch (error) {
    console.error("Registration error:", error)
    return { error: "Failed to register user" }
  }
}