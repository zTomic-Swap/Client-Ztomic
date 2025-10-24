import { Barretenberg, Fr, UltraHonkBackend } from "@aztec/bb.js";
import { ethers } from "ethers";
import { PoseidonTree, ZERO_VALUES } from "./merkleTree.js";
import { Noir, type CompiledCircuit } from "@noir-lang/noir_js";
import { Base8, mulPointEscalar } from "@zk-kit/baby-jubjub";
import { fileURLToPath } from "url";
import CircuitA from "../circuits/CircuitA.json";
import path from "path";
import fs from "fs";

// Load Circuit
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const circuit = JSON.parse(
//   fs.readFileSync(
//     path.resolve(__dirname, "../../Circuits-Noir/target/circuit_alice.json"),
//     "utf8"
//   )
// );
const circuit = CircuitA as CompiledCircuit;
/**
 * Generates Alice's proof for the swap.
 *
 * @param secretKeyParty - Alice's secret key.
 * @param publicKeyCounterparty - Bob's public key [x, y].
 * @param orderId - The order ID.
 * @param hashlockNonce - The nonce used for the hashlock.
 * @param leaves - An array of commitment strings to build the Merkle tree.
 * @returns A promise resolving to an object with the proof and public inputs.
 */
export async function createProofA(
  secretKeyParty: string, // Alice's secret key
  publicKeyCounterparty: [string, string], // Bob's public key
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

  try {
    // --- 1. Convert Inputs ---
    const alice_sk = BigInt(secretKeyParty);
    const bob_pk_point: [bigint, bigint] = [
      BigInt(publicKeyCounterparty[0]),
      BigInt(publicKeyCounterparty[1]),
    ];
    const order_id_fr = new Fr(BigInt(orderId));
    const nonce_fr = new Fr(BigInt(hashlockNonce));
    const bob_pk_x_fr = new Fr(bob_pk_point[0]);

    // --- 2. Build Merkle Tree ---
    const tree = new PoseidonTree(20, ZERO_VALUES);
    console.log("Merkle Tree leaves:", leaves);
    await tree.init([], bb);

    for (const leaf of leaves) {
     await tree.insert(leaf, bb);
    }

    console.log("Merkle Tree initialized with root:", tree.root().toString());

    // --- 3. Calculate Secrets and Commitments ---
    const shared_secret = mulPointEscalar(bob_pk_point, alice_sk);
    const shared_secret_x = shared_secret[0];
    const shared_secret_x_fr = new Fr(shared_secret_x);

    // Reconstruct hashlock (Bob_PK_x, nonce)
    const reconstructed_hash_lock_fr = await bb.poseidon2Hash([
      bob_pk_x_fr,
      nonce_fr,
    ]);

    // Compute nullifier (shared_secret_x, Bob_PK_x, order_id)
    const computed_nullifier_fr = await bb.poseidon2Hash([
      shared_secret_x_fr,
      bob_pk_x_fr,
      order_id_fr,
    ]);

    // Derive commitment (hash_lock, shared_secret_x)
    const derived_commitment_fr = await bb.poseidon2Hash([
      reconstructed_hash_lock_fr,
      shared_secret_x_fr,
    ]);

    console.log("derived_commitment_fr:", derived_commitment_fr.toString());

    // --- 4. Get Merkle Proof ---
    const commitmentIndex = tree.getIndex(derived_commitment_fr.toString());
    if (commitmentIndex === -1) {
      throw new Error("Generated commitment not found in the Merkle tree leaves.");
    }
    console.log("Commitment Index in Merkle Tree:", commitmentIndex);
    const merkleRoot = tree.root();
    console.log("Reconstructed Merkle Root:", merkleRoot.toString());
    const merkleProof = tree.proof(commitmentIndex);

    // --- 5. Prepare Noir Inputs ---
    const noir = new Noir(circuit);
    const honk = new UltraHonkBackend(circuit.bytecode, { threads: 1 });

    const input = {
      alice_priv_key: secretKeyParty,
      bob_pub_key_x: publicKeyCounterparty[0],
      bob_pub_key_y: publicKeyCounterparty[1],
      order_id: orderId,
      merkle_proof: merkleProof.pathElements.map((s) => s.toString()),
      is_even: merkleProof.pathIndices.map((i) => i % 2 == 0),
      hash_lock_nonce: hashlockNonce,
      nullifier_hash: computed_nullifier_fr.toString(),
      root: merkleProof.root.toString(),
    };

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
    console.error("Error generating Alice's proof:", error);
    throw error;
  } finally {
    await bb.destroy();
  }
}

