
import React, { useMemo } from 'react';
import { Strategy, Payoff, GameState } from '../types';
import { calculatePayoff } from '../hooks/useTradeEngine';
import { SCENARIOS } from '../constants';

interface Props {
  state: GameState;
}


export const GameMatrix: React.FC<Props> = ({ state }) => {
  const strategies: Strategy[] = ['FREE_TRADE', 'TARIFFS', 'EXPORT_BANS'];
  const scenario = SCENARIOS[state.scenario];

  const matrix = useMemo(() => {
    const m: Record<string, Record<string, Payoff>> = {};
    strategies.forEach(us => {
      m[us] = {};
      strategies.forEach(china => {
        const tempState = { ...state, usStrategy: us, chinaStrategy: china };
        m[us][china] = calculatePayoff(tempState);
      });
    });
    return m;
  }, [state.scenario, state.usBanFocus, state.chinaBanFocus]);

  const getCellClass = (us: Strategy, china: Strategy) => {
    const isActive = us === state.usStrategy && china === state.chinaStrategy;
    return `relative p-2 border-r border-b border-slate-200 transition-all duration-200 flex flex-col justify-between ${isActive
      ? 'bg-slate-50 ring-2 ring-inset ring-blue-500 z-10'
      : 'bg-white hover:bg-slate-50'
      }`;
  };

  const renderPayoff = (payoff: Payoff, isActive: boolean) => (
    <div className="flex flex-col h-full justify-between gap-1">
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">US</span>
          <span className={`text-lg font-black tracking-tight ${isActive ? 'text-blue-600' : 'text-slate-700'}`}>
            {payoff.us.gdp.toFixed(1)}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">CHN</span>
          <span className={`text-lg font-black tracking-tight ${isActive ? 'text-red-600' : 'text-slate-700'}`}>
            {payoff.china.gdp.toFixed(1)}
          </span>
        </div>
      </div>
      <div className="mt-auto pt-2 border-t border-slate-100">
        <p className={`text-[9px] leading-relaxed font-medium line-clamp-2 ${isActive ? 'text-slate-600' : 'text-slate-400'}`}>
          {payoff.description}
        </p>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full flex flex-col select-none overflow-hidden bg-white border border-slate-200 rounded-lg shadow-sm">
      {/* Header Row */}
      <div className="grid grid-cols-[80px_1fr_1fr_1fr] bg-slate-50 border-b border-slate-200 text-slate-700 shrink-0">
        <div className="p-2 flex items-center justify-center border-r border-slate-200 bg-slate-100/50">
          <span className="text-[9px] uppercase font-black tracking-widest text-slate-500">US \ CN</span>
        </div>
        {strategies.map(s => (
          <div key={s} className="p-2 flex items-center justify-center border-r last:border-r-0 border-slate-200 font-bold text-[9px] uppercase tracking-widest text-slate-600">
            {s.replace('_', ' ')}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="flex-1 min-h-0 flex flex-col">
        {strategies.map(us => (
          <div key={us} className="grid grid-cols-[80px_1fr_1fr_1fr] flex-1 min-h-0">
            {/* Row Label */}
            <div className="bg-slate-50 border-r border-b border-slate-200 flex items-center justify-center px-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center leading-tight">
                {us.replace('_', ' ')}
              </span>
            </div>
            {/* Matrix Cells */}
            {strategies.map(china => {
              const isActive = us === state.usStrategy && china === state.chinaStrategy;
              return (
                <div key={china} className={getCellClass(us, china)}>
                  {renderPayoff(matrix[us][china], isActive)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
