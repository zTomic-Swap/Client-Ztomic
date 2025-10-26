import { create } from "zustand"

export interface OnChainEvent {
  id: string
  swapId: string
  type: "deposit" | "withdrawal" | "swap_initiated" | "swap_completed" | "error"
  user: string
  amount: number
  token: string
  txHash: string
  blockNumber: number
  timestamp: Date
  status: "pending" | "confirmed" | "failed"
}

export interface DepositRecord {
  id: string
  swapId: string
  user: string
  token: string
  amount: number
  txHash: string
  timestamp: Date
  status: "pending" | "confirmed" | "failed"
}

interface EventMonitorStore {
  events: OnChainEvent[]
  deposits: DepositRecord[]
  addEvent: (event: OnChainEvent) => void
  addDeposit: (deposit: DepositRecord) => void
  updateEventStatus: (eventId: string, status: "pending" | "confirmed" | "failed") => void
  updateDepositStatus: (depositId: string, status: "pending" | "confirmed" | "failed") => void
  getSwapEvents: (swapId: string) => OnChainEvent[]
  getSwapDeposits: (swapId: string) => DepositRecord[]
  getDepositStatus: (swapId: string, user: string) => DepositRecord | undefined
}

export const useEventMonitor = create<EventMonitorStore>((set, get) => ({
  events: [],
  deposits: [],

  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events],
    })),

  addDeposit: (deposit) =>
    set((state) => ({
      deposits: [deposit, ...state.deposits],
    })),

  updateEventStatus: (eventId, status) =>
    set((state) => ({
      events: state.events.map((event) => (event.id === eventId ? { ...event, status } : event)),
    })),

  updateDepositStatus: (depositId, status) =>
    set((state) => ({
      deposits: state.deposits.map((deposit) => (deposit.id === depositId ? { ...deposit, status } : deposit)),
    })),

  getSwapEvents: (swapId) => {
    const state = get()
    return state.events.filter((event) => event.swapId === swapId)
  },

  getSwapDeposits: (swapId) => {
    const state = get()
    return state.deposits.filter((deposit) => deposit.swapId === swapId)
  },

  getDepositStatus: (swapId, user) => {
    const state = get()
    return state.deposits.find((deposit) => deposit.swapId === swapId && deposit.user === user)
  },
}))
