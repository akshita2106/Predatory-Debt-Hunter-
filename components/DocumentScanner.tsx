import React, { useRef, useState } from 'react';
import { Upload, Camera, FileText, Loader2, AlertTriangle, ScanLine } from 'lucide-react';
import { analyzeDocument } from '../services/geminiService';
import { DocumentAnalysis } from '../types';

interface DocumentScannerProps {
  onAnalysisComplete: (analysis: DocumentAnalysis) => void;
}

const DocumentScanner: React.FC<DocumentScannerProps> = ({ onAnalysisComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeDocument(file);
      onAnalysisComplete(result);
    } catch (err) {
      setError("Failed to analyze the document. Please try a clearer image.");
    } finally {
      setIsAnalyzing(false);
      // Reset inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
          Document Intake
        </h2>
        <p className="text-slate-400 max-w-lg mx-auto text-lg">
          Scan a bill, contract, or loan offer to instantly detect hidden traps and predatory terms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Camera Option */}
        <div 
          onClick={() => cameraInputRef.current?.click()}
          className={`
            group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/50 p-8 
            cursor-pointer transition-all duration-300 hover:border-emerald-500 hover:bg-slate-800 hover:shadow-2xl hover:shadow-emerald-900/20
            ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
           <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           
           <div className="flex flex-col items-center text-center relative z-10">
              <div className="h-16 w-16 mb-4 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Camera size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Scan with Camera</h3>
              <p className="text-sm text-slate-400">Take a photo of your physical document</p>
           </div>
           <input 
              type="file" 
              ref={cameraInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              capture="environment"
              className="hidden" 
            />
        </div>

        {/* Upload Option */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`
            group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/50 p-8 
            cursor-pointer transition-all duration-300 hover:border-blue-500 hover:bg-slate-800 hover:shadow-2xl hover:shadow-blue-900/20
            ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
           <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           
           <div className="flex flex-col items-center text-center relative z-10">
              <div className="h-16 w-16 mb-4 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Upload size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Upload File</h3>
              <p className="text-sm text-slate-400">Select PDF or Image from device</p>
           </div>
           <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*,.pdf" 
              className="hidden" 
            />
        </div>
      </div>

      {/* Loading State Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-slate-900 p-8 rounded-2xl border border-slate-700 shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent animate-[shimmer_2s_infinite]" />
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-bold text-white mb-2">Analyzing Fine Print</h3>
              <p className="text-slate-400">Our AI is scanning for predatory clauses, interest traps, and hidden fees...</p>
           </div>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-950/40 border border-red-900/50 rounded-xl flex items-start gap-4 text-red-200 animate-in slide-in-from-bottom-2">
          <AlertTriangle className="shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold mb-1">Analysis Failed</h4>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}
      
      <div className="mt-8 pt-8 border-t border-slate-800 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm mb-2">
           <ScanLine size={16} />
           <span>Secure & Private Processing</span>
        </div>
        <p className="text-xs text-slate-600">
          Documents are processed in real-time and not stored permanently without permission.
        </p>
      </div>
    </div>
  );
};

export default DocumentScanner;