import { db } from "@/lib/db"
import {
  videoUploads,
  processingJobs,
  userSubscriptions,
  usageTracking,
  clipSettings
} from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { auditLogger } from "./audit"
import { SecureResourceType } from "./types"

// Cache for ownership verification results
interface OwnershipCacheEntry {
  isOwner: boolean
  timestamp: number
  ttl: number
}

const ownershipCache = new Map<string, OwnershipCacheEntry>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Clear expired cache entries
 */
function cleanupOwnershipCache(): void {
  const now = Date.now()
  for (const [key, entry] of ownershipCache.entries()) {
    if (now > entry.timestamp + entry.ttl) {
      ownershipCache.delete(key)
    }
  }
}

/**
 * Generate cache key for ownership check
 */
function getCacheKey(userId: string, resourceType: SecureResourceType, resourceId: string): string {
  return `${userId}:${resourceType}:${resourceId}`
}

/**
 * Get ownership result from cache or return null if not cached/expired
 */
function getCachedOwnership(userId: string, resourceType: SecureResourceType, resourceId: string): boolean | null {
  const key = getCacheKey(userId, resourceType, resourceId)
  const entry = ownershipCache.get(key)

  if (!entry) return null

  const now = Date.now()
  if (now > entry.timestamp + entry.ttl) {
    ownershipCache.delete(key)
    return null
  }

  return entry.isOwner
}

/**
 * Cache ownership result
 */
function cacheOwnership(
  userId: string,
  resourceType: SecureResourceType,
  resourceId: string,
  isOwner: boolean,
  customTtl?: number
): void {
  const key = getCacheKey(userId, resourceType, resourceId)
  ownershipCache.set(key, {
    isOwner,
    timestamp: Date.now(),
    ttl: customTtl || CACHE_TTL
  })
}

/**
 * Verify video ownership
 */
export async function verifyVideoOwnership(
  userId: string,
  videoId: string,
  options?: { useCache?: boolean; requestId?: string }
): Promise<boolean> {
  const { useCache = true, requestId } = options || {}

  try {
    // Check cache first
    if (useCache) {
      const cached = getCachedOwnership(userId, 'video', videoId)
      if (cached !== null) {
        return cached
      }
    }

    // Query database
    const result = await db
      .select({ id: videoUploads.id })
      .from(videoUploads)
      .where(
        and(
          eq(videoUploads.id, videoId),
          eq(videoUploads.userId, userId)
        )
      )
      .limit(1)

    const isOwner = result.length > 0

    // Cache result
    if (useCache) {
      cacheOwnership(userId, 'video', videoId, isOwner)
    }

    // Audit log for ownership verification
    if (isOwner) {
      await auditLogger.logSuccess(
        userId,
        "READ",
        "video",
        videoId,
        requestId,
        { operation: 'verifyVideoOwnership', cached: false }
      )
    } else {
      await auditLogger.logViolation(
        "OWNERSHIP_VIOLATION",
        "READ",
        "video",
        `User ${userId} attempted to verify ownership of video ${videoId} - access denied`,
        userId,
        videoId,
        requestId
      )
    }

    return isOwner

  } catch (error) {
    await auditLogger.logFailure(
      "READ",
      "video",
      error instanceof Error ? error.message : "Ownership verification failed",
      userId,
      videoId,
      undefined,
      requestId
    )
    return false
  }
}

/**
 * Verify processing job ownership
 */
export async function verifyJobOwnership(
  userId: string,
  jobId: string,
  options?: { useCache?: boolean; requestId?: string }
): Promise<boolean> {
  const { useCache = true, requestId } = options || {}

  try {
    // Check cache first
    if (useCache) {
      const cached = getCachedOwnership(userId, 'job', jobId)
      if (cached !== null) {
        return cached
      }
    }

    // Query database
    const result = await db
      .select({ id: processingJobs.id })
      .from(processingJobs)
      .where(
        and(
          eq(processingJobs.id, jobId),
          eq(processingJobs.userId, userId)
        )
      )
      .limit(1)

    const isOwner = result.length > 0

    // Cache result
    if (useCache) {
      cacheOwnership(userId, 'job', jobId, isOwner)
    }

    // Audit log
    if (isOwner) {
      await auditLogger.logSuccess(
        userId,
        "READ",
        "job",
        jobId,
        requestId,
        { operation: 'verifyJobOwnership', cached: false }
      )
    } else {
      await auditLogger.logViolation(
        "OWNERSHIP_VIOLATION",
        "READ",
        "job",
        `User ${userId} attempted to verify ownership of job ${jobId} - access denied`,
        userId,
        jobId,
        requestId
      )
    }

    return isOwner

  } catch (error) {
    await auditLogger.logFailure(
      "READ",
      "job",
      error instanceof Error ? error.message : "Job ownership verification failed",
      userId,
      jobId,
      undefined,
      requestId
    )
    return false
  }
}

/**
 * Verify subscription ownership
 */
export async function verifySubscriptionOwnership(
  userId: string,
  subscriptionId: string,
  options?: { useCache?: boolean; requestId?: string }
): Promise<boolean> {
  const { useCache = true, requestId } = options || {}

  try {
    // Check cache first
    if (useCache) {
      const cached = getCachedOwnership(userId, 'subscription', subscriptionId)
      if (cached !== null) {
        return cached
      }
    }

    // Query database
    const result = await db
      .select({ id: userSubscriptions.id })
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.id, subscriptionId),
          eq(userSubscriptions.userId, userId)
        )
      )
      .limit(1)

    const isOwner = result.length > 0

    // Cache result
    if (useCache) {
      cacheOwnership(userId, 'subscription', subscriptionId, isOwner)
    }

    // Audit log
    if (isOwner) {
      await auditLogger.logSuccess(
        userId,
        "READ",
        "subscription",
        subscriptionId,
        requestId,
        { operation: 'verifySubscriptionOwnership', cached: false }
      )
    } else {
      await auditLogger.logViolation(
        "OWNERSHIP_VIOLATION",
        "READ",
        "subscription",
        `User ${userId} attempted to verify ownership of subscription ${subscriptionId} - access denied`,
        userId,
        subscriptionId,
        requestId
      )
    }

    return isOwner

  } catch (error) {
    await auditLogger.logFailure(
      "READ",
      "subscription",
      error instanceof Error ? error.message : "Subscription ownership verification failed",
      userId,
      subscriptionId,
      undefined,
      requestId
    )
    return false
  }
}

/**
 * Verify usage tracking record ownership
 */
export async function verifyUsageOwnership(
  userId: string,
  usageId: string,
  options?: { useCache?: boolean; requestId?: string }
): Promise<boolean> {
  const { useCache = true, requestId } = options || {}

  try {
    // Check cache first
    if (useCache) {
      const cached = getCachedOwnership(userId, 'usage', usageId)
      if (cached !== null) {
        return cached
      }
    }

    // Query database
    const result = await db
      .select({ id: usageTracking.id })
      .from(usageTracking)
      .where(
        and(
          eq(usageTracking.id, usageId),
          eq(usageTracking.userId, userId)
        )
      )
      .limit(1)

    const isOwner = result.length > 0

    // Cache result
    if (useCache) {
      cacheOwnership(userId, 'usage', usageId, isOwner)
    }

    return isOwner

  } catch (error) {
    await auditLogger.logFailure(
      "READ",
      "usage",
      error instanceof Error ? error.message : "Usage ownership verification failed",
      userId,
      usageId,
      undefined,
      requestId
    )
    return false
  }
}

/**
 * Generic resource ownership verification
 */
export async function verifyResourceOwnership(
  userId: string,
  resourceType: SecureResourceType,
  resourceId: string,
  options?: { useCache?: boolean; requestId?: string }
): Promise<boolean> {
  switch (resourceType) {
    case 'video':
      return verifyVideoOwnership(userId, resourceId, options)
    case 'job':
      return verifyJobOwnership(userId, resourceId, options)
    case 'subscription':
      return verifySubscriptionOwnership(userId, resourceId, options)
    case 'usage':
      return verifyUsageOwnership(userId, resourceId, options)
    case 'settings':
      // For clip settings, verify through video ownership
      return verifyClipSettingsOwnership(userId, resourceId, options)
    default:
      throw new Error(`Unsupported resource type: ${resourceType}`)
  }
}

/**
 * Verify clip settings ownership (through associated video)
 */
export async function verifyClipSettingsOwnership(
  userId: string,
  settingsId: string,
  options?: { useCache?: boolean; requestId?: string }
): Promise<boolean> {
  const { useCache = true, requestId } = options || {}

  try {
    // Check cache first
    if (useCache) {
      const cached = getCachedOwnership(userId, 'settings', settingsId)
      if (cached !== null) {
        return cached
      }
    }

    // Query clip settings to get video ID, then verify video ownership
    const clipResult = await db
      .select({
        id: clipSettings.id,
        videoUploadId: clipSettings.videoUploadId
      })
      .from(clipSettings)
      .where(eq(clipSettings.id, settingsId))
      .limit(1)

    if (clipResult.length === 0) {
      return false
    }

    const { videoUploadId } = clipResult[0]

    // Verify video ownership
    const isOwner = await verifyVideoOwnership(userId, videoUploadId, {
      useCache,
      requestId
    })

    // Cache result
    if (useCache) {
      cacheOwnership(userId, 'settings', settingsId, isOwner)
    }

    return isOwner

  } catch (error) {
    await auditLogger.logFailure(
      "READ",
      "settings",
      error instanceof Error ? error.message : "Clip settings ownership verification failed",
      userId,
      settingsId,
      undefined,
      requestId
    )
    return false
  }
}

/**
 * Bulk ownership verification for multiple resources of the same type
 */
export async function verifyBulkOwnership(
  userId: string,
  resourceType: SecureResourceType,
  resourceIds: string[],
  options?: { useCache?: boolean; requestId?: string }
): Promise<{ ownedIds: string[]; unauthorizedIds: string[] }> {
  const { useCache = true, requestId } = options || {}
  const ownedIds: string[] = []
  const unauthorizedIds: string[] = []

  // Process in parallel for performance
  const results = await Promise.allSettled(
    resourceIds.map(id =>
      verifyResourceOwnership(userId, resourceType, id, { useCache, requestId })
    )
  )

  results.forEach((result, index) => {
    const resourceId = resourceIds[index]
    if (result.status === 'fulfilled' && result.value) {
      ownedIds.push(resourceId)
    } else {
      unauthorizedIds.push(resourceId)
    }
  })

  // Audit log for bulk operation
  await auditLogger.logSuccess(
    userId,
    "READ",
    resourceType,
    undefined,
    requestId,
    {
      operation: 'verifyBulkOwnership',
      totalRequested: resourceIds.length,
      ownedCount: ownedIds.length,
      unauthorizedCount: unauthorizedIds.length
    }
  )

  return { ownedIds, unauthorizedIds }
}

/**
 * Clear ownership cache for a specific user (useful after permission changes)
 */
export function clearUserOwnershipCache(userId: string): void {
  const keysToDelete: string[] = []

  for (const key of ownershipCache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      keysToDelete.push(key)
    }
  }

  keysToDelete.forEach(key => ownershipCache.delete(key))
}

/**
 * Clear ownership cache for a specific resource (useful after resource deletion)
 */
export function clearResourceOwnershipCache(resourceType: SecureResourceType, resourceId: string): void {
  const keysToDelete: string[] = []

  for (const key of ownershipCache.keys()) {
    if (key.endsWith(`:${resourceType}:${resourceId}`)) {
      keysToDelete.push(key)
    }
  }

  keysToDelete.forEach(key => ownershipCache.delete(key))
}

/**
 * Get ownership cache statistics
 */
export function getOwnershipCacheStats(): {
  size: number
  hitRate: number
  entries: Array<{ key: string; isOwner: boolean; age: number }>
} {
  const now = Date.now()
  const entries = Array.from(ownershipCache.entries()).map(([key, entry]) => ({
    key,
    isOwner: entry.isOwner,
    age: now - entry.timestamp
  }))

  return {
    size: ownershipCache.size,
    hitRate: 0, // TODO: Implement hit rate tracking
    entries: entries.slice(0, 10) // Show first 10 entries
  }
}

// Periodic cleanup every 10 minutes
if (typeof window === "undefined") {
  setInterval(() => {
    cleanupOwnershipCache()
  }, 10 * 60 * 1000)
}

// Export commonly used functions
export const ownership = {
  verifyVideo: verifyVideoOwnership,
  verifyJob: verifyJobOwnership,
  verifySubscription: verifySubscriptionOwnership,
  verifyUsage: verifyUsageOwnership,
  verifyClipSettings: verifyClipSettingsOwnership,
  verifyResource: verifyResourceOwnership,
  verifyBulk: verifyBulkOwnership,
  clearUserCache: clearUserOwnershipCache,
  clearResourceCache: clearResourceOwnershipCache,
  getCacheStats: getOwnershipCacheStats,
}