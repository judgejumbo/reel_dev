// Security-related TypeScript types and interfaces

// User context for security operations
export interface UserSecurityContext {
  userId: string
  email?: string
  role?: UserRole
  requestId: string
  timestamp: Date
}

// User roles (for future role-based access control)
export type UserRole = "user" | "admin" | "moderator"

// Resource types that can be secured
export type SecureResourceType =
  | "video"
  | "job"
  | "subscription"
  | "usage"
  | "settings"
  | "auth_token"

// Operations that can be performed on resources
export type SecurityOperation =
  | "CREATE"
  | "READ"
  | "UPDATE"
  | "DELETE"
  | "LIST"

// Security permission levels
export type PermissionLevel = "DENIED" | "READ_ONLY" | "FULL_ACCESS"

// Resource ownership information
export interface ResourceOwnership {
  resourceType: SecureResourceType
  resourceId: string
  ownerId: string
  createdAt: Date
  sharedWith?: string[] // For future sharing features
}

// Security violation types
export type SecurityViolationType =
  | "UNAUTHORIZED_ACCESS"
  | "OWNERSHIP_VIOLATION"
  | "RATE_LIMIT_EXCEEDED"
  | "INVALID_TOKEN"
  | "SUSPICIOUS_ACTIVITY"
  | "DATA_LEAK_ATTEMPT"

// Security event for audit logging
export interface SecurityEvent {
  id: string
  userId?: string
  operation: SecurityOperation
  resource: SecureResourceType
  resourceId?: string
  success: boolean
  timestamp: Date
  requestId?: string
  ipAddress?: string
  userAgent?: string
  violation?: SecurityViolationType
  error?: string
  metadata?: Record<string, unknown>
}

// Access control result
export interface AccessControlResult {
  allowed: boolean
  permission: PermissionLevel
  reason?: string
  resourceOwner?: string
  violations?: SecurityViolationType[]
}

// Security policy for a resource type
export interface SecurityPolicy {
  resourceType: SecureResourceType
  requiresOwnership: boolean
  allowedOperations: SecurityOperation[]
  rateLimitOverride?: {
    windowMs: number
    maxRequests: number
  }
  additionalChecks?: string[] // Custom validation function names
}

// Rate limiting result
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  windowMs: number
  userId: string
}

// Audit query filters
export interface AuditQueryFilters {
  userId?: string
  resourceType?: SecureResourceType
  operation?: SecurityOperation
  success?: boolean
  startDate?: Date
  endDate?: Date
  violationType?: SecurityViolationType
  limit?: number
  offset?: number
}

// Security configuration
export interface SecurityConfig {
  enableAuditLogging: boolean
  enableRateLimit: boolean
  auditLogRetentionDays: number
  rateLimitWindowMs: number
  rateLimitMaxRequests: number
  enablePermissionCaching: boolean
  permissionCacheTtlMs: number
}

// Error types for security operations
export class SecurityError extends Error {
  public readonly code: string
  public readonly userId?: string
  public readonly resourceId?: string
  public readonly violation: SecurityViolationType

  constructor(
    message: string,
    violation: SecurityViolationType,
    code: string = "SECURITY_ERROR",
    userId?: string,
    resourceId?: string
  ) {
    super(message)
    this.name = "SecurityError"
    this.code = code
    this.userId = userId
    this.resourceId = resourceId
    this.violation = violation
  }
}

export class UnauthorizedError extends SecurityError {
  constructor(message: string = "Unauthorized access", userId?: string, resourceId?: string) {
    super(message, "UNAUTHORIZED_ACCESS", "UNAUTHORIZED", userId, resourceId)
  }
}

export class OwnershipViolationError extends SecurityError {
  constructor(message: string = "Resource access denied", userId?: string, resourceId?: string) {
    super(message, "OWNERSHIP_VIOLATION", "OWNERSHIP_DENIED", userId, resourceId)
  }
}

export class RateLimitError extends SecurityError {
  public readonly retryAfterMs: number

  constructor(message: string = "Rate limit exceeded", retryAfterMs: number = 900000, userId?: string) {
    super(message, "RATE_LIMIT_EXCEEDED", "RATE_LIMITED", userId)
    this.retryAfterMs = retryAfterMs
  }
}

// Permission matrix type for complex access control
export type PermissionMatrix = {
  [K in SecureResourceType]: {
    [O in SecurityOperation]: PermissionLevel
  }
}

// Security metrics for monitoring
export interface SecurityMetrics {
  totalRequests: number
  authorizedRequests: number
  unauthorizedRequests: number
  rateLimitedRequests: number
  violationsByType: Record<SecurityViolationType, number>
  topViolatingUsers: Array<{ userId: string; violations: number }>
  responseTimeMs: {
    avg: number
    p95: number
    p99: number
  }
}

// Bulk operation security context
export interface BulkOperationContext {
  userId: string
  operation: SecurityOperation
  resourceType: SecureResourceType
  resourceIds: string[]
  requestId: string
  requireAllOwned: boolean
}

// Security validation result for bulk operations
export interface BulkValidationResult {
  success: boolean
  validResourceIds: string[]
  invalidResourceIds: string[]
  violations: Array<{
    resourceId: string
    violation: SecurityViolationType
    reason: string
  }>
}