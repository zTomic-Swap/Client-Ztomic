"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { useEventMonitor, type OnChainEvent } from "@/components/event-monitor"

interface EventLogProps {
  swapId: string
}

export default function EventLog({ swapId }: EventLogProps) {
  const [swapEvents, setSwapEvents] = useState<OnChainEvent[]>([])
  const events = useEventMonitor((state) => state.events)

  useEffect(() => {
    const filtered = useEventMonitor.getState().getSwapEvents(swapId)
    setSwapEvents(filtered)
  }, [events, swapId])

  const getEventIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return "💰"
      case "withdrawal":
        return "🔄"
      case "swap_initiated":
        return "🚀"
      case "swap_completed":
        return "✓"
      case "error":
        return "⚠️"
      default:
        return "•"
    }
  }

  const getEventColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-green-600 dark:text-green-400"
      case "pending":
        return "text-yellow-600 dark:text-yellow-400"
      case "failed":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card className="border border-border bg-card p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">On-Chain Events</h3>

      {swapEvents.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No events recorded yet</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {swapEvents.map((event) => (
            <div
              key={event.id}
              className="border-l-2 border-muted pl-3 py-2 hover:bg-secondary/50 rounded transition-colors"
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{getEventIcon(event.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground capitalize">{event.type.replace("_", " ")}</span>
                      <span className={`font-medium text-xs ${getEventColor(event.status)}`}>{event.status}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{event.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {event.amount} {event.token} • Block {event.blockNumber}
                  </p>
                  {event.txHash && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      TX: {event.txHash.substring(0, 16)}...
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
