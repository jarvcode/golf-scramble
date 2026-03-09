import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  type DocumentData,
  type QuerySnapshot,
  serverTimestamp,
} from 'firebase/firestore';

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

export const firebaseConfigured = !!projectId;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

/** Wrap any Firebase Promise to reject after a timeout. */
export function withTimeout<T>(promise: Promise<T>, ms = 10_000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error('Firebase request timed out. Check your internet connection and Firebase configuration.')),
        ms,
      ),
    ),
  ]);
}

export {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  serverTimestamp,
  type DocumentData,
  type QuerySnapshot,
};
