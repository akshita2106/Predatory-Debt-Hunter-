import React, { useState } from 'react';
import { User, FinancialProfile, ExpenseCategory } from '../types';
import { financeService } from '../services/financeService';
import { Shield, ArrowRight, DollarSign, Briefcase, MapPin, Plus, Trash2 } from 'lucide-react';

interface ProfileSetupProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [occupation, setOccupation] = useState('');
  const [location, setLocation] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [salary, setSalary] = useState(0);
  const [savings, setSavings] = useState(0);
  const [expenses, setExpenses] = useState<ExpenseCategory[]>([
    { id: '1', name: 'Rent / Housing', amount: 0 },
    { id: '2', name: 'Groceries', amount: 0 },
    { id: '3', name: 'Utilities', amount: 0 }
  ]);

  const addExpense = () => {
    setExpenses([...expenses, { id: crypto.randomUUID(), name: '', amount: 0 }]);
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const updateExpense = (id: string, field: keyof ExpenseCategory, value: string | number) => {
    setExpenses(expenses.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleComplete = async () => {
    const updatedUser: User = {
      ...user,
      occupation,
      location,
      currency,
      hasCompletedSetup: true
    };

    const financialProfile: FinancialProfile = {
      userId: user.id,
      monthlySalary: salary,
      currentSavings: savings,
      expenses: expenses.filter(e => e.name && e.amount > 0),
      updatedAt: Date.now()
    };

    await financeService.saveUserProfile(updatedUser);
    await financeService.saveFinancialProfile(financialProfile);
    onComplete(updatedUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
            <Shield className="text-emerald-500" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Setup Your Profile</h1>
            <p className="text-slate-400 text-sm">Let's personalize your financial bodyguard.</p>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-2 flex items-center gap-2">
                <Briefcase size={16} /> What is your occupation?
              </label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Software Engineer"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-2 flex items-center gap-2">
                <MapPin size={16} /> Where do you live?
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. New York, USA"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-2 flex items-center gap-2">
                <DollarSign size={16} /> Preferred Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
            >
              Next Step <ArrowRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-2">Monthly Salary</label>
                <input
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-2">Total Savings</label>
                <input
                  type="number"
                  value={savings}
                  onChange={(e) => setSavings(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-slate-400 text-sm font-medium">Monthly Expenses</label>
                <button
                  onClick={addExpense}
                  className="text-emerald-400 hover:text-emerald-300 text-xs font-bold flex items-center gap-1"
                >
                  <Plus size={14} /> Add Category
                </button>
              </div>
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex gap-2">
                    <input
                      type="text"
                      value={expense.name}
                      onChange={(e) => updateExpense(expense.id, 'name', e.target.value)}
                      placeholder="Category Name"
                      className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                    <input
                      type="number"
                      value={expense.amount}
                      onChange={(e) => updateExpense(expense.id, 'amount', Number(e.target.value))}
                      className="w-24 bg-slate-800 border border-slate-700 text-white text-sm rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                    <button
                      onClick={() => removeExpense(expense.id)}
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
              >
                Complete Setup <Shield size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSetup;
