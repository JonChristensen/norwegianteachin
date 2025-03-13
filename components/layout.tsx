"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useUser } from "@auth0/nextjs-auth0/client"
import { Menu, X, BookOpen, LogOut, Home, Plus, List } from "lucide-react"
import { cn } from "../lib/utils"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, isLoading } = useUser()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/exercise", label: "Practice", icon: BookOpen },
    { href: "/vocabulary", label: "Vocabulary", icon: List },
    // ... other nav items ...
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2 font-bold text-xl">
                <BookOpen className="h-6 w-6" />
                <span>Norwegian Teachin</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {user && (
                <>
                  <Link href="/" className="flex items-center space-x-1 hover:text-blue-200 transition-colors">
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </Link>
                  <Link
                    href="/exercise/nor-to-eng"
                    className="flex items-center space-x-1 hover:text-blue-200 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Exercise</span>
                  </Link>
                  <Link href="/vocabulary" className="hover:text-blue-200 transition-colors">
                    Vocabulary List
                  </Link>
                  <div className="border-l border-blue-400 h-6 mx-2"></div>
                  <span className="text-blue-100">Welcome, {user.name || user.email}!</span>
                  <a
                    href="/api/auth/logout"
                    className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </a>
                </>
              )}

              {!user && !isLoading && (
                <a
                  href="/api/auth/login"
                  className="flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded-md transition-colors"
                >
                  <span>Login</span>
                </a>
              )}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md hover:bg-blue-700 focus:outline-none"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "md:hidden transition-all duration-300 ease-in-out overflow-hidden",
            isMenuOpen ? "max-h-60" : "max-h-0",
          )}
        >
          <div className="px-4 py-3 space-y-3 bg-blue-700">
            {user && (
              <>
                <Link
                  href="/"
                  className="block px-3 py-2 rounded-md hover:bg-blue-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/exercise/nor-to-eng"
                  className="block px-3 py-2 rounded-md hover:bg-blue-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  New Exercise
                </Link>
                <Link
                  href="/vocabulary"
                  className="block px-3 py-2 rounded-md hover:bg-blue-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Vocabulary List
                </Link>
                <div className="border-t border-blue-600 my-2"></div>
                <div className="px-3 py-2 text-blue-200">Welcome, {user.name || user.email}!</div>
                <a
                  href="/api/auth/logout"
                  className="block px-3 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Logout
                </a>
              </>
            )}

            {!user && !isLoading && (
              <a
                href="/api/auth/login"
                className="block px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">{children}</main>

      <footer className="bg-gray-100 border-t border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 mb-4 md:mb-0">Norwegian Flashcards App © 2025</p>
            <p className="text-gray-600">
              We also have a helpful Norwegian{" "}
              <a
                href="https://chat.openai.com"
                className="text-blue-600 hover:text-blue-800 font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                learning GPT
              </a>{" "}
              on ChatGPT.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

