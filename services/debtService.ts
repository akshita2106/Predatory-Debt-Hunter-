import { DebtTask, UserSettings, DebtStatus } from "../types";

const DEBTS_KEY_PREFIX = "pdh_debts_";
const SETTINGS_KEY_PREFIX = "pdh_settings_";

const DEFAULT_SETTINGS: UserSettings = {
  deleteCompletedAfterDays: 30,
  currencySymbol: '$'
};

export const debtService = {
  getDebts: (userId: string): DebtTask[] => {
    const key = `${DEBTS_KEY_PREFIX}${userId}`;
    const data = localStorage.getItem(key);
    let debts: DebtTask[] = data ? JSON.parse(data) : [];
    
    // Apply retention policy on load
    const settings = debtService.getSettings(userId);
    const now = Date.now();
    const retentionMs = settings.deleteCompletedAfterDays * 24 * 60 * 60 * 1000;
    
    if (settings.deleteCompletedAfterDays > 0) {
        const filtered = debts.filter(d => {
            if (d.status === 'completed' && d.completedAt) {
                return (now - d.completedAt) < retentionMs;
            }
            return true;
        });
        
        if (filtered.length !== debts.length) {
            localStorage.setItem(key, JSON.stringify(filtered));
            debts = filtered;
        }
    }
    
    return debts.sort((a, b) => b.createdAt - a.createdAt);
  },

  addDebt: (userId: string, task: Omit<DebtTask, 'id' | 'userId' | 'createdAt'>): DebtTask => {
    const debts = debtService.getDebts(userId);
    const newTask: DebtTask = {
        ...task,
        id: crypto.randomUUID(),
        userId,
        createdAt: Date.now()
    };
    debts.unshift(newTask);
    localStorage.setItem(`${DEBTS_KEY_PREFIX}${userId}`, JSON.stringify(debts));
    return newTask;
  },

  updateDebt: (userId: string, taskId: string, updates: Partial<DebtTask>): DebtTask[] => {
    let debts = debtService.getDebts(userId);
    debts = debts.map(d => d.id === taskId ? { ...d, ...updates } : d);
    localStorage.setItem(`${DEBTS_KEY_PREFIX}${userId}`, JSON.stringify(debts));
    return debts;
  },

  deleteDebt: (userId: string, taskId: string): DebtTask[] => {
    let debts = debtService.getDebts(userId);
    debts = debts.filter(d => d.id !== taskId);
    localStorage.setItem(`${DEBTS_KEY_PREFIX}${userId}`, JSON.stringify(debts));
    return debts;
  },

  markComplete: (userId: string, taskId: string, proofBase64?: string): DebtTask[] => {
      return debtService.updateDebt(userId, taskId, {
          status: 'completed',
          completedAt: Date.now(),
          proofOfPayment: proofBase64
      });
  },

  getSettings: (userId: string): UserSettings => {
      const data = localStorage.getItem(`${SETTINGS_KEY_PREFIX}${userId}`);
      return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  },

  saveSettings: (userId: string, settings: UserSettings) => {
      localStorage.setItem(`${SETTINGS_KEY_PREFIX}${userId}`, JSON.stringify(settings));
  }
};
