"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface WalletConnectProps {
  onConnect: (identity: { address: string; identity: string; pubKeyX: string; pubKeyY: string }) => void
}

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  const [step, setStep] = useState<"wallet" | "identity">("wallet")
  const [walletAddress, setWalletAddress] = useState("")
  const [identityName, setIdentityName] = useState("")

  const handleWalletConnect = () => {
    if (walletAddress.trim()) {
      setStep("identity")
    }
  }

  const handleIdentityCreate = () => {
    if (identityName.trim()) {
      // Generate mock public keys
      const pubKeyX = Math.random().toString(36).substring(2, 15)
      const pubKeyY = Math.random().toString(36).substring(2, 15)

      onConnect({
        address: walletAddress,
        identity: identityName,
        pubKeyX,
        pubKeyY,
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-border bg-card">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">ZK Privacy Swap</h1>
            <p className="text-sm text-muted-foreground">Private atomic stablecoin swaps</p>
          </div>

          {step === "wallet" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Wallet Address</label>
                <Input
                  type="text"
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Button
                onClick={handleWalletConnect}
                disabled={!walletAddress.trim()}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Connect Wallet
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Identity Name</label>
                <Input
                  type="text"
                  placeholder="e.g., yash.ztom"
                  value={identityName}
                  onChange={(e) => setIdentityName(e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Wallet: {walletAddress.substring(0, 10)}...</p>
              </div>
              <Button
                onClick={handleIdentityCreate}
                disabled={!identityName.trim()}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Create Identity
              </Button>
              <Button
                onClick={() => setStep("wallet")}
                variant="outline"
                className="w-full border-border text-foreground hover:bg-secondary"
              >
                Back
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
