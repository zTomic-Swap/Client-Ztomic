import { Barretenberg, Fr, UltraHonkBackend } from "@aztec/bb.js";
import { ethers } from "ethers";
import { PoseidonTree, ZERO_VALUES } from "./merkleTree.js";
import { Noir, type CompiledCircuit } from "@noir-lang/noir_js";
import { Base8, mulPointEscalar } from "@zk-kit/baby-jubjub";
import { fileURLToPath } from "url";
// 1. IMPORT BOB'S CIRCUIT
import CircuitB from "../circuits/CircuitB.json";
import path from "path";
import fs from "fs";

// Load Circuit
const circuit = CircuitB as CompiledCircuit;

/**
 * Generates Bob's proof for the swap.
 *
 * @param secretKeyParty - Bob's secret key.
 * @param publicKeyCounterparty - Alice's public key [x, y].
 * @param orderId - The order ID.
 * @param hashlockNonce - The nonce used for the hashlock.
 * @param leaves - An array of commitment strings to build the Merkle tree.
 * @returns A promise resolving to an object with the proof and public inputs.
 */
export async function createProofB(
  secretKeyParty: string, // Bob's secret key
  publicKeyCounterparty: [string, string], // Alice's public key
  orderId: string,
  hashlockNonce: string,
  leaves: string[]
): Promise<{ proof: string; publicInputs: string[] }> {
  // --- Input Guard Clauses ---
  if (!secretKeyParty) throw new Error("Invalid 'secretKeyParty' parameter.");
  if (
    !publicKeyCounterparty ||
    !publicKeyCounterparty[0] ||
    !publicKeyCounterparty[1]
  )
    throw new Error("Invalid 'publicKeyCounterparty' parameter.");
  if (!orderId) throw new Error("Invalid 'orderId' parameter.");
  if (!hashlockNonce) throw new Error("Invalid 'hashlockNonce' parameter.");
  if (!leaves || leaves.length === 0)
    throw new Error("Invalid 'leaves' parameter. Must be a non-empty array.");

  // Initialize Barretenberg
  const bb = await Barretenberg.new();

  console.log("order id in proof generation (Bob)", orderId);
  try {
    // --- 1. Convert Inputs ---
    // --- FIXED ---
    console.log(" secret key string", secretKeyParty);
    const bob_sk = BigInt(secretKeyParty);
    // --- END FIX ---

    const alice_pk_point: [bigint, bigint] = [
      BigInt(publicKeyCounterparty[0]),
      BigInt(publicKeyCounterparty[1]),
    ];
    console.log("alice public key", publicKeyCounterparty);

    // Ensure order ID is within field bounds
    const orderIdBigInt = BigInt(orderId);
    const fieldModulus = BigInt(
      "21888242871839275222246405745257275088548364400416034343698204186575808495617"
    );
    if (orderIdBigInt >= fieldModulus) {
      throw new Error("Order ID is too large for the field modulus");
    }
    const order_id_fr = new Fr(orderIdBigInt);
    const nonce_fr = new Fr(BigInt(hashlockNonce));
    console.log("hashlock nonce (orig)", hashlockNonce);
    console.log("hashlock nonce Fr", nonce_fr.toString());
    const alice_pk_x_fr = new Fr(alice_pk_point[0]);

    // --- 2. Build Merkle Tree ---
    const tree = new PoseidonTree(20, ZERO_VALUES);
    console.log("Merkle Tree leaves:", leaves);
    await tree.init([], bb);

    for (const leaf of leaves) {
      await tree.insert(leaf, bb);
    }

    console.log("Merkle Tree initialized with root:", tree.root().toString());

    // --- 3. Calculate Secrets and Commitments (Must match Noir logic) ---

    // Derive Bob's public key (needed for hashlock)
    // Base8 is the BabyJubJub generator point
    console.log("bob secrey key imput", bob_sk);
    const bob_pk_point = mulPointEscalar(Base8, bob_sk);
    const bob_pk_x_fr = new Fr(bob_pk_point[0]);

    // Derive shared secret
    const shared_secret = mulPointEscalar(alice_pk_point, bob_sk);
    const shared_secret_x = shared_secret[0];
    const shared_secret_x_fr = new Fr(shared_secret_x);
    console.log("shared secret", shared_secret_x.toString());
    // Reconstruct hashlock (Bob_PK_x, nonce) - Matches Noir line 31
    const reconstructed_hash_lock_fr = await bb.poseidon2Hash([
      bob_pk_x_fr,
      nonce_fr,
    ]);

    console.log(
      "reconstrcuted hashlock",
      reconstructed_hash_lock_fr.toString()
    );

    // Derive commitment (hash_lock, shared_secret_x) - Matches Noir line 33
    const derived_commitment_fr = await bb.poseidon2Hash([
      reconstructed_hash_lock_fr,
      shared_secret_x_fr,
    ]);

    // Compute nullifier (shared_secret_x, Alice_PK_x, order_id) - Matches Noir line 35
    const computed_nullifier_fr = await bb.poseidon2Hash([
      shared_secret_x_fr,
      alice_pk_x_fr,
      order_id_fr,
    ]);

    console.log("Derived Commitment (Bob):", derived_commitment_fr.toString());

    // --- 4. Get Merkle Proof ---
    const commitmentIndex = tree.getIndex(derived_commitment_fr.toString());
    if (commitmentIndex === -1) {
      throw new Error(
        "Generated commitment not found in the Merkle tree leaves."
      );
    }
    console.log("Commitment Index in Merkle Tree:", commitmentIndex);
    const merkleRoot = tree.root();
    console.log("Reconstructed Merkle Root:", merkleRoot.toString());
    const merkleProof = tree.proof(commitmentIndex);
    console.log("Merkle proof root ", merkleProof.root.toString());

    // --- 5. Prepare Noir Inputs (Must match Noir 'main' signature) ---
    const noir = new Noir(circuit);
    const honk = new UltraHonkBackend(circuit.bytecode, { threads: 1 });

    const input = {
      // --- FIXED ---
      bob_priv_key: secretKeyParty,
      // --- END FIX ---
      alice_pub_key_x: publicKeyCounterparty[0],
      alice_pub_key_y: publicKeyCounterparty[1],
      hash_lock_nonce: hashlockNonce,
      order_id: orderId,
      merkle_proof: merkleProof.pathElements.map((s) => s.toString()),
      is_even: merkleProof.pathIndices.map((i) => i % 2 == 0),
      nullifier_hash: computed_nullifier_fr.toString(), // Public input
      root: merkleProof.root.toString(), // Public input
    };
    console.log("inputs for proof ----", input);

    // --- 6. Generate Proof ---
    const { witness } = await noir.execute(input);

    const originalLog = console.log; // Save original
    console.log = () => {}; // Silence logs

    const { proof, publicInputs } = await honk.generateProof(witness, {
      keccak: true,
    });

    console.log = originalLog; // Restore original

    // --- 7. Format and Return Output ---
    // Convert proof (Uint8Array) to hex string
    const proofHex = ethers.hexlify(proof);
    // Convert publicInputs (Fr[]) to string[]
    const publicInputsStrings = publicInputs.map((pi) => pi.toString());

    return {
      proof: proofHex,
      publicInputs: publicInputsStrings,
    };
  } catch (error) {
    console.error("Error generating Bob's proof:", error);
    throw error;
  } finally {
    await bb.destroy();
  }
}

// --- FIXED ---
// Deleted convertToHex function
// --- END FIX ---