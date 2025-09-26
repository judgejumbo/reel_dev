import {
  SecureResourceType,
  SecurityOperation,
  PermissionLevel,
  SecurityPolicy,
  PermissionMatrix,
  UserRole,
} from "./types"

// Default security policies for each resource type
export const DEFAULT_SECURITY_POLICIES: Record<SecureResourceType, SecurityPolicy> = {
  video: {
    resourceType: "video",
    requiresOwnership: true,
    allowedOperations: ["CREATE", "READ", "UPDATE", "DELETE", "LIST"],
    rateLimitOverride: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    },
  },
  job: {
    resourceType: "job",
    requiresOwnership: true,
    allowedOperations: ["CREATE", "READ", "UPDATE", "DELETE", "LIST"],
    rateLimitOverride: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 50,
    },
  },
  subscription: {
    resourceType: "subscription",
    requiresOwnership: true,
    allowedOperations: ["READ", "UPDATE"], // Users can't create/delete subscriptions directly
  },
  usage: {
    resourceType: "usage",
    requiresOwnership: true,
    allowedOperations: ["READ"], // Usage is read-only for users
  },
  settings: {
    resourceType: "settings",
    requiresOwnership: true,
    allowedOperations: ["READ", "UPDATE"],
  },
  auth_token: {
    resourceType: "auth_token",
    requiresOwnership: true,
    allowedOperations: ["CREATE", "READ", "DELETE"], // No update for security tokens
    rateLimitOverride: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10, // Strict limit for auth operations
    },
  },
}

// Permission matrix for different user roles
export const ROLE_PERMISSION_MATRIX: Record<UserRole, PermissionMatrix> = {
  user: {
    video: {
      CREATE: "FULL_ACCESS",
      READ: "FULL_ACCESS",
      UPDATE: "FULL_ACCESS",
      DELETE: "FULL_ACCESS",
      LIST: "FULL_ACCESS",
    },
    job: {
      CREATE: "FULL_ACCESS",
      READ: "FULL_ACCESS",
      UPDATE: "READ_ONLY", // Users can't modify job status directly
      DELETE: "DENIED", // Jobs are deleted via video deletion
      LIST: "FULL_ACCESS",
    },
    subscription: {
      CREATE: "DENIED", // Subscriptions created via payment flow
      READ: "FULL_ACCESS",
      UPDATE: "READ_ONLY", // Updates via payment flow
      DELETE: "DENIED", // Cancellation via payment flow
      LIST: "FULL_ACCESS",
    },
    usage: {
      CREATE: "DENIED", // Usage tracked automatically
      READ: "FULL_ACCESS",
      UPDATE: "DENIED",
      DELETE: "DENIED",
      LIST: "FULL_ACCESS",
    },
    settings: {
      CREATE: "DENIED", // Settings exist per user
      READ: "FULL_ACCESS",
      UPDATE: "FULL_ACCESS",
      DELETE: "DENIED",
      LIST: "DENIED",
    },
    auth_token: {
      CREATE: "FULL_ACCESS",
      READ: "FULL_ACCESS",
      UPDATE: "DENIED", // Tokens are immutable
      DELETE: "FULL_ACCESS",
      LIST: "FULL_ACCESS",
    },
  },
  admin: {
    video: {
      CREATE: "FULL_ACCESS",
      READ: "FULL_ACCESS",
      UPDATE: "FULL_ACCESS",
      DELETE: "FULL_ACCESS",
      LIST: "FULL_ACCESS",
    },
    job: {
      CREATE: "FULL_ACCESS",
      READ: "FULL_ACCESS",
      UPDATE: "FULL_ACCESS",
      DELETE: "FULL_ACCESS",
      LIST: "FULL_ACCESS",
    },
    subscription: {
      CREATE: "FULL_ACCESS",
      READ: "FULL_ACCESS",
      UPDATE: "FULL_ACCESS",
      DELETE: "FULL_ACCESS",
      LIST: "FULL_ACCESS",
    },
    usage: {
      CREATE: "FULL_ACCESS",
      READ: "FULL_ACCESS",
      UPDATE: "FULL_ACCESS",
      DELETE: "FULL_ACCESS",
      LIST: "FULL_ACCESS",
    },
    settings: {
      CREATE: "FULL_ACCESS",
      READ: "FULL_ACCESS",
      UPDATE: "FULL_ACCESS",
      DELETE: "FULL_ACCESS",
      LIST: "FULL_ACCESS",
    },
    auth_token: {
      CREATE: "FULL_ACCESS",
      READ: "FULL_ACCESS",
      UPDATE: "DENIED", // Tokens are immutable even for admins
      DELETE: "FULL_ACCESS",
      LIST: "FULL_ACCESS",
    },
  },
  moderator: {
    video: {
      CREATE: "DENIED",
      READ: "FULL_ACCESS",
      UPDATE: "READ_ONLY",
      DELETE: "FULL_ACCESS", // Can delete inappropriate content
      LIST: "FULL_ACCESS",
    },
    job: {
      CREATE: "DENIED",
      READ: "FULL_ACCESS",
      UPDATE: "READ_ONLY",
      DELETE: "DENIED",
      LIST: "FULL_ACCESS",
    },
    subscription: {
      CREATE: "DENIED",
      READ: "FULL_ACCESS",
      UPDATE: "DENIED",
      DELETE: "DENIED",
      LIST: "FULL_ACCESS",
    },
    usage: {
      CREATE: "DENIED",
      READ: "FULL_ACCESS",
      UPDATE: "DENIED",
      DELETE: "DENIED",
      LIST: "FULL_ACCESS",
    },
    settings: {
      CREATE: "DENIED",
      READ: "READ_ONLY",
      UPDATE: "DENIED",
      DELETE: "DENIED",
      LIST: "DENIED",
    },
    auth_token: {
      CREATE: "DENIED",
      READ: "DENIED",
      UPDATE: "DENIED",
      DELETE: "DENIED",
      LIST: "DENIED",
    },
  },
}

// Resource access levels
export const ACCESS_LEVELS = {
  PUBLIC: "public", // No authentication required
  AUTHENTICATED: "authenticated", // Requires valid session
  OWNER_ONLY: "owner", // Requires resource ownership
  ADMIN_ONLY: "admin", // Admin role required
} as const

export type AccessLevel = typeof ACCESS_LEVELS[keyof typeof ACCESS_LEVELS]

// Resource access configuration
export const RESOURCE_ACCESS_CONFIG: Record<SecureResourceType, {
  defaultAccess: AccessLevel
  operations: Record<SecurityOperation, AccessLevel>
}> = {
  video: {
    defaultAccess: ACCESS_LEVELS.OWNER_ONLY,
    operations: {
      CREATE: ACCESS_LEVELS.AUTHENTICATED,
      READ: ACCESS_LEVELS.OWNER_ONLY,
      UPDATE: ACCESS_LEVELS.OWNER_ONLY,
      DELETE: ACCESS_LEVELS.OWNER_ONLY,
      LIST: ACCESS_LEVELS.OWNER_ONLY,
    },
  },
  job: {
    defaultAccess: ACCESS_LEVELS.OWNER_ONLY,
    operations: {
      CREATE: ACCESS_LEVELS.AUTHENTICATED,
      READ: ACCESS_LEVELS.OWNER_ONLY,
      UPDATE: ACCESS_LEVELS.ADMIN_ONLY, // Only system can update job status
      DELETE: ACCESS_LEVELS.OWNER_ONLY,
      LIST: ACCESS_LEVELS.OWNER_ONLY,
    },
  },
  subscription: {
    defaultAccess: ACCESS_LEVELS.OWNER_ONLY,
    operations: {
      CREATE: ACCESS_LEVELS.AUTHENTICATED,
      READ: ACCESS_LEVELS.OWNER_ONLY,
      UPDATE: ACCESS_LEVELS.OWNER_ONLY,
      DELETE: ACCESS_LEVELS.OWNER_ONLY,
      LIST: ACCESS_LEVELS.OWNER_ONLY,
    },
  },
  usage: {
    defaultAccess: ACCESS_LEVELS.OWNER_ONLY,
    operations: {
      CREATE: ACCESS_LEVELS.ADMIN_ONLY, // System creates usage records
      READ: ACCESS_LEVELS.OWNER_ONLY,
      UPDATE: ACCESS_LEVELS.ADMIN_ONLY,
      DELETE: ACCESS_LEVELS.ADMIN_ONLY,
      LIST: ACCESS_LEVELS.OWNER_ONLY,
    },
  },
  settings: {
    defaultAccess: ACCESS_LEVELS.OWNER_ONLY,
    operations: {
      CREATE: ACCESS_LEVELS.AUTHENTICATED,
      READ: ACCESS_LEVELS.OWNER_ONLY,
      UPDATE: ACCESS_LEVELS.OWNER_ONLY,
      DELETE: ACCESS_LEVELS.OWNER_ONLY,
      LIST: ACCESS_LEVELS.OWNER_ONLY,
    },
  },
  auth_token: {
    defaultAccess: ACCESS_LEVELS.OWNER_ONLY,
    operations: {
      CREATE: ACCESS_LEVELS.AUTHENTICATED,
      READ: ACCESS_LEVELS.OWNER_ONLY,
      UPDATE: ACCESS_LEVELS.ADMIN_ONLY, // Tokens are immutable
      DELETE: ACCESS_LEVELS.OWNER_ONLY,
      LIST: ACCESS_LEVELS.OWNER_ONLY,
    },
  },
}

// Security constants
export const SECURITY_CONSTANTS = {
  // Rate limiting
  DEFAULT_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  DEFAULT_RATE_LIMIT_MAX_REQUESTS: 100,
  STRICT_RATE_LIMIT_MAX_REQUESTS: 10,

  // Caching
  PERMISSION_CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes
  SESSION_CACHE_TTL_MS: 60 * 1000, // 1 minute

  // Audit logging
  AUDIT_LOG_BATCH_SIZE: 100,
  AUDIT_LOG_RETENTION_DAYS: 90,

  // Request tracking
  REQUEST_ID_LENGTH: 16,
  MAX_REQUEST_BODY_SIZE: 50 * 1024 * 1024, // 50MB

  // Security headers
  CORS_MAX_AGE: 86400, // 24 hours

  // Token expiration
  AUTH_TOKEN_EXPIRY_HOURS: 24,
  RESET_TOKEN_EXPIRY_HOURS: 1,
  MAGIC_LINK_EXPIRY_MINUTES: 15,
} as const

// Error codes for consistent error handling
export const SECURITY_ERROR_CODES = {
  UNAUTHORIZED: "SEC_001",
  OWNERSHIP_DENIED: "SEC_002",
  RATE_LIMITED: "SEC_003",
  INVALID_TOKEN: "SEC_004",
  SUSPICIOUS_ACTIVITY: "SEC_005",
  DATA_LEAK_ATTEMPT: "SEC_006",
  INSUFFICIENT_PERMISSIONS: "SEC_007",
  RESOURCE_NOT_FOUND: "SEC_008",
  VALIDATION_FAILED: "SEC_009",
  SYSTEM_ERROR: "SEC_010",
} as const

// Helper functions for permission checking
export function getPermissionLevel(
  userRole: UserRole,
  resourceType: SecureResourceType,
  operation: SecurityOperation
): PermissionLevel {
  return ROLE_PERMISSION_MATRIX[userRole]?.[resourceType]?.[operation] || "DENIED"
}

export function isOperationAllowed(
  permission: PermissionLevel,
  operation: SecurityOperation
): boolean {
  if (permission === "DENIED") return false
  if (permission === "FULL_ACCESS") return true
  if (permission === "READ_ONLY") {
    return operation === "READ" || operation === "LIST"
  }
  return false
}

export function getRequiredAccessLevel(
  resourceType: SecureResourceType,
  operation: SecurityOperation
): AccessLevel {
  return RESOURCE_ACCESS_CONFIG[resourceType]?.operations[operation] ||
         RESOURCE_ACCESS_CONFIG[resourceType]?.defaultAccess ||
         ACCESS_LEVELS.AUTHENTICATED
}