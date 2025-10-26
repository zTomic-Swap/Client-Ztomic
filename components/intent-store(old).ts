import { create } from "zustand"

export interface Intent {
  id: string
  initiator: string
  initiatorAddress: string
  fromToken: string
  toToken: string
  amount: number
  status: "pending" | "active" | "completed" | "cancelled"
  createdAt: string
  interestedParties: string[]
  selectedCounterparty?: string
}

interface IntentStore {
  intents: Intent[]
  userIntents: Intent[]
  addIntent: (intent: Intent) => void
  updateIntent: (id: string, updates: Partial<Intent>) => void
  addInterest: (intentId: string, userId: string) => void
  selectCounterparty: (intentId: string, counterpartyId: string) => void
  getUserIntents: (userId: string) => Intent[]
  getIntentById: (id: string) => Intent | undefined
}

export const useIntentStore = create<IntentStore>((set, get) => ({
  intents: [
    {
      id: "order-1",
      initiator: "alice.ztom",
      initiatorAddress: "0x1234...5678",
      fromToken: "zUSDC",
      toToken: "zUSDT",
      amount: 1,
      status: "pending",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      interestedParties: ["bob.ztom"],
    },
    {
      id: "order-2",
      initiator: "charlie.ztom",
      initiatorAddress: "0x9876...5432",
      fromToken: "zUSDT",
      toToken: "zUSDC",
      amount: 1,
      status: "pending",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      interestedParties: [],
    },
  ],
  userIntents: [],

  addIntent: (intent) =>
    set((state) => ({
      intents: [intent, ...state.intents],
    })),

  updateIntent: (id, updates) =>
    set((state) => ({
      intents: state.intents.map((intent) => (intent.id === id ? { ...intent, ...updates } : intent)),
    })),

  addInterest: (intentId, userId) =>
    set((state) => ({
      intents: state.intents.map((intent) =>
        intent.id === intentId
          ? {
              ...intent,
              interestedParties: intent.interestedParties.includes(userId)
                ? intent.interestedParties.filter((p) => p !== userId)
                : [...intent.interestedParties, userId],
            }
          : intent,
      ),
    })),

  selectCounterparty: (intentId, counterpartyId) =>
    set((state) => ({
      intents: state.intents.map((intent) =>
        intent.id === intentId ? { ...intent, selectedCounterparty: counterpartyId, status: "active" } : intent,
      ),
    })),

  getUserIntents: (userId) => {
    const state = get()
    return state.intents.filter((intent) => intent.initiator === userId)
  },

  getIntentById: (id) => {
    const state = get()
    return state.intents.find((intent) => intent.id === id)
  },
}))
