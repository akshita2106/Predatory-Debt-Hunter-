import { auth, db } from '../firebase';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from "../types";
import { handleFirestoreError, OperationType, cleanObject } from './firestoreUtils';

const provider = new GoogleAuthProvider();

// Helper to detect mobile devices
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const authService = {
  /**
   * Helper to ensure a user document exists in Firestore.
   * This is called by both the sign-in method and the auth state listener.
   */
  async _getOrCreateUserDoc(firebaseUser: FirebaseUser): Promise<User> {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        return userDoc.data() as User;
      } else {
        // Create new user profile
        const newUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || 'User',
          photoURL: firebaseUser.photoURL || undefined,
          currency: 'USD', // Default
          hasCompletedSetup: false
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), cleanObject(newUser));
        return newUser;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
      throw error;
    }
  },

  async signInWithGoogle(): Promise<User | void> {
    try {
      if (isMobile()) {
        // On mobile, use redirect to avoid sessionStorage/popup issues
        // We wrap it in a try-catch to handle immediate failures
        return await signInWithRedirect(auth, provider);
      } else {
        // On desktop, use popup for better UX
        const result = await signInWithPopup(auth, provider);
        return await this._getOrCreateUserDoc(result.user);
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      
      // If redirect fails immediately or we detect a storage issue, 
      // we can try popup as a last resort even on mobile
      if (isMobile() && (error.code === 'auth/operation-not-supported-in-this-environment' || error.message?.includes('storage'))) {
        try {
          const result = await signInWithPopup(auth, provider);
          return await this._getOrCreateUserDoc(result.user);
        } catch (popupError) {
          throw popupError;
        }
      }
      throw error;
    }
  },

  async logout() {
    await signOut(auth);
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    // Check for redirect result on initialization
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        await this._getOrCreateUserDoc(result.user);
      }
    }).catch(error => {
      console.error("Error handling redirect result:", error);
      // Specific handling for the error in the screenshot
      if (error.message?.includes('missing initial state')) {
        console.warn("Detected missing initial state. This is common in some mobile browsers. Retrying with popup might be necessary.");
      }
    });

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Ensure the user profile exists in Firestore (handles redirect flow)
          const user = await this._getOrCreateUserDoc(firebaseUser);
          callback(user);
        } catch (error) {
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }
};
