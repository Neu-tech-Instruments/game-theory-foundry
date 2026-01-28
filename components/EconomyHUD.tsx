
import React from 'react';
import { EconomyState } from '../types';
import { TrendingUp, Activity, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  country: string;
  state: EconomyState;
  color: string;
}

export const EconomyHUD: React.FC<Props> = ({ country, state, color }) => {
  const getLabelColor = () => {
    if (color === 'blue') return 'text-blue-600';
    if (color === 'red') return 'text-red-600';
    return 'text-amber-600';
  };

  const getIndicatorColor = () => {
    if (color === 'blue') return 'bg-blue-500';
    if (color === 'red') return 'bg-red-500';
    return 'bg-amber-500';
  };

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-white border border-[#dee2e6] shadow-sm flex-1">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${getLabelColor()}`}>{country}</span>
        <div className={`w-2 h-2 rounded-full ${getIndicatorColor()} opacity-80`} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-1 opacity-50">
            <TrendingUp className="w-2.5 h-2.5" />
            <span className="text-[8px] uppercase font-bold">Points</span>
          </div>
          <span className="text-[13px] font-bold text-[#1c1e21]">{state.points.toFixed(1)}/10</span>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1 opacity-50">
            <Activity className="w-2.5 h-2.5" />
            <span className="text-[8px] uppercase font-bold">Inflation</span>
          </div>
          <span className={`text-[13px] font-bold ${state.inflation > 5 ? 'text-red-600' : 'text-emerald-600'}`}>
            {state.inflation.toFixed(1)}%
          </span>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1 opacity-50">
            <ShieldCheck className="w-2.5 h-2.5" />
            <span className="text-[8px] uppercase font-bold">Stability</span>
          </div>
          <span className="text-[13px] font-bold text-[#1c1e21]">{state.stability}%</span>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1 opacity-50">
            <Zap className="w-2.5 h-2.5" />
            <span className="text-[8px] uppercase font-bold">Influence</span>
          </div>
          <span className="text-[13px] font-bold text-[#1c1e21]">{state.influence}</span>
        </div>
      </div>
    </div>
  );
};
