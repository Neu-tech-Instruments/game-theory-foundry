export type PolicyStrategy = 'FREE_TRADE' | 'TARIFFS' | 'EXPORT_BANS';
export type IndustryStrategy = 'EXPANSION' | 'DIVERSIFICATION' | 'DEFENSIVE';
export type ScenarioID = 'BULL_MARKET' | 'BEAR_MARKET' | 'RECESSION' | 'SUPPLY_SHOCK';
export type MapMode = 'TECH' | 'MANUFACTURING' | 'ENERGY' | 'FINANCE';

export type BannedAsset = 'SEMICONDUCTORS' | 'RAW_MINERALS' | 'SOFTWARE_IP';

export type MetricType = 'pts_tech' | 'pts_manufacturing' | 'pts_energy' | 'pts_finance' | 'inflation_index';

export interface SectorState {
  id: MapMode;
  name: string;
  points: number; // Max 10 pts
  inflation: number; // % Rate
  stability: number; // 0-100%
  growth: number; // % Growth rate
  panicIndex: number; // 0-100% sentiment-driven volatility
}

export interface Payoff {
  sectors: Record<MapMode, SectorState>;
  description: string;
}

export interface Scenario {
  id: ScenarioID;
  title: string;
  context: string;
  volatility: number; // 0.1 to 2.0
}

export type AIStrategyType = 'MANUAL' | 'REACT_CONSERVATIVE' | 'REACT_AGGRESSIVE' | 'RANDOM';

export interface HistoryEntry {
  round: number;
  policyStrategy: PolicyStrategy;
  industryStrategy: IndustryStrategy;
  payoff: Payoff;
}

export interface PredictionLogEntry {
  id: string;
  materialId: string;
  materialName: string;
  predictionDate: string;
  targetDate: string;
  predictedPrice: number;
  realizedPrice?: number;
  quantity: number;
  status: 'PENDING' | 'REALIZED' | 'MISSED';
  savings?: number;
}

export interface GameState {
  scenario: ScenarioID;
  policyStrategy: PolicyStrategy;
  industryStrategy: IndustryStrategy;
  bannedAsset: BannedAsset;
  industryMode: AIStrategyType;
  currentRound: number;
  history: HistoryEntry[];
  predictionLog: PredictionLogEntry[];
}
