CREATE TABLE "clip_settings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"video_upload_id" uuid NOT NULL,
	"start_time" numeric(10, 1) NOT NULL,
	"end_time" numeric(10, 1) NOT NULL,
	"duration" numeric(10, 1) NOT NULL,
	"output_format" varchar(50) DEFAULT 'mp4' NOT NULL,
	"output_resolution" varchar(50) DEFAULT '1080x1920' NOT NULL,
	"bitrate" integer DEFAULT 2000,
	"fps" integer DEFAULT 30,
	"audio_enabled" boolean DEFAULT true,
	"custom_filters" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processing_jobs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"video_upload_id" uuid NOT NULL,
	"clip_settings_id" uuid NOT NULL,
	"webhook_url" varchar(500),
	"external_job_id" varchar(255),
	"status" varchar(50) DEFAULT 'queued' NOT NULL,
	"progress" integer DEFAULT 0,
	"error_message" text,
	"output_video_url" varchar(500),
	"output_video_size" integer,
	"processing_time" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"monthly_price" numeric(10, 2),
	"yearly_price" numeric(10, 2),
	"max_uploads_per_month" integer,
	"max_file_size_mb" integer,
	"features" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_tracking" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"uploads_count" integer DEFAULT 0,
	"total_processing_time" integer DEFAULT 0,
	"total_storage_used" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" varchar(50) NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "video_uploads" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"main_video_url" varchar(500) NOT NULL,
	"main_video_filename" varchar(255) NOT NULL,
	"main_video_size" integer NOT NULL,
	"overlay_video_url" varchar(500),
	"overlay_video_filename" varchar(255),
	"overlay_video_size" integer,
	"duration" numeric(10, 2),
	"original_format" varchar(50),
	"original_resolution" varchar(50),
	"status" varchar(50) DEFAULT 'uploaded' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clip_settings" ADD CONSTRAINT "clip_settings_video_upload_id_video_uploads_id_fk" FOREIGN KEY ("video_upload_id") REFERENCES "public"."video_uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_jobs" ADD CONSTRAINT "processing_jobs_video_upload_id_video_uploads_id_fk" FOREIGN KEY ("video_upload_id") REFERENCES "public"."video_uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_jobs" ADD CONSTRAINT "processing_jobs_clip_settings_id_clip_settings_id_fk" FOREIGN KEY ("clip_settings_id") REFERENCES "public"."clip_settings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_tracking" ADD CONSTRAINT "usage_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_uploads" ADD CONSTRAINT "video_uploads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;