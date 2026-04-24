import React, { useMemo } from 'react';
import { GameState, PolicyStrategy, IndustryStrategy, Payoff } from '../types';
import { calculatePayoff } from '../hooks/useTradeEngine';

interface Props {
  state: GameState;
}

export const GameMatrix: React.FC<Props> = ({ state }) => {
  const polStrategies: PolicyStrategy[] = ['FREE_TRADE', 'TARIFFS', 'EXPORT_BANS'];
  const indStrategies: IndustryStrategy[] = ['EXPANSION', 'DIVERSIFICATION', 'DEFENSIVE'];

  const matrix = useMemo(() => {
    const m: Record<string, Record<string, Payoff>> = {};
    polStrategies.forEach(pol => {
      m[pol] = {};
      indStrategies.forEach(ind => {
        const tempState = { ...state, policyStrategy: pol, industryStrategy: ind };
        m[pol][ind] = calculatePayoff(tempState);
      });
    });
    return m;
  }, [state.scenario, state.bannedAsset]);

  // Helper: Check if row is active (Policy)
  const isActiveRow = (strategy: PolicyStrategy): boolean => {
    return strategy === state.policyStrategy;
  };

  // Helper: Check if column is active (Industry)
  const isActiveColumn = (strategy: IndustryStrategy): boolean => {
    return strategy === state.industryStrategy;
  };

  const getCellClass = (pol: PolicyStrategy, ind: IndustryStrategy) => {
    const isActive = pol === state.policyStrategy && ind === state.industryStrategy;

    return `relative p-2 border-r border-b border-[#dee2e6] transition-all duration-200 flex flex-col justify-center items-center ${isActive
      ? 'bg-[#e7f5ff] ring-2 ring-inset ring-[#228be6] z-10'
      : `bg-white hover:bg-[#f8f9fa]`
      }`;
  };

  const renderPayoff = (payoff: Payoff, isActive: boolean) => {
    // Average points over the 4 sectors to give a summary
    const avgScore = (payoff.sectors.TECH.points + payoff.sectors.MANUFACTURING.points + payoff.sectors.ENERGY.points + payoff.sectors.FINANCE.points) / 4;
    const avgGrowth = (payoff.sectors.TECH.growth + payoff.sectors.MANUFACTURING.growth + payoff.sectors.ENERGY.growth + payoff.sectors.FINANCE.growth) / 4;

    return (
      <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
        {/* Scores Row */}
        <div className="flex justify-between items-center w-full gap-3">
          {/* Points summary */}
          <div className="flex flex-col items-center flex-1 border-r border-[#dee2e6]">
            <span className={`font-mono tabular-nums text-[20px] font-black tracking-tight leading-none mb-0.5 ${isActive ? 'text-[#1971c2]' : 'text-[#495057]'
              }`}>
              {avgScore.toFixed(1)}
            </span>
            <span className="text-[8px] font-black text-[#adb5bd] uppercase tracking-[0.15em]">Avg Score</span>
          </div>

          {/* Growth summary */}
          <div className="flex flex-col items-center flex-1">
            <span className={`font-mono tabular-nums text-[20px] font-black tracking-tight leading-none mb-0.5 ${isActive ? 'text-[#1971c2]' : 'text-[#495057]'
              }`}>
              {avgGrowth > 0 ? '+' : ''}{avgGrowth.toFixed(1)}%
            </span>
            <span className="text-[8px] font-black text-[#adb5bd] uppercase tracking-[0.15em]">Avg Grwth</span>
          </div>
        </div>

        {/* Description */}
        <div className="mt-0.5 pt-1 border-t border-[#dee2e6] w-full">
          <p className="text-[8px] leading-relaxed font-medium text-center text-[#495057] line-clamp-3">
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
            <span className="text-[8px] font-black text-[#1971c2] uppercase tracking-[0.1em] text-center leading-tight">Global<br/>Policy</span>
            <span className="text-[10px] font-black text-[#adb5bd]">\</span>
            <span className="text-[8px] font-black text-[#e03131] uppercase tracking-[0.15em] text-center leading-tight">Global<br/>Industry</span>
          </div>
        </div>

        {/* Column Headers (Industry) */}
        {indStrategies.map(s => {
          const isActive = isActiveColumn(s);
          return (
            <div
              key={s}
              className={`p-2 flex items-center justify-center border-r last:border-r-0 border-[#dee2e6] font-black text-[9px] uppercase tracking-[0.15em] transition-all text-center ${isActive
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
        {polStrategies.map(pol => {
          const isActiveRowFlag = isActiveRow(pol);
          return (
            <div key={pol} className="grid grid-cols-[80px_1fr_1fr_1fr] flex-1 min-h-0">
              {/* Row Label (Policy) */}
              <div
                className={`border-r border-b border-[#dee2e6] flex items-center justify-center px-1 transition-all ${isActiveRowFlag
                  ? 'bg-[#d0ebff] text-[#1971c2]'
                  : 'bg-[#f8f9fa] text-[#495057]'
                  }`}
              >
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-center leading-tight">
                  {pol.replace('_', ' ')}
                </span>
              </div>

              {/* Matrix Cells */}
              {indStrategies.map(ind => {
                const isActive = pol === state.policyStrategy && ind === state.industryStrategy;
                return (
                  <div key={ind} className={getCellClass(pol, ind)}>
                    {renderPayoff(matrix[pol][ind], isActive)}
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
