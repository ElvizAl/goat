"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { getUserSession, deleteUserSession } from "@/actions/user-actions"

export type User = {
  id: string
  name: string
  email: string
  role: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadUser() {
      try {
        const result = await getUserSession()
        setUser(result.success && result.data ? result.data : null)
      } catch (error) {
        console.error("Error loading user:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const logout = async () => {
    try {
      await deleteUserSession()
      setUser(null)
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const isAdmin = user?.role === "ADMIN"

  return {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
    isAdmin,
  }
}
