"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount } from "wagmi"

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
  const [authMode, setAuthMode] = useState<"register" | "login">("register") // New state for login/register
  const [walletAddress, setWalletAddress] = useState("")
  const [identityName, setIdentityName] = useState("")
  const [secretValue, setSecretValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { address, isConnected } = useAccount();

  // const handleWalletConnect = () => {
  //   if (walletAddress.trim()) {
  //     setStep("identity")
  //   }
  // }

  useEffect(() => {
    if (isConnected && address) {
      setStep("identity");
    }
  },[isConnected])

  /**
   * Handles the REGISTER flow by creating a new user and generating keys.
   */
  const handleIdentityCreate = async () => {
    if (!identityName.trim() || !secretValue.trim()) return

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
        const errorData = await response.json()
        throw new Error(errorData.error || "An unknown error occurred.")
      }

      const newUser: UserKey = await response.json()

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

  /**
   * Handles the LOGIN flow by fetching an existing user's data.
   */
  const handleLogin = async () => {
    if (!identityName.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch the user by their identity name
      const response = await fetch(`/api/users/${encodeURIComponent(identityName)}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Identity not found. Please check the name or register.")
        }
        const errorData = await response.json()
        throw new Error(errorData.error || "Login failed.")
      }

      const existingUser: UserKey = await response.json()

      onConnect({
        address: walletAddress, // We still need the wallet address from the first step
        identity: existingUser.userName,
        pubKeyX: existingUser.pubKeyX,
        pubKeyY: existingUser.pubKeyY,
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
              {/* <Button
                onClick={handleWalletConnect}
                disabled={!walletAddress.trim()}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-3"
              >
                Connect Wallet
              </Button> */}
              <ConnectButton/>
            </div>
          ) : (
            <div>
              {/* Auth Mode Toggle */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Button
                  onClick={() => setAuthMode("register")}
                  variant={authMode === "register" ? "default" : "outline"}
                  className="w-full"
                >
                  Register
                </Button>
                <Button
                  onClick={() => setAuthMode("login")}
                  variant={authMode === "login" ? "default" : "outline"}
                  className="w-full"
                >
                  Login
                </Button>
              </div>

              {/* Identity Name Input (Shared) */}
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

              {/* REGISTER FORM */}
              {authMode === "register" && (
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
              )}

              <div className="text-xs text-muted-foreground mt-2">
                <p>Wallet: {walletAddress.substring(0, 10)}...</p>
              </div>

              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

              {/* DYNAMIC SUBMIT BUTTON */}
              {authMode === "register" ? (
                <Button
                  onClick={handleIdentityCreate}
                  disabled={!identityName.trim() || !secretValue.trim() || isLoading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-3"
                >
                  {isLoading ? "Creating Identity..." : "Create Identity"}
                </Button>
              ) : (
                <Button
                  onClick={handleLogin}
                  disabled={!identityName.trim() || isLoading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-3"
                >
                  {isLoading ? "Logging In..." : "Login"}
                </Button>
              )}

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

