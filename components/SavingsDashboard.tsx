import React, { useMemo } from 'react';
import { TrendingUp, ShieldCheck, DollarSign, Target, ArrowRight, ShieldAlert } from 'lucide-react';
import { PredictionLogEntry } from '../types';

interface SavingsDashboardProps {
  predictionLog: PredictionLogEntry[];
  selectedMaterialId?: string | null;
  selectedMaterialName?: string | null;
  currentPrice?: number | null;
  unit?: string | null;
  onSimulate?: () => void;
}

export const SavingsDashboard: React.FC<SavingsDashboardProps> = ({ 
  predictionLog, 
  selectedMaterialId,
  selectedMaterialName,
  currentPrice,
  unit,
  onSimulate
}) => {
  const filteredLog = useMemo(() => {
    if (!selectedMaterialId) return predictionLog;
    return predictionLog.filter(p => p.materialId === selectedMaterialId);
  }, [predictionLog, selectedMaterialId]);

  const totalSavings = useMemo(() => {
    return filteredLog
      .filter(p => p.status === 'REALIZED')
      .reduce((acc, curr) => acc + (curr.savings || 0), 0);
  }, [filteredLog]);

  const accuracy = useMemo(() => {
    const realized = filteredLog.filter(p => p.status === 'REALIZED');
    if (filteredLog.length === 0) return 0;
    return Math.round((realized.length / filteredLog.length) * 100);
  }, [filteredLog]);

  const realizedPredictions = filteredLog.filter(p => p.status === 'REALIZED').reverse();
  const pendingPredictions = filteredLog.filter(p => p.status === 'PENDING').reverse();

  return (
    <div className="flex-1 flex gap-8 h-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Metrics Column */}
      <div className="w-80 flex flex-col gap-4 shrink-0">
        <div className="bg-gradient-to-br from-[#1971c2] to-[#1864ab] p-5 rounded-xl shadow-xl border border-blue-400/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
            <div className="flex items-center gap-2 mb-2 relative z-10">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Capital Protected</span>
            </div>
            <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-1 relative z-10 font-mono">
                <span className="text-xl opacity-70">$</span>
                {totalSavings.toLocaleString()}
            </div>
            <div className="mt-4 flex items-center justify-between relative z-10">
                <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-blue-200 uppercase tracking-widest">Efficiency Rating</span>
                    <span className="text-[12px] font-black text-white">{accuracy}% Precise</span>
                </div>
                <div className="w-10 h-10 border-2 border-white/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-200" />
                </div>
            </div>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm flex-1 flex flex-col justify-between">
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Night Shift Precision</span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-400 uppercase">Hit Rate</span>
                        <span className="text-slate-900">{accuracy}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${accuracy}%` }} />
                    </div>
                </div>
            </div>
            <p className="text-[9px] text-slate-400 italic font-medium leading-relaxed">
                The contrarian engine has successfully identified {realizedPredictions.length} critical price diversions across your material stack.
            </p>
        </div>
      </div>

      {/* Timeline Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4 px-2">
             <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {selectedMaterialName ? `Architect ROI Index // ${selectedMaterialName}` : "Global Capital ROI Index"}
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                </div>
                {currentPrice && (
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-[18px] font-black text-slate-900 font-mono">${currentPrice.toFixed(0)}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Current Projected / {unit}</span>
                    </div>
                )}
             </div>
             <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-black uppercase text-slate-500">Action Acknowledged</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 border-2 border-amber-500 rounded-full" />
                        <span className="text-[9px] font-black uppercase text-slate-500">Unresolved Risk</span>
                    </div>
                </div>
                {selectedMaterialName && (
                    <div className="px-2 py-0.5 bg-[#e7f5ff] text-[#1971c2] rounded text-[8px] font-black uppercase tracking-widest border border-blue-100 shadow-sm animate-pulse">
                        "I Told You So" Delta Active
                    </div>
                )}
             </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pr-4 space-y-3">
            {realizedPredictions.length === 0 && pendingPredictions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-20">
                    <ShieldAlert className="w-10 h-10 mb-4" />
                    <h3 className="text-[11px] font-black uppercase tracking-widest mb-1">Waiting for Neural Sync</h3>
                    <p className="text-[10px] font-bold mb-4">Perform a 'Sync Global Future' to realize your first capital protection cycle.</p>
                    {onSimulate && (
                        <button 
                            onClick={onSimulate}
                            className="px-6 py-2.5 bg-[#1c1e21] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95 flex items-center gap-2"
                        >
                            <TrendingUp className="w-4 h-4" />
                            Simulate 30-Day Drift
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* Realized Gains */}
                    {realizedPredictions.map(p => (
                        <div key={p.id} className="bg-white border-2 border-emerald-100 rounded-xl p-4 flex items-center gap-6 group hover:translate-x-1 transition-transform">
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[11px] font-black uppercase tracking-tight text-slate-900">{p.materialName} Warning</span>
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[8px] font-black uppercase">Capital Saved</span>
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                                    <span>Predicted: ${p.predictedPrice.toFixed(0)}</span>
                                    <ArrowRight className="w-3 h-3" />
                                    <span className="text-slate-900">Realized: ${p.realizedPrice?.toFixed(0)}</span>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-[14px] font-black text-emerald-600 font-mono">+${p.savings?.toLocaleString()}</div>
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ROI Realized</div>
                            </div>
                        </div>
                    ))}

                    {/* Pending Risks */}
                    {pendingPredictions.map(p => (
                        <div key={p.id} className="bg-[#fff9db] border-2 border-[#ffec99] rounded-xl p-4 flex items-center gap-6 opacity-80">
                            <div className="w-10 h-10 rounded-lg bg-white/50 border border-amber-200 flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[11px] font-black uppercase tracking-tight text-amber-900">Pending Pivot: {p.materialName}</span>
                                    <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded text-[8px] font-black uppercase">Early Warning Active</span>
                                </div>
                                <div className="text-[10px] font-bold text-amber-700/60 leading-tight">
                                    Identified on {p.predictionDate}. Target convergence on {p.targetDate}.
                                </div>
                            </div>
                            <div className="text-right shrink-0 opacity-40">
                                <div className="text-[12px] font-black text-amber-700 font-mono">TBD</div>
                                <div className="text-[8px] font-black text-amber-700 uppercase tracking-widest">Potential Saving</div>
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
      </div>
    </div>
  );
};

const Clock = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
