import { NextResponse } from "next/server"
import { auditLogger } from "./audit"

// Custom security error classes
export class SecurityError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly userId?: string
  public readonly resourceId?: string
  public readonly safe: boolean // Whether error message is safe to show to users

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    userId?: string,
    resourceId?: string,
    safe: boolean = false
  ) {
    super(message)
    this.name = "SecurityError"
    this.code = code
    this.statusCode = statusCode
    this.userId = userId
    this.resourceId = resourceId
    this.safe = safe
  }
}

export class OwnershipViolationError extends SecurityError {
  constructor(message: string, userId?: string, resourceId?: string) {
    super(message, "OWNERSHIP_VIOLATION", 403, userId, resourceId, false)
    this.name = "OwnershipViolationError"
  }
}

export class RateLimitError extends SecurityError {
  public readonly retryAfter: number

  constructor(message: string, retryAfter: number, userId?: string) {
    super(message, "RATE_LIMIT_EXCEEDED", 429, userId, undefined, true)
    this.name = "RateLimitError"
    this.retryAfter = retryAfter
  }
}

export class AuthenticationError extends SecurityError {
  constructor(message: string, userId?: string) {
    super(message, "AUTHENTICATION_FAILED", 401, userId, undefined, true)
    this.name = "AuthenticationError"
  }
}

export class ValidationError extends SecurityError {
  public readonly field?: string

  constructor(message: string, field?: string) {
    super(message, "VALIDATION_ERROR", 400, undefined, undefined, true)
    this.name = "ValidationError"
    this.field = field
  }
}

// Security incident types
export type SecurityIncidentType =
  | "UNAUTHORIZED_ACCESS"
  | "OWNERSHIP_VIOLATION"
  | "RATE_LIMIT_EXCEEDED"
  | "AUTHENTICATION_FAILURE"
  | "VALIDATION_ERROR"
  | "SYSTEM_ERROR"
  | "SUSPICIOUS_ACTIVITY"

// Security incident severity levels
export type SecurityIncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

// Security incident interface
export interface SecurityIncident {
  id: string
  type: SecurityIncidentType
  severity: SecurityIncidentSeverity
  message: string
  userId?: string
  resourceId?: string
  ip?: string
  userAgent?: string
  timestamp: Date
  metadata?: Record<string, unknown>
  resolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
}

// In-memory incident store (in production, use database)
const securityIncidents = new Map<string, SecurityIncident>()

/**
 * Safe error message generator - prevents data leaks
 */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof SecurityError && error.safe) {
    return error.message
  }

  if (error instanceof SecurityError) {
    switch (error.code) {
      case "OWNERSHIP_VIOLATION":
        return "Access denied. You do not have permission to access this resource."
      case "RATE_LIMIT_EXCEEDED":
        return "Too many requests. Please try again later."
      case "AUTHENTICATION_FAILED":
        return "Authentication failed. Please check your credentials."
      case "VALIDATION_ERROR":
        return "Invalid input provided."
      default:
        return "An error occurred while processing your request."
    }
  }

  // For any other error, return generic message
  return "An unexpected error occurred. Please try again later."
}

/**
 * Log security incident
 */
export async function logSecurityIncident(
  type: SecurityIncidentType,
  severity: SecurityIncidentSeverity,
  message: string,
  options?: {
    userId?: string
    resourceId?: string
    ip?: string
    userAgent?: string
    metadata?: Record<string, unknown>
  }
): Promise<string> {
  const incidentId = `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const incident: SecurityIncident = {
    id: incidentId,
    type,
    severity,
    message,
    userId: options?.userId,
    resourceId: options?.resourceId,
    ip: options?.ip,
    userAgent: options?.userAgent,
    timestamp: new Date(),
    metadata: options?.metadata,
    resolved: false
  }

  securityIncidents.set(incidentId, incident)

  // Log to audit system
  await auditLogger.logViolation(
    type,
    "SYSTEM",
    "security",
    message,
    options?.userId,
    options?.resourceId,
    undefined,
    {
      incidentId,
      severity,
      ip: options?.ip,
      userAgent: options?.userAgent,
      metadata: options?.metadata
    }
  )

  // In production, you would also:
  // - Send alerts for HIGH/CRITICAL incidents
  // - Store in database
  // - Integrate with monitoring systems (DataDog, Sentry, etc.)

  console.log(`🚨 Security Incident [${severity}]: ${type} - ${message}`)

  return incidentId
}

/**
 * Create safe API response for errors
 */
export function createSecureErrorResponse(
  error: unknown,
  requestId?: string
): NextResponse {
  const safeMessage = getSafeErrorMessage(error)
  let statusCode = 500

  if (error instanceof SecurityError) {
    statusCode = error.statusCode
  }

  // Log security incident for certain error types
  if (error instanceof SecurityError) {
    const severity = getSeverityForErrorCode(error.code)

    logSecurityIncident(
      error.code as SecurityIncidentType,
      severity,
      error.message,
      {
        userId: error.userId,
        resourceId: error.resourceId,
        metadata: { requestId, errorStack: error.stack }
      }
    )
  }

  return NextResponse.json(
    {
      error: safeMessage,
      code: error instanceof SecurityError ? error.code : "INTERNAL_ERROR",
      requestId,
      timestamp: new Date().toISOString()
    },
    { status: statusCode }
  )
}

/**
 * Get severity level for error code
 */
function getSeverityForErrorCode(code: string): SecurityIncidentSeverity {
  switch (code) {
    case "OWNERSHIP_VIOLATION":
      return "HIGH"
    case "RATE_LIMIT_EXCEEDED":
      return "MEDIUM"
    case "AUTHENTICATION_FAILED":
      return "MEDIUM"
    case "VALIDATION_ERROR":
      return "LOW"
    default:
      return "MEDIUM"
  }
}

/**
 * Get security incidents for monitoring
 */
export function getSecurityIncidents(
  filters?: {
    type?: SecurityIncidentType
    severity?: SecurityIncidentSeverity
    userId?: string
    resolved?: boolean
    since?: Date
  }
): SecurityIncident[] {
  let incidents = Array.from(securityIncidents.values())

  if (filters) {
    if (filters.type) {
      incidents = incidents.filter(i => i.type === filters.type)
    }
    if (filters.severity) {
      incidents = incidents.filter(i => i.severity === filters.severity)
    }
    if (filters.userId) {
      incidents = incidents.filter(i => i.userId === filters.userId)
    }
    if (filters.resolved !== undefined) {
      incidents = incidents.filter(i => i.resolved === filters.resolved)
    }
    if (filters.since) {
      incidents = incidents.filter(i => i.timestamp >= filters.since!)
    }
  }

  return incidents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

/**
 * Resolve security incident
 */
export async function resolveSecurityIncident(
  incidentId: string,
  resolvedBy: string,
  notes?: string
): Promise<boolean> {
  const incident = securityIncidents.get(incidentId)

  if (!incident) {
    return false
  }

  incident.resolved = true
  incident.resolvedAt = new Date()
  incident.resolvedBy = resolvedBy

  if (notes) {
    incident.metadata = {
      ...incident.metadata,
      resolutionNotes: notes
    }
  }

  securityIncidents.set(incidentId, incident)

  await auditLogger.logSuccess(
    resolvedBy,
    "RESOLVE_INCIDENT",
    "security",
    incidentId,
    undefined,
    {
      incidentType: incident.type,
      severity: incident.severity,
      resolutionNotes: notes
    }
  )

  return true
}

/**
 * Get security metrics for monitoring dashboard
 */
export function getSecurityMetrics(): {
  totalIncidents: number
  unresolvedIncidents: number
  incidentsByType: Record<SecurityIncidentType, number>
  incidentsBySeverity: Record<SecurityIncidentSeverity, number>
  recentIncidents: SecurityIncident[]
} {
  const incidents = Array.from(securityIncidents.values())
  const now = new Date()
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const incidentsByType: Record<SecurityIncidentType, number> = {
    UNAUTHORIZED_ACCESS: 0,
    OWNERSHIP_VIOLATION: 0,
    RATE_LIMIT_EXCEEDED: 0,
    AUTHENTICATION_FAILURE: 0,
    VALIDATION_ERROR: 0,
    SYSTEM_ERROR: 0,
    SUSPICIOUS_ACTIVITY: 0
  }

  const incidentsBySeverity: Record<SecurityIncidentSeverity, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0
  }

  incidents.forEach(incident => {
    incidentsByType[incident.type]++
    incidentsBySeverity[incident.severity]++
  })

  return {
    totalIncidents: incidents.length,
    unresolvedIncidents: incidents.filter(i => !i.resolved).length,
    incidentsByType,
    incidentsBySeverity,
    recentIncidents: incidents
      .filter(i => i.timestamp >= last24Hours)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)
  }
}

/**
 * Security monitoring middleware wrapper
 */
export function withSecurityMonitoring<T>(
  handler: (...args: unknown[]) => Promise<T>,
  operationName: string
) {
  return async (...args: unknown[]): Promise<T> => {
    const startTime = Date.now()

    try {
      const result = await handler(...args)

      // Log successful operation
      const duration = Date.now() - startTime
      if (duration > 5000) { // Log slow operations
        await logSecurityIncident(
          "SYSTEM_ERROR",
          "MEDIUM",
          `Slow operation detected: ${operationName} took ${duration}ms`,
          { metadata: { operationName, duration } }
        )
      }

      return result
    } catch (error) {
      // Log failed operation
      await logSecurityIncident(
        "SYSTEM_ERROR",
        error instanceof SecurityError ? getSeverityForErrorCode(error.code) : "HIGH",
        `Operation failed: ${operationName} - ${error}`,
        { metadata: { operationName, error: String(error) } }
      )

      throw error
    }
  }
}

export const securityErrorHandling = {
  SecurityError,
  OwnershipViolationError,
  RateLimitError,
  AuthenticationError,
  ValidationError,
  getSafeErrorMessage,
  logSecurityIncident,
  createSecureErrorResponse,
  getSecurityIncidents,
  resolveSecurityIncident,
  getSecurityMetrics,
  withSecurityMonitoring
}