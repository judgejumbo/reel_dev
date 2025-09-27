import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { auditLogger } from "./audit"

// Failed login tracking
interface FailedLoginAttempt {
  email: string
  ip: string
  timestamp: Date
  userAgent?: string
}

// In-memory store for failed attempts (in production, use Redis or database)
const failedAttempts = new Map<string, FailedLoginAttempt[]>()
const accountLockouts = new Map<string, Date>()

// Security configuration
const SECURITY_CONFIG = {
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  ATTEMPT_WINDOW_MINUTES: 10,
  PASSWORD_MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  TOKEN_EXPIRY_MINUTES: 15
}

/**
 * Track failed login attempts
 */
export async function trackFailedLogin(
  email: string,
  ip: string,
  userAgent?: string
): Promise<{
  shouldLockAccount: boolean
  attemptsRemaining: number
  lockoutUntil?: Date
}> {
  const key = `${email}:${ip}`
  const now = new Date()

  // Get or initialize failed attempts for this email/IP combo
  let attempts = failedAttempts.get(key) || []

  // Remove attempts older than the window
  const windowStart = new Date(now.getTime() - SECURITY_CONFIG.ATTEMPT_WINDOW_MINUTES * 60 * 1000)
  attempts = attempts.filter(attempt => attempt.timestamp > windowStart)

  // Add this failed attempt
  attempts.push({
    email,
    ip,
    timestamp: now,
    userAgent
  })

  failedAttempts.set(key, attempts)

  // Check if account should be locked
  const shouldLockAccount = attempts.length >= SECURITY_CONFIG.MAX_FAILED_ATTEMPTS
  const attemptsRemaining = Math.max(0, SECURITY_CONFIG.MAX_FAILED_ATTEMPTS - attempts.length)

  let lockoutUntil: Date | undefined

  if (shouldLockAccount) {
    lockoutUntil = new Date(now.getTime() + SECURITY_CONFIG.LOCKOUT_DURATION_MINUTES * 60 * 1000)
    accountLockouts.set(email, lockoutUntil)

    // Clear failed attempts after lockout
    failedAttempts.delete(key)

    // Audit log
    await auditLogger.logViolation(
      "ACCOUNT_LOCKOUT",
      "LOGIN",
      "user",
      `Account ${email} locked due to ${attempts.length} failed login attempts`,
      undefined,
      undefined,
      undefined,
      {
        email,
        ip,
        userAgent,
        attemptCount: attempts.length,
        lockoutUntil: lockoutUntil.toISOString()
      }
    )
  } else {
    // Audit log for failed attempt
    await auditLogger.logFailure(
      "LOGIN",
      "user",
      `Failed login attempt for ${email}`,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        email,
        ip,
        userAgent,
        attemptNumber: attempts.length,
        attemptsRemaining
      }
    )
  }

  return {
    shouldLockAccount,
    attemptsRemaining,
    lockoutUntil
  }
}

/**
 * Check if account is currently locked
 */
export function isAccountLocked(email: string): {
  isLocked: boolean
  lockoutUntil?: Date
  minutesRemaining?: number
} {
  const lockoutUntil = accountLockouts.get(email)

  if (!lockoutUntil) {
    return { isLocked: false }
  }

  const now = new Date()

  if (now >= lockoutUntil) {
    // Lockout has expired
    accountLockouts.delete(email)
    return { isLocked: false }
  }

  const minutesRemaining = Math.ceil((lockoutUntil.getTime() - now.getTime()) / (60 * 1000))

  return {
    isLocked: true,
    lockoutUntil,
    minutesRemaining
  }
}

/**
 * Clear failed attempts after successful login
 */
export async function clearFailedAttempts(email: string, ip: string): Promise<void> {
  const key = `${email}:${ip}`
  failedAttempts.delete(key)
  accountLockouts.delete(email)

  // Audit log successful login
  await auditLogger.logSuccess(
    undefined,
    "LOGIN",
    "user",
    undefined,
    undefined,
    {
      email,
      ip,
      clearedFailedAttempts: true
    }
  )
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
  score: number
} {
  const errors: string[] = []
  let score = 0

  // Length check
  if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters long`)
  } else {
    score += 1
    if (password.length >= 12) score += 1
  }

  // Uppercase check
  if (SECURITY_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  } else if (/[A-Z]/.test(password)) {
    score += 1
  }

  // Lowercase check
  if (SECURITY_CONFIG.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  } else if (/[a-z]/.test(password)) {
    score += 1
  }

  // Numbers check
  if (SECURITY_CONFIG.REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push("Password must contain at least one number")
  } else if (/\d/.test(password)) {
    score += 1
  }

  // Special characters check
  if (SECURITY_CONFIG.REQUIRE_SPECIAL_CHARS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character")
  } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1
  }

  // Common password patterns
  const commonPatterns = [
    /^password/i,
    /^123/,
    /^qwerty/i,
    /^admin/i,
    /^letmein/i
  ]

  if (commonPatterns.some(pattern => pattern.test(password))) {
    errors.push("Password contains common patterns that are easily guessed")
    score = Math.max(0, score - 2)
  }

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.min(5, score) // Max score of 5
  }
}

/**
 * Enhanced token expiration enforcement
 */
export function isTokenExpired(tokenCreatedAt: Date, expirationMinutes?: number): boolean {
  const now = new Date()
  const expiryMinutes = expirationMinutes || SECURITY_CONFIG.TOKEN_EXPIRY_MINUTES
  const expiryTime = new Date(tokenCreatedAt.getTime() + expiryMinutes * 60 * 1000)

  return now >= expiryTime
}

/**
 * Get security metrics for monitoring
 */
export function getSecurityMetrics(): {
  activeFailedAttempts: number
  activeLockouts: number
  lockoutDetails: Array<{ email: string; lockedUntil: Date }>
} {
  const now = new Date()

  // Clean up expired lockouts
  for (const [email, lockoutUntil] of accountLockouts.entries()) {
    if (now >= lockoutUntil) {
      accountLockouts.delete(email)
    }
  }

  const lockoutDetails = Array.from(accountLockouts.entries()).map(([email, lockedUntil]) => ({
    email,
    lockedUntil
  }))

  return {
    activeFailedAttempts: failedAttempts.size,
    activeLockouts: accountLockouts.size,
    lockoutDetails
  }
}

/**
 * Reset account lockout (admin function)
 */
export async function resetAccountLockout(email: string, adminUserId?: string): Promise<void> {
  accountLockouts.delete(email)

  // Clear any failed attempts for this email
  for (const [key, attempts] of failedAttempts.entries()) {
    if (key.startsWith(`${email}:`)) {
      failedAttempts.delete(key)
    }
  }

  // Audit log
  await auditLogger.logSuccess(
    adminUserId || "system",
    "UNLOCK_ACCOUNT",
    "user",
    undefined,
    undefined,
    {
      unlockedEmail: email,
      adminAction: true
    }
  )
}

export const authHardening = {
  trackFailedLogin,
  isAccountLocked,
  clearFailedAttempts,
  validatePasswordStrength,
  isTokenExpired,
  getSecurityMetrics,
  resetAccountLockout,
  SECURITY_CONFIG
}