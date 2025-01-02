import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

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

const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const encryptData = await encryptObject(data);
      console.log("Encrypted data:", encryptData);

      const decryptData = await decryptObject(encryptData);
      console.log("Decrypted data:", decryptData);
      const res = await axiosInstance.post("/auth/signup", {
        data: encryptData,
      });
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
