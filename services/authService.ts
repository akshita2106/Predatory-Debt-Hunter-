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

      // Seed demo data
      const demoDebts = [
        {
          id: crypto.randomUUID(),
          userId: firebaseUser.uid,
          title: 'Payday Advance #402',
          issuer: 'QuickCash Loans',
          amount: 50000, // $500.00
          dueDate: Date.now() + (2 * 24 * 60 * 60 * 1000),
          category: 'loan',
          priority: 'urgent',
          status: 'pending',
          riskLevel: 'PREDATORY',
          notes: 'High interest rate detected (400% APR). Hidden rollover fees.',
          createdAt: Date.now()
        },
        {
          id: crypto.randomUUID(),
          userId: firebaseUser.uid,
          title: 'Credit Card Statement',
          issuer: 'MegaBank',
          amount: 125000, // $1250.00
          dueDate: Date.now() + (10 * 24 * 60 * 60 * 1000),
          category: 'bill',
          priority: 'normal',
          status: 'pending',
          riskLevel: 'CAUTION',
          notes: 'Late fee is excessive. Minimum payment trap detected.',
          createdAt: Date.now()
        }
      ];

      for (const debt of demoDebts) {
        await setDoc(doc(db, 'debts', debt.id), debt);
      }

      const demoProfile = {
        userId: firebaseUser.uid,
        monthlySalary: 450000, // $4500
        currentSavings: 120000, // $1200
        expenses: [
          { id: '1', name: 'Rent', amount: 150000 },
          { id: '2', name: 'Groceries', amount: 40000 },
          { id: '3', name: 'Utilities', amount: 20000 }
        ],
        updatedAt: Date.now()
      };
      await setDoc(doc(db, 'financialProfiles', firebaseUser.uid), demoProfile);

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
