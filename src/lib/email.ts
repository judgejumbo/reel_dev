import { Resend } from "resend"

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

// Email configuration
const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev"
const APP_NAME = "ReelRift"
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000"

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send an email using Resend
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [to],
      subject,
      html,
      text: text || stripHtml(html), // Fallback to stripped HTML if no text provided
    })

    if (error) {
      console.error("Email send error:", error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Email send error:", error)
    throw error
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const subject = `Reset your ${APP_NAME} password`
  const html = generatePasswordResetHtml(resetUrl)

  return sendEmail({
    to: email,
    subject,
    html,
  })
}

/**
 * Send magic link email
 */
export async function sendMagicLinkEmail(email: string, magicUrl: string) {
  const subject = `Sign in to ${APP_NAME}`
  const html = generateMagicLinkHtml(magicUrl, email)

  return sendEmail({
    to: email,
    subject,
    html,
  })
}

/**
 * Send email verification email
 */
export async function sendEmailVerificationEmail(email: string, verifyUrl: string) {
  const subject = `Verify your ${APP_NAME} email`
  const html = generateEmailVerificationHtml(verifyUrl, email)

  return sendEmail({
    to: email,
    subject,
    html,
  })
}

/**
 * Generate password reset email HTML
 */
function generatePasswordResetHtml(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
    <!-- Header -->
    <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #10b981;">
      <h1 style="margin: 0; color: #10b981; font-size: 28px;">${APP_NAME}</h1>
    </div>

    <!-- Content -->
    <div style="padding: 30px 20px;">
      <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>

      <p style="margin-bottom: 20px; font-size: 16px;">
        We received a request to reset your password. Click the button below to create a new password:
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="display: inline-block; background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Reset Password</a>
      </div>

      <p style="margin-bottom: 15px; font-size: 14px; color: #666;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="word-break: break-all; font-size: 14px; color: #666; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">
        ${resetUrl}
      </p>

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        This link will expire in 1 hour for security reasons.
      </p>

      <p style="margin-top: 20px; font-size: 14px; color: #666;">
        If you didn't request this password reset, you can safely ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #e5e5e5; padding: 20px; text-align: center; font-size: 12px; color: #999;">
      <p style="margin: 0;">${APP_NAME} - Video Repurposing Made Simple</p>
      <p style="margin: 5px 0 0 0;">
        <a href="${APP_URL}" style="color: #10b981; text-decoration: none;">${APP_URL}</a>
      </p>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Generate magic link email HTML
 */
function generateMagicLinkHtml(magicUrl: string, email: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to ${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
    <!-- Header -->
    <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #10b981;">
      <h1 style="margin: 0; color: #10b981; font-size: 28px;">${APP_NAME}</h1>
    </div>

    <!-- Content -->
    <div style="padding: 30px 20px;">
      <h2 style="color: #333; margin-bottom: 20px;">Sign in to ${APP_NAME}</h2>

      <p style="margin-bottom: 20px; font-size: 16px;">
        Click the button below to sign in as <strong>${email}</strong>:
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${magicUrl}" style="display: inline-block; background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Sign In</a>
      </div>

      <p style="margin-bottom: 15px; font-size: 14px; color: #666;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="word-break: break-all; font-size: 14px; color: #666; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">
        ${magicUrl}
      </p>

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        This link will expire in 15 minutes for security reasons.
      </p>

      <p style="margin-top: 20px; font-size: 14px; color: #666;">
        If you didn't request this sign-in link, you can safely ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #e5e5e5; padding: 20px; text-align: center; font-size: 12px; color: #999;">
      <p style="margin: 0;">${APP_NAME} - Video Repurposing Made Simple</p>
      <p style="margin: 5px 0 0 0;">
        <a href="${APP_URL}" style="color: #10b981; text-decoration: none;">${APP_URL}</a>
      </p>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Generate email verification HTML
 */
function generateEmailVerificationHtml(verifyUrl: string, email: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
    <!-- Header -->
    <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #10b981;">
      <h1 style="margin: 0; color: #10b981; font-size: 28px;">${APP_NAME}</h1>
    </div>

    <!-- Content -->
    <div style="padding: 30px 20px;">
      <h2 style="color: #333; margin-bottom: 20px;">Welcome to ${APP_NAME}! 🎉</h2>

      <p style="margin-bottom: 20px; font-size: 16px;">
        Thank you for signing up! Please verify your email address <strong>${email}</strong> to get started:
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="display: inline-block; background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Verify Email</a>
      </div>

      <p style="margin-bottom: 15px; font-size: 14px; color: #666;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="word-break: break-all; font-size: 14px; color: #666; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">
        ${verifyUrl}
      </p>

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        This link will expire in 24 hours for security reasons.
      </p>

      <p style="margin-top: 20px; font-size: 14px; color: #666;">
        If you didn't create this account, you can safely ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #e5e5e5; padding: 20px; text-align: center; font-size: 12px; color: #999;">
      <p style="margin: 0;">${APP_NAME} - Video Repurposing Made Simple</p>
      <p style="margin: 5px 0 0 0;">
        <a href="${APP_URL}" style="color: #10b981; text-decoration: none;">${APP_URL}</a>
      </p>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Strip HTML tags from a string (simple fallback for text version)
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
}