"use client"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useIntentStore } from "@/components/intent-store"
import { useIntentSync } from "@/components/intent-store-sync"
import { useMemo } from "react"

interface OrderManagementProps {
  userIdentity: any
  onSelectOrder: (order: any) => void
}

export default function OrderManagement({ userIdentity, onSelectOrder }: OrderManagementProps) {
  // Use the sync hook for real-time updates
  useIntentSync();
  
  const intents = useIntentStore((state) => state.intents)
  const updateIntent = useIntentStore((state) => state.updateIntent)
  const selectCounterparty = useIntentStore((state) => state.selectCounterparty)

  const userIntents = useMemo(() => intents.filter((intent) => intent.initiator === userIdentity.identity), [
    intents,
    userIdentity.identity,
  ])

  const handleCancelOrder = async (orderId: number) => {
    await updateIntent(orderId, { status: "cancelled" })
  }

  const handleSelectCounterparty = async (intentId: number, counterparty: {identity: string, "on-chain": string}) => {
    await selectCounterparty(intentId, counterparty);
  }

  const handleViewOrder = (order: any) => {
    onSelectOrder(order)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">My Orders</h2>

      {userIntents.length === 0 ? (
        <Card className="border border-border bg-card p-6 text-center">
          <p className="text-muted-foreground">No orders created yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {userIntents.map((order) => (
            <Card key={order.id} className="border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {order.amount} {order.fromToken} → {order.toToken}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        order.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-700"
                          : order.status === "active"
                            ? "bg-blue-500/20 text-blue-700"
                            : order.status === "completed"
                              ? "bg-green-500/20 text-green-700"
                              : "bg-red-500/20 text-red-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Chain: {order["on-chain"]} • {order.interestedParties?.reduce((total, party) => total + (party.identity?.length || 0), 0) || 0} interested • Created{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                  {order.interestedParties && order.interestedParties.length > 0 && !order.selectedCounterparty && (
                    <div className="mt-2 text-xs">
                      <div className="mb-1 font-medium text-xs">Interested parties</div>
                      <div className="flex flex-wrap gap-2">
                        {order.interestedParties.map((party, partyIndex) => 
                          party.identity?.map((identity, identityIndex) => (
                            <button
                              key={`${partyIndex}-${identityIndex}`}
                              onClick={() => handleSelectCounterparty(order.id, {
                                identity,
                                "on-chain": party["on-chain"]?.[identityIndex] || party["on-chain"]?.[0]
                              })}
                              className={`text-xs px-2 py-1 rounded border border-border hover:bg-secondary/30`}
                            >
                              {identity} ({party["on-chain"]?.[identityIndex] || party["on-chain"]?.[0]})
                            </button>
                          )) || []
                        )}
                      </div>
                    </div>
                  )}
                  {order.selectedCounterparty && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Selected: {order.selectedCounterparty.identity} ({order.selectedCounterparty["on-chain"]})
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleViewOrder(order)}
                    variant="outline"
                    className="border-border text-foreground hover:bg-secondary"
                  >
                    View
                  </Button>
                  {order.status === "pending" && (
                    <Button
                      onClick={() => handleCancelOrder(order.id)}
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive/10"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}