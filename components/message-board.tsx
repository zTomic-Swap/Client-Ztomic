"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export interface SwapMessage {
  id: number
  type: "event" | "deposit" | "message" | "status"
  sender?: string
  timestamp: Date
  message: string
  status: "pending" | "success" | "error"
}

interface MessageBoardProps {
  messages: SwapMessage[]
  onSendMessage?: (message: string) => void
  userIdentity: any
  swapStatus: string
}

export default function MessageBoard({ messages, onSendMessage, userIdentity, swapStatus }: MessageBoardProps) {
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (newMessage.trim() && onSendMessage) {
      onSendMessage(newMessage)
      setNewMessage("")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600 dark:text-green-400"
      case "error":
        return "text-red-600 dark:text-red-400"
      case "pending":
        return "text-yellow-600 dark:text-yellow-400"
      default:
        return "text-muted-foreground"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "event":
        return "⚡"
      case "deposit":
        return "💰"
      case "message":
        return "💬"
      case "status":
        return "✓"
      default:
        return "•"
    }
  }

  return (
    <Card className="border border-border bg-card p-6 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-foreground mb-4">Swap Activity</h3>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="text-xs border-l-2 border-muted pl-3 py-2 hover:bg-secondary/50 rounded transition-colors"
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{getTypeIcon(msg.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      {msg.sender && <span className="font-medium text-foreground truncate">{msg.sender}</span>}
                      <span className="text-muted-foreground">{msg.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <span className={`font-medium ${getStatusColor(msg.status)}`}>{msg.status}</span>
                  </div>
                  <p className="text-foreground break-words">{msg.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Status Footer */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground">Swap Status</span>
          <span className="text-xs font-semibold text-foreground capitalize bg-secondary px-2 py-1 rounded">
            {swapStatus}
          </span>
        </div>

        {/* Message Input */}
        {onSendMessage && swapStatus !== "completed" && (
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Send message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground text-xs"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Send
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
