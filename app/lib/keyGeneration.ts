import { Base8, mulPointEscalar } from "@zk-kit/baby-jubjub";

/**
 * Generates a pair of public keys from a user-provided secret.
 * * TODO: Replace this placeholder logic with your actual key generation algorithm.
 * * @param secretValue The secret string provided by the user.
 * @returns A promise that resolves to an object containing pubKeyX and pubKeyY.
 */
export async function generateKeysFromSecret(
  secretValue: string
): Promise<{ pubKeyX: string; pubKeyY: string }> {
  

  console.log(`Generating keys for secret: ${secretValue}`);

const hexSecret = convertToHex(secretValue)
  const key = derivePublicKey(secretValue);

  const pubKeyX = key.x;
  const pubKeyY = key.y;

  return { pubKeyX, pubKeyY };
}

function derivePublicKey(privateKeyHex : string) {
    const privateKey = BigInt(privateKeyHex);
    const publicKey = mulPointEscalar(Base8, privateKey);
    return {
        x: `0x${publicKey[0].toString(16)}`,
        y: `0x${publicKey[1].toString(16)}`,
    };
}

function convertToHex(str: string) {
    var hex = '';
    for(var i=0;i<str.length;i++) {
        hex += ''+str.charCodeAt(i).toString(16);
    }
    return hex;
}