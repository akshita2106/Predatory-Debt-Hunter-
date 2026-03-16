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
provider.setCustomParameters({
  prompt: 'select_account'
});

// Helper to detect mobile devices or tablets
const isMobile = () => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || 
         (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
};

export const authService = {
  /**
   * Helper to ensure a user document exists in Firestore.
   * This is called by both the sign-in method and the auth state listener.
   */
  async _getOrCreateUserDoc(firebaseUser: FirebaseUser): Promise<User> {
    try {
      console.log("Fetching/Creating user doc for:", firebaseUser.uid);
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        console.log("User doc exists");
        return userDoc.data() as User;
      } else {
        console.log("Creating new user doc");
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
      console.error("Error in _getOrCreateUserDoc:", error);
      handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
      throw error;
    }
  },

  async signInWithGoogle(): Promise<User | void> {
    try {
      if (isMobile()) {
        console.log("Mobile detected, using redirect");
        return await signInWithRedirect(auth, provider);
      } else {
        console.log("Desktop detected, using popup");
        const result = await signInWithPopup(auth, provider);
        return await this._getOrCreateUserDoc(result.user);
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      
      // If redirect fails immediately or we detect a storage issue, 
      // we can try popup as a last resort even on mobile
      if (isMobile() && (error.code === 'auth/operation-not-supported-in-this-environment' || error.message?.includes('storage'))) {
        try {
          console.log("Redirect failed or unsupported, trying popup fallback");
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
        console.log("Redirect result found for user:", result.user.uid);
        await this._getOrCreateUserDoc(result.user);
      }
    }).catch(error => {
      console.error("Error handling redirect result:", error);
    });

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("Auth state changed: User logged in", firebaseUser.uid);
        try {
          const user = await this._getOrCreateUserDoc(firebaseUser);
          callback(user);
        } catch (error) {
          console.error("Failed to sync user doc on auth change:", error);
          // If we can't get the doc, we might still want to show the user as logged in
          // but the app expects a full User object. 
          // For now, we call callback(null) to force a retry/login if it's a fatal error
          callback(null);
        }
      } else {
        console.log("Auth state changed: No user");
        callback(null);
      }
    });
  }
};
