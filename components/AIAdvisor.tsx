
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { GameState, Scenario } from '../types';
import { BAN_METRICS } from '../constants';
import { Loader2, Zap } from 'lucide-react';

interface Props {
  state: GameState;
  scenario: Scenario;
}

export const AIAdvisor: React.FC<Props> = ({ state, scenario }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchAdvice = async () => {
    if (!process.env.API_KEY) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const usBanLabel = BAN_METRICS[state.usBanFocus]?.label || 'None';
      const chinaBanLabel = BAN_METRICS[state.chinaBanFocus]?.label || 'None';
      
      const prompt = `
        Analyze this Trade War state as a Senior Geopolitical Strategist:
        Context: ${scenario.title}
        US Strategy: ${state.usStrategy} (Weaponizing: ${usBanLabel})
        China Strategy: ${state.chinaStrategy} (Weaponizing: ${chinaBanLabel})
        Trade Dependency Modifiers: US on China: ${scenario.tradeDependency.usOnChina}, China on US: ${scenario.tradeDependency.chinaOnUs}.
        
        Provide a concise, high-level tactical advice (1 short sentence) for the G7 summit.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          temperature: 0.9,
          maxOutputTokens: 80,
          thinkingConfig: { thinkingBudget: 40 },
        }
      });

      setAdvice(response.text?.trim() || 'Strategic stream interrupted.');
    } catch (err) {
      setAdvice('Uplink failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchAdvice(), 1000);
    return () => clearTimeout(timer);
  }, [state.scenario, state.usStrategy, state.chinaStrategy, state.usBanFocus, state.chinaBanFocus]);

  return (
    <div className="h-full bg-blue-900/10 border border-blue-500/20 rounded-xl p-3 relative overflow-hidden group shadow-lg flex flex-col">
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 via-sky-400 to-blue-500 opacity-50" />
      <div className="flex items-center gap-1.5 mb-1 shrink-0">
        <Zap className="w-2.5 h-2.5 text-blue-400 fill-blue-400/20" />
        <h3 className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-200 leading-none">Strategic Intel</h3>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="flex items-center gap-2 py-1">
            <Loader2 className="w-2.5 h-2.5 animate-spin text-blue-500" />
            <p className="text-[8px] font-bold tracking-widest uppercase animate-pulse">Running Simulation...</p>
          </div>
        ) : (
          <p className="text-[10px] sm:text-xs leading-tight text-slate-100 font-medium italic">
            "{advice}"
          </p>
        )}
      </div>
    </div>
  );
};
