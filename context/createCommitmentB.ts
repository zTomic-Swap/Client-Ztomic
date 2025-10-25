import { Barretenberg, Fr } from "@aztec/bb.js";
import { Base8, mulPointEscalar } from "@zk-kit/baby-jubjub";
// ethers is not needed if we follow createCommitmentA's return format

/**
 * Derives Commitment B (Bob's commitment) using the counterparty's (Alice's) public key,
 * the party's (Bob's) secret key, and the pre-computed hashlock.
 *
 * @param publicKeyCounterparty - Alice's public key as [x, y] coordinate strings.
 * @param secretKeyParty - Bob's secret key as a hex or decimal string.
 * @param hashlock - The hashlock string generated and provided by Alice (from createCommitmentA).
 * @returns A promise that resolves to an object containing the commitment string.
 */
export async function generateCommitmentB(
  publicKeyCounterparty: [string, string], // Alice's Public Key
  secretKeyParty: string, // Bob's Secret Key
  hashlock: string // Hashlock from createCommitmentA
): Promise<{ commitment: string }> {
  
  // Add guard clause to check for valid hashlock string.
  // The error "Attempt to access memory outside buffer bounds" often happens
  // if Fr.fromString receives an undefined, null, or empty string.
  if (!hashlock || typeof hashlock !== 'string' || hashlock.trim() === '') {
    const errorMsg = "Invalid 'hashlock' parameter provided. Must be a non-empty string.";
    console.error("Error in createCommitmentB:", errorMsg, "Received:", hashlock);
    throw new Error(errorMsg);
  }

  console.log("aluce public keys in create commitment", publicKeyCounterparty)
  console.log("private key bob in create commitment", secretKeyParty)
  const bb = await Barretenberg.new();

  // 1. Convert inputs from strings to BigInt/Fr
  const counterpartyPubKey = [
    BigInt(publicKeyCounterparty[0]),
    BigInt(publicKeyCounterparty[1]),
  ];
  const counterpartyPubKeyPoint: [bigint, bigint] = [
    counterpartyPubKey[0],
    counterpartyPubKey[1],
  ];

  const secretKeyHex = convertToHex(secretKeyParty)
      console.log(" secret key hex", secretKeyHex)

  const secretKeyBigInt = BigInt(secretKeyHex);

 
  
  // This line (previously 32) is where the error originates
  const hashlock_fr = Fr.fromString(hashlock);
  
  const haslock_hash_fr = await bb.poseidon2Hash([hashlock_fr]);

  console.log("Counterparty (Alice) Public Keys:", publicKeyCounterparty);
  console.log("Input Hashlock (from Alice):", hashlock);

  try {
    // 2. Calculate shared secret
    // shared_secret = mulPointEscalar(Alice's_PK, Bob's_SK)
    const shared_secret = mulPointEscalar(
      counterpartyPubKeyPoint,
      secretKeyBigInt
    );
    const shared_secret_x = shared_secret[0];
    console.log("Shared Secret X Coordinate:", shared_secret_x.toString());

    // 3. Convert shared secret to Fr
    const shared_secret_x_fr = new Fr(shared_secret_x);

    // 4. Calculate Commitment B
    // This logic matches generateBobCommitment
    const derivedCommitmentB_fr = await bb.poseidon2Hash([
      haslock_hash_fr,
      shared_secret_x_fr,
    ]);
    console.log("Derived Commitment B (Fr):", derivedCommitmentB_fr.toString());

    // 5. Return commitment string in an object, matching createCommitmentA's style
    return { commitment: derivedCommitmentB_fr.toString() };
    
  } catch (error) {
    console.error("Error generating commitment B:", error);
    throw error;
  } finally {
    // 6. Clean up Barretenberg instance
    await bb.destroy();
  }
}

function convertToHex(str: string) {
    var hex = '';
    for(var i=0;i<str.length;i++) {
        hex += ''+str.charCodeAt(i).toString(16);
    }
    return hex;
}

