"use client"

import { useState } from "react"
import { UserIdentityContext, type UserIdentity } from "@/context/UserIdentityContext"

/**
 * This is a Client Component that manages the state for our UserIdentityContext.
 */
export default function AppProvider({ children }: { children: React.ReactNode }) {
  const [userIdentity, setUserIdentity] = useState<UserIdentity>(null)

  const connect = (identity: NonNullable<UserIdentity>) => {
    setUserIdentity(identity)
  }

  const disconnect = () => {
    setUserIdentity(null)
  }

  // The value object contains both the state and the functions to update it.
  const value = { userIdentity, connect, disconnect }

  return (
    <UserIdentityContext.Provider value={value}>
      {children}
    </UserIdentityContext.Provider>
  )
}
