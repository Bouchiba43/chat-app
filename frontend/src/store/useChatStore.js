import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

const secretKey = "ddZnpw61uhAuIaUjl73t4J0lzprx8T/eb52XuTj7MsI=";

/**
 * Encrypts an object using AES-CBC.
 * @param {Object} data - The object to encrypt.
 * @returns {Promise<string>} - The Base64-encoded IV and ciphertext.
 */
export async function encryptObject(data) {
  try {
    // Convert the object to a JSON string
    const message = JSON.stringify(data);

    // Decode the Base64 secret key into a Uint8Array
    const key = Uint8Array.from(atob(secretKey), (c) => c.charCodeAt(0));

    // Generate a random 16-byte IV
    const iv = window.crypto.getRandomValues(new Uint8Array(16));

    // Encode the message as a Uint8Array
    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(message);

    // Import the secret key for AES-CBC encryption
    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      key,
      { name: "AES-CBC" },
      false,
      ["encrypt"],
    );

    // Encrypt the message
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: "AES-CBC",
        iv: iv,
      },
      cryptoKey,
      encodedMessage,
    );

    // Combine the IV and encrypted message for transmission
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv); // First 16 bytes are the IV
    combined.set(new Uint8Array(encrypted), iv.length); // Remaining bytes are the ciphertext

    // Base64 encode the combined result
    return btoa(String.fromCharCode(...combined));
  } catch (err) {
    console.error("Encryption error:", err);
    throw new Error("Failed to encrypt the object");
  }
}

/**
 * Decrypts an encrypted object using AES-CBC.
 * @param {string} encryptedMessage - The Base64-encoded IV and ciphertext.
 * @returns {Promise<Object>} - The decrypted object.
 */
export async function decryptObject(encryptedMessage) {
  try {
    // Decode the Base64 secret key into a Uint8Array
    const key = Uint8Array.from(atob(secretKey), (c) => c.charCodeAt(0));

    // Decode the Base64 encrypted message into a Uint8Array
    const cipherBytes = Uint8Array.from(atob(encryptedMessage), (c) =>
      c.charCodeAt(0),
    );

    // Extract the IV (first 16 bytes)
    const iv = cipherBytes.slice(0, 16);

    // Extract the actual encrypted content (remaining bytes)
    const encryptedContent = cipherBytes.slice(16);

    // Import the secret key for AES-CBC decryption
    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      key,
      { name: "AES-CBC" },
      false,
      ["decrypt"],
    );

    // Decrypt the message
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-CBC",
        iv: iv,
      },
      cryptoKey,
      encryptedContent,
    );

    // Decode the decrypted content into a string
    const decoder = new TextDecoder();
    const decryptedMessage = decoder.decode(decrypted);

    // Parse the JSON string back into an object
    return JSON.parse(decryptedMessage);
  } catch (err) {
    console.error("Decryption error:", err);
    throw new Error("Failed to decrypt the object");
  }
}


export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      const decryptedUsers = await decryptObject(res.data);
      set({ users: decryptedUsers });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      const decryptedMessages = await decryptObject(res.data);
      set({ messages: decryptedMessages });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const encryptData = await encryptObject(messageData);
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, {data: encryptData});
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
