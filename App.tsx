import React, { useState, useEffect } from 'react';
import { DocumentAnalysis, User, DebtTask } from './types';
import DocumentScanner from './components/DocumentScanner';
import RiskDashboard from './components/RiskDashboard';
import FinanceSimulator from './components/FinanceSimulator';
import NegotiationHub from './components/NegotiationHub';
import AuthPage from './components/AuthPage';
import TriageCenter from './components/TriageCenter';
import DebtFormModal from './components/DebtFormModal';
import { authService } from './services/authService';
import { debtService } from './services/debtService';
import { Shield, FileText, Activity, MessageSquare, Menu, X, LayoutDashboard, LogOut, User as UserIcon, ListTodo } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'scan' | 'triage' | 'dashboard' | 'simulator' | 'negotiate'>('scan');
  const [documents, setDocuments] = useState<DocumentAnalysis[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Debt Form Modal State
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [docToSave, setDocToSave] = useState<DocumentAnalysis | null>(null);

  // Negotiation Context State
  const [negotiationTask, setNegotiationTask] = useState<DebtTask | null>(null);

  // Check for existing session on load
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
        setCurrentUser(user);
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setDocuments([]);
    setSelectedDocId(null);
    setCurrentView('scan');
  };

  const handleAnalysisComplete = (analysis: DocumentAnalysis) => {
    setDocuments(prev => [analysis, ...prev]);
    setSelectedDocId(analysis.id);
    setCurrentView('dashboard'); // Show Risk Dashboard first
  };

  const handleOpenSaveModal = (analysis: DocumentAnalysis) => {
      setDocToSave(analysis);
      setIsDebtModalOpen(true);
  };

  const handleSaveDebt = (taskData: any) => {
      if (currentUser) {
          debtService.addDebt(currentUser.id, taskData);
          setIsDebtModalOpen(false);
          setCurrentView('triage');
      }
  };

  const handleNavigateToNegotiate = (task: DebtTask) => {
      // Create a mock doc analysis context from the task if actual doc is missing from RAM
      const relatedDoc = documents.find(d => d.id === task.analysisId);
      
      if (relatedDoc) {
          setSelectedDocId(relatedDoc.id);
      } else {
          // Fallback if we refreshed and lost the scan result
          const mockDoc: DocumentAnalysis = {
              id: task.analysisId || 'mock',
              fileName: task.title,
              timestamp: task.createdAt,
              summary: task.notes,
              riskScore: task.riskLevel === 'PREDATORY' ? 85 : 20,
              riskLevel: task.riskLevel,
              clauses: [],
              extractedAmounts: [{ label: 'Amount', amount: String(task.amount) }],
              actionableAdvice: 'Proceed with negotiation based on saved task parameters.'
          };
          setDocuments(prev => [mockDoc, ...prev]);
          setSelectedDocId(mockDoc.id);
      }
      
      setCurrentView('negotiate');
  };

  const currentDoc = documents.find(d => d.id === selectedDocId) || documents[0] || null;

  const NavItem = ({ view, icon, label }: { view: typeof currentView, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        currentView === view 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  // If not logged in, show Auth Page
  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Mobile Header */}
      <div className="lg:hidden p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
            <Shield className="text-emerald-500" />
            <span className="font-bold text-lg text-white">Debt Hunter</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300">
            {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen">
        
        {/* Sidebar */}
        <aside className={`
            fixed lg:sticky top-16 lg:top-0 left-0 h-[calc(100vh-64px)] lg:h-screen w-full lg:w-72 bg-slate-900 border-r border-slate-800 p-6 flex flex-col z-40 transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="hidden lg:flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                <Shield className="text-emerald-500" size={24} />
            </div>
            <div>
                <h1 className="font-bold text-xl text-white tracking-tight">Predatory<br/>Debt Hunter</h1>
            </div>
          </div>

          <nav className="space-y-2 flex-1">
            <NavItem view="scan" icon={<FileText size={20} />} label="Scanner" />
            <NavItem view="triage" icon={<ListTodo size={20} />} label="Triage Center" />
            {currentDoc && <NavItem view="dashboard" icon={<LayoutDashboard size={20} />} label="Risk Analysis" />}
            <NavItem view="simulator" icon={<Activity size={20} />} label="Simulator" />
            <NavItem view="negotiate" icon={<MessageSquare size={20} />} label="Negotiation" />
          </nav>

          {/* User Profile & Logout */}
          <div className="mt-8 pt-6 border-t border-slate-800">
             <div className="flex items-center gap-3 px-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <UserIcon size={16} />
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                </div>
             </div>
             <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-950/30 hover:text-red-300 rounded-lg transition-colors"
             >
                <LogOut size={16} /> Sign Out
             </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 lg:ml-0 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {currentView === 'scan' && (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Scan & Analyze</h2>
                    <p className="text-slate-400">Upload financial documents to detect predatory terms instantly.</p>
                </div>
                <DocumentScanner onAnalysisComplete={handleAnalysisComplete} />
              </div>
            )}

            {currentView === 'triage' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <TriageCenter 
                        user={currentUser} 
                        onNegotiate={handleNavigateToNegotiate}
                        onOpenDoc={(id) => { setSelectedDocId(id); setCurrentView('dashboard'); }}
                    />
                </div>
            )}

            {currentView === 'dashboard' && (
               currentDoc ? (
                 <RiskDashboard 
                    analysis={currentDoc} 
                    onSaveToTriage={handleOpenSaveModal}
                 />
               ) : (
                 <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <Shield size={64} className="text-slate-700 mb-4" />
                    <h2 className="text-xl font-bold text-slate-400">No Analysis Available</h2>
                    <p className="text-slate-500 mt-2 mb-6">Scan a document to view the risk dashboard.</p>
                    <button 
                        onClick={() => setCurrentView('scan')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                    >
                        Go to Scanner
                    </button>
                 </div>
               )
            )}

            {currentView === 'simulator' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <FinanceSimulator user={currentUser} />
                </div>
            )}

            {currentView === 'negotiate' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <NegotiationHub currentDoc={currentDoc} />
                </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {docToSave && (
          <DebtFormModal 
              isOpen={isDebtModalOpen} 
              onClose={() => setIsDebtModalOpen(false)} 
              analysis={docToSave}
              onSave={handleSaveDebt}
          />
      )}
    </div>
  );
};

export default App;
