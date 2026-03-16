import { auth, db } from '../firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from "../types";
import { handleFirestoreError, OperationType, cleanObject } from './firestoreUtils';

const provider = new GoogleAuthProvider();

export const authService = {
  async signInWithGoogle(): Promise<User> {
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;
    
    // Check if user exists in Firestore
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

  async logout() {
    await signOut(auth);
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            callback(userDoc.data() as User);
          } else {
            callback(null);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }
};
