import { db } from '../firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { User, FinancialProfile, SavedScenario, ExpenseCategory } from '../types';
import { handleFirestoreError, OperationType, cleanObject } from './firestoreUtils';

export const financeService = {
  // --- User Profile ---
  async saveUserProfile(user: User) {
    try {
      await setDoc(doc(db, 'users', user.id), cleanObject(user));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
    }
  },

  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as User) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${userId}`);
      return null;
    }
  },

  // --- Financial Profile ---
  async saveFinancialProfile(profile: FinancialProfile) {
    try {
      await setDoc(doc(db, 'financialProfiles', profile.userId), cleanObject({
        ...profile,
        updatedAt: Date.now()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `financialProfiles/${profile.userId}`);
    }
  },

  async getFinancialProfile(userId: string): Promise<FinancialProfile | null> {
    try {
      const docRef = doc(db, 'financialProfiles', userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as FinancialProfile) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `financialProfiles/${userId}`);
      return null;
    }
  },

  // --- Saved Scenarios ---
  async saveScenario(scenario: Omit<SavedScenario, 'id' | 'timestamp'>): Promise<SavedScenario> {
    const scenarioId = crypto.randomUUID();
    const newScenario: SavedScenario = {
      ...scenario,
      id: scenarioId,
      timestamp: Date.now()
    };
    try {
      await setDoc(doc(db, 'savedScenarios', scenarioId), cleanObject(newScenario));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `savedScenarios/${scenarioId}`);
    }
    return newScenario;
  },

  async getScenarios(userId: string): Promise<SavedScenario[]> {
    try {
      const q = query(
        collection(db, 'savedScenarios'), 
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as SavedScenario);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'savedScenarios');
      return [];
    }
  },

  async deleteScenario(scenarioId: string) {
    try {
      await deleteDoc(doc(db, 'savedScenarios', scenarioId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `savedScenarios/${scenarioId}`);
    }
  }
};
