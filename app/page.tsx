"use client"

import { useState } from "react"
import WalletConnect from "@/components/wallet-connect"
import Dashboard from "@/components/dashboard"

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [userIdentity, setUserIdentity] = useState<{
    address: string
    identity: string
    pubKeyX: string
    pubKeyY: string
  } | null>(null)

  const handleWalletConnect = (identity: { address: string; identity: string; pubKeyX: string; pubKeyY: string }) => {
    setUserIdentity(identity)
    setIsConnected(true)
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setUserIdentity(null)
  }

  return (
    <main className="min-h-screen bg-background">
      {!isConnected ? (
        <WalletConnect onConnect={handleWalletConnect} />
      ) : (
        <Dashboard userIdentity={userIdentity} onDisconnect={handleDisconnect} />
      )}
    </main>
  )
}
