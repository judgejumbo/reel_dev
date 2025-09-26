import { NextRequest, NextResponse } from "next/server"
import { validateAndConsumeToken } from "@/lib/tokens"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      )
    }

    // Validate and consume the email verification token
    const tokenData = await validateAndConsumeToken(token, "EMAIL_VERIFY")

    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or expired verification link" },
        { status: 401 }
      )
    }

    // Get the user associated with this token
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.id, tokenData.userId))
      .limit(1)

    const user = userResults[0]

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Return user info for the verification process
    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
    })

  } catch (error) {
    console.error("Email verification API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}