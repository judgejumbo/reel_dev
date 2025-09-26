import {
  SecureResourceType,
  SecurityOperation,
  PermissionLevel,
  AccessControlResult,
  UserRole,
  SecurityPolicy
} from "./types"
import {
  getPermissionLevel,
  isOperationAllowed,
  getRequiredAccessLevel,
  RESOURCE_ACCESS_CONFIG,
  DEFAULT_SECURITY_POLICIES
} from "./permissions"
import {
  verifyResourceOwnership,
  verifyVideoOwnership,
  verifyJobOwnership,
  verifySubscriptionOwnership
} from "./ownership"
import { auditLogger } from "./audit"

// Permission cache for performance optimization
interface PermissionCacheEntry {
  result: AccessControlResult
  timestamp: number
  ttl: number
}

const permissionCache = new Map<string, PermissionCacheEntry>()
const PERMISSION_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Generate cache key for permission check
 */
function getPermissionCacheKey(
  userId: string,
  operation: SecurityOperation,
  resourceType: SecureResourceType,
  resourceId?: string
): string {
  return `${userId}:${operation}:${resourceType}:${resourceId || 'general'}`
}

/**
 * Get cached permission result
 */
function getCachedPermission(
  userId: string,
  operation: SecurityOperation,
  resourceType: SecureResourceType,
  resourceId?: string
): AccessControlResult | null {
  const key = getPermissionCacheKey(userId, operation, resourceType, resourceId)
  const entry = permissionCache.get(key)

  if (!entry) return null

  const now = Date.now()
  if (now > entry.timestamp + entry.ttl) {
    permissionCache.delete(key)
    return null
  }

  return entry.result
}

/**
 * Cache permission result
 */
function cachePermission(
  userId: string,
  operation: SecurityOperation,
  resourceType: SecureResourceType,
  result: AccessControlResult,
  resourceId?: string,
  customTtl?: number
): void {
  const key = getPermissionCacheKey(userId, operation, resourceType, resourceId)
  permissionCache.set(key, {
    result,
    timestamp: Date.now(),
    ttl: customTtl || PERMISSION_CACHE_TTL
  })
}

/**
 * Check if user can access a specific video
 */
export async function canUserAccessVideo(
  userId: string,
  videoId: string,
  operation: SecurityOperation = "READ",
  options?: {
    userRole?: UserRole
    useCache?: boolean
    requestId?: string
  }
): Promise<AccessControlResult> {
  const { userRole = "user", useCache = true, requestId } = options || {}

  try {
    // Check cache first
    if (useCache) {
      const cached = getCachedPermission(userId, operation, "video", videoId)
      if (cached) {
        return cached
      }
    }

    // Get base permission level for user role
    const basePermission = getPermissionLevel(userRole, "video", operation)

    // If operation is completely denied by role
    if (!isOperationAllowed(basePermission, operation)) {
      const result: AccessControlResult = {
        allowed: false,
        permission: "DENIED",
        reason: `Operation ${operation} not allowed for role ${userRole}`,
        violations: ["INSUFFICIENT_PERMISSIONS"]
      }

      if (useCache) {
        cachePermission(userId, operation, "video", result, videoId)
      }

      await auditLogger.logViolation(
        "UNAUTHORIZED_ACCESS",
        operation,
        "video",
        `User ${userId} with role ${userRole} attempted ${operation} on video ${videoId} - insufficient permissions`,
        userId,
        videoId,
        requestId
      )

      return result
    }

    // For ownership-required operations, verify ownership
    const requiresOwnership = RESOURCE_ACCESS_CONFIG.video.operations[operation] === "owner"

    if (requiresOwnership || userRole === "user") {
      const isOwner = await verifyVideoOwnership(userId, videoId, { useCache, requestId })

      if (!isOwner) {
        const result: AccessControlResult = {
          allowed: false,
          permission: "DENIED",
          reason: `User does not own video ${videoId}`,
          violations: ["OWNERSHIP_VIOLATION"]
        }

        if (useCache) {
          cachePermission(userId, operation, "video", result, videoId)
        }

        await auditLogger.logViolation(
          "OWNERSHIP_VIOLATION",
          operation,
          "video",
          `User ${userId} attempted ${operation} on video ${videoId} without ownership`,
          userId,
          videoId,
          requestId
        )

        return result
      }
    }

    // Access granted
    const result: AccessControlResult = {
      allowed: true,
      permission: basePermission,
      resourceOwner: userId
    }

    if (useCache) {
      cachePermission(userId, operation, "video", result, videoId)
    }

    await auditLogger.logSuccess(
      userId,
      operation,
      "video",
      videoId,
      requestId,
      { operation: 'canUserAccessVideo', granted: true }
    )

    return result

  } catch (error) {
    const result: AccessControlResult = {
      allowed: false,
      permission: "DENIED",
      reason: error instanceof Error ? error.message : "Access check failed"
    }

    await auditLogger.logFailure(
      operation,
      "video",
      error instanceof Error ? error.message : "Access control check failed",
      userId,
      videoId,
      undefined,
      requestId
    )

    return result
  }
}

/**
 * Check if user can modify a processing job
 */
export async function canUserModifyJob(
  userId: string,
  jobId: string,
  operation: SecurityOperation = "UPDATE",
  options?: {
    userRole?: UserRole
    useCache?: boolean
    requestId?: string
  }
): Promise<AccessControlResult> {
  const { userRole = "user", useCache = true, requestId } = options || {}

  try {
    // Check cache first
    if (useCache) {
      const cached = getCachedPermission(userId, operation, "job", jobId)
      if (cached) {
        return cached
      }
    }

    // Get base permission level
    const basePermission = getPermissionLevel(userRole, "job", operation)

    // Check if operation is allowed for this role
    if (!isOperationAllowed(basePermission, operation)) {
      const result: AccessControlResult = {
        allowed: false,
        permission: "DENIED",
        reason: `Operation ${operation} not allowed for role ${userRole} on jobs`,
        violations: ["INSUFFICIENT_PERMISSIONS"]
      }

      if (useCache) {
        cachePermission(userId, operation, "job", result, jobId)
      }

      return result
    }

    // For regular users, verify job ownership
    if (userRole === "user") {
      const isOwner = await verifyJobOwnership(userId, jobId, { useCache, requestId })

      if (!isOwner) {
        const result: AccessControlResult = {
          allowed: false,
          permission: "DENIED",
          reason: `User does not own processing job ${jobId}`,
          violations: ["OWNERSHIP_VIOLATION"]
        }

        if (useCache) {
          cachePermission(userId, operation, "job", result, jobId)
        }

        await auditLogger.logViolation(
          "OWNERSHIP_VIOLATION",
          operation,
          "job",
          `User ${userId} attempted ${operation} on job ${jobId} without ownership`,
          userId,
          jobId,
          requestId
        )

        return result
      }
    }

    // Access granted
    const result: AccessControlResult = {
      allowed: true,
      permission: basePermission,
      resourceOwner: userId
    }

    if (useCache) {
      cachePermission(userId, operation, "job", result, jobId)
    }

    return result

  } catch (error) {
    const result: AccessControlResult = {
      allowed: false,
      permission: "DENIED",
      reason: error instanceof Error ? error.message : "Job access check failed"
    }

    await auditLogger.logFailure(
      operation,
      "job",
      error instanceof Error ? error.message : "Job access control check failed",
      userId,
      jobId,
      undefined,
      requestId
    )

    return result
  }
}

/**
 * Check if user can access subscription information
 */
export async function canUserAccessSubscription(
  userId: string,
  subscriptionId: string,
  operation: SecurityOperation = "READ",
  options?: {
    userRole?: UserRole
    useCache?: boolean
    requestId?: string
  }
): Promise<AccessControlResult> {
  const { userRole = "user", useCache = true, requestId } = options || {}

  try {
    // Check cache first
    if (useCache) {
      const cached = getCachedPermission(userId, operation, "subscription", subscriptionId)
      if (cached) {
        return cached
      }
    }

    // Get base permission level
    const basePermission = getPermissionLevel(userRole, "subscription", operation)

    if (!isOperationAllowed(basePermission, operation)) {
      const result: AccessControlResult = {
        allowed: false,
        permission: "DENIED",
        reason: `Operation ${operation} not allowed for role ${userRole} on subscriptions`
      }

      if (useCache) {
        cachePermission(userId, operation, "subscription", result, subscriptionId)
      }

      return result
    }

    // Verify subscription ownership for non-admin users
    if (userRole === "user") {
      const isOwner = await verifySubscriptionOwnership(userId, subscriptionId, { useCache, requestId })

      if (!isOwner) {
        const result: AccessControlResult = {
          allowed: false,
          permission: "DENIED",
          reason: `User does not own subscription ${subscriptionId}`,
          violations: ["OWNERSHIP_VIOLATION"]
        }

        if (useCache) {
          cachePermission(userId, operation, "subscription", result, subscriptionId)
        }

        return result
      }
    }

    // Access granted
    const result: AccessControlResult = {
      allowed: true,
      permission: basePermission,
      resourceOwner: userId
    }

    if (useCache) {
      cachePermission(userId, operation, "subscription", result, subscriptionId)
    }

    return result

  } catch (error) {
    return {
      allowed: false,
      permission: "DENIED",
      reason: error instanceof Error ? error.message : "Subscription access check failed"
    }
  }
}

/**
 * Get comprehensive resource permissions for a user
 */
export async function getResourcePermissions(
  userId: string,
  resourceType: SecureResourceType,
  options?: {
    userRole?: UserRole
    resourceId?: string
    useCache?: boolean
    requestId?: string
  }
): Promise<{
  [K in SecurityOperation]?: AccessControlResult
}> {
  const { userRole = "user", resourceId, useCache = true, requestId } = options || {}
  const permissions: { [K in SecurityOperation]?: AccessControlResult } = {}

  const operations: SecurityOperation[] = ["CREATE", "READ", "UPDATE", "DELETE", "LIST"]

  // Check each operation
  for (const operation of operations) {
    try {
      let result: AccessControlResult

      if (resourceId) {
        // Check specific resource permissions
        switch (resourceType) {
          case "video":
            result = await canUserAccessVideo(userId, resourceId, operation, {
              userRole,
              useCache,
              requestId
            })
            break
          case "job":
            result = await canUserModifyJob(userId, resourceId, operation, {
              userRole,
              useCache,
              requestId
            })
            break
          case "subscription":
            result = await canUserAccessSubscription(userId, resourceId, operation, {
              userRole,
              useCache,
              requestId
            })
            break
          default:
            // Generic check without ownership verification
            const basePermission = getPermissionLevel(userRole, resourceType, operation)
            result = {
              allowed: isOperationAllowed(basePermission, operation),
              permission: basePermission,
              reason: isOperationAllowed(basePermission, operation)
                ? undefined
                : `Operation ${operation} not allowed for role ${userRole}`
            }
        }
      } else {
        // General permission check without specific resource
        const basePermission = getPermissionLevel(userRole, resourceType, operation)
        result = {
          allowed: isOperationAllowed(basePermission, operation),
          permission: basePermission,
          reason: isOperationAllowed(basePermission, operation)
            ? undefined
            : `Operation ${operation} not allowed for role ${userRole}`
        }
      }

      permissions[operation] = result

    } catch (error) {
      permissions[operation] = {
        allowed: false,
        permission: "DENIED",
        reason: error instanceof Error ? error.message : "Permission check failed"
      }
    }
  }

  // Audit log for permission matrix request
  await auditLogger.logSuccess(
    userId,
    "READ",
    resourceType,
    resourceId,
    requestId,
    {
      operation: 'getResourcePermissions',
      userRole,
      permissionsChecked: operations.length
    }
  )

  return permissions
}

/**
 * Check if user has administrative privileges
 */
export function isUserAdmin(userRole: UserRole): boolean {
  return userRole === "admin"
}

/**
 * Check if user has moderator or higher privileges
 */
export function isUserModerator(userRole: UserRole): boolean {
  return userRole === "moderator" || userRole === "admin"
}

/**
 * Validate security policy for a resource type
 */
export function validateSecurityPolicy(
  resourceType: SecureResourceType,
  operation: SecurityOperation,
  userRole: UserRole = "user"
): {
  allowed: boolean
  reason?: string
  requiredLevel: string
} {
  const policy = DEFAULT_SECURITY_POLICIES[resourceType]
  const permissionLevel = getPermissionLevel(userRole, resourceType, operation)
  const allowed = isOperationAllowed(permissionLevel, operation)

  return {
    allowed,
    reason: allowed ? undefined : `Operation requires higher permissions than ${permissionLevel}`,
    requiredLevel: policy.requiresOwnership ? "OWNER" : "AUTHENTICATED"
  }
}

/**
 * Clear permission cache for a user
 */
export function clearUserPermissionCache(userId: string): void {
  const keysToDelete: string[] = []

  for (const key of permissionCache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      keysToDelete.push(key)
    }
  }

  keysToDelete.forEach(key => permissionCache.delete(key))
}

/**
 * Clear permission cache for a specific resource
 */
export function clearResourcePermissionCache(resourceType: SecureResourceType, resourceId: string): void {
  const keysToDelete: string[] = []

  for (const key of permissionCache.keys()) {
    if (key.includes(`:${resourceType}:${resourceId}`)) {
      keysToDelete.push(key)
    }
  }

  keysToDelete.forEach(key => permissionCache.delete(key))
}

/**
 * Get permission cache statistics
 */
export function getPermissionCacheStats(): {
  size: number
  entries: Array<{ key: string; allowed: boolean; age: number }>
} {
  const now = Date.now()
  const entries = Array.from(permissionCache.entries()).map(([key, entry]) => ({
    key,
    allowed: entry.result.allowed,
    age: now - entry.timestamp
  }))

  return {
    size: permissionCache.size,
    entries: entries.slice(0, 10) // Show first 10 entries
  }
}

// Cleanup expired cache entries every 10 minutes
if (typeof window === "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of permissionCache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        permissionCache.delete(key)
      }
    }
  }, 10 * 60 * 1000)
}

// Export commonly used access control functions
export const access = {
  canAccessVideo: canUserAccessVideo,
  canModifyJob: canUserModifyJob,
  canAccessSubscription: canUserAccessSubscription,
  getPermissions: getResourcePermissions,
  isAdmin: isUserAdmin,
  isModerator: isUserModerator,
  validatePolicy: validateSecurityPolicy,
  clearUserCache: clearUserPermissionCache,
  clearResourceCache: clearResourcePermissionCache,
  getCacheStats: getPermissionCacheStats,
}