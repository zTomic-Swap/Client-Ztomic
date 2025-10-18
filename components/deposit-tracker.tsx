"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { useEventMonitor, type DepositRecord } from "@/components/event-monitor"

interface DepositTrackerProps {
  swapId: string
  userAddress: string
  counterpartyAddress: string
  initiatorToken: string
  counterpartyToken: string
}

export default function DepositTracker({
  swapId,
  userAddress,
  counterpartyAddress,
  initiatorToken,
  counterpartyToken,
}: DepositTrackerProps) {
  const [userDeposit, setUserDeposit] = useState<DepositRecord | null>(null)
  const [counterpartyDeposit, setCounterpartyDeposit] = useState<DepositRecord | null>(null)

  const deposits = useEventMonitor((state) => state.deposits)

  useEffect(() => {
    const userDep = useEventMonitor.getState().getDepositStatus(swapId, userAddress)
    const counterpartyDep = useEventMonitor.getState().getDepositStatus(swapId, counterpartyAddress)

    setUserDeposit(userDep || null)
    setCounterpartyDeposit(counterpartyDep || null)
  }, [deposits, swapId, userAddress, counterpartyAddress])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/20 text-green-700 dark:text-green-400"
      case "pending":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
      case "failed":
        return "bg-red-500/20 text-red-700 dark:text-red-400"
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400"
    }
  }

  return (
    <Card className="border border-border bg-card p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">Deposit Verification</h3>

      <div className="space-y-4">
        {/* User Deposit */}
        <div className="bg-secondary/50 rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-muted-foreground">Your Deposit</p>
              <p className="text-sm font-medium text-foreground">{initiatorToken}</p>
            </div>
            {userDeposit ? (
              <div className="text-right">
                <p className={`text-xs font-semibold px-2 py-1 rounded ${getStatusBadge(userDeposit.status)}`}>
                  {userDeposit.status}
                </p>
                {userDeposit.txHash && (
                  <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">
                    {userDeposit.txHash.substring(0, 10)}...
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Not deposited</p>
            )}
          </div>
          {userDeposit && (
            <p className="text-xs text-muted-foreground">
              {userDeposit.amount} {userDeposit.token} • {userDeposit.timestamp.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Counterparty Deposit */}
        <div className="bg-secondary/50 rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-muted-foreground">Counterparty Deposit</p>
              <p className="text-sm font-medium text-foreground">{counterpartyToken}</p>
            </div>
            {counterpartyDeposit ? (
              <div className="text-right">
                <p className={`text-xs font-semibold px-2 py-1 rounded ${getStatusBadge(counterpartyDeposit.status)}`}>
                  {counterpartyDeposit.status}
                </p>
                {counterpartyDeposit.txHash && (
                  <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">
                    {counterpartyDeposit.txHash.substring(0, 10)}...
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Not deposited</p>
            )}
          </div>
          {counterpartyDeposit && (
            <p className="text-xs text-muted-foreground">
              {counterpartyDeposit.amount} {counterpartyDeposit.token} •{" "}
              {counterpartyDeposit.timestamp.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Verification Status */}
        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground mb-2">Verification Status</p>
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-2 h-2 rounded-full ${userDeposit?.status === "confirmed" ? "bg-green-500" : "bg-gray-400"}`}
                />
                <span className="text-xs text-foreground">Your deposit</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-2 h-2 rounded-full ${counterpartyDeposit?.status === "confirmed" ? "bg-green-500" : "bg-gray-400"}`}
                />
                <span className="text-xs text-foreground">Counterparty deposit</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
