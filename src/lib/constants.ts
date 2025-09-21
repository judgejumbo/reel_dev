export const APP_NAME = "Reel Dev"
export const APP_DESCRIPTION = "Convert horizontal videos to vertical format for social media"

export const VIDEO_FORMATS = {
  INPUT: {
    MAX_SIZE: 500 * 1024 * 1024, // 500MB
    ALLOWED_TYPES: ["video/mp4", "video/webm", "video/quicktime"]
  },
  OUTPUT: {
    WIDTH: 1080,
    HEIGHT: 1920,
    FORMAT: "mp4"
  }
} as const

export const SUBSCRIPTION_TIERS = {
  FREE: "free",
  BASIC: "basic",
  PRO: "pro",
  ENTERPRISE: "enterprise"
} as const