/*
 * Deterministic PRNG, byte permutation, XOR rounds, and G7 string decoder setup.
 */

import {
  createHash as g7CreateHash,
  pbkdf2Sync as g7Pbkdf2Sync,
  randomBytes as g7RandomBytes,
} from "crypto";
class DeterministicBytePrng {
  key;
  counter = 0n;
  buf = Buffer.alloc(0);
  offset = 0;
  constructor(prngSeedKey) {
    this.key = prngSeedKey;
  }
  refill() {
    let prngHash = g7CreateHash("sha256");
    prngHash.update(this.key);
    let prngCounterBuffer = Buffer.alloc(8);
    prngCounterBuffer.writeBigUInt64BE(this.counter++),
      prngHash.update(prngCounterBuffer),
      (this.buf = prngHash.digest()),
      (this.offset = 0);
  }
  nextByte() {
    if (this.offset >= this.buf.length) this.refill();
    return this.buf[this.offset++];
  }
  nextU32() {
    return (
      ((this.nextByte() << 24) |
        (this.nextByte() << 16) |
        (this.nextByte() << 8) |
        this.nextByte()) >>>
      0
    );
  }
}
function buildShufflePermutation(permutationPrng) {
  let shufflePermutation = new Uint8Array(256);
  for (let shuffleInitIndex = 0; shuffleInitIndex < 256; shuffleInitIndex++)
    shufflePermutation[shuffleInitIndex] = shuffleInitIndex;
  for (let shuffleIndex = 255; shuffleIndex > 0; shuffleIndex--) {
    let rejectionLimit = 4294967295 - (4294967295 % (shuffleIndex + 1)),
      randomU32;
    do randomU32 = permutationPrng.nextU32();
    while (randomU32 > rejectionLimit);
    let swapIndex = randomU32 % (shuffleIndex + 1);
    [shufflePermutation[shuffleIndex], shufflePermutation[swapIndex]] = [
      shufflePermutation[swapIndex],
      shufflePermutation[shuffleIndex],
    ];
  }
  return shufflePermutation;
}
function xorBuffers(xorLeftBuffer, xorRightBuffer, xorLength) {
  let xorOutputBuffer = Buffer.alloc(xorLength);
  for (let xorByteIndex = 0; xorByteIndex < xorLength; xorByteIndex++)
    xorOutputBuffer[xorByteIndex] =
      (xorLeftBuffer[xorByteIndex] ?? 0) ^ (xorRightBuffer[xorByteIndex] ?? 0);
  return xorOutputBuffer;
}
function applyPermutationXor(
  permutationKey,
  permutationRound,
  permutationOffset,
) {
  let permutationSeed = g7CreateHash("sha256")
    .update(permutationKey)
    .update(Buffer.from([permutationRound]))
    .update(Buffer.from(permutationOffset.toString()))
    .digest();
  return buildShufflePermutation(new DeterministicBytePrng(permutationSeed));
}
function g7EncodeRound(encodeInputBuffer, encodeRoundKey, encodeRoundIndex) {
  let encodedRoundBuffer = Buffer.alloc(encodeInputBuffer.length),
    previousCipherByte = 0;
  for (
    let encodeByteIndex = 0;
    encodeByteIndex < encodeInputBuffer.length;
    encodeByteIndex++
  ) {
    let roundPermutation = applyPermutationXor(
        encodeRoundKey,
        encodeRoundIndex,
        encodeByteIndex,
      ),
      xorPlainByte = encodeInputBuffer[encodeByteIndex] ^ previousCipherByte;
    (encodedRoundBuffer[encodeByteIndex] = roundPermutation[xorPlainByte]),
      (previousCipherByte = encodedRoundBuffer[encodeByteIndex]);
  }
  return encodedRoundBuffer;
}
function g7DecodeRound(decodeInputBuffer, decodeRoundKey, decodeRoundIndex) {
  let decodedRoundBuffer = Buffer.alloc(decodeInputBuffer.length),
    previousEncodedByte = 0;
  for (
    let decodeByteIndex = 0;
    decodeByteIndex < decodeInputBuffer.length;
    decodeByteIndex++
  ) {
    let decodePermutation = applyPermutationXor(
        decodeRoundKey,
        decodeRoundIndex,
        decodeByteIndex,
      ),
      inversePermutation = new Uint8Array(256);
    for (let inverseIndex = 0; inverseIndex < 256; inverseIndex++)
      inversePermutation[decodePermutation[inverseIndex]] = inverseIndex;
    let decodedPermutedByte =
      inversePermutation[decodeInputBuffer[decodeByteIndex]];
    (decodedRoundBuffer[decodeByteIndex] =
      decodedPermutedByte ^ previousEncodedByte),
      (previousEncodedByte = decodeInputBuffer[decodeByteIndex]);
  }
  return decodedRoundBuffer;
}
class G7StringCipher {
  masterKey;
  rounds;
  constructor(g7ConstructorKey, g7ConstructorSalt) {
    let g7DerivedKeyInput =
        g7ConstructorKey ?? g7RandomBytes(32).toString("hex"),
      g7DerivedSalt = g7ConstructorSalt ?? "__SCRAMBLE_DEFAULT_SALT__";
    (this.masterKey = g7Pbkdf2Sync(
      g7DerivedKeyInput,
      g7DerivedSalt,
      200000,
      32,
      "sha256",
    )),
      (this.rounds = 3);
  }
  encode(g7Plaintext) {
    let g7PlaintextBuffer = Buffer.from(g7Plaintext, "utf8"),
      g7Nonce = g7RandomBytes(16),
      g7NonceMask = g7CreateHash("sha256")
        .update(this.masterKey)
        .update(Buffer.from("n"))
        .digest(),
      g7MaskedNonce = xorBuffers(g7Nonce, g7NonceMask, 16),
      g7PayloadKey = g7CreateHash("sha256")
        .update(this.masterKey)
        .update(g7MaskedNonce)
        .digest(),
      g7EncodedPayload = Buffer.from(g7PlaintextBuffer);
    for (
      let g7EncodeRoundIndex = 0;
      g7EncodeRoundIndex < this.rounds;
      g7EncodeRoundIndex++
    )
      g7EncodedPayload = g7EncodeRound(
        g7EncodedPayload,
        g7PayloadKey,
        g7EncodeRoundIndex,
      );
    return Buffer.concat([g7MaskedNonce, g7EncodedPayload]).toString("base64");
  }
  decode(g7EncodedText) {
    let g7EncodedBuffer = Buffer.from(g7EncodedText, "base64"),
      g7EncodedNonce = g7EncodedBuffer.subarray(0, 16),
      g7NonceMaskForDecode = g7CreateHash("sha256")
        .update(this.masterKey)
        .update(Buffer.from("n"))
        .digest();
    xorBuffers(g7EncodedNonce, g7NonceMaskForDecode, 16);
    let g7DecodePayloadKey = g7CreateHash("sha256")
        .update(this.masterKey)
        .update(g7EncodedNonce)
        .digest(),
      g7DecodedPayload = g7EncodedBuffer.subarray(16);
    for (
      let g7DecodeRoundIndex = this.rounds - 1;
      g7DecodeRoundIndex >= 0;
      g7DecodeRoundIndex--
    )
      g7DecodedPayload = g7DecodeRound(
        g7DecodedPayload,
        g7DecodePayloadKey,
        g7DecodeRoundIndex,
      );
    return g7DecodedPayload.toString("utf8");
  }
}
var g7MasterKeyHex =
    "0373583a866284d26efd9baa8925cb874c4a41a7df3cd2a3e1b745ad7c8dcde9",
  g7SaltHex = "c4965554748945efe568cda5911279e7",
  g7DecoderGlobalName = "fae5ea76a",
  g7StringCipher = new G7StringCipher(g7MasterKeyHex, g7SaltHex);
function decodeG7String(encodedG7String) {
  return g7StringCipher.decode(encodedG7String);
}
(globalThis[g7DecoderGlobalName] = decodeG7String), initGithubApiModule();
