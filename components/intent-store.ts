import { create } from "zustand";

// 1. Use the same interface from your API lib
export interface Intent {
  id: number;
  initiator: string;
  fromToken: string;
  toToken: string;
  "on-chain": string;
  amount: string;
  status: "pending" | "active" | "completed" | "cancelled";
  createdAt: string;
  interestedParties: {identity: string[], "on-chain": string[]}[];
  selectedCounterparty?: {identity: string, "on-chain": string};
}

// 2. Update the store's interface
interface IntentStore {
  intents: Intent[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: number;
  isFetching: boolean;
  fetchIntents: () => Promise<void>;
  addIntent: (newIntentData: Omit<Intent, "id" | "createdAt" | "status" | "interestedParties">) => Promise<Intent | undefined>;
  updateIntent: (id: number, updates: Partial<Intent>) => Promise<void>;
  addInterest: (intentId: number, userId: string, userChain: string) => Promise<void>;
  selectCounterparty: (intentId: number, counterparty: {identity: string, "on-chain": string}) => Promise<void>;
  getUserIntents: (userId: string) => Intent[];
  getIntentById: (id: number) => Intent | undefined;
}

// 3. Create the store with API logic
export const useIntentStore = create<IntentStore>((set, get) => ({
  intents: [], // Start with an empty array
  isLoading: false,
  error: null,
  lastUpdate: 0,
  isFetching: false,

  /**
   * GET: Fetch all intents from the API
   */
  fetchIntents: async () => {
    const state = get();
    // Prevent multiple simultaneous fetches
    if (state.isFetching) return;
    
    // Only fetch if 2 seconds have passed since last update
    const now = Date.now();
    if (now - state.lastUpdate < 2000) return;

    set({ isFetching: true, error: null });
    try {
      const response = await fetch("/api/intents");
      if (!response.ok) throw new Error("Failed to fetch intents");
      const intents: Intent[] = await response.json();
      set({ intents, isLoading: false, lastUpdate: now, isFetching: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false, isFetching: false });
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
      
      // Add the new intent to the local state and update timestamp
      set((state) => ({
        intents: [createdIntent, ...state.intents],
        lastUpdate: Date.now()
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

      // Update the intent in the local state and update timestamp
      set((state) => ({
        intents: state.intents.map((intent) =>
          intent.id === id ? updatedIntent : intent
        ),
        lastUpdate: Date.now()
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  /**
   * PUT: Specific update for adding/removing interest
   */
  addInterest: async (intentId: number, userId: string, userChain: string) => {
    const state = get();
    const intent = state.intents.find((i) => i.id === intentId);
    if (!intent) return;

    // Check if user is already interested
    const existingPartyIndex = intent.interestedParties.findIndex(
      party => party.identity.includes(userId)
    );

    let newInterestedParties;
    if (existingPartyIndex >= 0) {
      // Remove user from interested parties
      const party = intent.interestedParties[existingPartyIndex];
      const updatedIdentity = party.identity.filter(id => id !== userId);
      const updatedChain = party["on-chain"].filter(chain => chain !== userChain);
      
      if (updatedIdentity.length === 0) {
        // Remove entire party if no identities left
        newInterestedParties = intent.interestedParties.filter((_, index) => index !== existingPartyIndex);
      } else {
        // Update party with remaining identities
        newInterestedParties = [...intent.interestedParties];
        newInterestedParties[existingPartyIndex] = {
          identity: updatedIdentity,
          "on-chain": updatedChain
        };
      }
    } else {
      // Add user to interested parties
      const existingParty = intent.interestedParties.find(party => 
        party["on-chain"].includes(userChain)
      );
      
      if (existingParty) {
        // Add to existing party with same chain
        newInterestedParties = intent.interestedParties.map(party => 
          party === existingParty 
            ? {
                ...party,
                identity: [...party.identity, userId]
              }
            : party
        );
      } else {
        // Create new party
        newInterestedParties = [
          ...intent.interestedParties,
          {
            identity: [userId],
            "on-chain": [userChain]
          }
        ];
      }
    }
    
    // Call the generic update function
    await state.updateIntent(intentId, { interestedParties: newInterestedParties });
  },

  /**
   * PUT: Specific update for selecting a counterparty
   */
  selectCounterparty: async (intentId: number, counterparty: {identity: string, "on-chain": string}) => {
    const state = get();
    // Call the generic update function with the specific payload
    await state.updateIntent(intentId, {
      selectedCounterparty: counterparty,
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