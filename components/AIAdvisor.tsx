import React, { useState, useEffect } from 'react';
import { BrainCircuit, Loader2, Sparkles } from 'lucide-react';
import { GameState, Scenario, Payoff, MapMode } from '../types';

interface Props {
  state: GameState;
  scenario: Scenario;
  payoff: Payoff;
}

export const AIAdvisor: React.FC<Props> = ({ state, scenario }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Generate new advice out whenever the round changes
    setLoading(true);
    const pol = state.policyStrategy;
    const ind = state.industryStrategy;

    const timer = setTimeout(() => {
      let insight = '';
      const pol = state.policyStrategy;
      const ind = state.industryStrategy;

      if (pol === 'FREE_TRADE') {
        insight = `Global policymakers are maintaining FREE TRADE. Industries are operating under ${ind.replace('_', ' ')}. Expect rapid technology deployment but potential supply chain overextensions if shocks occur.`;
      } else if (pol === 'TARIFFS') {
        insight = `TARIFFS are active. Industries reacting with ${ind.replace('_', ' ')} will face cost-push inflation. Manufacturing hubs and Energy markets will scramble to secure localized supply lines.`;
      } else if (pol === 'EXPORT_BANS') {
        insight = `EXPORT BANS have crippled the supply of ${state.bannedAsset.replace('_', ' ')}. Industries must adopt defensive postures. Severe market corrections expected in Tech and Finance if diversification is not achieved.`;
      }

      // INTEGRATE PANIC LOGIC
      const highPanicSectors = Object.values(payoff.sectors).filter(s => s.panicIndex > 60);
      let hoardingWarning = '';
      if (highPanicSectors.length > 0) {
        hoardingWarning = `\n\n⚠️ CONTRARIAN ALERT: ${highPanicSectors.map(s => s.name.split(' ')[0]).join(' & ')} sectors show ${highPanicSectors[0].panicIndex}% PANIC levels. Competitors are likely hoarding inventory. Move to defensive procurement immediately to avoid 2-3x price spikes.`;
      }

      setAdvice(`MACROECONOMIC INSIGHT (Round ${state.currentRound}):\n\n${insight}${hoardingWarning}\n\nSCENARIO: ${scenario.title} — ${scenario.context}`);
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [state.currentRound]);

  return (
    <div className="bg-gradient-to-b from-[#fdfbff] to-white border border-[#dee2e6] shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#6741d9] to-[#845ef7] py-2 px-3 flex items-center gap-2 shrink-0">
        <BrainCircuit className="w-4 h-4 text-white" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white">AI Policy Analyst</span>
        <div className="ml-auto flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm">
          <Sparkles className="w-3 h-3 text-white" />
          <span className="text-[9px] font-bold text-white">Gemini Pro</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 min-h-[140px] relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-[1px] text-[#6741d9]">
            <Loader2 className="w-5 h-5 animate-spin mb-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest animate-pulse">Running Monte Carlo Simulations...</span>
          </div>
        ) : (
          <div className="text-[11px] leading-relaxed text-[#495057] font-medium whitespace-pre-wrap">
            {advice}
          </div>
        )}
      </div>
    </div>
  );
};
