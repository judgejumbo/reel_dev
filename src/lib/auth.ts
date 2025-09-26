import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "./db"
import * as schema from "./schema"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  magicLinkToken: z.string().optional(),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        magicLinkToken: { label: "Magic Link Token", type: "text" },
      },
      async authorize(credentials) {
        try {
          const { email, password, magicLinkToken } = loginSchema.parse(credentials)

          // Fetch user from database
          const userResult = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.email, email))
            .limit(1)

          const user = userResult[0]

          if (!user) {
            return null
          }

          // Handle magic link authentication
          if (magicLinkToken) {
            // For magic link, we already validated the token in the API route
            // so we can trust this authentication
            return {
              id: user.id,
              email: user.email,
              name: user.name,
            }
          }

          // Handle password authentication
          if (password && user.password) {
            const passwordMatch = await bcrypt.compare(password, user.password)

            if (!passwordMatch) {
              return null
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
            }
          }

          // Neither magic link nor valid password provided
          return null

        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})