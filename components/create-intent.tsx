"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useIntentStore } from "@/components/intent-store"
import BroadcastBoard from "@/components/broadcast-board"

interface CreateIntentProps {
  onIntentCreated: (intent: any) => void
  userIdentity: any
}

export default function CreateIntent({ onIntentCreated, userIdentity }: CreateIntentProps) {
  const [fromToken, setFromToken] = useState("zUSDC")
  const [toToken, setToToken] = useState("zUSDT")
  const [amount, setAmount] = useState("1")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIntentId, setSelectedIntentId] = useState<number | null>(null)
  const [showCounterpartySelection, setShowCounterpartySelection] = useState(false)

  const addIntent = useIntentStore((state) => state.addIntent)
  const intents = useIntentStore((state) => state.intents)
  const selectCounterparty = useIntentStore((state) => state.selectCounterparty)

  const userIntents = intents.filter((intent) => intent.initiator === userIdentity.identity)

  const handleCreate = async () => {
    setIsLoading(true)
    try {
      const intent = {
        initiator: userIdentity.identity,
        initiatorAddress: userIdentity.address,
        fromToken,
        toToken,
        amount: Number.parseFloat(amount),
        status: "pending" as const,
        interestedParties: [],
      }

      console.log("Creating intent:", intent);

      const response = await fetch("/api/intents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(intent),
      });

      if (!response.ok) {
        throw new Error("Failed to create intent");
      }

      const savedIntent = await response.json();
      addIntent(savedIntent)
      setSelectedIntentId(savedIntent.id)
      setShowCounterpartySelection(true)
      setIsLoading(false)
    } catch (e) {
      console.error(e);
    }
  }

  const handleSelectCounterparty = (intentId: number, counterpartyId: string) => {
    selectCounterparty(intentId, counterpartyId)
    const selectedIntent = intents.find((i) => i.id === intentId)
    if (selectedIntent) {
      onIntentCreated(selectedIntent)
    }
    setShowCounterpartySelection(false)
    setSelectedIntentId(null)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Create Intent Form */}
      <div className="lg:col-span-1">
        <Card className="border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">Create Swap Intent</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">From Token</label>
              <select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className="w-full bg-secondary border border-border text-foreground rounded px-3 py-2"
              >
                <option>zUSDC</option>
                <option>zUSDT</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">To Token</label>
              <select
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                className="w-full bg-secondary border border-border text-foreground rounded px-3 py-2"
              >
                <option>zUSDT</option>
                <option>zUSDC</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Amount</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-secondary border-border text-foreground"
                disabled
              />
              <p className="text-xs text-muted-foreground mt-1">Fixed denomination: 1 {fromToken}</p>
            </div>

            <Button
              onClick={handleCreate}
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? "Creating..." : "Create Intent"}
            </Button>
          </div>
        </Card>
      </div>

      {/* My Intents & Counterparty Selection */}
      <div className="lg:col-span-2 space-y-6">
        {userIntents.length > 0 && (
          <Card className="border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">My Intents</h3>
            <div className="space-y-4">
              {userIntents.map((intent) => (
                <div key={intent.id} className="border border-border/50 rounded p-4 bg-secondary/30">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground mb-1">
                        {intent.amount} {intent.fromToken} → {intent.toToken}
                      </div>
                      <div className="text-xs text-muted-foreground">ID: {intent.id.toString()}</div>
                    </div>
                    <div className="text-xs font-semibold text-foreground bg-secondary px-2 py-1 rounded">
                      {intent.status}
                    </div>
                  </div>

                  {intent.interestedParties.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground font-semibold">
                        Interested parties ({intent.interestedParties.length}):
                      </div>
                      <div className="space-y-2">
                        {intent.interestedParties.map((party) => (
                          <div key={party} className="flex items-center justify-between bg-background/50 rounded p-2">
                            <span className="text-sm text-foreground">{party}</span>
                            {!intent.selectedCounterparty && (
                              <Button
                                onClick={() => handleSelectCounterparty(intent.id, party)}
                                size="sm"
                                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
                              >
                                Select
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground italic">Waiting for interested parties...</div>
                  )}

                  {intent.selectedCounterparty && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="text-xs text-muted-foreground font-semibold mb-1">Selected Counterparty:</div>
                      <div className="text-sm font-semibold text-foreground">{intent.selectedCounterparty}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Broadcast Board */}
        <BroadcastBoard userIdentity={userIdentity} />
      </div>
    </div>
  )
}
