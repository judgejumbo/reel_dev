import { randomBytes, createHash } from "crypto"
import { db } from "./db"
import { authTokens } from "./schema"
import { eq, and, gte, isNull } from "drizzle-orm"
import type { AuthToken, NewAuthToken } from "./schema"

export type TokenType = "PASSWORD_RESET" | "MAGIC_LINK" | "EMAIL_VERIFY"

// Token expiration times (in minutes)
const TOKEN_EXPIRY = {
  PASSWORD_RESET: 60, // 1 hour
  MAGIC_LINK: 15,     // 15 minutes
  EMAIL_VERIFY: 1440, // 24 hours
} as const

/**
 * Generate a secure random token
 */
function generateSecureToken(): string {
  return randomBytes(32).toString("hex") // 64 character hex string
}

/**
 * Hash a token for secure storage
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

/**
 * Generate expiration timestamp
 */
function getTokenExpiry(type: TokenType): Date {
  const expiryMinutes = TOKEN_EXPIRY[type]
  const expiry = new Date()
  expiry.setMinutes(expiry.getMinutes() + expiryMinutes)
  return expiry
}

/**
 * Create a new auth token
 */
export async function createAuthToken(userId: string, type: TokenType): Promise<string> {
  // Generate the raw token (this is what we'll send in the email)
  const rawToken = generateSecureToken()

  // Hash the token for database storage
  const hashedToken = hashToken(rawToken)

  // Calculate expiration
  const expires = getTokenExpiry(type)

  try {
    // Insert the hashed token into database
    await db.insert(authTokens).values({
      userId,
      token: hashedToken,
      type,
      expires,
    })

    // Return the raw token (to be sent in email)
    return rawToken
  } catch (error) {
    console.error("Error creating auth token:", error)
    throw new Error("Failed to create authentication token")
  }
}

/**
 * Validate and consume an auth token
 */
export async function validateAndConsumeToken(rawToken: string, type: TokenType): Promise<AuthToken | null> {
  // Hash the provided token to match database
  const hashedToken = hashToken(rawToken)

  try {
    // Find unused, non-expired token
    const tokenResults = await db
      .select()
      .from(authTokens)
      .where(
        and(
          eq(authTokens.token, hashedToken),
          eq(authTokens.type, type),
          gte(authTokens.expires, new Date()), // Not expired
          isNull(authTokens.usedAt) // Not used
        )
      )
      .limit(1)

    const token = tokenResults[0]

    if (!token) {
      return null // Token not found, expired, or already used
    }

    // Mark token as used
    await db
      .update(authTokens)
      .set({ usedAt: new Date() })
      .where(eq(authTokens.id, token.id))

    return token
  } catch (error) {
    console.error("Error validating token:", error)
    throw new Error("Failed to validate authentication token")
  }
}

/**
 * Validate a token without consuming it (for checking if it's valid)
 */
export async function validateToken(rawToken: string, type: TokenType): Promise<AuthToken | null> {
  const hashedToken = hashToken(rawToken)

  try {
    const tokenResults = await db
      .select()
      .from(authTokens)
      .where(
        and(
          eq(authTokens.token, hashedToken),
          eq(authTokens.type, type),
          gte(authTokens.expires, new Date()), // Not expired
          isNull(authTokens.usedAt) // Not used
        )
      )
      .limit(1)

    return tokenResults[0] || null
  } catch (error) {
    console.error("Error validating token:", error)
    return null
  }
}

/**
 * Invalidate all tokens of a specific type for a user
 */
export async function invalidateUserTokens(userId: string, type: TokenType): Promise<void> {
  try {
    await db
      .update(authTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(authTokens.userId, userId),
          eq(authTokens.type, type),
          eq(authTokens.usedAt, null) // Only unused tokens
        )
      )
  } catch (error) {
    console.error("Error invalidating user tokens:", error)
    throw new Error("Failed to invalidate tokens")
  }
}

/**
 * Clean up expired tokens (should be run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const result = await db
      .delete(authTokens)
      .where(
        and(
          gte(new Date(), authTokens.expires) // Expired tokens
        )
      )

    console.log(`Cleaned up expired tokens`)
    return 0 // Drizzle doesn't return affected rows count for delete
  } catch (error) {
    console.error("Error cleaning up expired tokens:", error)
    throw new Error("Failed to cleanup expired tokens")
  }
}

/**
 * Get token expiry information for display
 */
export function getTokenExpiryInfo(type: TokenType) {
  const expiryMinutes = TOKEN_EXPIRY[type]

  if (expiryMinutes < 60) {
    return `${expiryMinutes} minutes`
  } else if (expiryMinutes < 1440) {
    return `${Math.floor(expiryMinutes / 60)} hours`
  } else {
    return `${Math.floor(expiryMinutes / 1440)} days`
  }
}

/**
 * Generate URLs for different token types
 */
export function generateTokenUrls(token: string, type: TokenType) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

  const urls = {
    PASSWORD_RESET: `${baseUrl}/reset-password/${token}`,
    MAGIC_LINK: `${baseUrl}/auth/magic/${token}`,
    EMAIL_VERIFY: `${baseUrl}/verify-email/${token}`,
  }

  return urls[type]
}