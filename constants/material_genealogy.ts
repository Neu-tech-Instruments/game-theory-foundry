/**
 * Material Genealogy Engine
 * Defines the "DNA" of products for supply chain deconstruction.
 */

export interface MaterialNode {
  id: string;
  name: string;
  category: 'GENESIS' | 'ASSEMBLY' | 'SUB_SYSTEM' | 'MODULE' | 'COMPONENT' | 'PART' | 'ELEMENT' | 'RAW_MATERIAL';
  riskScore: number;
  basePrice?: number;
  unit?: string;
  ticker?: string;
  children?: MaterialNode[];
  position?: { x: number; y: number };
}

export interface ProductTemplate {
  id: string;
  name: string;
  industry: string;
  genealogy: MaterialNode[];
}

export const MATERIAL_GENEALOGY: Record<string, ProductTemplate> = {
  'CHAIR': {
    id: 'furn-001',
    name: 'Eames Lounge Chair',
    industry: 'LIFESTYLE',
    genealogy: [
      {
        id: 'body',
        name: 'Seating Body',
        category: 'COMPONENT',
        riskScore: 65,
        basePrice: 450,
        unit: 'unit',
        children: [
          { id: 'plywood', name: 'Molded Plywood', category: 'RAW_MATERIAL', riskScore: 78, basePrice: 1200, unit: 'ton', ticker: 'LBS=F' },
          { id: 'leather', name: 'Premium Leather', category: 'RAW_MATERIAL', riskScore: 42, basePrice: 15, unit: 'sqft', ticker: 'LBS=F' },
          { id: 'foam', name: 'PU Foam', category: 'RAW_MATERIAL', riskScore: 35, basePrice: 4.5, unit: 'kg' }
        ]
      },
      {
        id: 'frame',
        name: 'Structural Frame',
        category: 'COMPONENT',
        riskScore: 82,
        basePrice: 320,
        unit: 'unit',
        children: [
          { id: 'aluminum', name: 'Die-Cast Aluminum', category: 'RAW_MATERIAL', riskScore: 88, basePrice: 2500, unit: 'ton', ticker: 'ALI=F' },
          { id: 'steel', name: 'Reinforcement Steel', category: 'RAW_MATERIAL', riskScore: 54, basePrice: 850, unit: 'ton', ticker: 'HRC=F' }
        ]
      }
    ]
  },
  'EV': {
    id: 'auto-001',
    name: 'Electric Vehicle Platform',
    industry: 'HEAVY_INDUSTRY',
    genealogy: [
      {
        id: 'battery',
        name: 'High-Capacity Battery Pack',
        category: 'COMPONENT',
        riskScore: 94,
        basePrice: 12000,
        unit: 'unit',
        children: [
          { id: 'lithium', name: 'Lithium Hydroxide', category: 'RAW_MATERIAL', riskScore: 98, basePrice: 40000, unit: 'ton', ticker: 'LIT' },
          { id: 'cobalt', name: 'Cobalt Sulfate', category: 'RAW_MATERIAL', riskScore: 85, basePrice: 35000, unit: 'ton' },
          { id: 'nickel', name: 'Nickel Class 1', category: 'RAW_MATERIAL', riskScore: 72, basePrice: 18000, unit: 'ton' }
        ]
      },
      {
        id: 'powertrain',
        name: 'Electric Drive Unit',
        category: 'COMPONENT',
        riskScore: 68,
        basePrice: 8500,
        unit: 'unit',
        children: [
          { id: 'copper', name: 'Copper Windings', category: 'RAW_MATERIAL', riskScore: 62, basePrice: 9000, unit: 'ton', ticker: 'HG=F' },
          { id: 'magnets', name: 'Rare Earth Magnets', category: 'RAW_MATERIAL', riskScore: 91, basePrice: 150, unit: 'kg' }
        ]
      }
    ]
  },
  'SMARTPHONE': {
    id: 'tech-001',
    name: 'Flagship Smartphone',
    industry: 'HIGH_TECH',
    genealogy: [
      {
        id: 'display',
        name: 'LTPO OLED Display',
        category: 'COMPONENT',
        riskScore: 52,
        basePrice: 120,
        unit: 'unit',
        children: [
          { id: 'glass', name: 'Gorilla Glass Victus', category: 'RAW_MATERIAL', riskScore: 34, basePrice: 20, unit: 'sqft' },
          { id: 'indium', name: 'Indium Tin Oxide', category: 'RAW_MATERIAL', riskScore: 68, basePrice: 200, unit: 'kg' }
        ]
      },
      {
        id: 'soc',
        name: 'Neural Processing Core',
        category: 'COMPONENT',
        riskScore: 88,
        basePrice: 150,
        unit: 'unit',
        children: [
          { id: 'wafer', name: 'Silicon Wafer (3nm)', category: 'RAW_MATERIAL', riskScore: 92, basePrice: 15000, unit: 'wafer', ticker: 'SMH' },
          { id: 'neon', name: 'Excimer Laser Gas', category: 'RAW_MATERIAL', riskScore: 96, basePrice: 500, unit: 'L' }
        ]
      }
    ]
  }
};

