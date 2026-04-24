import React from 'react';
import { BAN_METRICS } from '../constants';

interface Props {
  label: string;
  value: string;
  focusValue?: string;
  onChange: (s: any) => void;
  onFocusChange?: (f: any) => void;
  accentColor: string;
  strategyOptions: string[];
  focusOptions?: string[];
  focusLabel?: string;
}

export const StrategyToggle: React.FC<Props> = ({
  label, value, focusValue, onChange, onFocusChange, accentColor, strategyOptions, focusOptions, focusLabel
}) => {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <div className="flex items-center gap-2 ml-1">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
        <div className={`w-0.5 h-2.5 rounded-full ${accentColor === 'blue' ? 'bg-blue-500' : 'bg-red-500'}`} />
      </div>

      <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner">
        {strategyOptions.map((s) => {
          let styleClass = 'text-slate-500 hover:text-slate-700 hover:bg-white hover:shadow-sm';
          if (value === s) {
            if (s === 'FREE_TRADE' || s === 'EXPANSION') styleClass = 'bg-emerald-500 text-white shadow-md';
            else if (s === 'TARIFFS' || s === 'DIVERSIFICATION') styleClass = 'bg-amber-500 text-white shadow-md';
            else styleClass = 'bg-[#e03131] text-white shadow-md'; // BANS or DEFENSIVE
          }

          let displayName = s.replace('_', ' ');
          if (s === 'FREE_TRADE') displayName = 'FREE';
          if (s === 'EXPORT_BANS') displayName = 'EXPORT';

          return (
            <button
              key={s}
              onClick={() => onChange(s)}
              className={`flex-1 py-2 px-1 rounded text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${styleClass}`}
            >
              {displayName}
            </button>
          );
        })}
      </div>

      {value === 'EXPORT_BANS' && focusOptions && onFocusChange && (
        <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="text-[9px] font-black text-slate-700 uppercase mb-1.5 ml-1 tracking-wider">{focusLabel || 'Weaponized Asset:'}</div>
          <div className="grid grid-cols-1 gap-1.5">
            {focusOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => onFocusChange(opt)}
                className={`py-2 px-3 rounded-md border-2 text-[9px] font-black uppercase tracking-widest text-left transition-all ${focusValue === opt
                  ? 'bg-[#ffc9c9] border-[#e03131]/50 text-[#c92a2a]'
                  : 'bg-[#e9ecef] border-[#dee2e6] text-[#adb5bd] hover:border-[#ced4da]'
                  }`}
              >
                {BAN_METRICS[opt as keyof typeof BAN_METRICS].label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
