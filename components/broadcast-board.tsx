"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useIntentStore } from "@/components/intent-store"

interface BroadcastBoardProps {
  userIdentity: any
}

export default function BroadcastBoard({ userIdentity }: BroadcastBoardProps) {
  const intents = useIntentStore((state) => state.intents)
  const addInterest = useIntentStore((state) => state.addInterest)
  const [selectedChain, setSelectedChain] = useState("hedera")

  const broadcasts = useMemo(() => {
    if (!intents || intents.length === 0) return []

    return intents
      .filter((intent) => intent.status === "pending" || intent.status === "active")
      .map((intent) => ({
        type: intent.selectedCounterparty ? "selection" : "intent",
        intent,
        timestamp: intent.createdAt,
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [intents])

  const handleShowInterest = async (intentId: number) => {
    await addInterest(intentId, userIdentity.identity, selectedChain)
  }

  const isUserInterested = (intent: any) => {
    return intent.interestedParties?.some((party: any) => 
      party.identity?.includes(userIdentity.identity)
    ) || false
  }

  return (
    <Card className="border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Broadcast Board</h3>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Chain:</label>
          <select
            value={selectedChain}
            onChange={(e) => setSelectedChain(e.target.value)}
            className="text-xs bg-secondary border border-border text-foreground rounded px-2 py-1"
          >
            <option value="hedera">Hedera</option>
            <option value="sepolia">Sepolia</option>
          </select>
        </div>
      </div>

      {broadcasts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No broadcasts yet</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {broadcasts.map((broadcast) => {
            const { intent } = broadcast
            const createdDate = new Date(intent.createdAt)
            const timeAgo = Math.floor((Date.now() - createdDate.getTime()) / 1000)
            const timeAgoText =
              timeAgo < 60
                ? `${timeAgo}s ago`
                : timeAgo < 3600
                  ? `${Math.floor(timeAgo / 60)}m ago`
                  : `${Math.floor(timeAgo / 3600)}h ago`

            const totalInterested = intent.interestedParties?.reduce((total, party) => total + (party.identity?.length || 0), 0) || 0
            const userIsInterested = isUserInterested(intent)

            return (
              <div
                key={`${intent.id}-${broadcast.type}`}
                className="border border-border/50 rounded p-3 bg-secondary/30 text-sm"
              >
                {broadcast.type === "intent" ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-foreground">{intent.initiator}</span>
                      <span className="text-xs text-muted-foreground">{timeAgoText}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created intent: {intent.amount} {intent.fromToken} → {intent.toToken}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      Chain: {intent["on-chain"]} | {totalInterested} interested
                    </div>
                    {intent.initiator !== userIdentity.identity && (
                      <Button
                        onClick={() => handleShowInterest(intent.id)}
                        size="sm"
                        variant={userIsInterested ? "secondary" : "default"}
                        className="text-xs"
                      >
                        {userIsInterested ? "Remove Interest" : "Show Interest"}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-foreground">{intent.initiator}</span>
                      <span className="text-xs text-muted-foreground">{timeAgoText}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Selected counterparty: <span className="font-semibold">{intent.selectedCounterparty?.identity}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Chain: {intent.selectedCounterparty?.["on-chain"]} | Swap: {intent.amount} {intent.fromToken} ↔ {intent.toToken}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
