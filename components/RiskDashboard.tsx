import React, { useState } from 'react';
import { DocumentAnalysis, RiskLevel } from '../types';
import { AlertOctagon, CheckCircle, AlertTriangle, Info, ChevronDown, ChevronUp, FileText, PlusCircle } from 'lucide-react';
import DebtFormModal from './DebtFormModal';

interface RiskDashboardProps {
  analysis: DocumentAnalysis;
  onSaveToTriage: (analysis: DocumentAnalysis) => void;
}

const RiskDashboard: React.FC<RiskDashboardProps> = ({ analysis, onSaveToTriage }) => {
  const [showClauses, setShowClauses] = useState(true);

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.SAFE: return 'text-emerald-400 border-emerald-500/50 bg-emerald-900/20';
      case RiskLevel.CAUTION: return 'text-yellow-400 border-yellow-500/50 bg-yellow-900/20';
      case RiskLevel.PREDATORY: return 'text-orange-500 border-orange-500/50 bg-orange-900/20';
      case RiskLevel.URGENT: return 'text-red-500 border-red-500/50 bg-red-900/20';
      default: return 'text-slate-400';
    }
  };

  const getRiskIcon = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.SAFE: return <CheckCircle className="w-8 h-8" />;
      case RiskLevel.CAUTION: return <Info className="w-8 h-8" />;
      case RiskLevel.PREDATORY: return <AlertTriangle className="w-8 h-8" />;
      case RiskLevel.URGENT: return <AlertOctagon className="w-8 h-8" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header Card */}
      <div className={`p-6 rounded-xl border ${getRiskColor(analysis.riskLevel)} flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-slate-900/50 shadow-inner">
            {getRiskIcon(analysis.riskLevel)}
          </div>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-wider">{analysis.riskLevel} RISK DETECTED</h2>
            <p className="text-slate-300 opacity-90">{analysis.fileName}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-widest">Risk Score</p>
            <p className="text-4xl font-black">{analysis.riskScore}<span className="text-lg text-slate-500 font-normal">/100</span></p>
          </div>
          {/* Simple progress ring placeholder */}
          <div className="w-16 h-16 rounded-full border-4 border-slate-700 relative flex items-center justify-center">
            <div 
                className="absolute inset-0 rounded-full border-4 border-current opacity-40" 
                style={{ clipPath: `inset(${100 - analysis.riskScore}% 0 0 0)` }} // Simple visual hack for progress
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Analysis */}
        <div className="md:col-span-2 space-y-6">
          {/* Summary */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <FileText size={20} className="text-blue-400" /> Executive Summary
            </h3>
            <p className="text-slate-300 leading-relaxed">{analysis.summary}</p>
          </div>

          {/* Clauses */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div 
              className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-750 transition-colors"
              onClick={() => setShowClauses(!showClauses)}
            >
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <AlertTriangle size={20} className="text-orange-400" /> 
                Detected Clauses ({analysis.clauses.length})
              </h3>
              {showClauses ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            
            {showClauses && (
              <div className="px-6 pb-6 space-y-4">
                {analysis.clauses.map((clause, idx) => (
                  <div key={idx} className={`p-4 rounded-lg border ${clause.type === 'danger' ? 'border-red-900/50 bg-red-900/10' : 'border-slate-600 bg-slate-700/30'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 min-w-[8px] h-2 rounded-full ${clause.type === 'danger' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                      <div>
                        <p className="text-slate-200 font-medium italic mb-2">"{clause.text}"</p>
                        <p className={`text-sm ${clause.type === 'danger' ? 'text-red-300' : 'text-slate-400'}`}>
                          <span className="font-bold uppercase text-xs mr-2 border px-1 rounded border-current opacity-70">
                            {clause.type}
                          </span>
                          {clause.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {analysis.clauses.length === 0 && (
                   <p className="text-slate-500 italic">No specific dangerous clauses detected.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          
          {/* Primary Action */}
          <button 
             onClick={() => onSaveToTriage(analysis)}
             className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
             <PlusCircle size={20} />
             Track in Triage Center
          </button>

          {/* Actionable Advice */}
          <div className="bg-gradient-to-b from-blue-900/20 to-slate-800 p-6 rounded-xl border border-blue-800/50">
            <h3 className="text-lg font-bold text-blue-300 mb-3">AI Recommendation</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              {analysis.actionableAdvice}
            </p>
          </div>

          {/* Extracted Data */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Extracted Figures</h3>
            <div className="space-y-3">
              {analysis.extractedAmounts.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-slate-700 pb-2 last:border-0 last:pb-0">
                  <span className="text-slate-400 text-sm">{item.label}</span>
                  <span className="text-white font-mono font-bold">{item.amount}</span>
                </div>
              ))}
              {analysis.extractedAmounts.length === 0 && <span className="text-slate-500 text-sm">No amounts extracted.</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskDashboard;
