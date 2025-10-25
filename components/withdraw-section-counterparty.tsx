"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Address, Hash } from "viem"
import { getEvents } from '../context/useZtomicDeposits'

interface WithdrawSectionProps {
  title: string
  token: string
  amount: number
  isUserWithdraw: boolean
  hasWithdrawn: boolean
  onWithdraw: (secret: string, leaves: Hash[], recipient: string) => void
  isLoading?: boolean
  counterpartyName?: string
  orderId?: string
  recipient?: string
}

export default function WithdrawSectionCounterparty({
  title,
  token,
  amount,
  isUserWithdraw,
  hasWithdrawn,
  onWithdraw,
  isLoading = false,
  counterpartyName,
  orderId,
  recipient
}: WithdrawSectionProps) {
  const [proof, setProof] = useState("")
  const [nullifierHash, setNullifierHash] = useState("")
  const [root, setRoot] = useState("")
  const [recipientAddr, setRecipientAddr] = useState<string>()
  const [secret, setSecret] = useState("");
  const [fetchedLeaves, setFetchedLeaves] = useState<Hash[]>();
 useEffect(() => {
handleFetchLeaves();

  }, [])

  const handleFetchLeaves = async () => {

    const leaves = await getEvents("0x63DFD07e625736bd20C62BD882e5D3475d8E0297");
    setFetchedLeaves(leaves);

  }

  const handleWithdraw = () => {
    if(fetchedLeaves && recipientAddr)
    onWithdraw(secret, fetchedLeaves, recipientAddr)
  }

  return (
    <Card className="border border-border bg-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {counterpartyName && !isUserWithdraw && (
            <p className="text-xs text-muted-foreground mt-1">{counterpartyName}</p>
          )}
        </div>
        <div
          className={`text-xs font-semibold px-3 py-1 rounded ${
            hasWithdrawn
              ? "bg-green-500/20 text-green-700 dark:text-green-400"
              : "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
          }`}
        >
          {hasWithdrawn ? "✓ Withdrawn" : "Pending"}
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-secondary/50 rounded p-3">
          <div className="text-xs text-muted-foreground mb-1">Available Amount</div>
          <div className="text-lg font-semibold text-foreground">
            {amount} <span className="text-sm text-muted-foreground">{token}</span>
          </div>
        </div>

        {isUserWithdraw && !hasWithdrawn ? (
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">Withdraw Proof (hex)</label>
              <div className="flex flex-col gap-2">
                {/* <Input
                  type="text"
                  placeholder={`Proof bytes (hex)`}
                  value={proof}
                  onChange={(e) => setProof(e.target.value)}
                  disabled={isLoading}
                  className="bg-secondary border-border text-foreground"
                /> */}

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="text"
                    placeholder={`Secret Key`}
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    disabled={isLoading}
                    className="bg-secondary border-border text-foreground"
                  />
                  {/* <Input
                    type="text"
                    placeholder={`Merkle Root`}
                    value={root}
                    onChange={(e) => setRoot(e.target.value)}
                    disabled={isLoading}
                    className="bg-secondary border-border text-foreground"
                  /> */}
                </div>

                <Input
                  type="text"
                  placeholder={`Recipient address (optional)`}
                  value={recipientAddr}
                  onChange={(e) => setRecipientAddr(e.target.value)}
                  disabled={isLoading}
                  className="bg-secondary border-border text-foreground"
                />

                <div className="flex justify-end">
                  <Button
                    onClick={handleWithdraw}
                    disabled={isLoading}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isLoading ? "Processing..." : "Withdraw"}
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Submit the zk-proof and public inputs to withdraw the funds on-chain.
            </p>
          </div>
        ) : (
          <div className="bg-secondary/50 rounded p-3">
            <p className="text-xs text-muted-foreground">
              {hasWithdrawn
                ? `Withdraw confirmed.`
                : `Waiting for ${counterpartyName || "counterparty"} to complete the withdraw proof...`}
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
