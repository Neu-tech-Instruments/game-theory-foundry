
import { Scenario, EconomyState, US_BanItem, CHINA_BanItem } from './types';

export const BASE_ECONOMY: Record<string, EconomyState> = {
  US: { gdp: 25.0, inflation: 2.1, stability: 85, influence: 90 },
  CHINA: { gdp: 18.0, inflation: 1.8, stability: 92, influence: 85 },
  EU: { gdp: 16.0, inflation: 2.0, stability: 88, influence: 75 }
};

export const BAN_METRICS: Record<string, any> = {
  AI_CHIPS: { label: 'Advanced AI Chips', gdpImpact: -1.2, stabilityImpact: -10, inflationImpact: 0.5, target: 'CHINA' },
  CHIP_GEAR: { label: 'Lithography Equipment', gdpImpact: -0.8, stabilityImpact: -5, inflationImpact: 0.2, target: 'CHINA' },
  CLOUD_TECH: { label: 'Cloud Infrastructure', gdpImpact: -0.5, stabilityImpact: -8, inflationImpact: 0.4, target: 'CHINA' },
  RARE_EARTHS: { label: 'Rare Earth Elements', gdpImpact: -1.5, stabilityImpact: -12, inflationImpact: 2.5, target: 'US' },
  EV_MINERALS: { label: 'Lithium & Graphite', gdpImpact: -1.0, stabilityImpact: -8, inflationImpact: 1.8, target: 'US' },
  LEGACY_CHIPS: { label: 'Mature Node Chips', gdpImpact: -0.6, stabilityImpact: -4, inflationImpact: 1.2, target: 'US' }
};

export const SCENARIOS: Record<string, Scenario> = {
  NEUTRAL: {
    id: 'NEUTRAL',
    title: 'The EU remains neutral',
    context: 'Both nations are deeply integrated. Banning critical tech will cause severe domestic inflation.',
    tradeDependency: { usOnChina: 1.2, chinaOnUs: 1.1 }
  },
  ALIGN_US: {
    id: 'ALIGN_US',
    title: 'The EU aligns with the us',
    context: 'The US has successfully lowered dependency on China. Export bans now hurt China significantly more than the US.',
    tradeDependency: { usOnChina: 0.6, chinaOnUs: 1.5 }
  },
  ALIGN_CHINA: {
    id: 'ALIGN_CHINA',
    title: 'The EU aligns with china',
    context: 'China has established alternative markets. US export bans are less effective, while China controls critical EU supply chains.',
    tradeDependency: { usOnChina: 1.8, chinaOnUs: 0.7 }
  }
};
