import { type Address, type Hash } from 'viem';

type DepositedInitiatorArgs = {
  _commitment: Hash;       // bytes32
  _order_id_hash: Hash;    // bytes32
  leafIndex: bigint;       // uint32 (represented as bigint by viem/wagmi)
  hashlock: Hash;          // bytes32
};

export type DepositedInitiatorLog = {
  eventName: 'deposited_initiator';
  args: DepositedInitiatorArgs;
  address: Address;          // address
  topics: [Hash, Hash?, Hash?, Hash?]; // Array of topics (Hash = `0x${string}`)
                                        // First topic is usually the event signature
                                        // Indexed args follow (max 3 indexed + signature)
  data: Hash;                // Non-indexed args encoded as bytes (`0x${string}`)
  blockNumber: bigint;       // bigint
  transactionHash: Hash;     // bytes32 (`0x${string}`)
  transactionIndex: number;  // number
  blockHash: Hash;           // bytes32 (`0x${string}`)
  logIndex: number;          // number
  removed: boolean;          // boolean
  blockTimestamp?: Hash;     // Optional: Hex string timestamp (`0x${string}`)
                             // May not always be present depending on setup/library version
};