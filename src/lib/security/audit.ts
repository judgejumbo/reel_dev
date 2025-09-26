import {
  SecurityEvent,
  SecurityOperation,
  SecureResourceType,
  SecurityViolationType,
  AuditQueryFilters,
  SecurityMetrics,
} from "./types"
import { SECURITY_CONSTANTS } from "./permissions"

// In-memory audit log storage (use database in production)
let auditLogs: SecurityEvent[] = []
let logBuffer: SecurityEvent[] = []
let metricsCache: SecurityMetrics | null = null
let metricsCacheExpiry = 0

// Audit logger class for structured security logging
export class AuditLogger {
  private static instance: AuditLogger | null = null

  // Singleton pattern for global audit logger
  static getInstance(): AuditLogger {
    if (!this.instance) {
      this.instance = new AuditLogger()
    }
    return this.instance
  }

  /**
   * Log a security event
   */
  async logEvent(event: Omit<SecurityEvent, "id" | "timestamp">): Promise<void> {
    const fullEvent: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ...event,
    }

    // Add to buffer for batch processing
    logBuffer.push(fullEvent)

    // Log immediately to console for development
    this.logToConsole(fullEvent)

    // Flush buffer if it reaches batch size
    if (logBuffer.length >= SECURITY_CONSTANTS.AUDIT_LOG_BATCH_SIZE) {
      await this.flushBuffer()
    }
  }

  /**
   * Log successful operation
   */
  async logSuccess(
    userId: string,
    operation: SecurityOperation,
    resource: SecureResourceType,
    resourceId?: string,
    requestId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logEvent({
      userId,
      operation,
      resource,
      resourceId,
      success: true,
      requestId,
      metadata,
    })
  }

  /**
   * Log failed operation
   */
  async logFailure(
    operation: SecurityOperation,
    resource: SecureResourceType,
    error: string,
    userId?: string,
    resourceId?: string,
    violation?: SecurityViolationType,
    requestId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logEvent({
      userId,
      operation,
      resource,
      resourceId,
      success: false,
      error,
      violation,
      requestId,
      metadata,
    })
  }

  /**
   * Log security violation
   */
  async logViolation(
    violation: SecurityViolationType,
    operation: SecurityOperation,
    resource: SecureResourceType,
    details: string,
    userId?: string,
    resourceId?: string,
    requestId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logEvent({
      userId,
      operation,
      resource,
      resourceId,
      success: false,
      violation,
      error: details,
      requestId,
      metadata: {
        severity: "HIGH",
        ...metadata,
      },
    })

    // For critical violations, trigger immediate alerts
    if (this.isCriticalViolation(violation)) {
      await this.triggerSecurityAlert(violation, details, userId, resourceId)
    }
  }

  /**
   * Query audit logs with filters
   */
  queryLogs(filters: AuditQueryFilters = {}): SecurityEvent[] {
    let filtered = [...auditLogs, ...logBuffer]

    // Apply filters
    if (filters.userId) {
      filtered = filtered.filter(log => log.userId === filters.userId)
    }
    if (filters.resourceType) {
      filtered = filtered.filter(log => log.resource === filters.resourceType)
    }
    if (filters.operation) {
      filtered = filtered.filter(log => log.operation === filters.operation)
    }
    if (filters.success !== undefined) {
      filtered = filtered.filter(log => log.success === filters.success)
    }
    if (filters.violationType) {
      filtered = filtered.filter(log => log.violation === filters.violationType)
    }
    if (filters.startDate) {
      filtered = filtered.filter(log => log.timestamp >= filters.startDate!)
    }
    if (filters.endDate) {
      filtered = filtered.filter(log => log.timestamp <= filters.endDate!)
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Apply pagination
    if (filters.offset) {
      filtered = filtered.slice(filters.offset)
    }
    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit)
    }

    return filtered
  }

  /**
   * Get security metrics
   */
  getMetrics(forceRefresh = false): SecurityMetrics {
    const now = Date.now()

    // Return cached metrics if still valid
    if (!forceRefresh && metricsCache && now < metricsCacheExpiry) {
      return metricsCache
    }

    const allLogs = [...auditLogs, ...logBuffer]
    const last24Hours = new Date(now - 24 * 60 * 60 * 1000)
    const recentLogs = allLogs.filter(log => log.timestamp >= last24Hours)

    const metrics: SecurityMetrics = {
      totalRequests: recentLogs.length,
      authorizedRequests: recentLogs.filter(log => log.success).length,
      unauthorizedRequests: recentLogs.filter(log => !log.success && !log.violation).length,
      rateLimitedRequests: recentLogs.filter(log => log.violation === "RATE_LIMIT_EXCEEDED").length,
      violationsByType: this.getViolationCounts(recentLogs),
      topViolatingUsers: this.getTopViolatingUsers(recentLogs),
      responseTimeMs: {
        avg: 0, // TODO: Implement response time tracking
        p95: 0,
        p99: 0,
      },
    }

    // Cache metrics for 5 minutes
    metricsCache = metrics
    metricsCacheExpiry = now + 5 * 60 * 1000

    return metrics
  }

  /**
   * Flush buffer to persistent storage
   */
  async flushBuffer(): Promise<void> {
    if (logBuffer.length === 0) return

    // Move buffer contents to main storage
    auditLogs.push(...logBuffer)
    logBuffer = []

    // Clean up old logs to prevent memory leaks
    this.cleanupOldLogs()

    // TODO: In production, send to external logging service (e.g., CloudWatch, Datadog)
    console.log(`[AUDIT] Flushed ${logBuffer.length} events to storage`)
  }

  /**
   * Clean up old audit logs
   */
  private cleanupOldLogs(): void {
    const cutoffDate = new Date(
      Date.now() - SECURITY_CONSTANTS.AUDIT_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000
    )

    const originalLength = auditLogs.length
    auditLogs = auditLogs.filter(log => log.timestamp >= cutoffDate)

    if (auditLogs.length < originalLength) {
      console.log(`[AUDIT] Cleaned up ${originalLength - auditLogs.length} old log entries`)
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Log to console with structured format
   */
  private logToConsole(event: SecurityEvent): void {
    const level = event.success ? "INFO" : "WARN"
    const violation = event.violation ? ` [${event.violation}]` : ""
    const user = event.userId ? ` user:${event.userId}` : ""
    const resource = event.resourceId ? ` resource:${event.resourceId}` : ""

    console.log(
      `[${level}][AUDIT]${violation} ${event.operation} ${event.resource}${user}${resource} - ${
        event.success ? "SUCCESS" : event.error
      }`
    )
  }

  /**
   * Check if violation is critical and requires immediate attention
   */
  private isCriticalViolation(violation: SecurityViolationType): boolean {
    const criticalViolations: SecurityViolationType[] = [
      "DATA_LEAK_ATTEMPT",
      "SUSPICIOUS_ACTIVITY",
      "UNAUTHORIZED_ACCESS",
    ]
    return criticalViolations.includes(violation)
  }

  /**
   * Trigger security alert for critical violations
   */
  private async triggerSecurityAlert(
    violation: SecurityViolationType,
    details: string,
    userId?: string,
    resourceId?: string
  ): Promise<void> {
    // TODO: Implement alerting (email, Slack, PagerDuty, etc.)
    console.error(`[SECURITY ALERT] ${violation}: ${details}`, {
      userId,
      resourceId,
      timestamp: new Date().toISOString(),
    })

    // In production, you might want to:
    // - Send email to security team
    // - Post to Slack security channel
    // - Create incident in PagerDuty
    // - Block user account temporarily
  }

  /**
   * Get violation counts by type
   */
  private getViolationCounts(logs: SecurityEvent[]): Record<SecurityViolationType, number> {
    const counts: Record<SecurityViolationType, number> = {
      UNAUTHORIZED_ACCESS: 0,
      OWNERSHIP_VIOLATION: 0,
      RATE_LIMIT_EXCEEDED: 0,
      INVALID_TOKEN: 0,
      SUSPICIOUS_ACTIVITY: 0,
      DATA_LEAK_ATTEMPT: 0,
    }

    logs.forEach(log => {
      if (log.violation) {
        counts[log.violation]++
      }
    })

    return counts
  }

  /**
   * Get top users with most violations
   */
  private getTopViolatingUsers(logs: SecurityEvent[]): Array<{ userId: string; violations: number }> {
    const userViolations = new Map<string, number>()

    logs
      .filter(log => !log.success && log.userId)
      .forEach(log => {
        const current = userViolations.get(log.userId!) || 0
        userViolations.set(log.userId!, current + 1)
      })

    return Array.from(userViolations.entries())
      .map(([userId, violations]) => ({ userId, violations }))
      .sort((a, b) => b.violations - a.violations)
      .slice(0, 10) // Top 10
  }
}

// Global audit logger instance
export const auditLogger = AuditLogger.getInstance()

// Convenience functions for common operations
export async function logSecurityEvent(
  userId: string,
  operation: SecurityOperation,
  resource: SecureResourceType,
  success: boolean,
  resourceId?: string,
  error?: string,
  violation?: SecurityViolationType,
  requestId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  if (success) {
    await auditLogger.logSuccess(userId, operation, resource, resourceId, requestId, metadata)
  } else {
    await auditLogger.logFailure(
      operation,
      resource,
      error || "Operation failed",
      userId,
      resourceId,
      violation,
      requestId,
      metadata
    )
  }
}

export async function logUnauthorizedAccess(
  operation: SecurityOperation,
  resource: SecureResourceType,
  details: string,
  userId?: string,
  resourceId?: string,
  requestId?: string
): Promise<void> {
  await auditLogger.logViolation(
    "UNAUTHORIZED_ACCESS",
    operation,
    resource,
    details,
    userId,
    resourceId,
    requestId
  )
}

export async function logOwnershipViolation(
  operation: SecurityOperation,
  resource: SecureResourceType,
  userId: string,
  resourceId: string,
  requestId?: string
): Promise<void> {
  await auditLogger.logViolation(
    "OWNERSHIP_VIOLATION",
    operation,
    resource,
    `User ${userId} attempted to access resource ${resourceId} without ownership`,
    userId,
    resourceId,
    requestId
  )
}

export async function logRateLimitExceeded(
  operation: SecurityOperation,
  resource: SecureResourceType,
  userId: string,
  requestId?: string
): Promise<void> {
  await auditLogger.logViolation(
    "RATE_LIMIT_EXCEEDED",
    operation,
    resource,
    `Rate limit exceeded for user ${userId}`,
    userId,
    undefined,
    requestId
  )
}

// Periodic cleanup (run every hour)
if (typeof window === "undefined") {
  setInterval(async () => {
    await auditLogger.flushBuffer()
  }, 60 * 60 * 1000) // 1 hour
}