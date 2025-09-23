import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  integer,
  decimal,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"

// NextAuth.js Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"), // For credentials auth
})

// NextAuth.js Accounts table
export const accounts = pgTable("account", {
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
}, (account) => ({
  compoundKey: {
    name: "account_provider_providerAccountId_pk",
    columns: [account.provider, account.providerAccountId],
  },
}))

// NextAuth.js Sessions table
export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

// NextAuth.js Verification tokens table
export const verificationTokens = pgTable("verificationToken", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
}, (vt) => ({
  compoundKey: {
    name: "verificationToken_identifier_token_pk",
    columns: [vt.identifier, vt.token],
  },
}))

// Subscription plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 100 }).notNull(), // free, basic, pro, enterprise
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }),
  yearlyPrice: decimal("yearly_price", { precision: 10, scale: 2 }),
  maxUploadsPerMonth: integer("max_uploads_per_month"),
  maxFileSizeMB: integer("max_file_size_mb"),
  features: jsonb("features"), // Array of feature strings
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// User subscriptions
export const userSubscriptions = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull(),
  planId: uuid("plan_id").references(() => subscriptionPlans.id).notNull(),
  status: varchar("status", { length: 50 }).notNull(), // active, cancelled, expired
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Video uploads - Step 1 of workflow
export const videoUploads = pgTable("video_uploads", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull(),

  // Main video file
  mainVideoUrl: varchar("main_video_url", { length: 500 }).notNull(),
  mainVideoFilename: varchar("main_video_filename", { length: 255 }).notNull(),
  mainVideoSize: integer("main_video_size").notNull(), // bytes

  // Optional overlay video
  overlayVideoUrl: varchar("overlay_video_url", { length: 500 }),
  overlayVideoFilename: varchar("overlay_video_filename", { length: 255 }),
  overlayVideoSize: integer("overlay_video_size"), // bytes

  // Metadata
  duration: decimal("duration", { precision: 10, scale: 2 }), // seconds
  originalFormat: varchar("original_format", { length: 50 }),
  originalResolution: varchar("original_resolution", { length: 50 }),

  status: varchar("status", { length: 50 }).notNull().default("uploaded"), // uploaded, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Clip settings - Steps 2 & 3 of workflow
export const clipSettings = pgTable("clip_settings", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  videoUploadId: uuid("video_upload_id").references(() => videoUploads.id).notNull(),

  // Step 2: Clip length selection (0.1s precision)
  startTime: decimal("start_time", { precision: 10, scale: 1 }).notNull(), // seconds
  endTime: decimal("end_time", { precision: 10, scale: 1 }).notNull(), // seconds
  duration: decimal("duration", { precision: 10, scale: 1 }).notNull(), // seconds

  // Step 3: FFMPEG parameters
  outputFormat: varchar("output_format", { length: 50 }).notNull().default("mp4"),
  outputResolution: varchar("output_resolution", { length: 50 }).notNull().default("1080x1920"),
  bitrate: integer("bitrate").default(2000), // kbps
  fps: integer("fps").default(30),
  audioEnabled: boolean("audio_enabled").default(true),

  // Advanced FFMPEG options
  customFilters: text("custom_filters"), // JSON string of custom FFMPEG filters

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Processing jobs - Step 4 of workflow
export const processingJobs = pgTable("processing_jobs", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  videoUploadId: uuid("video_upload_id").references(() => videoUploads.id).notNull(),
  clipSettingsId: uuid("clip_settings_id").references(() => clipSettings.id).notNull(),

  // N8N webhook integration
  webhookUrl: varchar("webhook_url", { length: 500 }),
  externalJobId: varchar("external_job_id", { length: 255 }), // N8N job reference

  // Processing status
  status: varchar("status", { length: 50 }).notNull().default("queued"), // queued, processing, completed, failed
  progress: integer("progress").default(0), // 0-100
  errorMessage: text("error_message"),

  // Output
  outputVideoUrl: varchar("output_video_url", { length: 500 }),
  outputVideoSize: integer("output_video_size"), // bytes
  processingTime: integer("processing_time"), // seconds

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
})

// Usage tracking for subscription limits
export const usageTracking = pgTable("usage_tracking", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull(),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  uploadsCount: integer("uploads_count").default(0),
  totalProcessingTime: integer("total_processing_time").default(0), // seconds
  totalStorageUsed: integer("total_storage_used").default(0), // bytes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Export types for use in the application
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type VideoUpload = typeof videoUploads.$inferSelect
export type NewVideoUpload = typeof videoUploads.$inferInsert

export type ClipSettings = typeof clipSettings.$inferSelect
export type NewClipSettings = typeof clipSettings.$inferInsert

export type ProcessingJob = typeof processingJobs.$inferSelect
export type NewProcessingJob = typeof processingJobs.$inferInsert

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect
export type UserSubscription = typeof userSubscriptions.$inferSelect
export type UsageTracking = typeof usageTracking.$inferSelect