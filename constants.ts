
import { Scenario, EconomyState, US_BanItem, CHINA_BanItem } from './types';

export const BASE_ECONOMY: Record<string, EconomyState> = {
  US: { points: 10.0, inflation: 2.1, stability: 85, influence: 90 },
  CHINA: { points: 10.0, inflation: 1.8, stability: 92, influence: 85 }
};

export const BAN_METRICS: Record<string, any> = {
  AI_CHIPS: { label: 'Advanced AI Chips', pointImpact: -2.5, stabilityImpact: -10, inflationImpact: 0.5, target: 'CHINA' },
  CHIP_GEAR: { label: 'Semiconductors', pointImpact: -2.0, stabilityImpact: -5, inflationImpact: 0.2, target: 'CHINA' },
  CLOUD_TECH: { label: 'Cloud Infrastructure', pointImpact: -1.5, stabilityImpact: -8, inflationImpact: 0.4, target: 'CHINA' },
  RARE_EARTHS: { label: 'Rare Earth Elements', pointImpact: -3.0, stabilityImpact: -12, inflationImpact: 2.5, target: 'US' },
  EV_MINERALS: { label: 'Lithium & Graphite', pointImpact: -2.5, stabilityImpact: -8, inflationImpact: 1.8, target: 'US' },
  LEGACY_CHIPS: { label: 'Mature Node Chips', pointImpact: -1.5, stabilityImpact: -4, inflationImpact: 1.2, target: 'US' }
};

export const SCENARIOS: Record<string, Scenario> = {
  NEUTRAL: {
    id: 'NEUTRAL',
    title: 'Integrated Markets',
    context: 'Both nations are deeply integrated. Banning critical tech will cause severe domestic inflation.',
    tradeDependency: { usOnChina: 1.2, chinaOnUs: 1.1 }
  },
  ALIGN_US: {
    id: 'ALIGN_US',
    title: 'Strategic Decoupling',
    context: 'The US has successfully lowered dependency on China. Export bans now hurt China significantly more than the US.',
    tradeDependency: { usOnChina: 0.6, chinaOnUs: 1.5 }
  },
  ALIGN_CHINA: {
    id: 'ALIGN_CHINA',
    title: 'Supply Chain Dominance',
    context: 'China has established alternative markets. US export bans are less effective, while China controls critical supply chains.',
    tradeDependency: { usOnChina: 1.8, chinaOnUs: 0.7 }
  },
  CHICKEN: {
    id: 'CHICKEN',
    title: 'Trade Standoff (Chicken)',
    context: 'Both nations are locked in a high-stakes standoff. Refusing to swerve (cooperate) will lead to a catastrophic economic collision.',
    tradeDependency: { usOnChina: 2.5, chinaOnUs: 2.5 }
  }
};
