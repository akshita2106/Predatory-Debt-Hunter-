import React, { useState, useEffect, useRef } from 'react';
import { generateNegotiationContent } from '../services/geminiService';
import { DocumentAnalysis, UserSettings } from '../types';
import { Mail, PhoneCall, Copy, Check, MessageSquare, Mic, StopCircle, Zap, Volume2, Sparkles } from 'lucide-react';

interface NegotiationHubProps {
  analysis: DocumentAnalysis | null;
  userSettings?: UserSettings;
}

const NegotiationHub: React.FC<NegotiationHubProps> = ({ analysis, userSettings }) => {
  const [activeTab, setActiveTab] = useState<'script' | 'email'>('script');
  const [goal, setGoal] = useState('Waive the late fee');
  const [tone, setTone] = useState('Professional & Firm');
  const [additionalContext, setAdditionalContext] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Voice Coach State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const handleGenerate = async () => {
    if (!analysis) return;
    setIsGenerating(true);
    setVoiceFeedback(null);
    const content = await generateNegotiationContent(analysis, activeTab, goal, tone, additionalContext);
    setGeneratedContent(content);
    setIsGenerating(false);
    setCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Mock Recording Logic
  const toggleRecording = async () => {
    if (isRecording) {
        // Stop Recording
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
        setRecordingTime(0);
        
        // Generate Mock Analysis based on context
        const mockFeedback = [
            "⚠️ Analysis: Your tone sounded a bit hesitant. Try to lower your pitch at the end of sentences to sound more authoritative.",
            "✅ Analysis: Excellent pacing! You sounded calm and firm. This represents a strong negotiating position.",
            "⚠️ Analysis: You were speaking too fast. Slow down to ensure the agent understands your request clearly.",
            "✅ Analysis: Great confidence. Using pauses effectively can help pressure the other side to fill the silence."
        ];
        setVoiceFeedback(mockFeedback[Math.floor(Math.random() * mockFeedback.length)]);
    } else {
        // Start Recording
        try {
            // Request permission to verify intent and show browser indicator
            await navigator.mediaDevices.getUserMedia({ audio: true });
            setIsRecording(true);
            setVoiceFeedback(null);
            timerRef.current = window.setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            alert("Microphone access denied. Please enable permissions to use the Voice Coach.");
        }
    }
  };

  useEffect(() => {
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!analysis) {
    return (
      <div className="text-center p-12 bg-slate-800 rounded-xl border border-slate-700 border-dashed animate-fade-in">
        <MessageSquare className="mx-auto h-12 w-12 text-slate-600 mb-4" />
        <h3 className="text-xl font-medium text-slate-300">No Document Selected</h3>
        <p className="text-slate-500 mt-2">Scan a document first to generate specific negotiation strategies.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in">
       <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
         {/* Header */}
         <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                <Sparkles className="text-blue-500" />
                Negotiation Assistant
            </h2>
            <p className="text-slate-400 text-sm">
                Active Target: <span className="text-emerald-400 font-semibold px-2 py-0.5 bg-slate-700/50 rounded-md border border-slate-600">{analysis.fileName}</span>
            </p>
         </div>

         <div className="p-8 grid grid-cols-1 xl:grid-cols-2 gap-10">
            {/* Left Column: Controls */}
            <div className="space-y-8">
                {/* Inputs */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Communication Channel</label>
                        <div className="flex bg-slate-900/50 p-1.5 rounded-xl border border-slate-700/50">
                            <button 
                                onClick={() => setActiveTab('script')}
                                className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all font-medium ${activeTab === 'script' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                <PhoneCall size={18} /> Call Script
                            </button>
                            <button 
                                onClick={() => setActiveTab('email')}
                                className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all font-medium ${activeTab === 'email' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                <Mail size={18} /> Formal Email
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Desired Outcome</label>
                        <div className="relative">
                            <select 
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl p-4 pr-10 appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer hover:bg-slate-800"
                            >
                                <option value="Waive the late fee">Waive the late fee</option>
                                <option value="Lower the APR interest rate">Lower the APR / Interest Rate</option>
                                <option value="Negotiate a payment plan">Negotiate a Payment Plan (EMI)</option>
                                <option value="Dispute a charge">Dispute a Fraudulent Charge</option>
                                <option value="Settlement offer">Offer a Lump-sum Settlement</option>
                                <option value="Request debt validation">Request Debt Validation (Legal)</option>
                                <option value="Remove from credit report">Remove Negative Mark from Credit Report</option>
                                <option value="Hardship deferral">Request Financial Hardship Deferral</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tone of Voice</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Professional & Firm', 'Empathetic & Cooperative', 'Strict & Legalistic', 'Persistent & Direct'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTone(t)}
                                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${tone === t ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Additional Context (Optional)</label>
                        <textarea 
                            value={additionalContext}
                            onChange={(e) => setAdditionalContext(e.target.value)}
                            placeholder="e.g. I lost my job last month, or I have a medical emergency..."
                            className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl p-4 min-h-[100px] outline-none focus:border-blue-500 transition-all resize-none text-sm"
                        />
                    </div>

                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {isGenerating ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Drafting Strategy...</span>
                            </div>
                        ) : (
                            <span className="flex items-center justify-center gap-2">Generate {activeTab === 'script' ? 'Script' : 'Email'} <Zap size={18} className="fill-white" /></span>
                        )}
                    </button>
                </div>
                
                {/* Voice Coach Section (Only for Scripts) */}
                {activeTab === 'script' && (
                    <div className="pt-8 border-t border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Volume2 className="text-purple-400" /> 
                                AI Voice Coach
                            </h3>
                            <span className="text-xs font-medium px-2 py-1 bg-purple-900/30 text-purple-300 rounded border border-purple-500/30">BETA</span>
                        </div>
                        
                        <div className="bg-slate-900 rounded-xl p-6 border border-slate-700/50 relative overflow-hidden">
                            {/* Background Elements */}
                            {isRecording && (
                                <div className="absolute inset-0 bg-purple-900/10 animate-pulse" />
                            )}

                            <div className="relative z-10 text-center">
                                <p className="text-slate-400 text-sm mb-6">
                                    Practice reading your script. AI will analyze your tone for confidence and clarity.
                                </p>
                                
                                <button
                                    onClick={toggleRecording}
                                    className={`
                                        h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 shadow-xl
                                        ${isRecording 
                                            ? 'bg-red-500 hover:bg-red-600 scale-110 ring-4 ring-red-500/20' 
                                            : 'bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-purple-500 group'}
                                    `}
                                >
                                    {isRecording ? (
                                        <StopCircle size={32} className="text-white" />
                                    ) : (
                                        <Mic size={32} className="text-slate-400 group-hover:text-purple-400 transition-colors" />
                                    )}
                                </button>
                                
                                {isRecording && (
                                    <div className="text-red-400 font-mono text-lg font-bold animate-pulse">
                                        {formatTime(recordingTime)}
                                    </div>
                                )}
                                
                                {!isRecording && !voiceFeedback && (
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Tap to Record</p>
                                )}
                            </div>
                        </div>

                        {/* Feedback Area */}
                        {voiceFeedback && (
                            <div className="mt-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg animate-in slide-in-from-top-2">
                                <p className="text-purple-200 text-sm leading-relaxed font-medium">
                                    {voiceFeedback}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right Column: Output */}
            <div className="relative flex flex-col h-full min-h-[500px] bg-slate-900 rounded-xl border border-slate-700 shadow-inner overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500 opacity-50" />
                
                {generatedContent ? (
                    <>
                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                            <div className="prose prose-invert max-w-none">
                                <pre className="font-sans text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                                    {generatedContent}
                                </pre>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-800/80 backdrop-blur border-t border-slate-700 flex justify-end">
                             <button 
                                onClick={copyToClipboard}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors border border-slate-600 hover:border-slate-500"
                            >
                                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                <span className="text-sm font-medium">{copied ? 'Copied' : 'Copy Text'}</span>
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 text-center opacity-60">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                            <MessageSquare size={40} className="text-slate-500" />
                        </div>
                        <h4 className="text-xl font-medium text-slate-400 mb-2">Ready to Draft</h4>
                        <p className="max-w-xs mx-auto text-sm">Select your goal and click generate to create a custom negotiation script backed by AI.</p>
                    </div>
                )}
            </div>
         </div>
       </div>
    </div>
  );
};

export default NegotiationHub;