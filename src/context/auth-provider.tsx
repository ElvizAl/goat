"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useAuth, type User } from "@/hooks/use-auth"

type AuthContextType = {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }

  return context
}
