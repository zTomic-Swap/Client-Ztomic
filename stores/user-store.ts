"use client"

import { create } from "zustand"

// Define the shape of the user's identity
interface UserIdentity {
  address: string
  identity: string
  pubKeyX: string
  pubKeyY: string
}

// Define the shape of the store's state and actions
interface UserStore {
  userIdentity: UserIdentity | null
  isConnected: boolean
  connect: (identity: UserIdentity) => void
  disconnect: () => void
}

/**
 * A Zustand store for managing the user's session and identity.
 */
export const useUserStore = create<UserStore>((set) => ({
  userIdentity: null,
  isConnected: false,
  /**
   * Sets the user's identity and marks them as connected.
   */
  connect: (identity) => set({ userIdentity: identity, isConnected: true }),
  /**
   * Clears the user's identity and marks them as disconnected.
   */
  disconnect: () => set({ userIdentity: null, isConnected: false }),
}))
