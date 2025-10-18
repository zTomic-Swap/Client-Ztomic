"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface DepositSectionProps {
  title: string
  token: string
  amount: number
  isUserDeposit: boolean
  hasDeposited: boolean
  onDeposit: (amount: string) => void
  isLoading?: boolean
  counterpartyName?: string
}

export default function DepositSection({
  title,
  token,
  amount,
  isUserDeposit,
  hasDeposited,
  onDeposit,
  isLoading = false,
  counterpartyName,
}: DepositSectionProps) {
  const [depositAmount, setDepositAmount] = useState("")

  const handleDeposit = () => {
    if (depositAmount) {
      onDeposit(depositAmount)
      setDepositAmount("")
    }
  }

  return (
    <Card className="border border-border bg-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {counterpartyName && !isUserDeposit && (
            <p className="text-xs text-muted-foreground mt-1">{counterpartyName}</p>
          )}
        </div>
        <div
          className={`text-xs font-semibold px-3 py-1 rounded ${
            hasDeposited
              ? "bg-green-500/20 text-green-700 dark:text-green-400"
              : "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
          }`}
        >
          {hasDeposited ? "✓ Deposited" : "Pending"}
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-secondary/50 rounded p-3">
          <div className="text-xs text-muted-foreground mb-1">Required Amount</div>
          <div className="text-lg font-semibold text-foreground">
            {amount} <span className="text-sm text-muted-foreground">{token}</span>
          </div>
        </div>

        {isUserDeposit && !hasDeposited ? (
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">Deposit Amount</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={`${amount}`}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  disabled={isLoading}
                  className="bg-secondary border-border text-foreground"
                />
                <Button
                  onClick={handleDeposit}
                  disabled={!depositAmount || isLoading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isLoading ? "..." : "Deposit"}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              You will deposit {amount} {token} to complete this swap
            </p>
          </div>
        ) : (
          <div className="bg-secondary/50 rounded p-3">
            <p className="text-xs text-muted-foreground">
              {hasDeposited
                ? `Deposit confirmed. Waiting for counterparty...`
                : `Waiting for ${counterpartyName || "counterparty"} to deposit...`}
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
