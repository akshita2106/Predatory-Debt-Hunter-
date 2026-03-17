import React, { useState } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';
import { User } from '../types';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await authService.signInWithGoogle();
      if (user) {
        onLogin(user);
      }
    } catch (err: any) {
      console.error("AuthPage Error:", err);
      
      // Handle specific Firebase Auth errors
      if (err.code === 'auth/popup-closed-by-user') {
        // Don't show a scary error for a user cancellation, just reset
        setError(null); 
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError("Sign-in request was cancelled. Please try again.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Sign-in popup was blocked by your browser. Please allow popups for this site.");
      } else if (err.code === 'auth/web-storage-unsupported' || err.message?.includes('storage')) {
        setError("Your browser settings are restricting storage (cookies/local storage), which is required for login. Please enable them or try a different browser.");
      } else {
        setError("Failed to sign in with Google. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="p-8 pb-6 border-b border-slate-800 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 mb-6 shadow-lg">
            <Shield className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Predatory Debt Hunter</h1>
          <p className="text-slate-400 text-sm">Your AI Financial Bodyguard</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold text-white">Welcome Back</h2>
            <p className="text-slate-400 text-sm">Sign in to access your financial dashboard and protect your assets.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-70 disabled:transform-none ${loading ? 'cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={20} />
                <span>Connecting...</span>
              </div>
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Continue with Google
              </>
            )}
          </button>

          <p className="text-center text-slate-500 text-xs">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
      
      <p className="mt-8 text-slate-600 text-xs">
        &copy; 2026 Predatory Debt Hunter. Secure Financial Analysis.
      </p>
    </div>
  );
};

export default AuthPage;
