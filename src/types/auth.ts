export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  subscription: SubscriptionType
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  user: User
  token: string
  expiresAt: Date
}

export type SubscriptionType = "free" | "basic" | "pro" | "enterprise"

export interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
}