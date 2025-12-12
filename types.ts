export enum RiskLevel {
  SAFE = 'SAFE',
  CAUTION = 'CAUTION',
  PREDATORY = 'PREDATORY',
  URGENT = 'URGENT',
}

export interface Clause {
  text: string;
  type: 'danger' | 'warning' | 'info';
  explanation: string;
}

export interface DocumentAnalysis {
  id: string;
  fileName: string;
  timestamp: number;
  summary: string;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  clauses: Clause[];
  extractedAmounts: {
    label: string;
    amount: string;
  }[];
  actionableAdvice: string;
  rawText?: string;
}

export interface NegotiationTemplate {
  id: string;
  title: string;
  type: 'email' | 'script';
  content: string;
}

export interface SimulationScenario {
  name: string;
  incomeChange: number; // percentage
  expenseChange: number; // percentage
  inflationRate: number; // percentage
  months: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface SavedScenario {
  id: string;
  name: string;
  savings: number;
  expenses: number;
  scenarioType: string;
  timestamp: number;
}

export type DebtCategory = 'bill' | 'loan' | 'collection' | 'subscription' | 'other';
export type DebtPriority = 'urgent' | 'normal' | 'low';
export type DebtStatus = 'pending' | 'completed' | 'snoozed';

export interface DebtTask {
  id: string;
  userId: string;
  analysisId?: string; // Link to original scan
  title: string;
  issuer: string;
  amount: number;
  dueDate: number | null; // Timestamp
  category: DebtCategory;
  priority: DebtPriority;
  status: DebtStatus;
  notes: string;
  createdAt: number;
  completedAt?: number;
  proofOfPayment?: string; // Base64
  riskLevel: RiskLevel;
}

export interface UserSettings {
  deleteCompletedAfterDays: number; // e.g., 30
  currencySymbol: string;
}
