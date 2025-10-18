export interface Intent {
  id: string;
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

export interface UserKey {
  userName: string;
  pubKeyX: string;
  pubKeyY: string;
}