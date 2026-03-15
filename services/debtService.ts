import { db } from "../firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  getDoc,
  setDoc,
  Timestamp,
  orderBy,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { DebtTask, UserSettings, User } from "../types";
import { handleFirestoreError, OperationType, cleanObject } from "./firestoreUtils";

const DEBTS_COLLECTION = "debts";
const USERS_COLLECTION = "users";

export const debtService = {
  // Real-time listener for debts
  subscribeToDebts: (userId: string, callback: (debts: DebtTask[]) => void) => {
    const q = query(
      collection(db, DEBTS_COLLECTION),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

      return onSnapshot(q, (snapshot) => {
        const debts = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as DebtTask[];
        callback(debts);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, DEBTS_COLLECTION);
      });
  },

  addDebt: async (userId: string, task: Omit<DebtTask, 'id' | 'userId' | 'createdAt'>): Promise<string> => {
    try {
      const data = cleanObject({
        ...task,
        userId,
        createdAt: Date.now(),
        status: task.status || 'pending'
      });
      const docRef = await addDoc(collection(db, DEBTS_COLLECTION), data);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, DEBTS_COLLECTION);
      throw error;
    }
  },

  updateDebt: async (taskId: string, updates: Partial<DebtTask>): Promise<void> => {
    try {
      const docRef = doc(db, DEBTS_COLLECTION, taskId);
      await updateDoc(docRef, cleanObject(updates));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${DEBTS_COLLECTION}/${taskId}`);
      throw error;
    }
  },

  deleteDebt: async (taskId: string): Promise<void> => {
    try {
      const docRef = doc(db, DEBTS_COLLECTION, taskId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${DEBTS_COLLECTION}/${taskId}`);
      throw error;
    }
  },

  markComplete: async (taskId: string, proofBase64?: string): Promise<void> => {
    return debtService.updateDebt(taskId, {
      status: 'completed',
      completedAt: Date.now(),
      proofOfPayment: proofBase64
    });
  },

  // Settings are now part of the User object
  getSettings: async (userId: string): Promise<UserSettings> => {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        return userData.settings || { deleteCompletedAfterDays: 30, currencySymbol: '$', currencyCode: 'USD' };
      }
      return { deleteCompletedAfterDays: 30, currencySymbol: '$', currencyCode: 'USD' };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${USERS_COLLECTION}/${userId}`);
      return { deleteCompletedAfterDays: 30, currencySymbol: '$', currencyCode: 'USD' };
    }
  },

  saveSettings: async (userId: string, settings: UserSettings): Promise<void> => {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      await updateDoc(userRef, cleanObject({ settings }));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${userId}`);
      throw error;
    }
  },

  // Process retention policy (can be called periodically or on load)
  applyRetentionPolicy: async (userId: string, days: number): Promise<void> => {
    if (days <= 0) return;

    try {
      const retentionMs = days * 24 * 60 * 60 * 1000;
      const cutoff = Date.now() - retentionMs;

      const q = query(
        collection(db, DEBTS_COLLECTION),
        where("userId", "==", userId),
        where("status", "==", "completed"),
        where("completedAt", "<", cutoff)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return;

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, DEBTS_COLLECTION);
    }
  }
};
