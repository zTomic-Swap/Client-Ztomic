// "use client";

// import { Contract } from "ethers";
// // Import one of your async contract functions
// // Adjust the path to where your contract functions are saved
// import { contractZtomicSepolia_USDCtoUSDT } from "./contract";

// /**
//  * Fetches all historical deposit and withdrawal events from the Ztomic contract.
//  */
// export const fetchHistoricalEvents = async () => {
//   let ztomicContract: Contract;
//   try {
//     // 1. Get the contract instance using your function
//     //    You can swap this for any of your other contract functions
//     ztomicContract = await contractZtomicSepolia_USDCtoUSDT();
//     console.log("Got contract instance at:", ztomicContract.target);
//   } catch (error) {
//     console.error("Failed to get contract instance:", error);
//     return;
//   }

//   try {
//     // For performance on a real network, you should specify a block range:
//     // e.g., await ztomicContract.queryFilter('EventName', fromBlock, toBlock);
//     // Here we query all events from the beginning.

//     console.log("Fetching 'deposited' events...");
//     const depositInitiatorEvents = await ztomicContract.queryFilter("deposited", 9469111, 
// 9469666);
//     console.log(`Found ${depositInitiatorEvents.length} deposited events.`);

//     console.log("Fetching 'withdrawal_initiator' events...");
//     const withdrawInitiatorEvents = await ztomicContract.queryFilter("withdrawal_initiator");
//     console.log(`Found ${withdrawInitiatorEvents.length} withdrawal_initiator events.`);

//     console.log("Fetching 'deposited' events...");
//     const depositResponderEvents = await ztomicContract.queryFilter("deposited");
//     console.log(`Found ${depositResponderEvents.length} deposited events.`);

//     console.log("Fetching 'withdrawal_responder' events...");
//     const withdrawResponderEvents = await ztomicContract.queryFilter("withdrawal_responder");
//     console.log(`Found ${withdrawResponderEvents.length} withdrawal_responder events.`);

//     console.log("--- All event fetching complete ---");

//     // You can now process these arrays
//     // For example, log the arguments of the first event
//     // if (depositInitiatorEvents.length > 0) {
//     //   console.log("First deposit_initiator args:", depositInitiatorEvents[0].args);
//     // }
    
//     return {
//       depositInitiatorEvents,
//       withdrawInitiatorEvents,
//       depositResponderEvents,
//       withdrawResponderEvents,
//     };

//   } catch (error) {
//     console.error("Error fetching historical events:", error);
//   }
// };

// // To run this function, you could call it from another part of your app:
// fetchHistoricalEvents();