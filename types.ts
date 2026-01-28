
export type Player = 'US' | 'CHINA';
export type Strategy = 'FREE_TRADE' | 'TARIFFS' | 'EXPORT_BANS';
export type ScenarioID = 'NEUTRAL' | 'ALIGN_US' | 'ALIGN_CHINA' | 'CHICKEN';

export type US_BanItem = 'AI_CHIPS' | 'CHIP_GEAR' | 'CLOUD_TECH';
export type CHINA_BanItem = 'RARE_EARTHS' | 'EV_MINERALS' | 'LEGACY_CHIPS';

export interface EconomyState {
  points: number; // Max 10 pts
  inflation: number; // % Rate
  stability: number; // 0-100%
  influence: number; // 0-100
}

export interface Payoff {
  us: EconomyState;
  china: EconomyState;
  description: string;
}

export interface Scenario {
  id: ScenarioID;
  title: string;
  context: string;
  tradeDependency: {
    usOnChina: number; // 0-2 (Multiplier for harm when China retaliates)
    chinaOnUs: number; // 0-2 (Multiplier for harm when US retaliates)
  };
}

export type AIStrategyType = 'MANUAL' | 'TIT_FOR_TAT' | 'GRIM_TRIGGER' | 'RANDOM';

export interface HistoryEntry {
  round: number;
  usStrategy: Strategy;
  chinaStrategy: Strategy;
  payoff: Payoff;
}

export interface GameState {
  scenario: ScenarioID;
  usStrategy: Strategy;
  chinaStrategy: Strategy;
  usBanFocus: US_BanItem;
  chinaBanFocus: CHINA_BanItem;
  chinaStrategyMode: AIStrategyType;
  currentRound: number;
  history: HistoryEntry[];
}
