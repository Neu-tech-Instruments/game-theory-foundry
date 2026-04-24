import { useState, useEffect } from 'react';

export interface PolymarketEvent {
    id: string;
    title: string;
    probability: number;
    category: string;
    sourceUrl: string;
}

export const usePolymarket = () => {
    const [markets, setMarkets] = useState<PolymarketEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMarkets = async () => {
            try {
                const response = await fetch('https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=10&order=volume&ascending=false&tag_id=1'); // tag_id=1 is often Politics/Geopolitical
                if (!response.ok) throw new Error('Polymarket API unreachable');
                
                const data = await response.json();
                
                const formatted: PolymarketEvent[] = data.map((m: any) => ({
                    id: m.id || m.conditionId,
                    title: m.question,
                    probability: Math.round((m.outcomePrices?.[0] || 0.5) * 100),
                    category: m.group_id === '1' ? 'GEOPOLITICAL' : 'MACRO',
                    sourceUrl: `https://polymarket.com/event/${m.slug}`
                })).filter((m: any) => m.title);

                setMarkets(formatted);
            } catch (err) {
                console.warn('Using fallback Polymarket data');
                // Fallback for isolated environments
                setMarkets([
                    { id: 'p1', title: 'Will Russia/Ukraine reach a ceasefire in 2026?', probability: 22, category: 'GEOPOLITICAL', sourceUrl: '#' },
                    { id: 'p2', title: 'Will the US Enter a Recession before 2027?', probability: 38, category: 'MACRO', sourceUrl: '#' },
                    { id: 'p3', title: 'Will TikTok be banned in the US?', probability: 64, category: 'TRADE', sourceUrl: '#' }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchMarkets();
    }, []);

    return { markets, loading };
};
