export interface Intent {
  id: number;
  initiator: string;
  fromToken: string;
  toToken: string;
  "on-chain": string;
  amount: string;
  status: "pending" | "active" | "completed" | "cancelled";
  interestedParties: {identity: string[], "on-chain": string[]}[];
  selectedCounterparty?: {identity: string, "on-chain": string};
  createdAt: string;
}

export interface UserKey {
  userName: string;
  pubKeyX: string;
  pubKeyY: string;
}