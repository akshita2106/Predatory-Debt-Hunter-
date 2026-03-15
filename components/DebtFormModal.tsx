import React, { useState, useEffect } from 'react';
import { DocumentAnalysis, DebtTask, DebtCategory, DebtPriority, UserSettings } from '../types';
import { X, Calendar, Tag, AlertCircle, FileText } from 'lucide-react';
import { convertToBase, convertFromBase } from '../services/currencyUtils';

interface DebtFormModalProps {
  analysis: DocumentAnalysis;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<DebtTask, 'id' | 'userId' | 'createdAt'>) => void;
  userSettings?: UserSettings;
}

const DebtFormModal: React.FC<DebtFormModalProps> = ({ analysis, isOpen, onClose, onSave, userSettings }) => {
  const [formData, setFormData] = useState({
    title: '',
    issuer: '',
    amount: '',
    dueDate: '',
    category: 'bill' as DebtCategory,
    priority: 'normal' as DebtPriority,
    notes: ''
  });

  const currencySymbol = userSettings?.currencySymbol || '$';
  const currencyCode = userSettings?.currencyCode || 'USD';

  useEffect(() => {
    if (isOpen && analysis) {
        // Attempt to auto-extract
        const amountObj = analysis.extractedAmounts.find(a => a.label.toLowerCase().includes('total') || a.label.toLowerCase().includes('due'));
        const rawAmountStr = amountObj ? amountObj.amount.replace(/[^0-9.]/g, '') : '0';
        const rawAmount = parseFloat(rawAmountStr) || 0;
        
        // Convert from base (assuming AI extracts in base/USD) to user currency for display
        const displayAmount = convertFromBase(rawAmount, currencyCode).toFixed(2);
        
        setFormData({
            title: `Processed: ${analysis.fileName}`,
            issuer: 'Unknown Issuer', 
            amount: displayAmount,
            dueDate: '', 
            category: analysis.riskLevel === 'PREDATORY' ? 'loan' : 'bill',
            priority: analysis.riskLevel === 'URGENT' ? 'urgent' : 'normal',
            notes: analysis.summary
        });
    }
  }, [isOpen, analysis]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountInUserCurrency = parseFloat(formData.amount) || 0;
    // Convert to base currency (USD) for storage
    const amountInBase = convertToBase(amountInUserCurrency, currencyCode);

    onSave({
        title: formData.title,
        issuer: formData.issuer,
        amount: amountInBase,
        dueDate: formData.dueDate ? new Date(formData.dueDate).getTime() : null,
        category: formData.category,
        priority: formData.priority,
        notes: formData.notes,
        status: 'pending',
        analysisId: analysis.id,
        riskLevel: analysis.riskLevel
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Save to Dashboard</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Title</label>
                <input 
                    type="text" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Issuer / Creditor</label>
                    <input 
                        type="text" 
                        value={formData.issuer} 
                        onChange={e => setFormData({...formData, issuer: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Amount Due ({currencyCode})</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">{currencySymbol}</span>
                        <input 
                            type="number" 
                            value={formData.amount} 
                            onChange={e => setFormData({...formData, amount: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-9 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            step="0.01"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Due Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="date" 
                            value={formData.dueDate} 
                            onChange={e => setFormData({...formData, dueDate: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-9 text-white focus:ring-2 focus:ring-blue-500 outline-none [color-scheme:dark]"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Category</label>
                    <select 
                        value={formData.category} 
                        onChange={e => setFormData({...formData, category: e.target.value as DebtCategory})}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="bill">Utility Bill</option>
                        <option value="loan">Loan / Credit</option>
                        <option value="subscription">Subscription</option>
                        <option value="collection">Debt Collection</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>

            <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Priority</label>
                 <div className="flex gap-3">
                    {['low', 'normal', 'urgent'].map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setFormData({...formData, priority: p as DebtPriority})}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize border transition-all ${
                                formData.priority === p 
                                    ? p === 'urgent' ? 'bg-red-600 border-red-500 text-white' : p === 'normal' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-emerald-600 border-emerald-500 text-white'
                                    : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                 </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Notes</label>
                <textarea 
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                ></textarea>
            </div>

            <div className="pt-4">
                <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-900/20"
                >
                    Save to Pending Tasks
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default DebtFormModal;