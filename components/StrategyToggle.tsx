
import React from 'react';
import { Strategy, US_BanItem, CHINA_BanItem } from '../types';
import { BAN_METRICS } from '../constants';

interface Props {
  label: string;
  value: Strategy;
  focusValue: string;
  onChange: (s: Strategy) => void;
  onFocusChange: (f: any) => void;
  accentColor: string;
  options: string[];
}

export const StrategyToggle: React.FC<Props> = ({
  label, value, focusValue, onChange, onFocusChange, accentColor, options
}) => {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <div className="flex items-center gap-2 ml-1">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
        <div className={`w-0.5 h-2.5 rounded-full ${accentColor === 'blue' ? 'bg-blue-500' : 'bg-red-500'}`} />
      </div>

      <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner">
        {(['FREE_TRADE', 'TARIFFS', 'EXPORT_BANS'] as Strategy[]).map((s) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={`flex-1 py-2 px-1 rounded text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${value === s
              ? `${s === 'FREE_TRADE' ? 'bg-emerald-500' : s === 'TARIFFS' ? 'bg-amber-500' : 'bg-[#e03131]'} text-white shadow-md`
              : 'text-slate-500 hover:text-slate-700 hover:bg-white hover:shadow-sm'
              }`}
          >
            {s === 'FREE_TRADE' ? 'FREE' : s === 'EXPORT_BANS' ? 'EXPORT' : 'TARIFFS'}
          </button>
        ))}
      </div>

      {value === 'EXPORT_BANS' && (
        <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="text-[9px] font-black text-slate-700 uppercase mb-1.5 ml-1 tracking-wider">Weaponized Asset:</div>
          <div className="grid grid-cols-1 gap-1.5">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => onFocusChange(opt)}
                className={`py-2 px-3 rounded-md border-2 text-[9px] font-black uppercase tracking-widest text-left transition-all ${focusValue === opt
                  ? 'bg-[#ffc9c9] border-[#e03131]/50 text-[#c92a2a]'
                  : 'bg-[#e9ecef] border-[#dee2e6] text-[#adb5bd] hover:border-[#ced4da]'
                  }`}
              >
                {BAN_METRICS[opt].label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
