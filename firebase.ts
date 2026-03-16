import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

console.log('Initializing Firebase with config:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Set persistence to local to handle mobile redirect flows better
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("Could not set auth persistence:", err);
});
