
import { useMemo } from 'react';
import { GameState, EconomyState, Payoff } from '../types';
import { SCENARIOS, BASE_ECONOMY, BAN_METRICS } from '../constants';

export const calculatePayoff = (state: GameState): Payoff => {
  const scenario = SCENARIOS[state.scenario];
  const us: EconomyState = { ...BASE_ECONOMY.US };
  const china: EconomyState = { ...BASE_ECONOMY.CHINA };
  const eu: EconomyState = { ...BASE_ECONOMY.EU };

  // 1. TARIFFS LOGIC
  if (state.usStrategy === 'TARIFFS') {
    us.gdp -= 0.2;
    us.inflation += 0.8 * scenario.tradeDependency.usOnChina;
    us.stability += 5; // Domestic industrial support

    china.gdp -= 0.6;
    china.inflation += 0.3;
  }

  if (state.chinaStrategy === 'TARIFFS') {
    china.gdp -= 0.3;
    china.inflation += 0.5 * scenario.tradeDependency.chinaOnUs;
    china.stability += 3;

    us.gdp -= 0.4;
    us.inflation += 0.6;
  }

  // 2. EXPORT BANS LOGIC (The "Nuclear" Weaponization)
  if (state.usStrategy === 'EXPORT_BANS') {
    const ban = BAN_METRICS[state.usBanFocus];
    // Self cost
    us.gdp -= 0.5;
    us.inflation += 0.3;

    // Target (China) impact
    china.gdp += (ban.gdpImpact * scenario.tradeDependency.chinaOnUs);
    china.stability += (ban.stabilityImpact * scenario.tradeDependency.chinaOnUs);
    china.inflation += 1.5;
  }

  if (state.chinaStrategy === 'EXPORT_BANS') {
    const ban = BAN_METRICS[state.chinaBanFocus];
    // Self cost
    china.gdp -= 0.4;
    china.inflation += 0.2;

    // Target (US) impact
    us.gdp += (ban.gdpImpact * scenario.tradeDependency.usOnChina);
    us.stability += (ban.stabilityImpact * scenario.tradeDependency.usOnChina);
    us.inflation += (ban.inflationImpact * scenario.tradeDependency.usOnChina);
  }

  // 3. EU REALIGNMENT Logic
  if (state.scenario === 'ALIGN_US') {
    eu.influence -= 10; // EU loses autonomy
    us.influence += 15;
  } else if (state.scenario === 'ALIGN_CHINA') {
    eu.influence -= 5;
    china.influence += 20;
  }

  // Global drag if both ban
  if (state.usStrategy === 'EXPORT_BANS' && state.chinaStrategy === 'EXPORT_BANS') {
    us.inflation += 2.0;
    china.inflation += 2.0;
    eu.gdp -= 1.5;
  }

  return {
    us, china, eu,
    description: `Active Geopolitical Friction: ${state.usStrategy} vs ${state.chinaStrategy}`
  };
};

export const useTradeEngine = (state: GameState): Payoff => {
  return useMemo(() => calculatePayoff(state), [state]);
};
