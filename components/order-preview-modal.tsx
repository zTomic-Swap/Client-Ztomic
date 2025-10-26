"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Intent } from "@/components/intent-store"

interface OrderPreviewModalProps {
  order: Intent
  userIdentity: any
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export default function OrderPreviewModal({
  order,
  userIdentity,
  onConfirm,
  onCancel,
  isLoading = false,
}: OrderPreviewModalProps) {
  const createdDate = new Date(order.createdAt)
  const timeAgo = Math.floor((Date.now() - createdDate.getTime()) / 1000)
  const timeAgoText =
    timeAgo < 60
      ? `${timeAgo}s ago`
      : timeAgo < 3600
        ? `${Math.floor(timeAgo / 60)}m ago`
        : `${Math.floor(timeAgo / 3600)}h ago`

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="border border-border bg-card p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold text-foreground mb-4">Confirm Order Selection</h2>

        <div className="space-y-4 mb-6">
          <div className="bg-secondary/50 rounded p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Initiator</span>
              <span className="text-sm font-medium text-foreground">{order.initiator}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Swap Pair</span>
              <span className="text-sm font-medium text-foreground">
                {order.fromToken} → {order.toToken}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-sm font-medium text-foreground">{order.amount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="text-sm font-medium text-foreground capitalize">{order.status}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm font-medium text-foreground">{timeAgoText}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Interested Parties</span>
              <span className="text-sm font-medium text-foreground">{order.interestedParties.length}</span>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              By joining this order, you'll become the counterparty and will need to deposit{" "}
              <span className="font-semibold">
                {order.amount} {order.toToken}
              </span>{" "}
              to complete the swap.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            disabled={isLoading}
            variant="outline"
            className="flex-1 border-border text-foreground hover:bg-secondary bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? "Joining..." : "Join Order"}
          </Button>
        </div>
      </Card>
    </div>
  )
}
