import React from 'react';
import { AlertCircle, Globe, ShieldAlert, Zap } from 'lucide-react';

interface EventIntelCardProps {
  event: {
    id: string;
    title: string;
    severity: 'LOW' | 'MID' | 'HIGH';
    impact: string;
    timestamp: string;
    type: 'GEOPOLITICAL' | 'TRADE' | 'INFERENCE';
    marketProb?: number;
    confidence?: number;
  };
}

export const EventIntelCard: React.FC<EventIntelCardProps> = ({ event }) => {
  const getIcon = () => {
    switch (event.type) {
      case 'GEOPOLITICAL': return <Globe className="w-3.5 h-3.5" />;
      case 'TRADE': return <ShieldAlert className="w-3.5 h-3.5" />;
      default: return <Zap className="w-3.5 h-3.5" />;
    }
  };

  const getColor = () => {
    switch (event.severity) {
      case 'HIGH': return 'border-red-200 bg-red-50 text-red-700';
      case 'MID': return 'border-amber-200 bg-amber-50 text-amber-700';
      default: return 'border-blue-200 bg-blue-50 text-blue-700';
    }
  };

  return (
    <div className={`p-3 rounded-xl border transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:-translate-y-[1px] ${getColor()} relative overflow-hidden group`}>
      {/* Probability Glow Background */}
      {event.marketProb && (
        <div
          className="absolute inset-y-0 left-0 bg-current opacity-[0.03] transition-all duration-1000"
          style={{ width: `${event.marketProb}%` }}
        />
      )}

      <div className="flex items-center justify-between mb-2 relative z-10">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-[9px] font-black uppercase tracking-widest">{event.type}</span>
        </div>
        <div className="flex items-center gap-2">
          {event.marketProb && (
            <span className="text-[9px] font-black bg-white/50 px-1.5 py-0.5 rounded border border-current/20 shadow-sm">
              {event.marketProb}% ODDS
            </span>
          )}
          <span className="text-[8px] font-bold opacity-60 uppercase">{event.timestamp}</span>
        </div>
      </div>

      <h4 className="text-[10px] font-black uppercase tracking-tight mb-0.5 relative z-10">{event.title}</h4>
      <p className="text-[9px] font-medium opacity-80 leading-snug mb-2 relative z-10">{event.impact}</p>

      {event.confidence !== undefined && (
        <div className="space-y-1 relative z-10">
          <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest opacity-60">
            <span>Certainty Meter</span>
            <span>{event.confidence}% Confidence</span>
          </div>
          <div className="h-1 bg-current/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-current transition-all duration-1000"
              style={{ width: `${event.confidence}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
