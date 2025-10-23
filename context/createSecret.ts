// Imports from baby-jubjub
import { Base8, mulPointEscalar, type Point } from "@zk-kit/baby-jubjub";

/**
 * Generates a pair of public keys from a user-provided secret.
 * @param secretValue The secret string provided by the user.
 * @returns A promise that resolves to an object containing pubKeyX and pubKeyY.
 */
export async function generateKeysFromSecret(
  secretValue: string
): Promise<{ pubKeyX: string; pubKeyY: string }> {
  console.log(`Generating keys for secret: ${secretValue}`);

  const hexSecret = convertToHex(secretValue);
  const key = derivePublicKey(hexSecret);

  const pubKeyX = key.x;
  const pubKeyY = key.y;

  return { pubKeyX, pubKeyY };
}

/**
 * Creates a shared secret using the user's private key and the counterparty's public key.
 * This is the core of the Diffie-Hellman key exchange.
 * S = myPrivateKey * theirPublicKey
 * @param mySecret The user's private secret string.
 * @param theirPublicKey The counterparty's public key (x and y coordinates as hex strings).
 * @returns A promise that resolves to the shared secret point (x and y coordinates as hex strings).
 */
export async function createSharedSecret(
  mySecret: string,
  theirPublicKey: { pubKeyX: string; pubKeyY: string }
): Promise<{ sharedSecretX: string; sharedSecretY: string }> {
  
  // 1. Convert your secret string to a bigint private key
  const myPrivateKeyHex = convertToHex(mySecret);
  const myPrivateKeyBigInt = BigInt(myPrivateKeyHex);

  // 2. Convert their hex public key strings to a Point<bigint>
  const theirPublicKeyPoint: Point<bigint> = [
    BigInt(theirPublicKey.pubKeyX),
    BigInt(theirPublicKey.pubKeyY)
  ];

  // 3. Calculate the shared secret: S = myPrivateKey * theirPublicKey
  const sharedSecretPoint = mulPointEscalar(theirPublicKeyPoint, myPrivateKeyBigInt);

  // 4. Format the resulting point as hex strings
  const sharedSecretX = `0x${sharedSecretPoint[0].toString(16)}`;
  const sharedSecretY = `0x${sharedSecretPoint[1].toString(16)}`;

  return { sharedSecretX, sharedSecretY };
}


// --- Helper Functions ---

function derivePublicKey(privateKeyHex: string) {
  const privateKey = BigInt(privateKeyHex);
  // PublicKey = privateKey * BasePoint
  const publicKey = mulPointEscalar(Base8, privateKey);
  return {
    x: `0x${publicKey[0].toString(16)}`,
    y: `0x${publicKey[1].toString(16)}`,
  };
}

function convertToHex(str: string) {
  var hex = "";
  for (var i = 0; i < str.length; i++) {
    hex += "" + str.charCodeAt(i).toString(16);
  }
  // Ensure it's prefixed with 0x for BigInt conversion
  return "0x" + hex;
}