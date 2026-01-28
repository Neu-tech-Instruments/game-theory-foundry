
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

  // Helper: Get background color based on total score
  const getBackgroundColor = (total: number): string => {
    if (total >= 18) return 'bg-gradient-to-br from-emerald-50 via-white to-emerald-25';
    if (total >= 15) return 'bg-gradient-to-br from-blue-50 via-white to-blue-25';
    if (total >= 12) return 'bg-gradient-to-br from-yellow-50 via-white to-yellow-25';
    if (total >= 8) return 'bg-gradient-to-br from-orange-50 via-white to-orange-25';
    return 'bg-gradient-to-br from-red-50 via-white to-red-25';
  };

  // Helper: Check if row is active
  const isActiveRow = (strategy: Strategy): boolean => {
    return strategy === state.usStrategy;
  };

  // Helper: Check if column is active
  const isActiveColumn = (strategy: Strategy): boolean => {
    return strategy === state.chinaStrategy;
  };

  const getCellClass = (us: Strategy, china: Strategy) => {
    const isActive = us === state.usStrategy && china === state.chinaStrategy;
    const payoff = matrix[us][china];
    const total = payoff.us.points + payoff.china.points;
    const bgColor = getBackgroundColor(total);

    return `relative p-2 border-r border-b border-[#dee2e6] transition-all duration-200 flex flex-col justify-center items-center ${isActive
      ? 'bg-[#e7f5ff] ring-2 ring-inset ring-[#228be6] z-10'
      : `bg-white hover:bg-[#f8f9fa]`
      }`;
  };

  const renderPayoff = (payoff: Payoff, isActive: boolean, us: Strategy, china: Strategy) => {
    return (
      <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
        {/* Scores Row */}
        <div className="flex justify-between items-center w-full gap-3">
          {/* US Score */}
          <div className="flex flex-col items-center flex-1 border-r border-[#dee2e6]">
            <span className={`font-mono tabular-nums text-[24px] font-black tracking-tight leading-none mb-0.5 ${isActive ? 'text-[#1971c2]' : 'text-[#495057]'
              }`}>
              {payoff.us.points.toFixed(1)}
            </span>
            <span className="text-[9px] font-black text-[#adb5bd] uppercase tracking-[0.15em]">United States</span>
          </div>

          {/* China Score */}
          <div className="flex flex-col items-center flex-1">
            <span className={`font-mono tabular-nums text-[24px] font-black tracking-tight leading-none mb-0.5 ${isActive ? 'text-[#1971c2]' : 'text-[#495057]'
              }`}>
              {payoff.china.points.toFixed(1)}
            </span>
            <span className="text-[9px] font-black text-[#adb5bd] uppercase tracking-[0.15em]">China</span>
          </div>
        </div>

        {/* Description */}
        <div className="mt-0.5 pt-1 border-t border-[#dee2e6] w-full">
          <p className="text-[9px] leading-relaxed font-medium text-center text-[#495057]">
            {payoff.description}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col select-none overflow-hidden bg-white border border-[#dee2e6] rounded-lg shadow-sm">
      {/* Header Row */}
      <div className="grid grid-cols-[80px_1fr_1fr_1fr] bg-[#f8f9fa] border-b border-[#dee2e6] text-[#495057] shrink-0">
        {/* Corner Cell */}
        <div className="p-2 flex items-center justify-center border-r border-[#dee2e6]">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[7px] font-black text-[#1971c2] uppercase tracking-[0.1em]">United States</span>
            <span className="text-[10px] font-black text-[#adb5bd]">\</span>
            <span className="text-[8px] font-black text-[#e03131] uppercase tracking-[0.15em]">China</span>
          </div>
        </div>

        {/* Column Headers */}
        {strategies.map(s => {
          const isActive = isActiveColumn(s);
          return (
            <div
              key={s}
              className={`p-2 flex items-center justify-center border-r last:border-r-0 border-[#dee2e6] font-black text-[10px] uppercase tracking-[0.15em] transition-all ${isActive
                ? 'bg-[#ffc9c9] text-[#c92a2a]'
                : 'text-[#495057]'
                }`}
            >
              {s.replace('_', ' ')}
            </div>
          );
        })}
      </div>

      {/* Rows */}
      <div className="flex-1 min-h-0 flex flex-col">
        {strategies.map(us => {
          const isActiveRowFlag = isActiveRow(us);
          return (
            <div key={us} className="grid grid-cols-[80px_1fr_1fr_1fr] flex-1 min-h-0">
              {/* Row Label */}
              <div
                className={`border-r border-b border-[#dee2e6] flex items-center justify-center px-1 transition-all ${isActiveRowFlag
                  ? 'bg-[#d0ebff] text-[#1971c2]'
                  : 'bg-[#f8f9fa] text-[#495057]'
                  }`}
              >
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-center leading-tight">
                  {us.replace('_', ' ')}
                </span>
              </div>

              {/* Matrix Cells */}
              {strategies.map(china => {
                const isActive = us === state.usStrategy && china === state.chinaStrategy;
                return (
                  <div key={china} className={getCellClass(us, china)}>
                    {renderPayoff(matrix[us][china], isActive, us, china)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
