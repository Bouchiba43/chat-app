import crypto from "crypto";

const secretKey = Buffer.from(
  "ddZnpw61uhAuIaUjl73t4J0lzprx8T/eb52XuTj7MsI=",
  "base64",
);

/**
 * Encrypts an object using AES-256-CBC.
 * @param {Object} data - The object to encrypt.
 * @returns {string} - The Base64-encoded IV and ciphertext.
 */
export function encryptObject(data) {
  try {
    // Convert the object to a JSON string
    const message = JSON.stringify(data);

    // Generate a random 16-byte IV
    const iv = crypto.randomBytes(16);

    // Create a cipher instance
    const cipher = crypto.createCipheriv("aes-256-cbc", secretKey, iv);

    // Encrypt the message
    let encrypted = cipher.update(message, "utf8", "base64");
    encrypted += cipher.final("base64");

    // Combine the IV and encrypted message for transmission
    const combined = Buffer.concat([iv, Buffer.from(encrypted, "base64")]);

    // Return the Base64-encoded result
    return combined.toString("base64");
  } catch (err) {
    console.error("Encryption error:", err);
    throw new Error("Failed to encrypt the object");
  }
}

/**
 * Decrypts an encrypted object using AES-256-CBC.
 * @param {string} encryptedMessage - The Base64-encoded IV and ciphertext.
 * @returns {Object} - The decrypted object.
 */
export function decryptObject(encryptedMessage) {
  try {
    // Decode the Base64 encrypted message
    const combined = Buffer.from(encryptedMessage, "base64");

    // Extract the IV (first 16 bytes)
    const iv = combined.slice(0, 16);

    // Extract the encrypted content (remaining bytes)
    const encryptedContent = combined.slice(16);

    // Create a decipher instance
    const decipher = crypto.createDecipheriv("aes-256-cbc", secretKey, iv);

    // Decrypt the message
    let decrypted = decipher.update(encryptedContent, "base64", "utf8");
    decrypted += decipher.final("utf8");

    // Parse the JSON string back into an object
    return JSON.parse(decrypted);
  } catch (err) {
    console.error("Decryption error:", err);
    throw new Error("Failed to decrypt the object");
  }
}
