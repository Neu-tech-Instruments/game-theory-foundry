import { GameState, Payoff, SectorState, MapMode } from '../types';
import { BASE_SECTORS, BAN_METRICS, SCENARIOS } from '../constants';

export const calculatePayoff = (state: GameState): Payoff => {
  const scenario = SCENARIOS[state.scenario];
  const pol = state.policyStrategy;
  const ind = state.industryStrategy;
  
  // Clone base sectors
  const sectors: Record<MapMode, SectorState> = {
    TECH: { ...BASE_SECTORS.TECH },
    MANUFACTURING: { ...BASE_SECTORS.MANUFACTURING },
    ENERGY: { ...BASE_SECTORS.ENERGY },
    FINANCE: { ...BASE_SECTORS.FINANCE }
  };

  let description = '';

  // 1. BASE MATRIX LOGIC: POLICY vs INDUSTRY
  if (pol === 'FREE_TRADE' && ind === 'EXPANSION') {
    // Both maximize growth, high risk, high reward
    sectors.TECH.points += 1.5; sectors.TECH.growth += 3;
    sectors.FINANCE.points += 1.0; sectors.FINANCE.growth += 2;
    sectors.MANUFACTURING.points += 0.5;
    description = 'Golden Era: Free capital flow triggers aggressive global expansion.';
  } else if (pol === 'FREE_TRADE' && ind === 'DIVERSIFICATION') {
    // Industries play it safe despite free trade
    sectors.MANUFACTURING.stability += 10;
    sectors.TECH.stability += 5;
    sectors.FINANCE.points -= 0.5; // capital tied up in redundant supply chains
    description = 'Resilient Growth: Policies allow free trade, while industries build redundant supply chains.';
  } else if (pol === 'FREE_TRADE' && ind === 'DEFENSIVE') {
    // Free trade but industries hoard cash
    sectors.FINANCE.points += 1.5;
    sectors.MANUFACTURING.points -= 1.0; sectors.MANUFACTURING.growth -= 2;
    sectors.TECH.points -= 1.0;
    description = 'Capital Hoarding: Open markets fail to stimulate growth as corporations stockpile cash.';
  } else if (pol === 'TARIFFS' && ind === 'EXPANSION') {
    // Tariffs hit expanding industries with high costs
    sectors.MANUFACTURING.inflation += 4.0; sectors.MANUFACTURING.points -= 1.5;
    sectors.TECH.inflation += 3.0; sectors.TECH.points -= 1.0;
    sectors.FINANCE.points -= 1.0;
    description = 'Supply Shock: Tariffs crush aggressive expansion, causing massive cost-push inflation.';
  } else if (pol === 'TARIFFS' && ind === 'DIVERSIFICATION') {
    // Diversification blunts the tariffs
    sectors.MANUFACTURING.stability += 5; sectors.MANUFACTURING.inflation += 1.5;
    sectors.TECH.stability += 2;
    description = 'Managed Decline: Diversified supply chains absorb tariff shocks, preventing severe inflation.';
  } else if (pol === 'TARIFFS' && ind === 'DEFENSIVE') {
    // Both sides hunker down
    sectors.MANUFACTURING.points -= 2.0; sectors.MANUFACTURING.growth -= 3;
    sectors.ENERGY.points -= 1.5;
    sectors.FINANCE.stability += 5;
    description = 'Stagflation: Protectionist policies and defensive corporate hoarding grind global growth to a halt.';
  } else if (pol === 'EXPORT_BANS' && ind === 'EXPANSION') {
    // Catastrophic clash
    sectors.TECH.points -= 3.0; sectors.TECH.inflation += 5.0; sectors.TECH.stability -= 25;
    sectors.MANUFACTURING.points -= 2.5; sectors.MANUFACTURING.inflation += 4.0;
    sectors.FINANCE.stability -= 20;
    description = 'Catastrophic Collision: Export bans decimate aggressive expansion strategies, sparking financial panic.';
  } else if (pol === 'EXPORT_BANS' && ind === 'DIVERSIFICATION') {
    // Partial mitigation
    sectors.TECH.points -= 1.5; sectors.TECH.inflation += 2.0;
    sectors.MANUFACTURING.stability -= 5;
    // Partial mitigation logic
    description = 'Costly Independence: Export bans force expensive decoupling, but diversified networks prevent collapse.';
  } else if (pol === 'EXPORT_BANS' && ind === 'DEFENSIVE') {
    // Absolute freeze
    sectors.FINANCE.points -= 2.0; sectors.FINANCE.stability -= 15;
    sectors.ENERGY.points -= 2.0;
    sectors.MANUFACTURING.growth -= 5;
    description = 'Deep Freeze: Extreme trade warfare and corporate retreat plunge markets into a deep freeze.';
  }

  // 2. EXPORT BAN SPECIFIC TARGETING
  if (pol === 'EXPORT_BANS') {
    const asset = BAN_METRICS[state.bannedAsset];
    const target = asset.targetSector as MapMode;
    sectors[target].points += asset.pointImpact;
    sectors[target].stability += asset.stabilityImpact;
    sectors[target].inflation += asset.inflationImpact;
    description += ` ${asset.label} bans directly target ${sectors[target].name}.`;
  }

  // 3. SCENARIO MODIFIERS & PANIC CALCULATION
  const calculatePanic = (sector: SectorState) => {
    let panic = 0;
    
    // Inflation-driven panic (Exponential)
    if (sector.inflation > 5) panic += (sector.inflation - 5) * 5;
    if (sector.inflation > 12) panic += 30; // Crisis threshold
    
    // Stability-driven panic
    if (sector.stability < 60) panic += (60 - sector.stability) * 0.8;
    if (sector.stability < 30) panic += 20; // Collapse threshold
    
    // Scenario-specific panic multipliers
    if (scenario.id === 'SUPPLY_SHOCK') panic *= 1.5;
    if (scenario.id === 'RECESSION') panic *= 1.2;
    
    // Strategy Panic: Export bans + Aggressive strategy = High Panic
    if (state.policyStrategy === 'EXPORT_BANS' && state.industryStrategy === 'EXPANSION') {
        panic += 25;
    }

    return Math.min(100, Math.max(0, panic));
  };

  const applyVolatility = (sector: SectorState) => {
    // If bear/recession, points and growth suffer based on volatility
    if (scenario.id === 'BEAR_MARKET' || scenario.id === 'RECESSION') {
      sector.points -= scenario.volatility * (pol === 'FREE_TRADE' ? 0.5 : 1.5);
      sector.growth -= scenario.volatility * 2;
    }
    // If supply shock, inflation spikes
    if (scenario.id === 'SUPPLY_SHOCK') {
      sector.inflation += scenario.volatility * 2;
      sector.stability -= scenario.volatility * 10;
    }

    // Calculate panic for this state
    sector.panicIndex = calculatePanic(sector);
  };

  Object.values(sectors).forEach(applyVolatility);

  // Clamp limits
  Object.values(sectors).forEach(s => {
    s.points = Math.max(0, Math.min(10, s.points));
    s.inflation = Math.max(0, s.inflation);
    s.stability = Math.max(0, Math.min(100, s.stability));
    s.panicIndex = Math.round(s.panicIndex);
  });

  return { sectors, description };
};

export const useTradeEngine = (state: GameState): Payoff => calculatePayoff(state);

