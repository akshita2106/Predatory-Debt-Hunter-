import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { simulateScenarioAdvice } from '../services/geminiService';
import { financeService } from '../services/financeService';
import { 
  BrainCircuit, AlertCircle, Save, FolderOpen, Trash2, 
  TrendingUp, TrendingDown, Wallet, Activity, Plus, X,
  Briefcase, Home, ShoppingCart, Zap, Car, ShieldCheck, HeartPulse, Info
} from 'lucide-react';
import { User, SavedScenario, FinancialProfile, ExpenseCategory } from '../types';
import { formatCurrency, convertFromBase, convertToBase } from '../services/currencyUtils';

interface FinanceSimulatorProps {
  user: User;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#71717a'];

const FinanceSimulator: React.FC<FinanceSimulatorProps> = ({ user }) => {
  const userSettings = user.settings || { currencyCode: 'USD', currencySymbol: '$', deleteCompletedAfterDays: 30 };
  
  // Financial State (stored in user's selected currency for UI)
  const [salary, setSalary] = useState(0);
  const [savings, setSavings] = useState(0);
  const [expenses, setExpenses] = useState<ExpenseCategory[]>([]);
  const [scenarioType, setScenarioType] = useState('normal'); 
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  
  // Saving/Loading State
  const [scenarioName, setScenarioName] = useState("");
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Track previous currency to handle conversions when it changes
  const [prevCurrency, setPrevCurrency] = useState(userSettings.currencyCode);

  // Load profile and scenarios on mount
  useEffect(() => {
    const loadData = async () => {
      const profile = await financeService.getFinancialProfile(user.id);
      if (profile) {
        // Convert from base (USD) to user's currency
        setSalary(convertFromBase(profile.monthlySalary, userSettings.currencyCode));
        setSavings(convertFromBase(profile.currentSavings, userSettings.currencyCode));
        setExpenses(profile.expenses.map(e => ({
            ...e,
            amount: convertFromBase(e.amount, userSettings.currencyCode)
        })));
      }
      
      const scenarios = await financeService.getScenarios(user.id);
      setSavedScenarios(scenarios);
      setIsInitialLoad(false);
    };
    loadData();
  }, [user]);

  // Handle currency change
  useEffect(() => {
    if (prevCurrency !== userSettings.currencyCode) {
        // Convert current state from old currency to new currency
        setSalary(prev => convertFromBase(convertToBase(prev, prevCurrency), userSettings.currencyCode));
        setSavings(prev => convertFromBase(convertToBase(prev, prevCurrency), userSettings.currencyCode));
        setExpenses(prev => prev.map(e => ({
            ...e,
            amount: convertFromBase(convertToBase(e.amount, prevCurrency), userSettings.currencyCode)
        })));
        setPrevCurrency(userSettings.currencyCode);
    }
  }, [userSettings.currencyCode, prevCurrency]);

  // Derived Calculations
  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const disposableIncome = salary - totalExpenses;
  const runwayMonths = totalExpenses > 0 ? savings / totalExpenses : 0;

  const riskLevel = useMemo(() => {
    if (runwayMonths < 3) return { label: 'High Risk', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' };
    if (runwayMonths < 6) return { label: 'Moderate Risk', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    return { label: 'Stable', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
  }, [runwayMonths]);

  // Chart Data Generation
  const chartData = useMemo(() => {
    const months = 12;
    const data = [];
    let currentSavings = savings;
    
    // Scenario Adjustments
    let monthlySalaryAdj = salary;
    let monthlyExpensesAdj = totalExpenses;

    if (scenarioType === 'job_loss') monthlySalaryAdj = 0;
    if (scenarioType === 'rent_increase') monthlyExpensesAdj += 500;
    if (scenarioType === 'inflation') monthlyExpensesAdj *= 1.1;
    if (scenarioType === 'medical_emergency') currentSavings -= 5000;

    for (let i = 0; i <= months; i++) {
        data.push({
            month: `M${i}`,
            savings: Math.max(0, Math.round(currentSavings)),
        });
        currentSavings += (monthlySalaryAdj - monthlyExpensesAdj);
    }
    return data;
  }, [savings, salary, totalExpenses, scenarioType]);

  const expensePieData = useMemo(() => {
    return expenses.map(e => ({ name: e.name, value: e.amount }));
  }, [expenses]);

  // AI Advice Trigger
  useEffect(() => {
    if (isInitialLoad) return;

    const timer = setTimeout(async () => {
        setIsLoadingAdvice(true);
        const advice = await simulateScenarioAdvice(savings, salary, totalExpenses, scenarioType, userSettings.currencyCode);
        setAiAdvice(advice);
        setIsLoadingAdvice(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [savings, salary, totalExpenses, scenarioType, isInitialLoad, userSettings.currencyCode]);

  const handleSaveScenario = async () => {
    if (!scenarioName.trim()) return;
    setIsSaving(true);
    try {
        // Convert to base (USD) before saving
        const baseSalary = convertToBase(salary, userSettings.currencyCode);
        const baseSavings = convertToBase(savings, userSettings.currencyCode);
        const baseExpenses = expenses.map(e => ({
            ...e,
            amount: convertToBase(e.amount, userSettings.currencyCode)
        }));

        const newScenario = await financeService.saveScenario({
            userId: user.id,
            name: scenarioName,
            salary: baseSalary,
            savings: baseSavings,
            expenses: baseExpenses,
            scenarioType
        });
        setSavedScenarios(prev => [newScenario, ...prev]);
        setScenarioName("");
    } catch (err) {
        console.error(err);
    } finally {
        setIsSaving(false);
    }
  };

  const handleLoadScenario = (scenario: SavedScenario) => {
    // Convert from base (USD) to current user currency
    setSalary(convertFromBase(scenario.salary, userSettings.currencyCode));
    setSavings(convertFromBase(scenario.savings, userSettings.currencyCode));
    setExpenses(scenario.expenses.map(e => ({
        ...e,
        amount: convertFromBase(e.amount, userSettings.currencyCode)
    })));
    setScenarioType(scenario.scenarioType);
  };

  const handleDeleteScenario = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await financeService.deleteScenario(id);
    setSavedScenarios(prev => prev.filter(s => s.id !== id));
  };

  const addExpense = () => {
    setExpenses([...expenses, { id: crypto.randomUUID(), name: 'New Expense', amount: 0 }]);
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const updateExpense = (id: string, field: keyof ExpenseCategory, value: string | number) => {
    setExpenses(expenses.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-20">
      
      {/* Header & Quick Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <Activity className="text-emerald-500" /> Financial Health Simulator
            </h2>
            <p className="text-slate-400">Visualize your financial future and stress-test your stability.</p>
        </div>
        
        <div className={`px-6 py-3 rounded-2xl border ${riskLevel.border} ${riskLevel.bg} flex flex-col items-end`}>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Current Status</span>
            <span className={`text-xl font-black ${riskLevel.color}`}>{riskLevel.label}</span>
        </div>
      </div>

      {/* Top Bar: Save/Load */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
            <FolderOpen className="text-slate-500" size={20} />
            <div className="flex-1 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {savedScenarios.length === 0 ? (
                    <span className="text-slate-600 text-sm italic">No saved scenarios</span>
                ) : (
                    savedScenarios.map(s => (
                        <button 
                            key={s.id}
                            onClick={() => handleLoadScenario(s)}
                            className="flex-shrink-0 group flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-emerald-500/50 px-3 py-1.5 rounded-xl transition-all"
                        >
                            <span className="text-xs font-medium text-slate-300">{s.name}</span>
                            <X 
                                size={12} 
                                className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" 
                                onClick={(e) => handleDeleteScenario(s.id, e)}
                            />
                        </button>
                    ))
                )}
            </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-2">
            <input 
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="Name this scenario..."
                className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
            <button 
                onClick={handleSaveScenario}
                disabled={isSaving || !scenarioName}
                className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl disabled:opacity-50 transition-all"
            >
                <Save size={20} />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Inputs */}
        <div className="lg:col-span-4 space-y-6">
            {/* Income & Savings */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Wallet size={16} /> Core Inputs
                </h3>
                <div>
                    <label className="block text-xs text-slate-400 mb-1">Monthly Salary ({user.settings?.currencyCode || 'USD'})</label>
                    <input 
                        type="number"
                        value={salary}
                        onChange={(e) => setSalary(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs text-slate-400 mb-1">Current Savings ({user.settings?.currencyCode || 'USD'})</label>
                    <input 
                        type="number"
                        value={savings}
                        onChange={(e) => setSavings(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>
            </div>

            {/* Expenses */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Monthly Expenses</h3>
                    <button onClick={addExpense} className="text-emerald-500 hover:text-emerald-400"><Plus size={20} /></button>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {expenses.map(exp => (
                        <div key={exp.id} className="flex gap-2 group">
                            <input 
                                type="text"
                                value={exp.name}
                                onChange={(e) => updateExpense(exp.id, 'name', e.target.value)}
                                className="flex-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                            <input 
                                type="number"
                                value={exp.amount}
                                onChange={(e) => updateExpense(exp.id, 'amount', Number(e.target.value))}
                                className="w-20 bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                            <button onClick={() => removeExpense(exp.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Total Monthly</span>
                    <span className="text-white font-bold">
                        {formatCurrency(
                            totalExpenses,
                            userSettings.currencySymbol,
                            userSettings.currencyCode
                        )}
                    </span>
                </div>
            </div>
        </div>

        {/* Right Column: Simulation & Charts */}
        <div className="lg:col-span-8 space-y-6">
            
            {/* Simulation Controls */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Activity size={16} /> Stress Test Scenarios
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                        { id: 'normal', label: 'Normal', icon: <ShieldCheck size={16} /> },
                        { id: 'job_loss', label: 'Job Loss', icon: <Briefcase size={16} /> },
                        { id: 'rent_increase', label: 'Rent Hike', icon: <Home size={16} /> },
                        { id: 'inflation', label: 'Inflation', icon: <TrendingUp size={16} /> },
                        { id: 'medical_emergency', label: 'Medical', icon: <HeartPulse size={16} /> },
                    ].map(s => (
                        <button 
                            key={s.id}
                            onClick={() => setScenarioType(s.id)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                                scenarioType === s.id 
                                ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20' 
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                            }`}
                        >
                            {s.icon}
                            <span className="text-[10px] font-bold uppercase">{s.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Runway Chart */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Savings Projection (12 Months)</h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                    itemStyle={{ color: '#10b981' }}
                                />
                                <Area type="monotone" dataKey="savings" stroke="#10b981" fillOpacity={1} fill="url(#colorSavings)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Expense Breakdown */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Expense Distribution</h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={expensePieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {expensePieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* AI Advisor Box */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <BrainCircuit size={80} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <BrainCircuit className="text-emerald-500" size={18} />
                        </div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">AI Financial Advisor</h3>
                    </div>
                    
                    {isLoadingAdvice ? (
                        <div className="space-y-3">
                            <div className="h-4 bg-slate-800 rounded animate-pulse w-3/4"></div>
                            <div className="h-4 bg-slate-800 rounded animate-pulse w-full"></div>
                            <div className="h-4 bg-slate-800 rounded animate-pulse w-5/6"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-slate-300 text-sm leading-relaxed italic">
                                "{aiAdvice}"
                            </p>
                            
                            {disposableIncome > 500 && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-800">
                                    <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Emergency Fund</p>
                                        <p className="text-sm font-bold text-emerald-400">
                                            {formatCurrency(
                                                disposableIncome * 0.4,
                                                userSettings.currencySymbol,
                                                userSettings.currencyCode
                                            )}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Index Funds</p>
                                        <p className="text-sm font-bold text-blue-400">
                                            {formatCurrency(
                                                disposableIncome * 0.3,
                                                userSettings.currencySymbol,
                                                userSettings.currencyCode
                                            )}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Fixed Income</p>
                                        <p className="text-sm font-bold text-amber-400">
                                            {formatCurrency(
                                                disposableIncome * 0.2,
                                                userSettings.currencySymbol,
                                                userSettings.currencyCode
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Key Insights Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Disposable Income</p>
                    <div className="flex items-center gap-2">
                        {disposableIncome >= 0 ? <TrendingUp className="text-emerald-500" size={16} /> : <TrendingDown className="text-red-500" size={16} />}
                        <span className={`text-lg font-bold ${disposableIncome >= 0 ? 'text-white' : 'text-red-400'}`}>
                            {formatCurrency(
                                disposableIncome,
                                userSettings.currencySymbol,
                                userSettings.currencyCode
                            )}
                        </span>
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Savings Runway</p>
                    <div className="flex items-center gap-2">
                        <Activity className="text-blue-500" size={16} />
                        <span className="text-lg font-bold text-white">
                            {runwayMonths.toFixed(1)} Months
                        </span>
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Monthly Burn Rate</p>
                    <div className="flex items-center gap-2">
                        <Zap className="text-amber-500" size={16} />
                        <span className="text-lg font-bold text-white">
                            {((totalExpenses / salary) * 100).toFixed(0)}% of Salary
                        </span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceSimulator;
