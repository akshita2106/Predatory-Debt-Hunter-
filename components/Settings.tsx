import React, { useState, useEffect } from 'react';
import { User, UserSettings, FinancialProfile, ExpenseCategory } from '../types';
import { debtService } from '../services/debtService';
import { financeService } from '../services/financeService';
import { Save, Trash2, Shield, Bell, Globe, User as UserIcon, Wallet, Check, Phone, Mail, Briefcase, MapPin, Plus, X } from 'lucide-react';
import { convertFromBase, convertToBase } from '../services/currencyUtils';

interface SettingsProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser }) => {
  const [settings, setSettings] = useState<UserSettings>(user.settings || { 
    deleteCompletedAfterDays: 30, 
    currencySymbol: '$',
    currencyCode: 'USD'
  });
  const [profile, setProfile] = useState<User>(user);
  const [financialProfile, setFinancialProfile] = useState<FinancialProfile>({
    userId: user.id,
    monthlySalary: 0,
    currentSavings: 0,
    expenses: [],
    updatedAt: Date.now()
  });
  
  const [activeSection, setActiveSection] = useState<'profile' | 'financial' | 'general' | 'privacy' | 'notifications'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchFinancialProfile = async () => {
      const fp = await financeService.getFinancialProfile(user.id);
      if (fp) {
        // Convert from base (USD) to current currency for editing
        const converted = {
          ...fp,
          monthlySalary: convertFromBase(fp.monthlySalary, settings.currencyCode),
          currentSavings: convertFromBase(fp.currentSavings, settings.currencyCode),
          expenses: fp.expenses.map(e => ({
            ...e,
            amount: convertFromBase(e.amount, settings.currencyCode)
          }))
        };
        setFinancialProfile(converted);
      }
    };
    fetchFinancialProfile();
  }, [user.id, settings.currencyCode]);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Save Settings
      await debtService.saveSettings(user.id, settings);
      
      // 2. Save User Profile
      await financeService.saveUserProfile(profile);
      
      // 3. Save Financial Profile (Convert back to base USD)
      const baseFinancialProfile = {
        ...financialProfile,
        monthlySalary: convertToBase(financialProfile.monthlySalary, settings.currencyCode),
        currentSavings: convertToBase(financialProfile.currentSavings, settings.currencyCode),
        expenses: financialProfile.expenses.map(e => ({
          ...e,
          amount: convertToBase(e.amount, settings.currencyCode)
        }))
      };
      await financeService.saveFinancialProfile(baseFinancialProfile);
      
      onUpdateUser({ ...profile, settings });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings", error);
    } finally {
      setIsSaving(false);
    }
  };

  const addExpense = () => {
    const newExpense: ExpenseCategory = {
      id: crypto.randomUUID(),
      name: 'New Category',
      amount: 0
    };
    setFinancialProfile({
      ...financialProfile,
      expenses: [...financialProfile.expenses, newExpense]
    });
  };

  const removeExpense = (id: string) => {
    setFinancialProfile({
      ...financialProfile,
      expenses: financialProfile.expenses.filter(e => e.id !== id)
    });
  };

  const updateExpense = (id: string, updates: Partial<ExpenseCategory>) => {
    setFinancialProfile({
      ...financialProfile,
      expenses: financialProfile.expenses.map(e => e.id === id ? { ...e, ...updates } : e)
    });
  };

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  ];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-20">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
        <p className="text-slate-400">Manage your profile, financial data, and application preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation */}
        <div className="space-y-1">
          <button 
            onClick={() => setActiveSection('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${activeSection === 'profile' ? 'bg-slate-800 text-white border-slate-700 shadow-lg' : 'text-slate-400 border-transparent hover:bg-slate-800/50'}`}
          >
            <UserIcon size={18} className={activeSection === 'profile' ? 'text-blue-400' : ''} />
            <span className="font-medium">User Profile</span>
          </button>
          <button 
            onClick={() => setActiveSection('financial')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${activeSection === 'financial' ? 'bg-slate-800 text-white border-slate-700 shadow-lg' : 'text-slate-400 border-transparent hover:bg-slate-800/50'}`}
          >
            <Wallet size={18} className={activeSection === 'financial' ? 'text-emerald-400' : ''} />
            <span className="font-medium">Financial Profile</span>
          </button>
          <button 
            onClick={() => setActiveSection('general')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${activeSection === 'general' ? 'bg-slate-800 text-white border-slate-700 shadow-lg' : 'text-slate-400 border-transparent hover:bg-slate-800/50'}`}
          >
            <Globe size={18} className={activeSection === 'general' ? 'text-indigo-400' : ''} />
            <span className="font-medium">General & Localization</span>
          </button>
          <button 
            onClick={() => setActiveSection('privacy')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${activeSection === 'privacy' ? 'bg-slate-800 text-white border-slate-700 shadow-lg' : 'text-slate-400 border-transparent hover:bg-slate-800/50'}`}
          >
            <Shield size={18} className={activeSection === 'privacy' ? 'text-emerald-400' : ''} />
            <span className="font-medium">Privacy & Security</span>
          </button>
          <button 
            onClick={() => setActiveSection('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${activeSection === 'notifications' ? 'bg-slate-800 text-white border-slate-700 shadow-lg' : 'text-slate-400 border-transparent hover:bg-slate-800/50'}`}
          >
            <Bell size={18} className={activeSection === 'notifications' ? 'text-amber-400' : ''} />
            <span className="font-medium">Notifications</span>
          </button>
        </div>

        {/* Content */}
        <div className="md:col-span-2 space-y-6">
          {activeSection === 'profile' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-800 bg-slate-800/30">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <UserIcon size={18} className="text-blue-400" />
                  User Profile
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                    <div className="relative">
                      <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-blue-500 outline-none transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="tel"
                        value={profile.phone || ''}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-blue-500 outline-none transition-colors"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Occupation</label>
                    <div className="relative">
                      <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={profile.occupation || ''}
                        onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-blue-500 outline-none transition-colors"
                        placeholder="Software Engineer"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Location</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={profile.location || ''}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-blue-500 outline-none transition-colors"
                      placeholder="New York, NY"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Short Bio</label>
                  <textarea
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors h-24 resize-none"
                    placeholder="Tell us a bit about yourself..."
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'financial' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-800 bg-slate-800/30">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Wallet size={18} className="text-emerald-400" />
                  Financial Profile
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Monthly Salary ({settings.currencySymbol})</label>
                    <input
                      type="number"
                      value={financialProfile.monthlySalary}
                      onChange={(e) => setFinancialProfile({ ...financialProfile, monthlySalary: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none transition-colors text-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Current Savings ({settings.currencySymbol})</label>
                    <input
                      type="number"
                      value={financialProfile.currentSavings}
                      onChange={(e) => setFinancialProfile({ ...financialProfile, currentSavings: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none transition-colors text-xl font-bold"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Monthly Expenses</label>
                    <button 
                      onClick={addExpense}
                      className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <Plus size={14} />
                      Add Category
                    </button>
                  </div>
                  <div className="space-y-3">
                    {financialProfile.expenses.map((expense) => (
                      <div key={expense.id} className="flex items-center gap-3 group">
                        <input
                          type="text"
                          value={expense.name}
                          onChange={(e) => updateExpense(expense.id, { name: e.target.value })}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-emerald-500 outline-none transition-colors"
                          placeholder="Category Name"
                        />
                        <div className="relative w-32">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{settings.currencySymbol}</span>
                          <input
                            type="number"
                            value={expense.amount}
                            onChange={(e) => updateExpense(expense.id, { amount: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-8 pr-3 text-white focus:border-emerald-500 outline-none transition-colors text-right"
                          />
                        </div>
                        <button 
                          onClick={() => removeExpense(expense.id)}
                          className="p-2.5 text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                    {financialProfile.expenses.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-slate-800 rounded-2xl">
                        <p className="text-slate-500 text-sm italic">No expense categories added yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'general' && (
            <>
              {/* Localization Section */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-slate-800 bg-slate-800/30">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Globe size={18} className="text-indigo-400" />
                    Localization
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-3">Preferred Currency</label>
                    <p className="text-xs text-slate-500 mb-4 italic">Note: Changing currency will automatically convert your displayed amounts based on current market rates.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {currencies.map((curr) => (
                        <button
                          key={curr.code}
                          onClick={() => setSettings({ ...settings, currencyCode: curr.code, currencySymbol: curr.symbol })}
                          className={`
                            p-3 rounded-xl border text-left transition-all
                            ${settings.currencyCode === curr.code 
                              ? 'bg-indigo-600/10 border-indigo-500 text-white ring-1 ring-indigo-500' 
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'}
                          `}
                        >
                          <div className="text-lg font-bold mb-1">{curr.symbol}</div>
                          <div className="text-xs font-medium uppercase tracking-wider">{curr.code}</div>
                          <div className="text-[10px] opacity-60 truncate">{curr.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <label className="block text-sm font-medium text-slate-400 mb-2">Custom Currency Symbol</label>
                    <input
                      type="text"
                      value={settings.currencySymbol}
                      onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-indigo-500 outline-none transition-colors"
                      placeholder="$"
                    />
                  </div>
                </div>
              </div>

              {/* Data Management Section */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-slate-800 bg-slate-800/30">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Trash2 size={18} className="text-red-400" />
                    Data Management
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Auto-delete completed items</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        value={settings.deleteCompletedAfterDays}
                        onChange={(e) => setSettings({ ...settings, deleteCompletedAfterDays: parseInt(e.target.value) || 0 })}
                        className="w-32 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors"
                      />
                      <span className="text-slate-400">days after completion</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 italic">Set to 0 to disable automatic deletion. This helps keep your Triage Center clean.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'privacy' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-xl">
              <Shield size={48} className="text-emerald-500 mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-bold text-white mb-2">Privacy Settings</h3>
              <p className="text-slate-400 max-w-sm mx-auto">Your data is stored securely in your private cloud instance. We do not sell or share your financial data.</p>
              <div className="mt-8 p-4 bg-slate-950 rounded-xl border border-slate-800 inline-block">
                <p className="text-xs text-slate-500">Encryption: AES-256-GCM</p>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-xl">
              <Bell size={48} className="text-amber-500 mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-bold text-white mb-2">Notification Preferences</h3>
              <p className="text-slate-400 max-w-sm mx-auto">Configure how you want to be alerted about upcoming due dates and predatory risks.</p>
              
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button className="px-6 py-2 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors">
                  Enable Browser Notifications
                </button>
                
                {deferredPrompt && (
                  <button 
                    onClick={handleInstallApp}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20"
                  >
                    Install App
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex items-center justify-between pt-4">
            {showSuccess ? (
              <div className="flex items-center gap-2 text-emerald-400 font-medium animate-in fade-in slide-in-from-left-2">
                <Check size={20} />
                <span>Settings saved successfully!</span>
              </div>
            ) : (
              <div />
            )}
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={20} />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
