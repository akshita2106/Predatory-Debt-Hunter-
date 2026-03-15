import React, { useState, useEffect, useRef } from 'react';
import { DebtTask, User, UserSettings } from '../types';
import { debtService } from '../services/debtService';
import { CheckCircle, Clock, AlertTriangle, Calendar, MoreVertical, Trash2, Archive, Upload, X, Filter, Settings as SettingsIcon, FileText } from 'lucide-react';
import { formatCurrency, convertFromBase } from '../services/currencyUtils';
import { fileToGenerativePart } from '../services/geminiService';

interface TriageCenterProps {
  user: User;
  onNegotiate: (task: DebtTask) => void;
  onOpenDoc: (docId: string) => void;
  onOpenSettings?: () => void;
}

const TriageCenter: React.FC<TriageCenterProps> = ({ user, onNegotiate, onOpenDoc, onOpenSettings }) => {
  const [tasks, setTasks] = useState<DebtTask[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [loading, setLoading] = useState(true);
  
  // Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [completeConfirm, setCompleteConfirm] = useState<string | null>(null);

  // Proof Upload State
  const [proofTask, setProofTask] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = debtService.subscribeToDebts(user.id, (debts) => {
      setTasks(debts);
      setLoading(false);
      
      // Apply retention policy if needed
      if (user.settings?.deleteCompletedAfterDays) {
          debtService.applyRetentionPolicy(user.id, user.settings.deleteCompletedAfterDays);
      }
    });

    return () => unsubscribe();
  }, [user.id, user.settings?.deleteCompletedAfterDays]);

  const handleStatusChange = async (taskId: string, newStatus: 'snoozed' | 'pending') => {
      await debtService.updateDebt(taskId, { status: newStatus });
  };

  const handleDelete = async (taskId: string) => {
      await debtService.deleteDebt(taskId);
      setDeleteConfirm(null);
  };

  const handleMarkComplete = async (taskId: string, withProof: boolean) => {
      if (withProof) {
          setProofTask(taskId);
          setTimeout(() => fileInputRef.current?.click(), 100);
      } else {
          await debtService.markComplete(taskId);
      }
      setCompleteConfirm(null);
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && proofTask) {
          const base64 = await fileToGenerativePart(file);
          await debtService.markComplete(proofTask, `data:${file.type};base64,${base64}`);
          setProofTask(null);
      }
  };

  const handleSnooze = async (taskId: string, currentDueDate: number | null) => {
      const newDueDate = (currentDueDate || Date.now()) + (7 * 24 * 60 * 60 * 1000); // Add 7 days
      await debtService.updateDebt(taskId, { dueDate: newDueDate, status: 'pending' });
  };

  const filteredTasks = tasks.filter(t => activeTab === 'pending' ? t.status !== 'completed' : t.status === 'completed');

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
         <div>
            <h2 className="text-3xl font-bold text-white mb-1">Triage Center</h2>
            <p className="text-slate-400">Manage your financial obligations and track risks.</p>
         </div>
         <div className="flex items-center gap-2">
            <button 
                onClick={onOpenSettings}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
                <SettingsIcon size={20} />
            </button>
            <div className="bg-slate-800 p-1 rounded-lg flex">
                <button 
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'pending' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                    Pending ({tasks.filter(t => t.status !== 'completed').length})
                </button>
                <button 
                    onClick={() => setActiveTab('completed')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'completed' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                    Completed
                </button>
            </div>
         </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
            <div className="text-center py-20 bg-slate-800/30 border-2 border-dashed border-slate-700 rounded-2xl">
                <Archive className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                <h3 className="text-xl font-medium text-slate-400">No {activeTab} items found</h3>
                <p className="text-slate-500 mt-2">Scan a document to add it to your triage list.</p>
            </div>
        ) : (
            filteredTasks.map(task => (
                <div key={task.id} className="bg-slate-800 rounded-xl border border-slate-700 p-5 transition-all hover:border-slate-600 group relative">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        
                        {/* Info Section */}
                        <div className="flex items-start gap-4 flex-1">
                            <div className={`
                                mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0
                                ${task.priority === 'urgent' ? 'bg-red-900/30 text-red-500' : task.priority === 'normal' ? 'bg-blue-900/30 text-blue-500' : 'bg-emerald-900/30 text-emerald-500'}
                            `}>
                                {activeTab === 'completed' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white leading-tight">{task.title}</h3>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-400">
                                    <span className="font-semibold text-slate-300">{task.issuer}</span>
                                    <span>•</span>
                                    <span className={`flex items-center gap-1 ${task.dueDate && task.dueDate < Date.now() && activeTab === 'pending' ? 'text-red-400 font-bold' : ''}`}>
                                        <Calendar size={14} /> 
                                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Date'}
                                        {task.dueDate && task.dueDate < Date.now() && activeTab === 'pending' && (
                                            <span className="ml-1 text-[10px] bg-red-500 text-white px-1 rounded">OVERDUE</span>
                                        )}
                                        {task.dueDate && task.dueDate >= Date.now() && activeTab === 'pending' && (
                                            <span className="ml-2 text-slate-500 text-xs font-normal">
                                                ({Math.ceil((task.dueDate - Date.now()) / (1000 * 60 * 60 * 24))} days left)
                                            </span>
                                        )}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                        task.riskLevel === 'PREDATORY' || task.riskLevel === 'URGENT' ? 'bg-red-900/50 text-red-300' : 'bg-slate-700 text-slate-400'
                                    }`}>
                                        {task.riskLevel}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Amount Section */}
                        <div className="text-right min-w-[120px]">
                            <p className="text-2xl font-bold text-white tracking-tight">
                                {formatCurrency(
                                    convertFromBase(task.amount, user.settings?.currencyCode || 'USD'),
                                    user.settings?.currencySymbol || '$',
                                    user.settings?.currencyCode || 'USD'
                                )}
                            </p>
                            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{task.category}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 border-l border-slate-700 pl-4 ml-2">
                             {activeTab === 'pending' && (
                                <>
                                    <button 
                                        onClick={() => setCompleteConfirm(task.id)}
                                        className="p-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white rounded-lg transition-colors tooltip"
                                        title="Mark Complete"
                                    >
                                        <CheckCircle size={20} />
                                    </button>
                                    <button 
                                        onClick={() => handleSnooze(task.id, task.dueDate)}
                                        className="p-2 bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white rounded-lg transition-colors"
                                        title="Snooze (7 days)"
                                    >
                                        <Clock size={20} />
                                    </button>
                                    <button 
                                        onClick={() => onNegotiate(task)}
                                        className="p-2 bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white rounded-lg transition-colors"
                                        title="Negotiate"
                                    >
                                        <FileText size={20} />
                                    </button>
                                    <button 
                                        onClick={() => setDeleteConfirm(task.id)}
                                        className="p-2 text-slate-500 hover:bg-red-900/20 hover:text-red-400 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </>
                             )}
                             {activeTab === 'completed' && (
                                 <div className="flex items-center gap-4">
                                    {task.proofOfPayment && (
                                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                                            <FileText size={14} /> Proof Attached
                                        </span>
                                    )}
                                    <button 
                                        onClick={() => setDeleteConfirm(task.id)}
                                        className="p-2 text-slate-500 hover:bg-red-900/20 hover:text-red-400 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                 </div>
                             )}
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>

      {/* Hidden File Input for Proof */}
      <input type="file" ref={fileInputRef} onChange={handleProofUpload} className="hidden" accept="image/*" />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trash2 className="text-red-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Task?</h3>
                <p className="text-slate-400 mb-8 text-sm">This action cannot be undone. The task will be permanently removed from your records.</p>
                
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => handleDelete(deleteConfirm)}
                        className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all"
                    >
                        Yes, Delete Permanently
                    </button>
                    <button 
                        onClick={() => setDeleteConfirm(null)}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Completion Confirmation Modal */}
      {completeConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-emerald-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Mark as Completed</h3>
                <p className="text-slate-400 mb-8 text-sm">Would you like to attach a proof of payment (receipt/screenshot) for your records?</p>
                
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => handleMarkComplete(completeConfirm, true)}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <Upload size={18} /> Upload Proof & Complete
                    </button>
                    <button 
                        onClick={() => handleMarkComplete(completeConfirm, false)}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all"
                    >
                        Complete Without Proof
                    </button>
                    <button 
                        onClick={() => setCompleteConfirm(null)}
                        className="w-full py-3 text-slate-500 hover:text-slate-300 text-sm transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TriageCenter;
