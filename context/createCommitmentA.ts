import { Barretenberg, Fr } from "@aztec/bb.js";
import { Base8, mulPointEscalar } from "@zk-kit/baby-jubjub";
import { ethers } from "ethers";


export async function generateCommitmentA(publicKeyCounterparty: [string, string], secretKeyParty: string, haslockNonce: string): Promise<{ commitment: string, hashlock: string }> {

    const bb = await Barretenberg.new();
    const counterpartyPubKey = [BigInt(publicKeyCounterparty[0]), BigInt(publicKeyCounterparty[1])];
    const counterpartyPubKeyPoint: [bigint, bigint] = [BigInt(counterpartyPubKey[0]), BigInt(counterpartyPubKey[1])];
    const haslockNonceBigInt = BigInt(haslockNonce);
    const secretKeyHex = convertToHex(secretKeyParty)
        console.log(" secret key hex", secretKeyHex)
    const secretKeyBigInt = BigInt(secretKeyHex);
    console.log("Counterparty Public Keys:", publicKeyCounterparty);
    try {

        const shared_secret = mulPointEscalar(counterpartyPubKeyPoint, secretKeyBigInt);
        const shared_secret_x = shared_secret[0];
        console.log("Shared Secret X Coordinate:", shared_secret_x.toString());
        const counterpartyPublicKeyX_fr = new Fr(counterpartyPubKeyPoint[0]);
        const haslockNonce_fr = new Fr(haslockNonceBigInt);

        const reconstructedHashlock = await bb.poseidon2Hash([counterpartyPublicKeyX_fr, haslockNonce_fr]);
        console.log("Reconstructed Hashlock (Fr):", reconstructedHashlock.toString());
        const shared_secret_x_fr = new Fr(shared_secret_x);

        const derivedCommitmentA_fr = await bb.poseidon2Hash([reconstructedHashlock, shared_secret_x_fr]);
        console.log("Derived Commitment A (Fr):", derivedCommitmentA_fr.toString());
        return ({ commitment: derivedCommitmentA_fr.toString(), hashlock: reconstructedHashlock.toString() });
    }
    catch (error) {
        console.error("Error generating commitment A:", error);
        throw error;
    } finally {
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