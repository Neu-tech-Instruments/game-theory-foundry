import { Scenario, SectorState, BannedAsset, MapMode } from './types';

export const BASE_SECTORS: Record<MapMode, SectorState> = {
  TECH: { id: 'TECH', name: 'Technology & AI', points: 8.5, inflation: 2.1, stability: 80, growth: 12.5, panicIndex: 0 },
  MANUFACTURING: { id: 'MANUFACTURING', name: 'Global Manufacturing', points: 7.0, inflation: 3.5, stability: 85, growth: 4.2, panicIndex: 0 },
  ENERGY: { id: 'ENERGY', name: 'Energy & Resources', points: 7.5, inflation: 4.8, stability: 60, growth: 3.8, panicIndex: 0 },
  FINANCE: { id: 'FINANCE', name: 'Financial Markets', points: 9.0, inflation: 1.5, stability: 92, growth: 8.0, panicIndex: 0 }
};

export const BAN_METRICS: Record<BannedAsset, any> = {
  SEMICONDUCTORS: { label: 'Advanced Semiconductors', targetSector: 'TECH', pointImpact: -3.0, stabilityImpact: -15, inflationImpact: 2.0 },
  RAW_MINERALS: { label: 'Rare Earth Minerals', targetSector: 'MANUFACTURING', pointImpact: -2.0, stabilityImpact: -10, inflationImpact: 3.5 },
  SOFTWARE_IP: { label: 'Software IP & Cloud', targetSector: 'FINANCE', pointImpact: -1.5, stabilityImpact: -5, inflationImpact: 0.5 }
};

export const SCENARIOS: Record<string, Scenario> = {
  BULL_MARKET: {
    id: 'BULL_MARKET',
    title: 'Global Expansion',
    context: 'Capital is cheap and supply chains are highly integrated. Trade restrictions will trigger severe market corrections.',
    volatility: 0.8
  },
  BEAR_MARKET: {
    id: 'BEAR_MARKET',
    title: 'Capital Contraction',
    context: 'High interest rates limit expansion. Industries are focused on protecting margins rather than aggressive growth.',
    volatility: 1.2
  },
  RECESSION: {
    id: 'RECESSION',
    title: 'Global Recession',
    context: 'Demand has collapsed. Tariffs compound the crisis, while defensive diversification offers a stable floor.',
    volatility: 1.5
  },
  SUPPLY_SHOCK: {
    id: 'SUPPLY_SHOCK',
    title: 'Supply Chain Shock',
    context: 'A black swan event has bottlenecked global logistics. Export bans escalate inflation exponentially across all sectors.',
    volatility: 2.0
  }
};
