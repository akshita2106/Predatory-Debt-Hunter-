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

// Helper to detect if running in a WebView (common in APKs)
const isWebView = () => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /wv|Version\/[\d\.]+/.test(userAgent) || (isMobile() && !/Chrome|Safari/i.test(userAgent));
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
      // In WebViews/APKs, popups are almost always blocked or fail.
      // Redirect is safer, but we need to handle the storage issues.
      if (isMobile() || isWebView()) {
        console.log("Mobile/WebView detected, using redirect flow");
        try {
          return await signInWithRedirect(auth, provider);
        } catch (redirectError: any) {
          console.error("Redirect failed immediately:", redirectError);
          // Fallback to popup if redirect fails immediately (rare)
          if (redirectError.code === 'auth/operation-not-supported-in-this-environment') {
             const result = await signInWithPopup(auth, provider);
             return await this._getOrCreateUserDoc(result.user);
          }
          throw redirectError;
        }
      } else {
        console.log("Desktop detected, using popup flow");
        const result = await signInWithPopup(auth, provider);
        return await this._getOrCreateUserDoc(result.user);
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      
      // Handle "Session Storage" or "Web Storage" errors specifically
      if (error.code === 'auth/web-storage-unsupported' || error.message?.includes('storage')) {
        alert("Your browser settings are restricting storage, which is needed for login. Please enable cookies/local storage or try a different browser.");
      }
      
      throw error;
    }
  },

  async logout() {
    await signOut(auth);
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    // Check for redirect result on initialization
    // This is CRITICAL for mobile/APK flows
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        console.log("Redirect result found for user:", result.user.uid);
        const user = await this._getOrCreateUserDoc(result.user);
        callback(user);
      }
    }).catch(error => {
      console.error("Error handling redirect result:", error);
      // If we get a "missing initial state" error, it often means the redirect 
      // was interrupted or storage was cleared. We don't necessarily want to 
      // show an error to the user yet, as onAuthStateChanged might still pick up the session.
    });

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("Auth state changed: User logged in", firebaseUser.uid);
        try {
          const user = await this._getOrCreateUserDoc(firebaseUser);
          callback(user);
        } catch (error) {
          console.error("Failed to sync user doc on auth change:", error);
          callback(null);
        }
      } else {
        console.log("Auth state changed: No user");
        callback(null);
      }
    });
  }
};
