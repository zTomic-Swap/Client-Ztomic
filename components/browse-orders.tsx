"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useIntentStore, type Intent } from "@/components/intent-store"
import { useIntentSync } from "@/components/intent-store-sync"
import OrderFilters, { type SortOption, type TokenFilter } from "@/components/order-filters"
import OrderPreviewModal from "@/components/order-preview-modal"
import BroadcastBoard from "@/components/broadcast-board"

interface BrowseOrdersProps {
  onSelectOrder: (order: any) => void
  userIdentity: any
}

function BrowseOrders({ onSelectOrder, userIdentity }: BrowseOrdersProps) {
  const [userInterests, setUserInterests] = useState<Set<string>>(new Set())
  const [selectedChain, setSelectedChain] = useState("hedera")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [tokenFilter, setTokenFilter] = useState<TokenFilter>("all")
  const [selectedOrderForPreview, setSelectedOrderForPreview] = useState<Intent | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  // Use the sync hook for real-time updates
  useIntentSync();

  const intents = useIntentStore((state) => state.intents)
  const addInterest = useIntentStore((state) => state.addInterest)

  // Update userInterests based on intents changes
  useEffect(() => {
    setUserInterests(new Set(
      intents
        .filter(intent => intent.interestedParties?.some(party => 
          party.identity?.includes(userIdentity.identity)
        ))
        .map(intent => intent.id.toString())
    ));
  }, [intents, userIdentity.identity]);

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = intents.filter(
      (order) => order.initiator !== userIdentity.identity && order.status === "pending" && !order.selectedCounterparty,
    )

    if (tokenFilter !== "all") {
      filtered = filtered.filter((order) => order.fromToken === tokenFilter || order.toToken === tokenFilter)
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else {
        const aInterested = a.interestedParties?.reduce((total, party) => total + (party.identity?.length || 0), 0) || 0
        const bInterested = b.interestedParties?.reduce((total, party) => total + (party.identity?.length || 0), 0) || 0
        return bInterested - aInterested
      }
    })

    return sorted
  }, [intents, userIdentity.identity, tokenFilter, sortBy])

  const handleShowInterest = useCallback(
    async (orderId: number) => {
      await addInterest(orderId, userIdentity.identity, selectedChain);
    },
    [addInterest, userIdentity.identity, selectedChain],
  )

  const handlePreviewOrder = useCallback((order: Intent) => {
    setSelectedOrderForPreview(order)
  }, [])

  const handleConfirmSelection = useCallback(() => {
    if (!selectedOrderForPreview) return
    setIsConfirming(true)
    setTimeout(() => {
      onSelectOrder(selectedOrderForPreview)
      setSelectedOrderForPreview(null)
      setIsConfirming(false)
    }, 500)
  }, [selectedOrderForPreview, onSelectOrder])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Available Orders</h2>
          <div className="flex items-center gap-4 mb-4">
            <p className="text-sm text-muted-foreground">
              Found {filteredAndSortedOrders.length} order{filteredAndSortedOrders.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Chain:</label>
              <select
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
                className="text-sm bg-secondary border border-border text-foreground rounded px-2 py-1"
              >
                <option value="hedera">Hedera</option>
                <option value="sepolia">Sepolia</option>
              </select>
            </div>
          </div>
        </div>

        <OrderFilters
          onSortChange={setSortBy}
          onTokenFilterChange={setTokenFilter}
          currentSort={sortBy}
          currentFilter={tokenFilter}
        />

        {filteredAndSortedOrders.length === 0 ? (
          <Card className="border border-border bg-card p-6 text-center">
            <p className="text-muted-foreground">No orders match your filters</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedOrders.map((order) => {
              const createdDate = new Date(order.createdAt)
              const timeAgo = Math.floor((Date.now() - createdDate.getTime()) / 1000)
              const timeAgoText =
                timeAgo < 60
                  ? `${timeAgo}s ago`
                  : timeAgo < 3600
                    ? `${Math.floor(timeAgo / 60)}m ago`
                    : `${Math.floor(timeAgo / 3600)}h ago`

              return (
                <Card
                  key={order.id}
                  className="border border-border bg-card p-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-foreground">{order.initiator}</span>
                            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                              #{order.id.toString()}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">{timeAgoText}</div>
                        </div>
                      </div>

                      <div className="bg-secondary/50 rounded p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <div className="text-center flex-1">
                            <div className="text-xs text-muted-foreground mb-1">From</div>
                            <div className="text-sm font-semibold text-foreground">{order.amount}</div>
                            <div className="text-xs text-muted-foreground">{order.fromToken}</div>
                          </div>
                          <div className="text-muted-foreground mx-2">→</div>
                          <div className="text-center flex-1">
                            <div className="text-xs text-muted-foreground mb-1">To</div>
                            <div className="text-sm font-semibold text-foreground">{order.amount}</div>
                            <div className="text-xs text-muted-foreground">{order.toToken}</div>
                          </div>
                        </div>
                        <div className="text-center mt-2">
                          <div className="text-xs text-muted-foreground">Original Chain: {order["on-chain"]}</div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">You can show interest on any chain</div>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {order.interestedParties?.reduce((total, party) => total + (party.identity?.length || 0), 0) || 0} interested{" "}
                        {(order.interestedParties?.reduce((total, party) => total + (party.identity?.length || 0), 0) || 0) !== 1 ? "parties" : "party"}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        onClick={() => handleShowInterest(order.id)}
                        variant={userInterests.has(order.id.toString()) ? "default" : "outline"}
                        className={
                          userInterests.has(order.id.toString())
                            ? "bg-primary text-primary-foreground"
                            : "border-border text-foreground hover:bg-secondary"
                        }
                      >
                        {userInterests.has(order.id.toString()) ? "✓ Interested" : `Show Interest on ${selectedChain}`}
                      </Button>
                      {userInterests.has(order.id.toString()) && (
                        <Button
                          onClick={() => handlePreviewOrder(order)}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Join
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {selectedOrderForPreview && (
          <OrderPreviewModal
            order={selectedOrderForPreview}
            userIdentity={userIdentity}
            onConfirm={handleConfirmSelection}
            onCancel={() => setSelectedOrderForPreview(null)}
            isLoading={isConfirming}
          />
        )}
      </div>

      <div className="lg:col-span-1">
        <BroadcastBoard userIdentity={userIdentity} />
      </div>
    </div>
  )
}

export default BrowseOrders