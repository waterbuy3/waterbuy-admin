import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const config = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isConfigured =
  !!config.apiKey &&
  config.apiKey !== "REPLACE_ME" &&
  config.apiKey !== "undefined";

const app = isConfigured ? (getApps()[0] ?? initializeApp(config)) : null;

export const db      = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app)   : null;
