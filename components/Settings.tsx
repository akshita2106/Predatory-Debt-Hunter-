import React, { useState } from 'react';
import { User, UserSettings } from '../types';
import { debtService } from '../services/debtService';
import { Save, Trash2, Shield, Bell, Globe, CreditCard, Check } from 'lucide-react';

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
  const [activeSection, setActiveSection] = useState<'general' | 'privacy' | 'notifications'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await debtService.saveSettings(user.id, settings);
      onUpdateUser({ ...user, settings });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings", error);
    } finally {
      setIsSaving(false);
    }
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
        <p className="text-slate-400">Manage your preferences and application configuration.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation */}
        <div className="space-y-1">
          <button 
            onClick={() => setActiveSection('general')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${activeSection === 'general' ? 'bg-slate-800 text-white border-slate-700 shadow-lg' : 'text-slate-400 border-transparent hover:bg-slate-800/50'}`}
          >
            <Globe size={18} className={activeSection === 'general' ? 'text-blue-400' : ''} />
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
          {activeSection === 'general' && (
            <>
              {/* Localization Section */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-slate-800 bg-slate-800/30">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Globe size={18} className="text-blue-400" />
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
                              ? 'bg-blue-600/10 border-blue-500 text-white ring-1 ring-blue-500' 
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors"
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
              <button className="mt-8 px-6 py-2 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors">
                Enable Browser Notifications
              </button>
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
