const { createHash, createDecipheriv, createCipheriv, randomBytes } = require("crypto"); // Node.js crypto (used for the key generation)
const CryptoJS = require("crypto-js"); // crypto-js for frontend

// Choose the appropriate crypto library depending on the environment
const isNodeEnv = typeof window === "undefined"; // Check if running in Node.js

// For Node.js
const ENCRYPTION_KEY = isNodeEnv
  ? createHash("sha256")
      .update("98a56c02010cade108b09d58055cc7ecb8a0c939b0887b9d9e8d0da9870f731c")
      .digest() // Digest directly produces a 32-byte buffer for Node.js
  : CryptoJS.enc.Utf8.parse("98a56c02010cade108b09d58055cc7ecb8a0c939b0887b9d9e8d0da9870f731c"); // For React (Frontend) using CryptoJS

const IV_LENGTH = parseInt(process.env.NEXT_PUBLIC_IV_LENGTH || "16", 10); // Default to 16 bytes for AES-256-CBC IV.

const encrypt = (text) => {
  try {
    // Validate inputs
    if (!text) {
      throw new Error("Text to encrypt cannot be empty");
    }

    if (isNodeEnv && ENCRYPTION_KEY.length !== 32) {
      throw new Error(`Invalid key length. Expected 32 bytes, got ${ENCRYPTION_KEY.length}`);
    }

    // Generate random IV
    const iv = isNodeEnv
      ? Buffer.from(randomBytes(IV_LENGTH)) // For Node.js
      : CryptoJS.lib.WordArray.random(IV_LENGTH); // For React (Frontend)

    // Encrypt
    let encrypted;

    if (isNodeEnv) {
      const cipher = createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
      encrypted = cipher.update(text, "utf8", "hex") + cipher.final("hex");
    } else {
      encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY, { iv: iv }).toString();
    }

    // Return IV and encrypted text in "iv:encrypted" format
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Encryption failed: ${error.message}`);
    } else {
      throw new Error("Encryption failed: Unknown error");
    }
  }
};

const decrypt = (encryptedText) => {
  try {
    // Validate inputs
    if (!encryptedText) {
      throw new Error("Encrypted text cannot be empty");
    }

    const [ivHex, encrypted] = encryptedText.split(":");

    if (!ivHex || !encrypted) {
      throw new Error("Invalid encrypted text format. Expected 'iv:encrypted'");
    }

    if (isNodeEnv && ENCRYPTION_KEY.length !== 32) {
      throw new Error(`Invalid key length. Expected 32 bytes, got ${ENCRYPTION_KEY.length}`);
    }

    const iv = isNodeEnv ? Buffer.from(ivHex, "hex") : CryptoJS.enc.Hex.parse(ivHex);

    // Decrypt
    let decrypted;

    if (isNodeEnv) {
      const decipher = createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
      decrypted = decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
    } else {
      const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY, { iv: iv });
      decrypted = bytes.toString(CryptoJS.enc.Utf8);
    }

    return decrypted;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Decryption failed: ${error.message}`);
    } else {
      throw new Error("Decryption failed: Unknown error");
    }
  }
};

module.exports = { encrypt, decrypt };
