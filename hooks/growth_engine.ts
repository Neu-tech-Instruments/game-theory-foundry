import { ProductTemplate, MaterialNode } from '../constants/material_genealogy';

/**
 * Neural Growth Engine
 * Synthesizes a supply chain DNA from a user prompt.
 */

const MATERIAL_CLUSTERS: Record<string, MaterialNode[]> = {
    'AEROSPACE_CORE': [
        { id: 'titanium-sp', name: 'Titanium Sponge', category: 'RAW_MATERIAL', riskScore: 82, basePrice: 12000, unit: 'ton', ticker: 'TI' },
        { id: 'carbon-pre', name: 'Carbon Fiber Pre-preg', category: 'RAW_MATERIAL', riskScore: 65, basePrice: 450, unit: 'kg' },
        { id: 'ceramic-sh', name: 'Thermal Shield Ceramics', category: 'RAW_MATERIAL', riskScore: 71, basePrice: 200, unit: 'kg' },
        { id: 'inconel-718', name: 'Inconel 718 Superalloy', category: 'RAW_MATERIAL', riskScore: 88, basePrice: 45000, unit: 'ton' },
        { id: 'spacex-304l', name: 'SpaceX 304L Stainless', category: 'RAW_MATERIAL', riskScore: 42, basePrice: 850, unit: 'ton' },
        { id: 'pica-x', name: 'PICA-X Material', category: 'RAW_MATERIAL', riskScore: 92, basePrice: 1200, unit: 'kg' }
    ],
    'PROPULSION_RESOURCES': [
        { id: 'methane-liq', name: 'Liquid Methane (CH4)', category: 'RAW_MATERIAL', riskScore: 35, basePrice: 400, unit: 'ton' },
        { id: 'lox', name: 'Liquid Oxygen (LOX)', category: 'RAW_MATERIAL', riskScore: 28, basePrice: 150, unit: 'ton' },
        { id: 'he-gas', name: 'High-Purity Helium', category: 'RAW_MATERIAL', riskScore: 85, basePrice: 2500, unit: 'm3' },
        { id: 'cu-alloy', name: 'NARloy-Z Copper Alloy', category: 'RAW_MATERIAL', riskScore: 76, basePrice: 12000, unit: 'ton' }
    ],
    'ELECTRONICS': [
        { id: 'silicon', name: 'Silicon Wafer', category: 'RAW_MATERIAL', riskScore: 92, basePrice: 15000, unit: 'wafer', ticker: 'SMH' },
        { id: 'neon', name: 'Excimer Neon', category: 'RAW_MATERIAL', riskScore: 96, basePrice: 500, unit: 'L' },
        { id: 'gallium', name: 'Gallium Nitride', category: 'RAW_MATERIAL', riskScore: 78, basePrice: 1200, unit: 'kg' }
    ],
    'ELEMENTAL_TRACES': [
        { id: 'cobalt-raw', name: 'Refined Cobalt', category: 'RAW_MATERIAL', riskScore: 88, basePrice: 32000, unit: 'ton' },
        { id: 'nickel-cl1', name: 'Nickel Class 1', category: 'RAW_MATERIAL', riskScore: 72, basePrice: 18000, unit: 'ton' },
        { id: 'lithium-hy', name: 'Lithium Hydroxide', category: 'RAW_MATERIAL', riskScore: 98, basePrice: 45000, unit: 'ton' }
    ]
};

const MEGA_COMPONENT_GROUPS: Record<string, string[]> = {
    'STARSHIP_ASSEMBLY': [
        'Raptor Engine Cluster', 'Cold Gas Thruster System', 'Stainless Steel Hull Section',
        'Forward Flap Actuators', 'Aft Flap Logic', 'Header Tank Assembly',
        'Avionics Navigation Bay', 'Starlink Integrated Comms', 'PICA-X Heat Shield Array',
        'Payload Bay Mechanism', 'Methane Fuel System', 'Oxygen Oxidizer Array'
    ],
    'RESOURCES': ['Mass Extraction Module', 'Chemical Refining Array', 'Strategic Storage Matrix']
};

export const synthesizeProduct = (prompt: string, isImage: boolean = false): { template: ProductTemplate, industry: string } => {
    const ucPrompt = (prompt || (isImage ? 'Visual DNA Scan' : '')).toUpperCase();
    const isMega = ucPrompt.includes('STARSHIP') || ucPrompt.includes('SPACEX') || ucPrompt.includes('ROCKET') || ucPrompt.includes('FALCON') || ucPrompt.includes('MARS') || ucPrompt.includes('ORBIT');
    
    // 1. AUTODETECT INDUSTRY
    let detectedIndustry = 'LIFESTYLE';
    if (isMega || ucPrompt.includes('AERO') || ucPrompt.includes('SPACE')) detectedIndustry = 'RESOURCES'; 
    else if (ucPrompt.includes('COMPUTER') || ucPrompt.includes('PHONE') || ucPrompt.includes('TECH')) detectedIndustry = 'HIGH_TECH';
    else if (ucPrompt.includes('CAR') || ucPrompt.includes('VEHICLE') || ucPrompt.includes('MACHINE')) detectedIndustry = 'HEAVY_INDUSTRY';

    // 2. RECURSIVE SYNTHESIS LOGIC
    const expandNode = (name: string, depth: number, maxDepth: number): MaterialNode[] => {
        if (depth >= maxDepth) {
            // Return elements at leaf nodes
            const rawPool = Object.values(MATERIAL_CLUSTERS).flat();
            const count = 3 + Math.floor(Math.random() * 3);
            return Array.from({ length: count }).map((_, i) => ({
                ...rawPool[Math.floor(Math.random() * rawPool.length)],
                id: `raw-${depth}-${i}-${Math.random().toString(36).substr(2, 4)}`,
                category: 'ELEMENT'
            }));
        }

        // Branching logic: categories based on depth
        const categories = ['GENESIS', 'ASSEMBLY', 'SUB_SYSTEM', 'MODULE', 'COMPONENT', 'PART', 'ELEMENT'];
        const currentCategory = categories[depth] || 'COMPONENT';
        // Per-depth branching: wide at top, narrows at bottom so total stays ~2500 nodes
        // d0=12, d1=4, d2=3, d3=3, d4=2, d5=2 → 12×4×3×3×2×2 = 864 non-leaf + leaves ≈ 2600 total
        const subCount = isMega
            ? ([12, 4, 3, 3, 2, 2][depth] ?? 2)
            : 3;
        return Array.from({ length: subCount }).map((_, i) => {
            const compId = `comp-${depth}-${i}-${Math.random().toString(36).substr(2, 4)}`;
            return {
                id: compId,
                name: depth === 0 ? (MEGA_COMPONENT_GROUPS.STARSHIP_ASSEMBLY[i] || `${name} Section ${i}`) : `${name} Logic ${i}.${depth}`,
                category: currentCategory,
                riskScore: 40 + Math.random() * 50,
                basePrice: 5000 / (depth + 1),
                unit: 'unit',
                children: expandNode(`${name} Part`, depth + 1, maxDepth)
            };
        });
    };

    const maxDepth = isMega ? 6 : 2; // Mega: 7 levels (GENESIS→ASSEMBLY→SUB_SYSTEM→MODULE→COMPONENT→PART→ELEMENT). Standard: 3.
    const genealogy = expandNode(ucPrompt, 0, maxDepth);

    return {
        template: {
            id: `syn-${Date.now()}`,
            name: prompt || (isImage ? 'Visual DNA Scan' : 'Unidentified Prototype'),
            industry: detectedIndustry,
            genealogy
        },
        industry: detectedIndustry
    };
};
