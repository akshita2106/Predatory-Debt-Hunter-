import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, indexedDBLocalPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Set persistence to indexedDB (more reliable in WebViews/APKs)
setPersistence(auth, indexedDBLocalPersistence).catch((err) => {
  console.error("Could not set indexedDB persistence, falling back to browserLocalPersistence:", err);
  setPersistence(auth, browserLocalPersistence).catch(e => console.error("Final persistence fallback failed:", e));
});
