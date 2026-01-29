
import { useMemo } from 'react';
import { GameState, EconomyState, Payoff } from '../types';
import { SCENARIOS, BASE_ECONOMY, BAN_METRICS } from '../constants';

export const calculatePayoff = (state: GameState): Payoff => {
  const scenario = SCENARIOS[state.scenario];
  const us: EconomyState = { ...BASE_ECONOMY.US };
  const china: EconomyState = { ...BASE_ECONOMY.CHINA };

  // 1. TARIFFS LOGIC
  const usTariff = state.usStrategy === 'TARIFFS';
  const chinaTariff = state.chinaStrategy === 'TARIFFS';

  if (usTariff && chinaTariff) {
    // Nash Equilibrium: Both retaliate (5, 5)
    us.points = 5.0;
    china.points = 5.0;

    us.inflation += 2.0;
    china.inflation += 2.0;
    us.stability -= 10;
    china.stability -= 10;
  } else if (usTariff) {
    // US Impose Tariffs / China Free Trade (12, 2)
    us.points = 12.0;
    china.points = 2.0;

    us.stability += 5;
    china.inflation += 0.3;
  } else if (chinaTariff) {
    // China Impose Tariffs / US Free Trade (2, 12)
    china.points = 12.0;
    us.points = 2.0;

    china.stability += 3;
    us.inflation += 0.6;
  }

  // 2. EXPORT BANS LOGIC
  if (state.usStrategy === 'EXPORT_BANS') {
    const ban = BAN_METRICS[state.usBanFocus];
    us.points -= 1.0;
    us.inflation += 0.3;

    china.points += (ban.pointImpact * scenario.tradeDependency.chinaOnUs);
    china.stability += (ban.stabilityImpact * scenario.tradeDependency.chinaOnUs);
    china.inflation += 1.5;
  }

  if (state.chinaStrategy === 'EXPORT_BANS') {
    const ban = BAN_METRICS[state.chinaBanFocus];
    china.points -= 1.0;
    china.inflation += 0.2;

    us.points += (ban.pointImpact * scenario.tradeDependency.usOnChina);
    us.stability += (ban.stabilityImpact * scenario.tradeDependency.usOnChina);
    us.inflation += (ban.inflationImpact * scenario.tradeDependency.usOnChina);
  }

  // Global drag if both ban
  if (state.usStrategy === 'EXPORT_BANS' && state.chinaStrategy === 'EXPORT_BANS') {
    us.inflation += 2.0;
    china.inflation += 2.0;

    if (state.scenario === 'CHICKEN') {
      us.points -= 5.0;
      china.points -= 5.0;
      us.stability -= 30;
      china.stability -= 30;
    }
  }

  // CHICKEN ONE-SIDED ESCALATION
  if (state.scenario === 'CHICKEN') {
    if (state.usStrategy === 'EXPORT_BANS' && state.chinaStrategy !== 'EXPORT_BANS') {
      us.points += 1.0;
      china.points -= 3.5;
    }
    if (state.chinaStrategy === 'EXPORT_BANS' && state.usStrategy !== 'EXPORT_BANS') {
      china.points += 1.0;
      us.points -= 3.5;
    }
  }

  // Rounding & Clamping (Integers and .5 increments only)
  const finalizePoints = (pts: number) => {
    // Force to 0.5 increments
    const rounded = Math.round(pts * 2) / 2;
    // Clamp between 2.0 and 15.0 (Updated to allow 12)
    return Math.max(2, Math.min(15, rounded));
  };

  us.points = finalizePoints(us.points);
  china.points = finalizePoints(china.points);

  // Generate descriptive outcome text
  const diff = us.points - china.points;
  let description = '';

  if (Math.abs(diff) < 0.5) {
    description = 'Balanced outcome - Both economies maintain equilibrium';
  } else if (diff > 2.5) {
    description = 'US wins decisively - China suffers significant economic damage';
  } else if (diff > 1.0) {
    description = 'US wins - China experiences moderate economic pressure';
  } else if (diff > 0) {
    description = 'US gains slight advantage - China faces minor setbacks';
  } else if (diff < -2.5) {
    description = 'China wins decisively - US suffers significant economic damage';
  } else if (diff < -1.0) {
    description = 'China wins - US experiences moderate economic pressure';
  } else {
    description = 'China gains slight advantage - US faces minor setbacks';
  }

  return {
    us, china,
    description
  };
};

export const useTradeEngine = (state: GameState): Payoff => {
  return useMemo(() => calculatePayoff(state), [state]);
};
