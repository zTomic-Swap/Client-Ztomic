"use client"

import { createContext, useContext } from "react"

// Define the shape of the identity data
export type UserIdentity = {
  address: string
  identity: string
  pubKeyX: string
  pubKeyY: string
} | null

// Define the shape of the object that the context will provide.
// This is the type that was causing the mismatch.
export interface UserIdentityContextType {
  userIdentity: UserIdentity
  connect: (identity: NonNullable<UserIdentity>) => void
  disconnect: () => void
}

// Create the context with the correct type: UserIdentityContextType
export const UserIdentityContext = createContext<UserIdentityContextType | undefined>(undefined)

// Create a custom hook for easier access, which also handles the undefined case.
export function useUserIdentity() {
  const context = useContext(UserIdentityContext)
  if (context === undefined) {
    throw new Error("useUserIdentity must be used within a UserIdentityContext.Provider")
  }
  return context
}

