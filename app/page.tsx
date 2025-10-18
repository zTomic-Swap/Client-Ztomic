"use client"

import WalletConnect from "@/components/wallet-connect"
import Dashboard from "@/components/dashboard"
import { useUserIdentity } from "@/context/UserIdentityContext"
import { UserIdentity } from "@/context/UserIdentityContext"

export default function Home() {
  // Read state and functions from the global context instead of local state.
  const { userIdentity, connect, disconnect } = useUserIdentity()

  // This function now calls the global 'connect' function from the context.
  const handleWalletConnect = (identity: UserIdentity) => {
    if (identity) {
      connect(identity)
    }
  }

  // This function now calls the global 'disconnect' function.
  const handleDisconnect = () => {
    disconnect()
  }

  return (
    <main className="min-h-screen bg-background">
      {/* The view is now determined by the global userIdentity state */}
      {!userIdentity ? (
        <WalletConnect onConnect={handleWalletConnect} />
      ) : (
        <Dashboard />
      )}
    </main>
  )
}

