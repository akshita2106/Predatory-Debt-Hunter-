import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { simulateScenarioAdvice } from '../services/geminiService';
import { authService } from '../services/authService';
import { BrainCircuit, AlertCircle, Save, FolderOpen, Trash2 } from 'lucide-react';
import { User, SavedScenario } from '../types';

interface FinanceSimulatorProps {
  user: User;
}

const FinanceSimulator: React.FC<FinanceSimulatorProps> = ({ user }) => {
  // Inputs
  const [savings, setSavings] = useState(5000);
  const [expenses, setExpenses] = useState(2500);
  const [scenarioType, setScenarioType] = useState('job_loss'); 
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  
  // Saving/Loading State
  const [scenarioName, setScenarioName] = useState("");
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Derived Data for Chart
  const [chartData, setChartData] = useState<any[]>([]);

  // Load scenarios on mount
  useEffect(() => {
    const loaded = authService.getScenarios(user.id);
    setSavedScenarios(loaded);
  }, [user.id]);

  useEffect(() => {
    // Generate simple projection data based on inputs
    const months = 12;
    const data = [];
    let currentSavings = savings;
    
    // Scenario Multipliers
    let burnRate = 0;
    
    if (scenarioType === 'job_loss') {
        burnRate = expenses;
    } else if (scenarioType === 'inflation') {
        burnRate = expenses * 0.15; // Gap created by inflation
    } else if (scenarioType === 'rent_hike') {
        burnRate = 500; // Flat increase
    }

    for (let i = 0; i <= months; i++) {
        data.push({
            month: `Month ${i}`,
            savings: Math.max(0, currentSavings),
            dangerZone: 0
        });
        currentSavings -= burnRate;
    }
    setChartData(data);

    // Debounced AI call
    const timer = setTimeout(async () => {
        setIsLoadingAdvice(true);
        const advice = await simulateScenarioAdvice(savings, expenses, scenarioType.replace('_', ' '));
        setAiAdvice(advice);
        setIsLoadingAdvice(false);
    }, 1000);

    return () => clearTimeout(timer);

  }, [savings, expenses, scenarioType]);

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) {
        alert("Please name your scenario");
        return;
    }
    setIsSaving(true);
    const newScenario = authService.saveScenario(user.id, {
        name: scenarioName,
        savings,
        expenses,
        scenarioType
    });
    setSavedScenarios(prev => [newScenario, ...prev]);
    setScenarioName("");
    setIsSaving(false);
  };

  const handleLoadScenario = (scenario: SavedScenario) => {
    setSavings(scenario.savings);
    setExpenses(scenario.expenses);
    setScenarioType(scenario.scenarioType);
  };

  const handleDeleteScenario = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = authService.deleteScenario(user.id, id);
    setSavedScenarios(updated);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      
      {/* Save / Load Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Save Controls */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-2">
            <input 
                type="text" 
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="Scenario Name (e.g. 'Optimistic Fall 2024')"
                className="flex-1 bg-slate-900 border border-slate-600 text-white text-sm rounded-lg p-2 focus:ring-1 focus:ring-purple-500 outline-none"
            />
            <button 
                onClick={handleSaveScenario}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors font-medium"
            >
                <Save size={16} /> Save
            </button>
        </div>

        {/* Load Controls */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
             <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                <FolderOpen size={14} /> Saved Scenarios
             </div>
             {savedScenarios.length === 0 ? (
                 <p className="text-slate-500 text-sm italic">No saved scenarios yet.</p>
             ) : (
                 <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                     {savedScenarios.map(s => (
                         <div 
                            key={s.id} 
                            onClick={() => handleLoadScenario(s)}
                            className="flex-shrink-0 group flex items-center gap-2 bg-slate-900 border border-slate-600 hover:border-purple-500/50 hover:bg-slate-800 px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                         >
                            <span className="text-sm text-slate-200 whitespace-nowrap">{s.name}</span>
                            <button 
                                onClick={(e) => handleDeleteScenario(s.id, e)}
                                className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={14} />
                            </button>
                         </div>
                     ))}
                 </div>
             )}
        </div>
      </div>

      {/* Main Simulator Card */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
            <BrainCircuit className="text-purple-400" size={28} />
            <h2 className="text-2xl font-bold text-white">What-If Simulator</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Controls */}
            <div className="space-y-6">
                <div>
                    <label className="block text-slate-400 text-sm mb-2">Current Savings ($)</label>
                    <input 
                        type="number" 
                        value={savings} 
                        onChange={(e) => setSavings(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-slate-400 text-sm mb-2">Monthly Expenses ($)</label>
                    <input 
                        type="number" 
                        value={expenses} 
                        onChange={(e) => setExpenses(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-slate-400 text-sm mb-2">Disaster Scenario</label>
                    <select 
                        value={scenarioType}
                        onChange={(e) => setScenarioType(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                        <option value="job_loss">Sudden Job Loss</option>
                        <option value="inflation">High Inflation (15% Cost Increase)</option>
                        <option value="rent_hike">Rent Hike ($500/mo)</option>
                    </select>
                </div>
            </div>

            {/* Chart */}
            <div className="md:col-span-2 min-h-[300px] bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                <h3 className="text-slate-400 text-sm font-semibold mb-4 text-center uppercase tracking-wider">Projected Runway</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }} 
                            itemStyle={{ color: '#f1f5f9' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="savings" stroke="#a855f7" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} name="Savings Balance" />
                    </LineChart>
                </ResponsiveContainer>
                
                {/* Insights */}
                <div className="mt-4 flex items-start gap-3 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                    {isLoadingAdvice ? (
                        <span className="text-slate-400 text-sm animate-pulse">AI is calculating survival strategy...</span>
                    ) : (
                        <>
                            <AlertCircle className="text-purple-400 min-w-[20px]" size={20} />
                            <p className="text-sm text-purple-200">{aiAdvice}</p>
                        </>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceSimulator;
