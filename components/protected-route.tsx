"use client"

import type React from "react"

import { useUser } from "@auth0/nextjs-auth0/client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, error } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user && !error) {
      // Redirect to Auth0 login - update the path
      window.location.href = "/api/auth/login"
    }
  }, [user, isLoading, error, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">Error: {error.message}</div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in the useEffect
  }

  return <>{children}</>
}

