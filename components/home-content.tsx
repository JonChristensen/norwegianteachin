"use client"

import { useUser } from "@auth0/nextjs-auth0/client"
import { useEffect, useState } from "react"

export function HomeContent() {
  const { user, isLoading } = useUser()
  
  // Add any state or effects that were in your original HomePage component
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {user ? (
        <div>
          <h1 className="text-3xl font-bold mb-6">Welcome, {user.name || user.email}!</h1>
          <p className="mb-4">
            Start practicing Norwegian verbs by going to the Exercises section.
          </p>
          {/* Add any other content that was in your original HomePage */}
        </div>
      ) : (
        <div>
          <h1 className="text-3xl font-bold mb-6">Welcome to Norwegian Flashcards</h1>
          <p className="mb-4">Please log in to access all features.</p>
          <div className="mt-6">
            <a 
              href="/api/auth/login" 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Log In
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
