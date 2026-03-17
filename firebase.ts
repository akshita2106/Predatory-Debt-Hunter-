import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, indexedDBLocalPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with long-polling for better compatibility in mobile WebViews/APKs
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

// Set persistence to indexedDB (more reliable in WebViews/APKs)
setPersistence(auth, indexedDBLocalPersistence).catch((err) => {
  console.error("Could not set indexedDB persistence, falling back to browserLocalPersistence:", err);
  setPersistence(auth, browserLocalPersistence).catch(e => console.error("Final persistence fallback failed:", e));
});

// Connection Test for Firestore
async function testConnection() {
  try {
    console.log("Firestore: Testing connection...");
    // Attempt to fetch a non-existent doc just to check connectivity
    await getDocFromServer(doc(db, '_internal_', 'connection_test'));
    console.log("Firestore: Connection successful");
  } catch (error: any) {
    if (error.message?.includes('offline') || error.code === 'unavailable') {
      console.error("Firestore Connection Error: Could not reach the backend. This may be due to a stale configuration or network restrictions.");
    }
  }
}
testConnection();
