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
  console.log("\n--- generateCommitmentB: Start ---");
  console.log(
    "generateCommitmentB: Input publicKeyCounterparty (Alice):",
    publicKeyCounterparty
  );
  console.log(
    "generateCommitmentB: Input secretKeyParty (Bob):",
    secretKeyParty
  );
  console.log("generateCommitmentB: Input hashlock:", hashlock);

  // Add guard clause to check for valid hashlock string.
  // The error "Attempt to access memory outside buffer bounds" often happens
  // if Fr.fromString receives an undefined, null, or empty string.
  if (!hashlock || typeof hashlock !== "string" || hashlock.trim() === "") {
    const errorMsg =
      "Invalid 'hashlock' parameter provided. Must be a non-empty string.";
    console.error(
      "Error in createCommitmentB:",
      errorMsg,
      "Received:",
      hashlock
    );
    throw new Error(errorMsg);
  }

  // console.log("aluce public keys in create commitment", publicKeyCounterparty) // Original log
  // console.log("private key bob in create commitment", secretKeyParty) // Original log
  const bb = await Barretenberg.new();
  console.log("generateCommitmentB: Barretenberg instance created.");

  // 1. Convert inputs from strings to BigInt/Fr
  const counterpartyPubKey = [
    BigInt(publicKeyCounterparty[0]),
    BigInt(publicKeyCounterparty[1]),
  ];
  const counterpartyPubKeyPoint: [bigint, bigint] = [
    counterpartyPubKey[0],
    counterpartyPubKey[1],
  ];
  console.log(
    "generateCommitmentB: counterpartyPubKeyPoint (Alice):",
    counterpartyPubKeyPoint.map((v) => v.toString())
  );

  // --- FIXED ---
  console.log("generateCommitmentB: secret key string (Bob):", secretKeyParty);
  const secretKeyBigInt = BigInt(secretKeyParty);
  // --- END FIX ---

  console.log(
    "generateCommitmentB: secretKeyBigInt (Bob):",
    secretKeyBigInt.toString()
  );

  // This line (previously 32) is where the error originates
  const hashlock_fr = Fr.fromString(hashlock);
  console.log("generateCommitmentB: hashlock_fr:", hashlock_fr.toString());

  const haslock_hash_fr = await bb.poseidon2Hash([hashlock_fr]);
  console.log(
    "generateCommitmentB: haslock_hash_fr (H(hashlock)):",
    haslock_hash_fr.toString()
  );

  console.log(
    "Counterparty (Alice) Public Keys:",
    publicKeyCounterparty
  ); // Original log
  console.log("Input Hashlock (from Alice):", hashlock); // Original log

  try {
    // 2. Calculate shared secret
    // shared_secret = mulPointEscalar(Alice's_PK, Bob's_SK)
    const shared_secret = mulPointEscalar(
      counterpartyPubKeyPoint,
      secretKeyBigInt
    );
    console.log(
      "generateCommitmentB: shared_secret [x, y]:",
      shared_secret.map((v) => v.toString())
    );

    const shared_secret_x = shared_secret[0];
    console.log(
      "Shared Secret X Coordinate:",
      shared_secret_x.toString()
    ); // Original log

    // 3. Convert shared secret to Fr
    const shared_secret_x_fr = new Fr(shared_secret_x);
    console.log(
      "generateCommitmentB: shared_secret_x_fr:",
      shared_secret_x_fr.toString()
    );

    // 4. Calculate Commitment B
    // This logic matches generateBobCommitment
    const derivedCommitmentB_fr = await bb.poseidon2Hash([
      haslock_hash_fr,
      shared_secret_x_fr,
    ]);
    console.log("Derived Commitment B (Fr):", derivedCommitmentB_fr.toString()); // Original log

    const commitmentString = derivedCommitmentB_fr.toString();
    console.log(
      "generateCommitmentB: Returning commitment:",
      commitmentString
    );

    // 5. Return commitment string in an object, matching createCommitmentA's style
    return { commitment: commitmentString };
  } catch (error) {
    console.error("Error generating commitment B:", error);
    throw error;
  } finally {
    // 6. Clean up Barretenberg instance
    await bb.destroy();
    console.log("generateCommitmentB: Barretenberg instance destroyed.");
    console.log("--- generateCommitmentB: End ---");
  }
}

// --- FIXED ---
// Deleted convertToHex function
// --- END FIX ---