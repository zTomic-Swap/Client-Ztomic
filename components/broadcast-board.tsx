"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { useIntentStore } from "@/components/intent-store"

interface BroadcastBoardProps {
  userIdentity: any
}

export default function BroadcastBoard({ userIdentity }: BroadcastBoardProps) {
  const intents = useIntentStore((state) => state.intents)

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

  return (
    <Card className="border border-border bg-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Broadcast Board</h3>

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
                    <div className="text-xs text-muted-foreground mt-1">
                      {intent.interestedParties.length} interested
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-foreground">{intent.initiator}</span>
                      <span className="text-xs text-muted-foreground">{timeAgoText}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Selected counterparty: <span className="font-semibold">{intent.selectedCounterparty}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Swap: {intent.amount} {intent.fromToken} ↔ {intent.toToken}
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
