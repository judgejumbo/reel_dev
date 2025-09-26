import { db } from "./db"
import { videoUploads, processingJobs, clipSettings, userSubscriptions, usageTracking } from "./schema"
import { eq, and } from "drizzle-orm"

// Security context for all database operations
export interface SecurityContext {
  userId: string
  requestId?: string
  operation: string
  resource: string
}

// Audit log entry structure
export interface AuditLogEntry {
  userId: string
  operation: string
  resource: string
  resourceId?: string
  timestamp: Date
  requestId?: string
  success: boolean
  error?: string
}

// Type-safe secure database operations
export class SecureDatabase {
  private context: SecurityContext | null = null
  private auditLogs: AuditLogEntry[] = []

  // Set security context for all subsequent operations
  setContext(context: SecurityContext) {
    this.context = context
  }

  // Clear security context
  clearContext() {
    this.context = null
  }

  // Get current context or throw error
  private requireContext(): SecurityContext {
    if (!this.context) {
      throw new Error("Security context not set. Call setContext() first.")
    }
    return this.context
  }

  // Log audit entry
  private logAudit(entry: Omit<AuditLogEntry, "timestamp">) {
    const auditEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date(),
    }
    this.auditLogs.push(auditEntry)

    // TODO: In production, send to external logging service
    console.log(`[AUDIT] ${entry.operation} on ${entry.resource} by ${entry.userId}`, auditEntry)
  }

  // Video Operations
  videos = {
    // Find all videos for authenticated user
    findAll: async () => {
      const context = this.requireContext()
      try {
        const result = await db
          .select()
          .from(videoUploads)
          .where(eq(videoUploads.userId, context.userId))

        this.logAudit({
          userId: context.userId,
          operation: "SELECT",
          resource: "videos",
          requestId: context.requestId,
          success: true,
        })

        return result
      } catch (error) {
        this.logAudit({
          userId: context.userId,
          operation: "SELECT",
          resource: "videos",
          requestId: context.requestId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        throw error
      }
    },

    // Find video by ID with ownership check
    findById: async (videoId: string) => {
      const context = this.requireContext()
      try {
        const result = await db
          .select()
          .from(videoUploads)
          .where(
            and(
              eq(videoUploads.id, videoId),
              eq(videoUploads.userId, context.userId)
            )
          )
          .limit(1)

        if (result.length === 0) {
          throw new Error(`Video not found or access denied: ${videoId}`)
        }

        this.logAudit({
          userId: context.userId,
          operation: "SELECT",
          resource: "videos",
          resourceId: videoId,
          requestId: context.requestId,
          success: true,
        })

        return result[0]
      } catch (error) {
        this.logAudit({
          userId: context.userId,
          operation: "SELECT",
          resource: "videos",
          resourceId: videoId,
          requestId: context.requestId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        throw error
      }
    },

    // Delete video with ownership check
    delete: async (videoId: string) => {
      const context = this.requireContext()
      try {
        // First verify ownership
        await this.videos.findById(videoId)

        // Delete the video
        const result = await db
          .delete(videoUploads)
          .where(
            and(
              eq(videoUploads.id, videoId),
              eq(videoUploads.userId, context.userId)
            )
          )

        this.logAudit({
          userId: context.userId,
          operation: "DELETE",
          resource: "videos",
          resourceId: videoId,
          requestId: context.requestId,
          success: true,
        })

        return result
      } catch (error) {
        this.logAudit({
          userId: context.userId,
          operation: "DELETE",
          resource: "videos",
          resourceId: videoId,
          requestId: context.requestId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        throw error
      }
    },
  }

  // Processing Jobs Operations
  jobs = {
    // Find all jobs for authenticated user
    findAll: async () => {
      const context = this.requireContext()
      try {
        const result = await db
          .select()
          .from(processingJobs)
          .where(eq(processingJobs.userId, context.userId))

        this.logAudit({
          userId: context.userId,
          operation: "SELECT",
          resource: "jobs",
          requestId: context.requestId,
          success: true,
        })

        return result
      } catch (error) {
        this.logAudit({
          userId: context.userId,
          operation: "SELECT",
          resource: "jobs",
          requestId: context.requestId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        throw error
      }
    },

    // Find job by ID with ownership check
    findById: async (jobId: string) => {
      const context = this.requireContext()
      try {
        const result = await db
          .select()
          .from(processingJobs)
          .where(
            and(
              eq(processingJobs.id, jobId),
              eq(processingJobs.userId, context.userId)
            )
          )
          .limit(1)

        if (result.length === 0) {
          throw new Error(`Job not found or access denied: ${jobId}`)
        }

        this.logAudit({
          userId: context.userId,
          operation: "SELECT",
          resource: "jobs",
          resourceId: jobId,
          requestId: context.requestId,
          success: true,
        })

        return result[0]
      } catch (error) {
        this.logAudit({
          userId: context.userId,
          operation: "SELECT",
          resource: "jobs",
          resourceId: jobId,
          requestId: context.requestId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        throw error
      }
    },
  }

  // Usage Tracking Operations
  usage = {
    // Get usage for current user and month
    getCurrentMonthUsage: async () => {
      const context = this.requireContext()
      const now = new Date()
      const month = now.getMonth() + 1
      const year = now.getFullYear()

      try {
        const result = await db
          .select()
          .from(usageTracking)
          .where(
            and(
              eq(usageTracking.userId, context.userId),
              eq(usageTracking.month, month),
              eq(usageTracking.year, year)
            )
          )
          .limit(1)

        this.logAudit({
          userId: context.userId,
          operation: "SELECT",
          resource: "usage",
          requestId: context.requestId,
          success: true,
        })

        return result[0] || null
      } catch (error) {
        this.logAudit({
          userId: context.userId,
          operation: "SELECT",
          resource: "usage",
          requestId: context.requestId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        throw error
      }
    },
  }

  // Get audit logs (for debugging/monitoring)
  getAuditLogs(): AuditLogEntry[] {
    return [...this.auditLogs]
  }

  // Clear audit logs (call periodically to prevent memory leaks)
  clearAuditLogs() {
    this.auditLogs = []
  }
}

// Global secure database instance
export const secureDb = new SecureDatabase()

// Helper function to create security context
export function createSecurityContext(
  userId: string,
  operation: string,
  resource: string,
  requestId?: string
): SecurityContext {
  return {
    userId,
    operation,
    resource,
    requestId: requestId || generateRequestId(),
  }
}

// Generate unique request ID for tracing
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Wrapper function for secure database operations
export async function withSecureContext<T>(
  context: SecurityContext,
  operation: () => Promise<T>
): Promise<T> {
  secureDb.setContext(context)
  try {
    const result = await operation()
    return result
  } finally {
    secureDb.clearContext()
  }
}