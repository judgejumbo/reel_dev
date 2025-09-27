import { db } from "@/lib/db"
import {
  videoUploads,
  processingJobs,
  clipSettings,
  userSubscriptions,
  usageTracking
} from "@/lib/schema"
import { eq, and, inArray, desc } from "drizzle-orm"
import { auditLogger } from "./audit"
import {
  SecureResourceType,
  SecurityError,
  OwnershipViolationError
} from "./types"

// Resource type to table mapping
const RESOURCE_TABLES = {
  video: videoUploads,
  job: processingJobs,
  subscription: userSubscriptions,
  usage: usageTracking,
  settings: clipSettings,
} as const

// Security context for operations
interface SecureQueryContext {
  userId: string
  requestId?: string
  skipOwnershipCheck?: boolean // For admin operations
}

/**
 * Secure find operation - automatically filters by userId
 */
export async function secureFind<T extends SecureResourceType>(
  resourceType: T,
  context: SecureQueryContext,
  filters?: Record<string, unknown>
): Promise<unknown[]> {
  const { userId, requestId } = context
  const table = RESOURCE_TABLES[resourceType]

  if (!table) {
    throw new SecurityError(
      `Invalid resource type: ${resourceType}`,
      "INVALID_RESOURCE_TYPE",
      "SECURITY_001",
      userId
    )
  }

  try {
    let query = db.select().from(table)

    // Add userId filter for user-owned resources
    if (resourceType !== 'usage') { // Usage might have different filtering logic
      query = query.where(eq(table.userId, userId))
    } else {
      // Special handling for usage tracking
      query = query.where(eq(usageTracking.userId, userId))
    }

    // Apply additional filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.where(eq(table[key], value))
        }
      })
    }

    // Order by creation date (newest first) for most resources
    if ('createdAt' in table) {
      query = query.orderBy(desc(table.createdAt))
    }

    const results = await query

    // Audit log
    await auditLogger.logSuccess(
      userId,
      "READ",
      resourceType,
      undefined,
      requestId,
      {
        count: results.length,
        filters: filters || {},
        operation: 'secureFind'
      }
    )

    return results

  } catch (error) {
    await auditLogger.logFailure(
      "READ",
      resourceType,
      error instanceof Error ? error.message : "Query failed",
      userId,
      undefined,
      undefined,
      requestId
    )
    throw error
  }
}

/**
 * Secure find by ID - verifies ownership before returning
 */
export async function secureFindById<T extends SecureResourceType>(
  resourceType: T,
  context: SecureQueryContext,
  resourceId: string
): Promise<unknown> {
  const { userId, requestId } = context
  const table = RESOURCE_TABLES[resourceType]

  if (!table) {
    throw new SecurityError(
      `Invalid resource type: ${resourceType}`,
      "INVALID_RESOURCE_TYPE",
      "SECURITY_001",
      userId,
      resourceId
    )
  }

  try {
    const result = await db
      .select()
      .from(table)
      .where(
        and(
          eq(table.id, resourceId),
          eq(table.userId, userId)
        )
      )
      .limit(1)

    if (result.length === 0) {
      throw new OwnershipViolationError(
        `${resourceType} not found or access denied`,
        userId,
        resourceId
      )
    }

    // Audit log
    await auditLogger.logSuccess(
      userId,
      "READ",
      resourceType,
      resourceId,
      requestId,
      { operation: 'secureFindById' }
    )

    return result[0]

  } catch (error) {
    if (error instanceof OwnershipViolationError) {
      await auditLogger.logViolation(
        "OWNERSHIP_VIOLATION",
        "READ",
        resourceType,
        `User ${userId} attempted to access ${resourceType} ${resourceId} without ownership`,
        userId,
        resourceId,
        requestId
      )
    } else {
      await auditLogger.logFailure(
        "READ",
        resourceType,
        error instanceof Error ? error.message : "Query failed",
        userId,
        resourceId,
        undefined,
        requestId
      )
    }
    throw error
  }
}

/**
 * Secure update - verifies ownership before allowing updates
 */
export async function secureUpdate<T extends SecureResourceType>(
  resourceType: T,
  context: SecureQueryContext,
  resourceId: string,
  updateData: Record<string, unknown>
): Promise<unknown> {
  const { userId, requestId, skipOwnershipCheck } = context
  const table = RESOURCE_TABLES[resourceType]

  if (!table) {
    throw new SecurityError(
      `Invalid resource type: ${resourceType}`,
      "INVALID_RESOURCE_TYPE",
      "SECURITY_001",
      userId,
      resourceId
    )
  }

  try {
    // First verify ownership (unless skipped for admin operations)
    if (!skipOwnershipCheck) {
      await secureFindById(resourceType, context, resourceId)
    }

    // Add updatedAt timestamp if the table has it
    const finalUpdateData = {
      ...updateData,
      ...(('updatedAt' in table) && { updatedAt: new Date() })
    }

    // Perform the update
    const result = await db
      .update(table)
      .set(finalUpdateData)
      .where(
        and(
          eq(table.id, resourceId),
          ...(!skipOwnershipCheck ? [eq(table.userId, userId)] : [])
        )
      )

    // Audit log
    await auditLogger.logSuccess(
      userId,
      "UPDATE",
      resourceType,
      resourceId,
      requestId,
      {
        operation: 'secureUpdate',
        updatedFields: Object.keys(updateData),
        skipOwnershipCheck
      }
    )

    return result

  } catch (error) {
    if (error instanceof OwnershipViolationError) {
      await auditLogger.logViolation(
        "OWNERSHIP_VIOLATION",
        "UPDATE",
        resourceType,
        `User ${userId} attempted to update ${resourceType} ${resourceId} without ownership`,
        userId,
        resourceId,
        requestId
      )
    } else {
      await auditLogger.logFailure(
        "UPDATE",
        resourceType,
        error instanceof Error ? error.message : "Update failed",
        userId,
        resourceId,
        undefined,
        requestId
      )
    }
    throw error
  }
}

/**
 * Secure delete - verifies ownership and handles cascading deletes
 */
export async function secureDelete<T extends SecureResourceType>(
  resourceType: T,
  context: SecureQueryContext,
  resourceId: string,
  cascadeOptions?: {
    deleteRelated?: boolean
    relatedResources?: string[]
  }
): Promise<unknown> {
  const { userId, requestId, skipOwnershipCheck } = context
  const table = RESOURCE_TABLES[resourceType]

  if (!table) {
    throw new SecurityError(
      `Invalid resource type: ${resourceType}`,
      "INVALID_RESOURCE_TYPE",
      "SECURITY_001",
      userId,
      resourceId
    )
  }

  try {
    // First verify ownership (unless skipped for admin operations)
    if (!skipOwnershipCheck) {
      await secureFindById(resourceType, context, resourceId)
    }

    // Handle cascading deletes for videos
    if (resourceType === 'video' && cascadeOptions?.deleteRelated) {
      // Delete related clip settings
      await db
        .delete(clipSettings)
        .where(eq(clipSettings.videoUploadId, resourceId))

      // Delete related processing jobs
      await db
        .delete(processingJobs)
        .where(eq(processingJobs.userId, userId))
        // Note: We filter by userId since processingJobs doesn't have direct videoUploadId
    }

    // Perform the main delete
    const result = await db
      .delete(table)
      .where(
        and(
          eq(table.id, resourceId),
          ...(!skipOwnershipCheck ? [eq(table.userId, userId)] : [])
        )
      )

    // Audit log
    await auditLogger.logSuccess(
      userId,
      "DELETE",
      resourceType,
      resourceId,
      requestId,
      {
        operation: 'secureDelete',
        cascadeOptions,
        skipOwnershipCheck
      }
    )

    return result

  } catch (error) {
    if (error instanceof OwnershipViolationError) {
      await auditLogger.logViolation(
        "OWNERSHIP_VIOLATION",
        "DELETE",
        resourceType,
        `User ${userId} attempted to delete ${resourceType} ${resourceId} without ownership`,
        userId,
        resourceId,
        requestId
      )
    } else {
      await auditLogger.logFailure(
        "DELETE",
        resourceType,
        error instanceof Error ? error.message : "Delete failed",
        userId,
        resourceId,
        undefined,
        requestId
      )
    }
    throw error
  }
}

/**
 * Secure insert - automatically adds userId and audit trail
 */
export async function secureInsert<T extends SecureResourceType>(
  resourceType: T,
  context: SecureQueryContext,
  data: Record<string, unknown>
): Promise<unknown> {
  const { userId, requestId } = context
  const table = RESOURCE_TABLES[resourceType]

  if (!table) {
    throw new SecurityError(
      `Invalid resource type: ${resourceType}`,
      "INVALID_RESOURCE_TYPE",
      "SECURITY_001",
      userId
    )
  }

  try {
    // Add userId and timestamps automatically
    const insertData = {
      ...data,
      userId,
      ...(('createdAt' in table) && { createdAt: new Date() }),
      ...(('updatedAt' in table) && { updatedAt: new Date() })
    }

    // Perform the insert
    const result = await db
      .insert(table)
      .values(insertData)
      .returning()

    const insertedRecord = result[0]
    const newResourceId = insertedRecord?.id || 'unknown'

    // Audit log
    await auditLogger.logSuccess(
      userId,
      "CREATE",
      resourceType,
      newResourceId,
      requestId,
      {
        operation: 'secureInsert',
        insertedFields: Object.keys(data)
      }
    )

    return insertedRecord

  } catch (error) {
    await auditLogger.logFailure(
      "CREATE",
      resourceType,
      error instanceof Error ? error.message : "Insert failed",
      userId,
      undefined,
      undefined,
      requestId
    )
    throw error
  }
}

/**
 * Secure bulk delete - verifies ownership of all resources before deletion
 */
export async function secureBulkDelete<T extends SecureResourceType>(
  resourceType: T,
  context: SecureQueryContext,
  resourceIds: string[]
): Promise<{ deletedCount: number; failedIds: string[] }> {
  const { userId, requestId } = context
  const table = RESOURCE_TABLES[resourceType]

  if (!table) {
    throw new SecurityError(
      `Invalid resource type: ${resourceType}`,
      "INVALID_RESOURCE_TYPE",
      "SECURITY_001",
      userId
    )
  }

  const failedIds: string[] = []
  let deletedCount = 0

  try {
    // First verify ownership of all resources
    const ownedResources = await db
      .select({ id: table.id })
      .from(table)
      .where(
        and(
          inArray(table.id, resourceIds),
          eq(table.userId, userId)
        )
      )

    const ownedIds = ownedResources.map(r => r.id)
    const unauthorizedIds = resourceIds.filter(id => !ownedIds.includes(id))

    // Log unauthorized attempts
    for (const unauthorizedId of unauthorizedIds) {
      failedIds.push(unauthorizedId)
      await auditLogger.logViolation(
        "OWNERSHIP_VIOLATION",
        "DELETE",
        resourceType,
        `Bulk delete attempted on unauthorized ${resourceType}`,
        userId,
        unauthorizedId,
        requestId
      )
    }

    // Delete only the owned resources
    if (ownedIds.length > 0) {
      await db
        .delete(table)
        .where(
          and(
            inArray(table.id, ownedIds),
            eq(table.userId, userId)
          )
        )

      deletedCount = ownedIds.length
    }

    // Audit log
    await auditLogger.logSuccess(
      userId,
      "DELETE",
      resourceType,
      undefined,
      requestId,
      {
        operation: 'secureBulkDelete',
        requestedCount: resourceIds.length,
        deletedCount,
        failedCount: failedIds.length,
        ownedIds,
        failedIds
      }
    )

    return { deletedCount, failedIds }

  } catch (error) {
    await auditLogger.logFailure(
      "DELETE",
      resourceType,
      error instanceof Error ? error.message : "Bulk delete failed",
      userId,
      undefined,
      undefined,
      requestId
    )
    throw error
  }
}

/**
 * Helper function to create secure query context
 */
export function createSecureContext(
  userId: string,
  requestId?: string,
  options?: { skipOwnershipCheck?: boolean }
): SecureQueryContext {
  return {
    userId,
    requestId: requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    skipOwnershipCheck: options?.skipOwnershipCheck || false
  }
}

// Export commonly used patterns
export const secureQueries = {
  find: secureFind,
  findById: secureFindById,
  update: secureUpdate,
  delete: secureDelete,
  insert: secureInsert,
  bulkDelete: secureBulkDelete,
  createContext: createSecureContext,
}