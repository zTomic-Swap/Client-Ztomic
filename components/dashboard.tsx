"use client"

import { useState, useEffect } from "react"
import { useIntentStore } from "@/components/intent-store"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import CreateIntent from "@/components/create-intent"
import BrowseOrders from "@/components/browse-orders"
import OrderManagement from "@/components/order-management"
import PrivateSwap from "@/components/private-swap"
import { useUserIdentity } from "@/context/UserIdentityContext" // 1. Import the hook

// 2. The component no longer needs to define or receive props for identity
type View = "home" | "create" | "browse" | "manage" | "swap"

export default function Dashboard() {
  // 3. Get identity and disconnect function directly from the global context
  const { userIdentity, disconnect } = useUserIdentity()

  const [currentView, setCurrentView] = useState<View>("home")
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [userRole, setUserRole] = useState<"initiator" | "counterparty" | null>(null)
  const [suppressAutoOpen, setSuppressAutoOpen] = useState(false)
  const intents = useIntentStore((s) => s.intents)
  const fetchIntents = useIntentStore((s) => s.fetchIntents)
  const isLoading = useIntentStore((s) => s.isLoading)
  const error = useIntentStore((s) => s.error)

  useEffect(() => {
    if (!userIdentity) return
    if (suppressAutoOpen) return

    const matched = intents.find((i) => i.selectedCounterparty?.identity === userIdentity.identity && i.status === "active")
    if (matched) {
      if (selectedOrder?.id !== matched.id) {
        setSelectedOrder(matched)
        setUserRole(matched.initiator === userIdentity.identity ? "initiator" : "counterparty")
        setCurrentView("swap")
      }
    }
  }, [intents, userIdentity, selectedOrder, suppressAutoOpen])

  useEffect(() => {
    fetchIntents()
  }, [fetchIntents])

  const handleCreateIntent = (intent: any) => {
    if (intent.selectedCounterparty?.identity) {
      setSelectedOrder(intent)
      setUserRole("initiator")
      setCurrentView("swap")
    }
  }

  const handleSelectOrder = (order: any) => {
    setSelectedOrder(order)
    setUserRole(order.initiator === userIdentity?.identity ? "initiator" : "counterparty")
    setCurrentView("swap")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading orders...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
        <Button onClick={fetchIntents} variant="outline" className="ml-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">ZK Privacy Swap</h1>
            {/* --- MODIFICATION START --- */}
            {userIdentity && (
              <div className="mt-1">
                <p className="text-sm font-medium text-foreground">{userIdentity.identity}</p>
                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  <p>Key X: {userIdentity.pubKeyX}</p>
                  <p>Key Y: {userIdentity.pubKeyY}</p>
                </div>
              </div>
            )}
            {/* --- MODIFICATION END --- */}
          </div>
          {/* 4. Use the disconnect function from the context */}
          <Button
            onClick={disconnect}
            variant="outline"
            className="border-border text-foreground hover:bg-secondary bg-transparent"
          >
            Disconnect
          </Button>
        </div>
      </header>
      {/* If user suppressed auto-open... */}
      {suppressAutoOpen && userIdentity && (
        <div className="max-w-7xl mx-auto px-4 py-2">
          {intents.some((i) => i.selectedCounterparty?.identity === userIdentity.identity && i.status === "active") && (
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  const matched = intents.find((i) => i.selectedCounterparty?.identity === userIdentity.identity && i.status === "active")
                  if (matched) {
                    setSelectedOrder(matched)
                    setUserRole(matched.initiator === userIdentity.identity ? "initiator" : "counterparty")
                    setCurrentView("swap")
                    setSuppressAutoOpen(false)
                  }
                }}
                variant="ghost"
                className="text-sm border-border"
              >
                Open selected swap
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {currentView === "home" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              className="border border-border bg-card p-6 cursor-pointer hover:bg-secondary transition-colors"
              onClick={() => setCurrentView("create")}
            >
              <h2 className="text-lg font-semibold text-foreground mb-2">Create Intent</h2>
              <p className="text-sm text-muted-foreground">Initiate a new swap order</p>
            </Card>
            <Card
              className="border border-border bg-card p-6 cursor-pointer hover:bg-secondary transition-colors"
              onClick={() => setCurrentView("browse")}
            >
              <h2 className="text-lg font-semibold text-foreground mb-2">Browse Orders</h2>
              <p className="text-sm text-muted-foreground">Find and join existing swaps</p>
            </Card>
            <Card
              className="border border-border bg-card p-6 cursor-pointer hover:bg-secondary transition-colors"
              onClick={() => setCurrentView("manage")}
            >
              <h2 className="text-lg font-semibold text-foreground mb-2">My Orders</h2>
              <p className="text-sm text-muted-foreground">Manage your created intents</p>
            </Card>
          </div>
        )}

        {currentView === "create" && (
          <div>
            <Button
              onClick={() => setCurrentView("home")}
              variant="outline"
              className="mb-4 border-border text-foreground hover:bg-secondary"
            >
              ← Back
            </Button>
            <CreateIntent onIntentCreated={handleCreateIntent} userIdentity={userIdentity} />
          </div>
        )}

        {currentView === "browse" && (
          <div>
            <Button
              onClick={() => setCurrentView("home")}
              variant="outline"
              className="mb-4 border-border text-foreground hover:bg-secondary"
            >
              ← Back
            </Button>
            <BrowseOrders onSelectOrder={handleSelectOrder} userIdentity={userIdentity} />
          </div>
        )}

        {currentView === "manage" && (
          <div>
            <Button
              onClick={() => setCurrentView("home")}
              variant="outline"
              className="mb-4 border-border text-foreground hover:bg-secondary"
            >
              ← Back
            </Button>
            <OrderManagement onSelectOrder={handleSelectOrder} userIdentity={userIdentity} />
          </div>
        )}

        {currentView === "swap" && selectedOrder && (
          <div>
            <Button
              onClick={() => {
                setSuppressAutoOpen(true)
                setCurrentView("home")
                setSelectedOrder(null)
                setUserRole(null)
              }}
              variant="outline"
              className="mb-4 border-border text-foreground hover:bg-secondary"
            >
              ← Back
            </Button>
            <PrivateSwap order={selectedOrder} userRole={userRole} userIdentity={userIdentity} />
          </div>
        )}
      </div>
    </div>
  )
}

