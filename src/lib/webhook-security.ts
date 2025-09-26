import crypto from "crypto"
import { NextRequest } from "next/server"

/**
 * HMAC-based webhook signature verification for N8N integration
 * This provides secure authentication for webhook endpoints
 */

const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET
const SIGNATURE_HEADER = "x-n8n-signature" // Standard header for N8N signatures
const TIMESTAMP_HEADER = "x-timestamp"
const MAX_TIMESTAMP_AGE = 5 * 60 * 1000 // 5 minutes in milliseconds

// Allowed origins for webhook requests (N8N server domains)
const ALLOWED_WEBHOOK_ORIGINS = [
  "https://n8n.srv888156.hstgr.cloud", // Production N8N server
  "http://localhost:5678", // Local N8N development
  "http://localhost:3000", // Local development (for testing)
  "https://localhost:3000", // Local HTTPS testing
]

if (!WEBHOOK_SECRET) {
  console.warn("⚠️  N8N_WEBHOOK_SECRET not configured - webhook security disabled")
}

/**
 * Generate HMAC signature for outgoing webhook requests to N8N
 */
export function generateWebhookSignature(payload: string, timestamp?: string): string {
  if (!WEBHOOK_SECRET) {
    throw new Error("N8N_WEBHOOK_SECRET not configured")
  }

  const ts = timestamp || Date.now().toString()
  const signaturePayload = `${ts}.${payload}`

  return crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(signaturePayload, "utf8")
    .digest("hex")
}

/**
 * Verify request origin for webhook security
 */
export function verifyWebhookOrigin(request: NextRequest): {
  isValid: boolean
  error?: string
} {
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")
  const userAgent = request.headers.get("user-agent") || ""

  // Check origin header first
  if (origin && ALLOWED_WEBHOOK_ORIGINS.includes(origin)) {
    return { isValid: true }
  }

  // Check referer header as fallback
  if (referer) {
    const refererOrigin = new URL(referer).origin
    if (ALLOWED_WEBHOOK_ORIGINS.includes(refererOrigin)) {
      return { isValid: true }
    }
  }

  // Allow requests from N8N user agents (additional security layer)
  if (userAgent.includes("n8n") || userAgent.includes("N8N") || userAgent.startsWith("axios/")) {
    return { isValid: true }
  }

  // Allow requests from known N8N server IPs (fallback)
  // N8N often makes requests without proper origin headers
  if (!origin && !referer && userAgent.startsWith("axios/")) {
    return { isValid: true }
  }

  return {
    isValid: false,
    error: `Invalid webhook origin. Origin: ${origin}, Referer: ${referer}, User-Agent: ${userAgent}`
  }
}

/**
 * Verify HMAC signature for incoming webhook requests from N8N
 */
export async function verifyWebhookSignature(request: NextRequest): Promise<{
  isValid: boolean
  error?: string
  body?: any
}> {
  try {
    // Verify origin first
    const originCheck = verifyWebhookOrigin(request)
    if (!originCheck.isValid) {
      return {
        isValid: false,
        error: `Origin validation failed: ${originCheck.error}`
      }
    }

    // If no webhook secret is configured, allow request (for development)
    if (!WEBHOOK_SECRET) {
      console.warn("⚠️  Webhook signature verification skipped - N8N_WEBHOOK_SECRET not configured")
      const body = await request.json()
      return { isValid: true, body }
    }

    // Check for API key authentication (for N8N)
    const apiKey = request.headers.get('x-api-key')
    if (apiKey === WEBHOOK_SECRET) {
      const body = await request.json()

      // Validate timestamp for replay attack prevention
      const timestamp = request.headers.get('x-timestamp')
      if (timestamp) {
        const timestampMs = parseInt(timestamp)
        const age = Math.abs(Date.now() - timestampMs)
        if (age > MAX_TIMESTAMP_AGE) {
          return {
            isValid: false,
            error: `Request too old: ${age}ms (max: ${MAX_TIMESTAMP_AGE}ms)`
          }
        }
      }

      console.log("✅ API key authentication successful")
      return { isValid: true, body }
    }

    // Get signature from headers
    const signature = request.headers.get(SIGNATURE_HEADER)
    const timestamp = request.headers.get(TIMESTAMP_HEADER) || Date.now().toString()

    if (!signature) {
      return {
        isValid: false,
        error: `Missing authentication: No API key or signature provided`
      }
    }

    // Validate timestamp to prevent replay attacks
    const timestampMs = parseInt(timestamp)
    const now = Date.now()
    const age = Math.abs(now - timestampMs)

    if (age > MAX_TIMESTAMP_AGE) {
      return {
        isValid: false,
        error: `Request too old: ${age}ms (max: ${MAX_TIMESTAMP_AGE}ms)`
      }
    }

    // Get request body
    const body = await request.json()
    const payload = JSON.stringify(body)

    // Generate expected signature
    const expectedSignature = generateWebhookSignature(payload, timestamp)

    // Compare signatures using timing-safe comparison
    const providedSignature = signature.startsWith("sha256=")
      ? signature.slice(7)
      : signature

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(providedSignature, "hex")
    )

    if (!isValid) {
      return {
        isValid: false,
        error: "Invalid signature"
      }
    }

    return { isValid: true, body }

  } catch (error) {
    return {
      isValid: false,
      error: `Signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Middleware wrapper for webhook signature verification
 */
export function withWebhookAuth<T>(
  handler: (request: NextRequest, body: any) => Promise<T>
) {
  return async (request: NextRequest): Promise<T | Response> => {
    const verification = await verifyWebhookSignature(request)

    if (!verification.isValid) {
      console.error("🚨 Webhook authentication failed:", verification.error)
      return new Response(
        JSON.stringify({ error: "Webhook authentication failed" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    return handler(request, verification.body)
  }
}

/**
 * Rate limiting for webhook endpoints
 */
const webhookRateLimit = new Map<string, { count: number; resetTime: number }>()

export function checkWebhookRateLimit(identifier: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now()
  const key = `webhook_${identifier}`
  const limit = webhookRateLimit.get(key)

  // Reset if time window has passed
  if (limit && now > limit.resetTime) {
    webhookRateLimit.delete(key)
  }

  const currentLimit = webhookRateLimit.get(key)
  if (!currentLimit) {
    // First request in this window
    webhookRateLimit.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (currentLimit.count >= maxRequests) {
    return false // Rate limited
  }

  currentLimit.count++
  return true
}