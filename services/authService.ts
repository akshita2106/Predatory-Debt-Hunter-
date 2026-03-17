import { auth, db } from '../firebase';
import { 
  signInAnonymously,
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from "../types";
import { handleFirestoreError, OperationType, cleanObject } from './firestoreUtils';

export const authService = {
  /**
   * Helper to ensure a user document exists in Firestore.
   */
  async _getOrCreateUserDoc(firebaseUser: FirebaseUser): Promise<User> {
    try {
      console.log("Fetching/Creating user doc for anonymous ID:", firebaseUser.uid);
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        console.log("User doc exists");
        return userDoc.data() as User;
      } else {
        console.log("Creating new anonymous user doc");
        // Create new user profile for anonymous user
        const newUser: User = {
          id: firebaseUser.uid,
          email: 'anonymous@user.local', // Placeholder for anonymous
          name: 'Guest User', // Default name
          photoURL: undefined,
          currency: 'USD',
          hasCompletedSetup: false
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), cleanObject(newUser));
        return newUser;
      }
    } catch (error) {
      console.error("Error in _getOrCreateUserDoc:", error);
      handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
      throw error;
    }
  },

  /**
   * Signs in as a demo user with pre-configured settings.
   */
  async signInAsDemo(): Promise<User> {
    try {
      console.log("Attempting demo sign-in...");
      const result = await signInAnonymously(auth);
      const firebaseUser = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists() && (userDoc.data() as User).hasCompletedSetup) {
        return userDoc.data() as User;
      }

      // Create a pre-configured demo user
      const demoUser: User = {
        id: firebaseUser.uid,
        email: 'demo@debt-hunter.ai',
        name: 'Demo User',
        photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
        currency: 'USD',
        hasCompletedSetup: true, // Skip setup
        location: 'New York, USA',
        occupation: 'Product Tester',
        settings: {
          deleteCompletedAfterDays: 30,
          currencySymbol: '$',
          currencyCode: 'USD'
        }
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), cleanObject(demoUser));
      return demoUser;
    } catch (error: any) {
      console.error("Demo sign-in error:", error);
      throw error;
    }
  },

  async logout() {
    await signOut(auth);
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("Auth state changed: User logged in (Anonymous)", firebaseUser.uid);
        try {
          const user = await this._getOrCreateUserDoc(firebaseUser);
          callback(user);
        } catch (error) {
          console.error("Failed to sync user doc on auth change:", error);
          callback(null);
        }
      } else {
        console.log("Auth state changed: No user, triggering auto-login...");
        // If no user, we can trigger the auto-login here or in the component
        callback(null);
      }
    });
  }
};
