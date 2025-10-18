"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import DepositSection from "@/components/deposit-section"
import MessageBoard, { type SwapMessage } from "@/components/message-board"
import DepositTracker from "@/components/deposit-tracker"
import EventLog from "@/components/event-log"
import { useEventMonitor, type DepositRecord } from "@/components/event-monitor"
import { UserIdentity } from "@/context/UserIdentityContext"
import { useIntentStore } from "@/components/intent-store"

interface PrivateSwapProps {
  order: any
  userRole: "initiator" | "counterparty" | null
  userIdentity: any
}

interface CounterpartyIdentity {
  userName: string
  pubKeyX: string
  pubKeyY: string
}

function createId() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID()
  } catch (e) {
    // ignore
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}

export default function PrivateSwap({ order, userRole, userIdentity }: PrivateSwapProps) {
  const [userADeposited, setUserADeposited] = useState(false)
  const [userBDeposited, setUserBDeposited] = useState(false)
  const [messages, setMessages] = useState<SwapMessage[]>([])
  const [swapStatus, setSwapStatus] = useState("awaiting_deposits")
  const [isDepositing, setIsDepositing] = useState(false)
  const [messageCount, setMessageCount] = useState(0)

  const intents = useIntentStore((state) => state.intents)
  const [counterpartyIdentity, setCounterpartyIdentity] = useState<CounterpartyIdentity | null>(null)
  const [counterpartyStatus, setCounterpartyStatus] = useState<"loading" | "found" | "error">("loading")

  const addDeposit = useEventMonitor((state) => state.addDeposit)
  const addEvent = useEventMonitor((state) => state.addEvent)

  useEffect(() => {
    const currentOrder = intents.find((i) => i.id === order.id)

    if (!currentOrder) {
      console.error("Swap order details not found in global state.")
      setCounterpartyStatus("error")
      return
    }

    // --- LOGIC FIX: Correctly identify the counterparty for BOTH roles ---
    const counterpartyName = currentOrder.selectedCounterparty;

    if (counterpartyName) {
      setCounterpartyStatus("loading")
      const fetchCounterpartyData = async () => {
        try {
          const response = await fetch(`/api/users/${encodeURIComponent(counterpartyName)}`);
          if (!response.ok) {
            throw new Error("Counterparty not found.")
          }

          const data: CounterpartyIdentity = await response.json()
          console.log("response data", data)
          setCounterpartyIdentity(data)

          console.log("counterparty Identity", counterpartyIdentity)

          setCounterpartyStatus("found")
        } catch (error) {
          console.error("Error fetching counterparty:", error)
          setCounterpartyStatus("error")
        }
      }
      fetchCounterpartyData()
    } else {
      console.error("Counterparty name is missing from the order object.")
      setCounterpartyStatus("error")
    }
  }, [])

  useEffect(() => {
    const initialMessages: SwapMessage[] = [
      { id: 1, type: "event", timestamp: new Date(Date.now() - 5000), message: "Swap contract initialized", status: "success" },
      { id: 2, type: "status", timestamp: new Date(Date.now() - 3000), message: "Awaiting deposits from both parties", status: "pending" },
    ]
    setMessages(initialMessages)
    setMessageCount(2)

    addEvent({
      id: createId(),
      swapId: order.id,
      type: "swap_initiated",
      user: order.initiator,
      amount: order.amount,
      token: order.fromToken,
      txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
      blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
      timestamp: new Date(),
      status: "confirmed",
    })
  }, [order, addEvent])

  const handleDeposit = (amount: string) => {
    if (userRole === "initiator" && counterpartyIdentity) {
      console.log("Creating commitment using counterparty public keys:")
      console.log("Counterparty Key X:", counterpartyIdentity.pubKeyX)
      console.log("Counterparty Key Y:", counterpartyIdentity.pubKeyY)
    }

    setIsDepositing(true)
    setTimeout(() => {
      const depositId = createId()
      const txHash = `0x${Math.random().toString(16).substring(2, 66)}`
      const token = userRole === "initiator" ? order.fromToken : order.toToken
      const user = userRole === "initiator" ? order.initiatorAddress : userIdentity.address

      const depositRecord: DepositRecord = { id: depositId, swapId: order.id, user, token, amount: Number.parseFloat(amount), txHash, timestamp: new Date(), status: "pending" }
      addDeposit(depositRecord)
      addEvent({ id: createId(), swapId: order.id, type: "deposit", user, amount: Number.parseFloat(amount), token, txHash, blockNumber: Math.floor(Math.random() * 1000000) + 18000000, timestamp: new Date(), status: "pending" })

      const newMessage: SwapMessage = { id: messageCount + 1, type: "deposit", sender: userRole === "initiator" ? "You (Initiator)" : "You (Counterparty)", timestamp: new Date(), message: `Deposited ${amount} ${token}`, status: "success" }
      setMessages((prev) => [...prev, newMessage])
      setMessageCount((prev) => prev + 1)

      if (userRole === "initiator") setUserADeposited(true)
      else setUserBDeposited(true)

      setIsDepositing(false)

      setTimeout(() => {
        const bothDeposited = (userRole === "initiator" && userBDeposited) || (userRole === "counterparty" && userADeposited)
        if (bothDeposited) {
          setSwapStatus("completed")
          const completionMessage: SwapMessage = { id: messageCount + 2, type: "event", timestamp: new Date(), message: "Swap completed successfully! Tokens exchanged.", status: "success" }
          setMessages((prev) => [...prev, completionMessage])
          setMessageCount((prev) => prev + 1)
          addEvent({ id: createId(), swapId: order.id, type: "swap_completed", user: userIdentity.address, amount: Number.parseFloat(amount), token, txHash: `0x${Math.random().toString(16).substring(2, 66)}`, blockNumber: Math.floor(Math.random() * 1000000) + 18000000, timestamp: new Date(), status: "confirmed" })
        }
      }, 2000)
    }, 800)
  }

  const handleSendMessage = (text: string) => {
    const newMessage: SwapMessage = { id: messageCount + 1, type: "message", sender: userIdentity.identity, timestamp: new Date(), message: text, status: "success" }
    setMessages((prev) => [...prev, newMessage])
    setMessageCount((prev) => prev + 1)
  }

  const getCounterpartyName = () => {
    if (counterpartyStatus === "loading") return "Loading..."
    if (counterpartyStatus === "error") return "Unknown"
    return counterpartyIdentity?.userName || "Unknown"
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Swap Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Initiator</p>
            <p className="text-sm font-medium text-foreground">{order.initiator}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Counterparty</p>
            <p className="text-sm font-medium text-foreground">{getCounterpartyName()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Swap Pair</p>
            <p className="text-sm font-medium text-foreground">{order.fromToken} → {order.toToken}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Amount</p>
            <p className="text-sm font-medium text-foreground">{order.amount}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <DepositSection title={userRole === "initiator" ? "Your Deposit" : `${order.initiator}'s Deposit`} token={order.fromToken} amount={order.amount} isUserDeposit={userRole === "initiator"} hasDeposited={userADeposited} onDeposit={handleDeposit} isLoading={isDepositing} counterpartyName={order.initiator} />
          <DepositSection title={userRole === "counterparty" ? "Your Deposit" : `${getCounterpartyName()}'s Deposit`} token={order.toToken} amount={order.amount} isUserDeposit={userRole === "counterparty"} hasDeposited={userBDeposited} onDeposit={handleDeposit} isLoading={isDepositing} counterpartyName={getCounterpartyName()} />
          <DepositTracker swapId={order.id} userAddress={userRole === "initiator" ? order.initiatorAddress : userIdentity.address} counterpartyAddress={counterpartyIdentity?.userName || ""} initiatorToken={order.fromToken} counterpartyToken={order.toToken} />
        </div>

        <div className="lg:col-span-1 space-y-4">
          <MessageBoard messages={messages} onSendMessage={handleSendMessage} userIdentity={userIdentity} swapStatus={swapStatus} />
          <EventLog swapId={order.id} />
        </div>
      </div>

      {swapStatus === "completed" && (
        <Card className="border border-green-500/20 bg-green-500/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">✓</div>
              <div>
                <h3 className="font-semibold text-green-700 dark:text-green-400">Swap Completed</h3>
                <p className="text-sm text-green-600 dark:text-green-500 mt-1">Your tokens have been successfully exchanged on-chain.</p>
              </div>
            </div>
            <Button variant="outline" className="border-border text-foreground hover:bg-secondary bg-transparent">View on Explorer</Button>
          </div>
        </Card>
      )}
    </div>
  )
}

