"use client"

import { ReactNode } from "react"
import { UserProvider } from "@auth0/nextjs-auth0/client"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  )
}


