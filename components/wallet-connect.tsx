"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

// The UserKey type should match the one in your API lib for consistency
interface UserKey {
  userName: string
  pubKeyX: string
  pubKeyY: string
}

interface WalletConnectProps {
  onConnect: (identity: { address: string; identity: string; pubKeyX: string; pubKeyY: string }) => void
}

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  const [step, setStep] = useState<"wallet" | "identity">("wallet")
  const [walletAddress, setWalletAddress] = useState("")
  const [identityName, setIdentityName] = useState("")
  const [secretValue, setSecretValue] = useState("") // New state for the secret
  const [isLoading, setIsLoading] = useState(false) // New state for loading
  const [error, setError] = useState<string | null>(null) // New state for errors

  const handleWalletConnect = () => {
    if (walletAddress.trim()) {
      setStep("identity")
    }
  }

  /**
   * Handles calling the API to create the user and generate keys.
   */
  const handleIdentityCreate = async () => {
    // Ensure both fields are filled
    if (!identityName.trim() || !secretValue.trim()) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: identityName,
          secretValue: secretValue,
        }),
      })

      if (!response.ok) {
        // If the server returns an error (e.g., user exists), display it
        const errorData = await response.json()
        throw new Error(errorData.error || "An unknown error occurred.")
      }

      const newUser: UserKey = await response.json()

      // On success, call the onConnect prop with data from the API response
      onConnect({
        address: walletAddress,
        identity: newUser.userName,
        pubKeyX: newUser.pubKeyX,
        pubKeyY: newUser.pubKeyY,
      })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-border bg-card">
        <div className="p-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-1">Ztomic Swap</h1>
            <p className="text-sm text-muted-foreground">Private atomic stablecoin swaps</p>
          </div>

          {step === "wallet" ? (
            <div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Wallet Address</label>
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
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-3"
              >
                Connect Wallet
              </Button>
            </div>
          ) : (
            <div>
              {/* Identity Name Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Identity Name</label>
                <Input
                  type="text"
                  placeholder="e.g., yash.ztom"
                  value={identityName}
                  onChange={(e) => setIdentityName(e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              {/* Secret Value Input */}
              <div className="mt-2">
                <label className="block text-sm font-medium text-foreground mb-1">Secret Phrase</label>
                <Input
                  type="password"
                  placeholder="A secret phrase to generate your keys"
                  value={secretValue}
                  onChange={(e) => setSecretValue(e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="text-xs text-muted-foreground mt-2">
                <p>Wallet: {walletAddress.substring(0, 10)}...</p>
              </div>

              {/* Error Display */}
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

              {/* Create Button */}
              <Button
                onClick={handleIdentityCreate}
                disabled={!identityName.trim() || !secretValue.trim() || isLoading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-3"
              >
                {isLoading ? "Creating Identity..." : "Create Identity"}
              </Button>

              {/* Back Button */}
              <Button
                onClick={() => setStep("wallet")}
                variant="outline"
                className="w-full border-border text-foreground hover:bg-secondary mt-2"
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

