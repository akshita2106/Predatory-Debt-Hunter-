import React, { useEffect, useState } from 'react';
import { Shield, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { User } from '../types';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("AuthPage: Triggering demo login...");
      const user = await authService.signInAsDemo();
      onLogin(user);
    } catch (err: any) {
      console.error("AuthPage: Demo login failed:", err);
      setError("We couldn't prepare the demo environment. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden text-center">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-500 p-10">
        <div className="mb-10 flex justify-center">
          <div className="w-24 h-24 bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/20 shadow-inner">
            <Shield className="text-emerald-500" size={48} />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
          Debt Hunter
        </h1>
        <p className="text-slate-400 mb-10 text-lg">
          Your AI-powered financial bodyguard.
        </p>

        <div className="space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm text-left">
              <AlertCircle size={20} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full group relative flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-emerald-900/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <Shield className="group-hover:scale-110 transition-transform" size={24} />
                <span className="text-lg">Enter Demo App</span>
              </>
            )}
          </button>
          
          <p className="text-slate-500 text-xs">
            No registration required. All data is encrypted and private.
          </p>
        </div>
      </div>
      
      <div className="mt-10 text-slate-600 text-xs flex items-center gap-2 relative z-10 font-medium">
        <Shield size={14} />
        <span className="uppercase tracking-widest">Bank-grade encryption active</span>
      </div>
    </div>
  );
};

export default AuthPage;
