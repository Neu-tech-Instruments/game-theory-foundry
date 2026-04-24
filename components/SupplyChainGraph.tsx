import React, { useRef, useState, useEffect, useCallback } from 'react';
import { GameState, Payoff } from '../types';
import { BAN_METRICS } from '../constants';
import {
  Building2,
  Cpu,
  Factory,
  Database,
  ShoppingBag,
  ShieldCheck,
  User,
  Box,
  LayoutGrid,
  TriangleAlert,
  ShieldBan,
  CircleAlert,
  Globe,
  Activity
} from 'lucide-react';

interface Props {
  state: GameState;
  payoff: Payoff;
  resetKey?: number;
}

export const SupplyChainGraph: React.FC<Props> = ({ state, payoff, resetKey }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number, y: number }>>({});

  useEffect(() => {
    setCustomPositions({});
  }, [resetKey]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateDimensions();

    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const [viewState, setViewState] = useState({ scale: 1, x: 0, y: 0 });
  // Keep a live ref so event handlers always read current values without re-subscribing
  const viewStateRef = useRef(viewState);
  useEffect(() => { viewStateRef.current = viewState; }, [viewState]);

  const draggingIdRef = useRef<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const isPanningRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setViewState(prev => {
        const zoomFactor = -e.deltaY * 0.01;
        const newScale = Math.min(Math.max(0.5, prev.scale + zoomFactor), 4);
        const contentX = (mouseX - prev.x) / prev.scale;
        const contentY = (mouseY - prev.y) / prev.scale;
        const newX = mouseX - (contentX * newScale);
        const newY = mouseY - (contentY * newScale);
        return { scale: newScale, x: newX, y: newY };
      });
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Single, stable global mouse handler — reads refs so it never needs to re-register
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const currentDraggingId = draggingIdRef.current;
      if (currentDraggingId && containerRef.current) {
        const vs = viewStateRef.current;
        const rect = containerRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const innerX = (mx - vs.x) / vs.scale;
        const innerY = (my - vs.y) / vs.scale;
        let newX = (innerX / rect.width) * 100;
        let newY = (innerY / rect.height) * 100;
        newX = Math.max(0, Math.min(100, newX));
        newY = Math.max(0, Math.min(100, newY));

        setCustomPositions(prev => ({
          ...prev,
          [currentDraggingId]: { x: newX, y: newY }
        }));
      } else if (isPanningRef.current) {
        // movementX/Y is always current — no stale state needed
        setViewState(prev => ({
          ...prev,
          x: prev.x + e.movementX,
          y: prev.y + e.movementY
        }));
      }
    };

    const handleMouseUp = () => {
      draggingIdRef.current = null;
      isPanningRef.current = false;
      setDraggingId(null);
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  // Intentionally empty — handler uses refs for all runtime values
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Industry-agnostic nodes mapping
  const baseNodes = [
    { id: 'raw', type: 'warehouse', label: 'Raw Minerals', icon: Database, x: 10, y: 20, color: '#e8590c' },
    { id: 'energy', type: 'warehouse', label: 'Energy Grids', icon: Building2, x: 10, y: 50, color: '#e8590c' },
    { id: 'capital', type: 'warehouse', label: 'Capital Markets', icon: Building2, x: 10, y: 80, color: '#2b8a3e' },

    { id: 'mfg-1', type: 'process', label: 'Heavy Manufacturing', icon: Factory, x: 35, y: 35, color: '#e03131' },
    { id: 'tech-1', type: 'process', label: 'Semiconductors', icon: Cpu, x: 35, y: 65, color: '#1971c2' },

    { id: 'mfg-2', type: 'inventory', label: 'Consumer Goods', icon: Box, x: 60, y: 35, color: '#e03131' },
    { id: 'tech-2', type: 'inventory', label: 'Cloud Infrastructure', icon: Box, x: 60, y: 65, color: '#1971c2' },

    { id: 'market-1', type: 'customer', label: 'B2B Services', icon: User, x: 88, y: 35, color: '#495057' },
    { id: 'market-2', type: 'customer', label: 'Retail Consumer', icon: User, x: 88, y: 65, color: '#495057' },
  ];

  const nodes = baseNodes.map(node => {
    // Map payoff sector IDs to nodes
    // raw -> ENERGY, energy -> ENERGY, capital -> FINANCE, mfg -> MANUFACTURING, tech -> TECH
    const sectorIdMap: Record<string, MapMode> = {
        'raw': 'ENERGY',
        'energy': 'ENERGY',
        'capital': 'FINANCE',
        'mfg-1': 'MANUFACTURING',
        'mfg-2': 'MANUFACTURING',
        'tech-1': 'TECH',
        'tech-2': 'TECH',
        'market-1': 'FINANCE',
        'market-2': 'FINANCE'
    };
    
    const sectorState = payoff.sectors[sectorIdMap[node.id]];
    const panicIndex = sectorState?.panicIndex || 0;

    let basePos = node;
    if (customPositions[node.id]) {
      basePos = { ...node, ...customPositions[node.id] };
    }
    return { ...basePos, panicIndex };
  });

  const isBannedPath = (fromId: string) => {
    if (state.policyStrategy !== 'EXPORT_BANS') return false;
    if (state.bannedAsset === 'SEMICONDUCTORS' && fromId === 'tech-1') return true;
    if (state.bannedAsset === 'RAW_MINERALS' && fromId === 'raw') return true;
    if (state.bannedAsset === 'SOFTWARE_IP' && fromId === 'tech-2') return true;
    return false;
  };

  const renderLink = (fromId: string, toId: string, customWeight?: string) => {
    if (dimensions.width === 0 || dimensions.height === 0) return null;

    const from = nodes.find(n => n.id === fromId);
    const to = nodes.find(n => n.id === toId);

    if (!from || !to) return null;

    const startX = (from.x / 100) * dimensions.width;
    const startY = (from.y / 100) * dimensions.height;
    const endX = (to.x / 100) * dimensions.width;
    const endY = (to.y / 100) * dimensions.height;

    const cp1x = startX + (endX - startX) * 0.5;
    const cp1y = startY;
    const cp2x = startX + (endX - startX) * 0.5;
    const cp2y = endY;

    const blocked = isBannedPath(fromId);
    const tarified = state.policyStrategy === 'TARIFFS';

    return (
      <g key={`${fromId}-${toId}`}>
        <path
          d={`M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`}
          fill="none"
          stroke={blocked ? '#ff8787' : tarified ? '#ffd43b' : '#adb5bd'}
          strokeWidth={blocked || tarified ? 2 : 1}
          strokeOpacity={blocked ? 0.8 : tarified ? 0.6 : 0.2}
          className={!blocked ? "flow-line" : ""}
          style={{ transition: draggingId ? 'none' : 'all 0.5s ease' }}
        />
        {!blocked && Math.random() > 0.4 && (
          <text
            x={(startX + endX) / 2}
            y={(startY + endY) / 2 - 10}
            fontSize="10"
            fill="#868e96"
            fontFamily="monospace"
            className="select-none"
            textAnchor="middle"
          >
            {customWeight || (Math.random() * 50).toFixed(2)} <tspan fontSize="7" opacity="0.5">pts</tspan>
          </text>
        )}
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-[#f8f9fa] cursor-grab active:cursor-grabbing"
      onMouseDown={() => { isPanningRef.current = true; setIsPanning(true); }}
    >
      <div
        className="w-full h-full origin-top-left will-change-transform"
        style={{
          transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.scale})`
        }}
      >
        <svg className="w-full h-full pointer-events-none overflow-visible">
          {renderLink('raw', 'mfg-1')}
          {renderLink('raw', 'tech-1')}
          {renderLink('energy', 'mfg-1')}
          {renderLink('energy', 'tech-1')}
          {renderLink('capital', 'tech-1')}
          {renderLink('capital', 'mfg-1')}

          {renderLink('mfg-1', 'mfg-2')}
          {renderLink('tech-1', 'mfg-2')}
          {renderLink('tech-1', 'tech-2')}
          
          {renderLink('mfg-2', 'market-1')}
          {renderLink('mfg-2', 'market-2')}
          {renderLink('tech-2', 'market-1')}
          {renderLink('tech-2', 'market-2')}
        </svg>

        {nodes.map(node => (
          <div
            key={node.id}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              draggingIdRef.current = node.id;
              setDraggingId(node.id);
            }}
            className={`absolute flex flex-col items-center gap-1 group pointer-events-auto cursor-pointer z-10 select-none ${draggingId === node.id ? 'z-50 scale-110' : 'transition-transform hover:scale-110'}`}
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: 'translate(-50%, -50%)',
              cursor: draggingId ? 'grabbing' : 'grab'
            }}
          >
            <div
              className={`relative w-9 h-9 rounded-sm border-[1.5px] bg-white flex items-center justify-center shadow-md transition-all ${node.type === 'inventory' ? 'rounded-md' : node.type === 'process' ? 'rounded-sm' : 'rounded-full'} ${node.panicIndex > 70 ? 'animate-panic-pulse border-red-500 bg-red-50' : ''}`}
              style={{ borderColor: isBannedPath(node.id) ? '#ef4444' : node.panicIndex > 70 ? '#ef4444' : node.color }}
            >
              <node.icon className={`w-5 h-5 ${node.panicIndex > 70 ? 'animate-pulse' : ''}`} style={{ color: isBannedPath(node.id) ? '#ef4444' : node.panicIndex > 70 ? '#ef4444' : node.color }} strokeWidth={2.5} />

              {(isBannedPath(node.id) || node.panicIndex > 80) && (
                <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[6px] px-1.5 py-0.5 rounded-full font-black shadow-lg border border-white uppercase tracking-tighter">
                  {isBannedPath(node.id) ? 'BANNED' : 'HOARDING'}
                </div>
              )}

              {node.panicIndex > 40 && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white border border-slate-200 shadow-sm rounded-full px-1.5 py-0.5 flex items-center gap-1">
                   <div className="w-1 h-1 rounded-full bg-red-500 animate-ping" />
                   <span className="text-[7px] font-black text-red-600">{node.panicIndex}% PANIC</span>
                </div>
              )}

              {state.policyStrategy === 'TARIFFS' && node.type === 'process' && (
                <div className="absolute -top-8 -right-8 z-20 drop-shadow-sm">
                  <TriangleAlert className="w-6 h-6 fill-[#fab005] text-white" strokeWidth={1.5} />
                </div>
              )}
            </div>

            <div className="bg-white border border-[#dee2e6] rounded-sm px-2 py-0.5 shadow-sm min-w-[60px] text-center">
              <span className="text-[9px] font-bold text-[#495057] whitespace-nowrap">{node.label}</span>
            </div>
          </div>
        ))}
      </div>
      <MacroLegend />
    </div>
  );
};

export const MacroLegend = () => (
    <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-4 shadow-xl z-20 animate-in fade-in slide-in-from-left-4 duration-1000 select-none">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-2">
            <Globe className="w-3 h-3" />
            Macro Intelligence Legend
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-sm border-2 border-[#e03131] bg-red-50 flex items-center justify-center shrink-0">
                    <Factory className="w-4 h-4 text-[#e03131]" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Industrial</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Manufacturing</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-sm border-2 border-[#1971c2] bg-blue-50 flex items-center justify-center shrink-0">
                    <Cpu className="w-4 h-4 text-[#1971c2]" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Technology</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Digital / IP</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#e8590c] bg-orange-50 flex items-center justify-center shrink-0">
                    <Database className="w-4 h-4 text-[#e8590c]" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Resource</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Minerals / Energy</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#2b8a3e] bg-emerald-50 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4 text-[#2b8a3e]" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Capital</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Market Flow</span>
                </div>
            </div>
        </div>
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-3">
            <div className="w-8 flex justify-center">
                <div className="w-4 h-px bg-[#adb5bd] border-t border-slate-300" />
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Trade Intensity Points (pts)</span>
        </div>
    </div>
);
