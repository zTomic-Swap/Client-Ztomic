import { create } from "zustand";

// 1. Use the same interface from your API lib
export interface Intent {
  id: number;
  initiator: string;
  initiatorAddress: string;
  fromToken: string;
  toToken: string;
  amount: number;
  status: "pending" | "active" | "completed" | "cancelled";
  createdAt: string;
  interestedParties: string[];
  selectedCounterparty?: string;
}

// 2. Update the store's interface
interface IntentStore {
  intents: Intent[];
  isLoading: boolean;
  error: string | null;
  fetchIntents: () => Promise<void>;
  addIntent: (newIntentData: Omit<Intent, "id" | "createdAt" | "status" | "interestedParties">) => Promise<Intent | undefined>;
  updateIntent: (id: number, updates: Partial<Intent>) => Promise<void>;
  addInterest: (intentId: number, userId: string) => Promise<void>;
  selectCounterparty: (intentId: number, counterpartyId: string) => Promise<void>;
  getUserIntents: (userId: string) => Intent[];
  getIntentById: (id: number) => Intent | undefined;
}

// 3. Create the store with API logic
export const useIntentStore = create<IntentStore>((set, get) => ({
  intents: [], // Start with an empty array
  isLoading: false,
  error: null,

  /**
   * GET: Fetch all intents from the API
   */
  fetchIntents: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/intents");
      if (!response.ok) throw new Error("Failed to fetch intents");
      const intents: Intent[] = await response.json();
      set({ intents, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  /**
   * POST: Create a new intent
   */
  addIntent: async (newIntentData) => {
    try {
      const response = await fetch("/api/intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIntentData),
      });
      if (!response.ok) throw new Error("Failed to create intent");
      
      const createdIntent: Intent = await response.json();
      
      // Add the new intent to the local state
      set((state) => ({
        intents: [createdIntent, ...state.intents],
      }));
      return createdIntent;
    } catch (e) {
      set({ error: (e as Error).message });
      return undefined;
    }
  },

  /**
   * PUT: Update a generic intent
   */
  updateIntent: async (id: number, updates) => {
    try {
      const response = await fetch(`/api/intents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update intent");
      
      const updatedIntent: Intent = await response.json();

      // Update the intent in the local state
      set((state) => ({
        intents: state.intents.map((intent) =>
          intent.id === id ? updatedIntent : intent
        ),
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  /**
   * PUT: Specific update for adding/removing interest
   */
  addInterest: async (intentId: number, userId: string) => {
    const state = get();
    const intent = state.intents.find((i) => i.id === intentId);
    if (!intent) return;

    // Toggle logic
    const newInterestedParties = intent.interestedParties.includes(userId)
      ? intent.interestedParties.filter((p) => p !== userId)
      : [...intent.interestedParties, userId];
    
    // Call the generic update function
    await state.updateIntent(intentId, { interestedParties: newInterestedParties });
  },

  /**
   * PUT: Specific update for selecting a counterparty
   */
  selectCounterparty: async (intentId: number, counterpartyId: string) => {
    const state = get();
    // Call the generic update function with the specific payload
    await state.updateIntent(intentId, {
      selectedCounterparty: counterpartyId,
      status: "active",
    });
  },

  // --- Selector functions (no change needed) ---
  getUserIntents: (userId: string) => {
    const state = get();
    return state.intents.filter((intent) => intent.initiator === userId);
  },

  getIntentById: (id: number) => {
    const state = get();
    return state.intents.find((intent) => intent.id === id);
  },
}));