"use client"

import { useState, useEffect } from "react"
import type { JSX } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import DepositSection from "@/components/deposit-section"
import DepositSectionCounterparty from "@/components/deposit-section-conterparty"
import MessageBoard, { type SwapMessage } from "@/components/message-board"
import DepositTracker from "@/components/deposit-tracker"
import EventLog from "@/components/event-log"
import { useEventMonitor, type DepositRecord } from "@/components/event-monitor"
import { UserIdentity } from "@/context/UserIdentityContext"
import { useIntentStore } from "@/components/intent-store"
import { watchContractEvent, writeContract } from "@wagmi/core"
import { type Address, type Hash, type Abi, keccak256, stringToBytes } from 'viem';
import { config } from "../wagmi"
import ztomicAbiJson from "../abi/ztomic.json"
import { type DepositedInitiatorLog, type withdrawalResponderLog } from "./eventTypes";
import WithdrawSection from "@/components/withdraw-section"
import WithdrawSectionCounterparty from "@/components/withdraw-section-counterparty"
// import { createSharedSecret } from "../context/createSecret"
import { generateCommitmentA } from "@/context/createCommitmentA"
import { generateCommitmentB } from "@/context/createCommitmentB"
import { createProofA } from "@/context/createProofA";
import { createProofB } from "@/context/createProofB";
import { deriveCommitmentB } from "@/context/reconstructBCommitmentForA"


const ztomicAbi = ztomicAbiJson.abi as Abi;

// unwatch()

// Import Intent type
import type { Intent } from "@/components/intent-store"

interface SwapOrder {
  id: string
  initiator: string
  initiatorAddress: string
  selectedCounterparty?: string  // Make this optional to match the intent type
  fromToken: string
  toToken: string
  amount: string
  status: "pending" | "active" | "completed" | "cancelled"
  createdAt: string
  interestedParties: string[]
}

// Convert Intent to SwapOrder
function convertIntentToSwapOrder(intent: Intent): SwapOrder {
  return {
    id: String(intent.id),
    initiator: intent.initiator,
    initiatorAddress: intent.initiatorAddress,
    selectedCounterparty: intent.selectedCounterparty,
    fromToken: intent.fromToken,
    toToken: intent.toToken,
    amount: String(intent.amount),
    status: intent.status,
    createdAt: intent.createdAt,
    interestedParties: intent.interestedParties || []
  }
}

interface PrivateSwapProps {
  order: SwapOrder
  userRole: "initiator" | "counterparty" | null
  userIdentity: NonNullable<UserIdentity>  // Ensure userIdentity is non-null
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

export default function PrivateSwap({ order, userRole, userIdentity }: PrivateSwapProps): JSX.Element {
  // Order state management
  const [currentOrder, setCurrentOrder] = useState<SwapOrder | null>(() => ({
    ...order,
    id: String(order.id),
    amount: String(order.amount)
  }))
  const [fetchError, setFetchError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  
  // Swap state
  const [userADeposited, setUserADeposited] = useState(false)
  const [userBDeposited, setUserBDeposited] = useState(false)
  const [messages, setMessages] = useState<SwapMessage[]>([])
  const [swapStatus, setSwapStatus] = useState("awaiting_deposits")
  const [isDepositing, setIsDepositing] = useState(false)
  const [messageCount, setMessageCount] = useState(0)

  const intents = useIntentStore((state) => state.intents)
  const fetchIntents = useIntentStore((state) => state.fetchIntents)
  const [initiatorIdentity, setInitiatorIdentity] = useState<CounterpartyIdentity | null>(null)
  const [counterpartyIdentity, setCounterpartyIdentity] = useState<CounterpartyIdentity | null>(null)
  const [counterpartyStatus, setCounterpartyStatus] = useState<"loading" | "found" | "error">("loading")

  const [eventLogs_depositInitiator, setEventLogs_depositInitiator] = useState<DepositedInitiatorLog[]>([]);
  const [eventLogs_depositResponder, setEventLogs_depositResponder] = useState<DepositedInitiatorLog[]>([]);
  const [eventLogs_withdrawInitiator, setEventLogs_withdrawInitiator] = useState<withdrawalResponderLog[]>([]);

  const [depositTx, setDepositTx] = useState<any>(null);
  const [hashlock_responder, setHashlock_responder] = useState<string | null>("");
  const [withdrawTx, setWithdrawTx] = useState<any>(null);
  const [userAWithdrawn, setUserAWithdrawn] = useState(false)
  const [userBWithdrawn, setUserBWithdrawn] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [ccipMessageId, setCcipMessageId] = useState<Hash | null>(null);

  const [hashlock_initiator, setHashlock_initiator] = useState<string | null>("");
  const [secretKey_initiator, setSecretKey_initiator] = useState<string | null>("");
  const [commitment_counterparty, setCommitment_counterparty] = useState<string | null>("");
  const [nonce_responder, setNonce_responder] = useState<string | null>("");


  const addDeposit = useEventMonitor((state) => state.addDeposit)
  const addEvent = useEventMonitor((state) => state.addEvent)

  useEffect(() => {
    if (!order || !userRole) return;
    decodeCounterPartyDepositLogs();
  }, [
    eventLogs_depositInitiator,
    eventLogs_withdrawInitiator,
    eventLogs_depositResponder,
    order,
    userRole,
    counterpartyIdentity,
    initiatorIdentity,
    secretKey_initiator,
    hashlock_initiator
  ]);



  async function decodeCounterPartyDepositLogs() {

    if (userRole === "counterparty") {
      eventLogs_depositInitiator.forEach((log) => {
        const decoded = {
          oprder_id_hash: log.args._order_id_hash,
          commitment: log.args._commitment,
          hashlock: log.args.hashlock,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          leafIndex: log.args.leafIndex,
          ccipMessageId: log.args.ccipMessageId
        };

        if (log.args._order_id_hash === keccak256(stringToBytes(order.id.toString()))) {
          setHashlock_responder(log.args.hashlock);
          setCcipMessageId(log.args.ccipMessageId);
        }

        console.log("Decoded Counterparty Deposit Log:", decoded);
      }
      )

      eventLogs_withdrawInitiator.forEach((log) => {
        const decoded = {
          _order_id_hash: log.args._order_id_hash,
          hashlock_nonce: log.data
        };

        if (log.args._order_id_hash === keccak256(stringToBytes(order.id.toString()))) {
          setNonce_responder(log.data)
        }

        console.log("Decoded Counterparty Deposit Log:", decoded);
      }
      )

    }

    if (userRole === "initiator") {
      eventLogs_depositResponder.forEach(async (log) => {
        const decoded = {
          oprder_id_hash: log.args._order_id_hash,
          commitment: log.args._commitment,
          hashlock: log.args.hashlock,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          leafIndex: log.args.leafIndex,
          ccipMessageId: log.args.ccipMessageId
        };
        const derivedCommitmentFromLogs = await deriveCommitmentB([counterpartyIdentity!.pubKeyX, counterpartyIdentity!.pubKeyY], secretKey_initiator!, hashlock_initiator!)
        if (decoded.commitment === derivedCommitmentFromLogs.commitment) {
          setCommitment_counterparty(decoded.commitment);
          console.log("Decoded responsed Deposit Log:", decoded);

        }
      }
      )

    }

  }

  useEffect(() => {
    if (!currentOrder || fetchError) {
      console.log("Skipping event setup - no order details or error state");
      return;
    }

    console.log("Setting up contract event watchers for order:", currentOrder.id);
    
    const unwatchDespositInitiator = watchContractEvent(config, {
      address: '0x63DFD07e625736bd20C62BD882e5D3475d8E0297',
      abi: ztomicAbi,
      eventName: 'deposited',
      onLogs(logs) {
        console.log('New initiator deposit logs:', logs);

        // FIX: Explicitly cast the logs to your specific type
        setEventLogs_depositInitiator(prevLogs => [
          ...prevLogs,
          ...(logs as unknown as DepositedInitiatorLog[])
        ]);
      },
    });

    const unwatchDespositResponder = watchContractEvent(config, {
      address: '0x63DFD07e625736bd20C62BD882e5D3475d8E0297',
      abi: ztomicAbi,
      eventName: 'deposited',
      onLogs(logs) {
        console.log('New logs!', logs);
        setEventLogs_depositResponder(prevLogs => [
          ...prevLogs,
          ...(logs as unknown as DepositedInitiatorLog[])
        ]);
      },
    });


    const unwatchWithdrawInitiator = watchContractEvent(config, {
      address: '0x63DFD07e625736bd20C62BD882e5D3475d8E0297',
      abi: ztomicAbi,
      eventName: 'withdrawal_initiator',
      onLogs(logs) {
        console.log('New logs!', logs);
        setEventLogs_withdrawInitiator(prevLogs => [
          ...prevLogs,
          ...(logs as unknown as withdrawalResponderLog[])
        ]);

      },
    });



    console.log("stored deposit_initiator logs:", eventLogs_depositInitiator);
    return () => {
      console.log("Unwatching contract events");
      unwatchDespositInitiator();
      unwatchDespositResponder();
      unwatchWithdrawInitiator();
    };
  }, [currentOrder, fetchError]);

  useEffect(() => {
    const syncOrderWithGlobalState = async () => {
      try {
        // First try to get from local state
        console.log("Searching for order in global state:", order.id);
        const localOrder = intents.find((i) => String(i.id) === order.id);
        
        if (localOrder) {
          console.log("Found order in global state:", localOrder);
          setCurrentOrder(convertIntentToSwapOrder(localOrder));
          setFetchError(false);
          return;
        }

        // If not found and under retry limit, fetch fresh intents
        if (retryCount < 3) {
          console.log(`Order not found in global state, fetching fresh intents (attempt ${retryCount + 1})...`);
          await fetchIntents();
          setRetryCount(prev => prev + 1);
          return; // The next effect run will check the refreshed intents
        }

        // If we've exhausted retries, try the API directly
        console.log("Retries exhausted, trying direct API call...");
        const response = await fetch(`/api/intents/${order.id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch order details: ${response.status}`);
        }
        
        const fetchedOrder = await response.json();
        console.log("Fetched order from API:", fetchedOrder);
        setCurrentOrder(fetchedOrder);
        setFetchError(false);
      } catch (error) {
        console.error("Error syncing order details:", error);
        setFetchError(true);
        setCounterpartyStatus("error");
      }
    };

    syncOrderWithGlobalState();
  }, [intents, order.id, retryCount]);



  // Effect to fetch counterparty and initiator data
  useEffect(() => {
    if (!currentOrder) return;

    const fetchParticipantData = async () => {
      const counterpartyName = currentOrder.selectedCounterparty;
      const initiatorName = currentOrder.initiator;

      // Fetch initiator data
      try {
        const response = await fetch(`/api/users/${encodeURIComponent(initiatorName)}`);
        if (!response.ok) {
          throw new Error("Initiator not found.");
        }
        const data: CounterpartyIdentity = await response.json();
        console.log("Initiator response data", data);
        setInitiatorIdentity(data);
      } catch (error) {
        console.error("Error fetching initiator:", error);
      }

      // Fetch counterparty data if available
      if (counterpartyName) {
        setCounterpartyStatus("loading");
        try {
          const response = await fetch(`/api/users/${encodeURIComponent(counterpartyName)}`);
          if (!response.ok) {
            throw new Error("Counterparty not found.");
          }

          const data: CounterpartyIdentity = await response.json();
          console.log("Counterparty response data", data);
          setCounterpartyIdentity(data);
          setCounterpartyStatus("found");
        } catch (error) {
          console.error("Error fetching counterparty:", error);
          setCounterpartyStatus("error");
        }
      } else {
        console.error("Counterparty name is missing from the order object.");
        setCounterpartyStatus("error");
      }
    };

    fetchParticipantData();
  }, [currentOrder]);

  useEffect(() => {
    const initialMessages: SwapMessage[] = [
      { id: 1, type: "event", timestamp: new Date(Date.now() - 5000), message: "Swap contract initialized", status: "success" },
      { id: 2, type: "status", timestamp: new Date(Date.now() - 3000), message: "Awaiting deposits from both parties", status: "pending" },
    ]
    setMessages(initialMessages)
    setMessageCount(2)

      addEvent({
      id: createId(),
      swapId: String(order.id),
      type: "swap_initiated",
      user: order.initiator,
      amount: parseFloat(order.amount) || 0,  // Convert to number with fallback
      token: order.fromToken,
      txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
      blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
      timestamp: new Date(),
      status: "confirmed",
    })
  }, [order, addEvent])

  const handleDeposit = async (amount: string, secret: string, hashlockNonce: string) => {
    if (userRole === "initiator" && counterpartyIdentity) {
      console.log("Creating commitment using counterparty public keys:")
      console.log("Counterparty Key X:", counterpartyIdentity.pubKeyX)
      console.log("Counterparty Key Y:", counterpartyIdentity.pubKeyY)
      console.log("Your Secret:", secret)

      const orderIdHash = keccak256(stringToBytes(order.id.toString()));
      console.log("Order ID Hash:", orderIdHash)
      console.log("generating Commitment A  for Initiator.")
      const commitmentA = await generateCommitmentA([counterpartyIdentity.pubKeyX, counterpartyIdentity.pubKeyY], secret, hashlockNonce);
      console.log("commitmentA created:", commitmentA)
      setHashlock_initiator(commitmentA.hashlock);
      setSecretKey_initiator(secret);
      const depositTx = await writeContract(config, {
        abi: ztomicAbi,
        address: '0x63DFD07e625736bd20C62BD882e5D3475d8E0297' as Address,

        functionName: 'deposit_initiator',
        args: [commitmentA.commitment, orderIdHash, commitmentA.hashlock, false, "0x0af700A3026adFddC10f7Aa8Ba2419e8503592f7"]


      })
      console.log("Deposit transaction sent:", depositTx);

      setDepositTx(depositTx);

      setIsDepositing(true)
    }
      setTimeout(() => {
      const depositId = createId()
      const txHash = depositTx
      const token = userRole === "initiator" ? order.fromToken : order.toToken
      const user = userRole === "initiator" ? order.initiatorAddress : userIdentity?.address || ''

      const depositRecord: DepositRecord = { 
        id: depositId, 
        swapId: String(order.id), 
        user, 
        token, 
        amount: parseFloat(amount) || 0, // Add fallback and ensure number
        txHash, 
        timestamp: new Date(), 
        status: "confirmed" 
      }
      addDeposit(depositRecord)
      addEvent({ 
        id: createId(), 
        swapId: String(order.id), 
        type: "deposit", 
        user, 
        amount: parseFloat(amount) || 0, 
        token, 
        txHash, 
        blockNumber: Math.floor(Math.random() * 1000000) + 18000000, 
        timestamp: new Date(), 
        status: "pending" 
      })

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
          addEvent({ id: createId(), swapId: order.id, type: "swap_completed", user: userIdentity?.address || '', amount: Number.parseFloat(amount), token, txHash: `0x${Math.random().toString(16).substring(2, 66)}`, blockNumber: Math.floor(Math.random() * 1000000) + 18000000, timestamp: new Date(), status: "confirmed" })
        }
      }, 2000)
    }, 800)

  }

  const handleDepositCounterparty = async (amount: string, secret: string, hashlock: string) => {
    if (hashlock_responder) {
    const commitmentB = await generateCommitmentB([initiatorIdentity!.pubKeyX, initiatorIdentity!.pubKeyY], secret, hashlock_responder);

    const depositTx = await writeContract(config, {
      abi: ztomicAbi,
      address: '0x63DFD07e625736bd20C62BD882e5D3475d8E0297' as Address,
      functionName: 'deposit_responder',
      args: [commitmentB.commitment, false, "0x0af700A3026adFddC10f7Aa8Ba2419e8503592f7"]
    })
    console.log("Counterparty Deposit transaction sent:", depositTx);
    setDepositTx(depositTx);
    setIsDepositing(true)

    setTimeout(() => {
      const depositId = createId()
      const txHash = depositTx
      const token = userRole === "initiator" ? order.fromToken : order.toToken
      const user = userRole === "initiator" ? order.initiatorAddress : userIdentity.address

      const depositRecord: DepositRecord = { 
        id: depositId, 
        swapId: String(order.id), 
        user, 
        token, 
        amount: Number.parseFloat("1"), 
        txHash, 
        timestamp: new Date(), 
        status: "confirmed" 
      }
      addDeposit(depositRecord)
      addEvent({ 
        id: createId(), 
        swapId: String(order.id), 
        type: "deposit", 
        user, 
        amount: Number.parseFloat("1"), 
        token, 
        txHash, 
        blockNumber: Math.floor(Math.random() * 1000000) + 18000000, 
        timestamp: new Date(), 
        status: "pending" 
      })

      const newMessage: SwapMessage = { id: messageCount + 1, type: "deposit", sender: userRole === "initiator" ? "You (Initiator)" : "You (Counterparty)", timestamp: new Date(), message: `Deposited ${"1"} ${token}`, status: "success" }
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
          addEvent({ id: createId(), swapId: order.id.toString(), type: "swap_completed", user: userIdentity?.address || '', amount: Number.parseFloat("1"), token, txHash: `0x${Math.random().toString(16).substring(2, 66)}`, blockNumber: Math.floor(Math.random() * 1000000) + 18000000, timestamp: new Date(), status: "confirmed" })
        }
      }, 2000)
    }, 800)
    }
  }

  const handleSendMessage = (text: string) => {
    const newMessage: SwapMessage = { id: messageCount + 1, type: "message", sender: userIdentity?.identity || 'Unknown', timestamp: new Date(), message: text, status: "success" }
    setMessages((prev) => [...prev, newMessage])
    setMessageCount((prev) => prev + 1)
  }

  // --- Withdraw handlers ---
  const handleWithdrawInitiator = async (
    secretKey: string,
    hashlockNonce: string,
    orderIdHash: string,
    recipient?: string,
    fetchedLeaves?: Hash[]
  ) => {
    try {
      setIsWithdrawing(true)
      if (!counterpartyIdentity || !fetchedLeaves) return
      const { proof, publicInputs } = await createProofA(secretKey, [counterpartyIdentity?.pubKeyX, counterpartyIdentity?.pubKeyY], order.id.toString(), hashlockNonce, fetchedLeaves);
      console.log("Generated proof for Initiator withdrawal:", proof, publicInputs)
      // proof should be bytes; assume the UI provides hex string (0x...)
      // orderIdHash is already a stringified version of order.id
      const args = [proof, publicInputs[1], publicInputs[2], publicInputs[0], keccak256(stringToBytes(orderIdHash)), recipient];
      const tx = await writeContract(config, {
        abi: ztomicAbi,
        address: '0x63DFD07e625736bd20C62BD882e5D3475d8E0297' as Address,
        functionName: 'withdraw_initiator',
        args: args as any,
      })
      console.log('withdraw_initiator tx:', tx)
      setWithdrawTx(tx)
      // update UI
      setUserAWithdrawn(true)
      addEvent({ 
        id: createId(), 
        swapId: String(order.id), 
        type: 'withdrawal', 
        user: userIdentity.address, 
        amount: parseFloat(String(order.amount)) || 0,  // Ensure we always have a valid number
        token: order.fromToken, 
        txHash: tx as any, 
        blockNumber: Math.floor(Math.random() * 1000000) + 18000000, 
        timestamp: new Date(), 
        status: 'pending' 
      })
      setMessages((prev) => [...prev, { id: messageCount + 1, type: 'event', timestamp: new Date(), message: 'Initiator withdrawal submitted', status: 'pending' }])
      setMessageCount((prev) => prev + 1)
    } catch (err) {
      console.error('Initiator withdraw failed', err)
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleWithdrawResponder = async (
   secret: string,
   leaves: Hash[]
  ) => {
    try {
      setIsWithdrawing(true)


      // const args = [proof, nullifierHash, root, recipient || userIdentity.address]

      if(!initiatorIdentity || !nonce_responder)
        return

      // Convert order ID to a field-compatible value
    const orderIdBigInt = BigInt(order.id.toString());
    const fieldModulus = BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
    const orderIdField = orderIdBigInt % fieldModulus;
    
    const {proof, publicInputs} = await createProofB(
        secret, 
        [initiatorIdentity.pubKeyX, initiatorIdentity.pubKeyY], 
        orderIdField.toString(), 
        nonce_responder, 
        leaves
      );      const args = [proof, publicInputs[0], publicInputs[1], "0x0af700A3026adFddC10f7Aa8Ba2419e8503592f7"]
      const tx = await writeContract(config, {
        abi: ztomicAbi,
        address: '0x63DFD07e625736bd20C62BD882e5D3475d8E0297' as Address,
        functionName: 'withdraw_responder',
        args: args as any,
      })
      console.log('withdraw_responder tx:', tx)
      setWithdrawTx(tx)
      setUserBWithdrawn(true)
      addEvent({ id: createId(), swapId: order.id.toString(), type: 'withdrawal', user: userIdentity?.address || '', amount: parseFloat(order.amount) || 0, token: order.toToken, txHash: tx as any, blockNumber: Math.floor(Math.random() * 1000000) + 18000000, timestamp: new Date(), status: 'pending' })
      setMessages((prev) => [...prev, { id: messageCount + 1, type: 'event', timestamp: new Date(), message: 'Responder withdrawal submitted', status: 'pending' }])
      setMessageCount((prev) => prev + 1)
    } catch (err) {
      console.error('Responder withdraw failed', err)
    } finally {
      setIsWithdrawing(false)
    }
  }

  const getCounterpartyName = () => {
    if (counterpartyStatus === "loading") return "Loading..."
    if (counterpartyStatus === "error") return "Unknown"
    return counterpartyIdentity?.userName || "Unknown"
  }

  // Error handling
  if (fetchError) {
    return (
      <Card className="border border-red-500/20 bg-red-500/10 p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Failed to Load Swap Details</h3>
          <p className="text-sm text-red-600 dark:text-red-500 mt-2">
            Unable to retrieve the swap information. Please try refreshing the page.
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setRetryCount(0);
              setFetchError(false);
              fetchIntents();
            }}
          >
            Retry Loading
          </Button>
        </div>
      </Card>
    );
  }

  // Loading state
  if (!currentOrder) {
    return (
      <Card className="border border-border bg-card p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">Loading Swap Details</h3>
          <p className="text-sm text-muted-foreground">Please wait while we fetch the latest information...</p>
        </div>
      </Card>
    );
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
          <div>
            <p className="text-xs text-muted-foreground mb-1">Order Id</p>
            <p className="text-sm font-medium text-foreground">{order.id}</p>
          </div>
          {userRole === "counterparty" &&
            <div>
              <p className="text-xs text-muted-foreground mb-1">Initiator's Deposit Status</p>
              <p className="text-sm font-medium text-foreground">{hashlock_responder ? `🟢` : `🔴`}</p>
            </div>
          }
          {userRole === "initiator" &&
            <div>
              <p className="text-xs text-muted-foreground mb-1">Responder's Deposit Status</p>
              <p className="text-sm font-medium text-foreground">{commitment_counterparty ? `🟢` : `🔴`}</p>
            </div>
          }
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">


          {userRole === "initiator" && (
            <DepositSection
              title="Your Deposit"
              token={order.fromToken}
                amount={parseFloat(order.amount) || 0}
              isUserDeposit={true}
              hasDeposited={userADeposited}
              onDeposit={handleDeposit}
              isLoading={isDepositing}
              counterpartyName={order.initiator}
              orderId={order.id}
            />
          )}


          {userRole === "counterparty" && (
            <DepositSectionCounterparty
              title="Your Deposit"
              token={order.toToken}
                amount={parseFloat(order.amount) || 0}
              isUserDeposit={true}
              hasDeposited={userBDeposited}
              onDeposit={handleDepositCounterparty}
              isLoading={isDepositing}
              counterpartyName={getCounterpartyName()}
              orderId={order.id}
              hashlock={hashlock_responder}
            />
          )}

          {/* Withdraw sections: show after deposits or when appropriate */}
          {commitment_counterparty && userRole === "initiator" && (
            <div className="mt-4">
              <WithdrawSection
                title="Withdraw (Initiator)"
                token={order.fromToken}
                amount={parseFloat(order.amount) || 0}
                isUserWithdraw={true}
                hasWithdrawn={userAWithdrawn}
                onWithdraw={handleWithdrawInitiator}
                isLoading={isWithdrawing}
                counterpartyName={getCounterpartyName()}
                orderId={order.id}
                recipient={userIdentity?.address || ''}
              />
            </div>
          )}

          {nonce_responder && userRole === "counterparty" && (
            <div className="mt-4">
              <WithdrawSectionCounterparty
                title="Withdraw (Responder)"
                token={order.toToken}
                amount={parseFloat(order.amount) || 0}
                isUserWithdraw={true}
                hasWithdrawn={userBWithdrawn}
                onWithdraw={handleWithdrawResponder}
                isLoading={isWithdrawing}
                counterpartyName={getCounterpartyName()}
                orderId={order.id}
                recipient={userIdentity?.address || ''}
              />
            </div>
          )}


          {/* <DepositTracker
            swapId={order.id}
            userAddress={userRole === "initiator" ? order.initiatorAddress : userIdentity.address}
            counterpartyAddress={counterpartyIdentity?.userName || ""}
            initiatorToken={order.fromToken}
            counterpartyToken={order.toToken}
          /> */}
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

