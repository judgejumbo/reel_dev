export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  interval: "month" | "year"
  features: string[]
  limits: {
    videoUploads: number
    maxVideoSize: number // in MB
    processingTime: number // in minutes
    priority: "low" | "normal" | "high"
  }
}

export interface UserSubscription {
  id: string
  userId: string
  planId: string
  status: "active" | "cancelled" | "expired" | "pending"
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SubscriptionUsage {
  userId: string
  period: {
    start: Date
    end: Date
  }
  usage: {
    videoUploads: number
    processingMinutes: number
    storageUsed: number // in MB
  }
  limits: {
    videoUploads: number
    processingTime: number
    storageLimit: number
  }
}