
export type Player = 'US' | 'CHINA' | 'EU';
export type Strategy = 'FREE_TRADE' | 'TARIFFS' | 'EXPORT_BANS';
export type ScenarioID = 'NEUTRAL' | 'ALIGN_US' | 'ALIGN_CHINA';

export type US_BanItem = 'AI_CHIPS' | 'CHIP_GEAR' | 'CLOUD_TECH';
export type CHINA_BanItem = 'RARE_EARTHS' | 'EV_MINERALS' | 'LEGACY_CHIPS';

export interface EconomyState {
  gdp: number; // $ Trillions
  inflation: number; // % Rate
  stability: number; // 0-100%
  influence: number; // 0-100
}

export interface Payoff {
  us: EconomyState;
  china: EconomyState;
  eu: EconomyState;
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

export interface GameState {
  scenario: ScenarioID;
  usStrategy: Strategy;
  chinaStrategy: Strategy;
  usBanFocus: US_BanItem;
  chinaBanFocus: CHINA_BanItem;
  history: any[];
}
