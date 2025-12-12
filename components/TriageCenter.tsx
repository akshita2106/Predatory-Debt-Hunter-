import React, { useState, useEffect, useRef } from 'react';
import { DebtTask, User, UserSettings } from '../types';
import { debtService } from '../services/debtService';
import { CheckCircle, Clock, AlertTriangle, Calendar, MoreVertical, Trash2, Archive, Upload, X, Filter, Settings as SettingsIcon, FileText } from 'lucide-react';
import { fileToGenerativePart } from '../services/geminiService';

interface TriageCenterProps {
  user: User;
  onNegotiate: (task: DebtTask) => void;
  onOpenDoc: (docId: string) => void;
}

const TriageCenter: React.FC<TriageCenterProps> = ({ user, onNegotiate, onOpenDoc }) => {
  const [tasks, setTasks] = useState<DebtTask[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(debtService.getSettings(user.id));
  
  // Proof Upload State
  const [proofTask, setProofTask] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTasks(debtService.getDebts(user.id));
  }, [user.id, activeTab]);

  const refresh = () => setTasks(debtService.getDebts(user.id));

  const handleStatusChange = (taskId: string, newStatus: 'snoozed' | 'pending') => {
      debtService.updateDebt(user.id, taskId, { status: newStatus });
      refresh();
  };

  const handleDelete = (taskId: string) => {
      if (confirm("Are you sure you want to permanently delete this task?")) {
          debtService.deleteDebt(user.id, taskId);
          refresh();
      }
  };

  const initiateCompletion = (taskId: string) => {
      if (confirm("Do you want to upload proof of payment? Click OK to upload, Cancel to just mark as done.")) {
          setProofTask(taskId);
          setTimeout(() => fileInputRef.current?.click(), 100);
      } else {
          debtService.markComplete(user.id, taskId);
          refresh();
      }
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && proofTask) {
          const base64 = await fileToGenerativePart(file);
          debtService.markComplete(user.id, proofTask, `data:${file.type};base64,${base64}`);
          setProofTask(null);
          refresh();
      }
  };

  const handleSaveSettings = () => {
      debtService.saveSettings(user.id, settings);
      setSettingsOpen(false);
      refresh(); // Re-apply retention
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
                onClick={() => setSettingsOpen(true)}
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
                                    <span className="flex items-center gap-1">
                                        <Calendar size={14} /> 
                                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Date'}
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
                        <div className="text-right min-w-[100px]">
                            <p className="text-2xl font-bold text-white tracking-tight">
                                {settings.currencySymbol}{task.amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">{task.category}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 border-l border-slate-700 pl-4 ml-2">
                             {activeTab === 'pending' && (
                                <>
                                    <button 
                                        onClick={() => initiateCompletion(task.id)}
                                        className="p-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white rounded-lg transition-colors tooltip"
                                        title="Mark Complete"
                                    >
                                        <CheckCircle size={20} />
                                    </button>
                                    <button 
                                        onClick={() => onNegotiate(task)}
                                        className="p-2 bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white rounded-lg transition-colors"
                                        title="Negotiate"
                                    >
                                        <FileText size={20} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(task.id)}
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
                                        onClick={() => handleDelete(task.id)}
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

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Retention Settings</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Delete completed items after (days)</label>
                        <input 
                            type="number" 
                            value={settings.deleteCompletedAfterDays}
                            onChange={(e) => setSettings({...settings, deleteCompletedAfterDays: parseInt(e.target.value)})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white"
                        />
                        <p className="text-xs text-slate-500 mt-1">Set to 0 to keep forever.</p>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Currency Symbol</label>
                        <input 
                            type="text" 
                            value={settings.currencySymbol}
                            onChange={(e) => setSettings({...settings, currencySymbol: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={() => setSettingsOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                    <button onClick={handleSaveSettings} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">Save Changes</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default TriageCenter;
