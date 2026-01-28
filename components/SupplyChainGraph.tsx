
import React, { useRef, useState, useEffect } from 'react';
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
  LayoutGrid
} from 'lucide-react';

interface Props {
  state: GameState;
  payoff: Payoff;
  resetKey?: number;
}

export const SupplyChainGraph: React.FC<Props> = ({ state, payoff, resetKey }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Track dragging state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [flowType, setFlowType] = useState<'US' | 'CHINA'>('US');

  // Store custom positions: { [id]: { x: number, y: number } }
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number, y: number }>>({});

  // Reset positions when resetKey changes
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

    // Initial measure
    updateDimensions();

    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Handle global mouse move/up for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingId && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();

        // Calculate new percentage position
        // Clamp to 0-100 to stay inside container
        let newX = ((e.clientX - rect.left) / rect.width) * 100;
        let newY = ((e.clientY - rect.top) / rect.height) * 100;

        newX = Math.max(0, Math.min(100, newX));
        newY = Math.max(0, Math.min(100, newY));

        setCustomPositions(prev => ({
          ...prev,
          [draggingId]: { x: newX, y: newY }
        }));
      }
    };

    const handleMouseUp = () => {
      setDraggingId(null);
    };

    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, dimensions]);

  // Define base node positions
  const usBaseNodes = [
    { id: 'us-source', type: 'warehouse', label: 'US Hub', icon: Building2, x: 10, y: 40, color: '#339af0' },
    { id: 'inventory-1', type: 'inventory', label: BAN_METRICS[state.usBanFocus].label, icon: Box, x: 25, y: 30, color: '#40c057' },
    { id: 'inventory-2', type: 'inventory', label: BAN_METRICS[state.chinaBanFocus].label, icon: Box, x: 25, y: 40, color: '#40c057' },
    { id: 'inventory-3', type: 'inventory', label: 'Commodities', icon: Box, x: 25, y: 50, color: '#40c057' },

    { id: 'proc-1', type: 'process', label: 'NYC Tech', icon: LayoutGrid, x: 55, y: 15, color: '#fab005' },
    { id: 'proc-2', type: 'process', label: 'DC Systems', icon: LayoutGrid, x: 55, y: 25, color: '#fab005' },
    { id: 'proc-3', type: 'process', label: 'PIT Infrastructure', icon: LayoutGrid, x: 55, y: 35, color: '#fab005' },
    { id: 'proc-4', type: 'process', label: 'Global SaaS', icon: LayoutGrid, x: 55, y: 45, color: '#fab005' },
    { id: 'proc-5', type: 'process', label: 'Eurasian Net', icon: LayoutGrid, x: 55, y: 55, color: '#fab005' },

    { id: 'finished-1', type: 'inventory', label: 'Market Access', icon: Box, x: 75, y: 30, color: '#40c057' },
    { id: 'finished-2', type: 'inventory', label: 'Trade Balance', icon: Box, x: 75, y: 55, color: '#40c057' },

    { id: 'customer', type: 'customer', label: 'Global Consumer', icon: User, x: 92, y: 40, color: '#e64980' },
  ];

  const chinaBaseNodes = [
    { id: 'cn-source', type: 'warehouse', label: 'China Hub', icon: Building2, x: 8, y: 32, color: '#e03131' },

    { id: 'cn-raw', type: 'inventory', label: 'Rare Earths', icon: Database, x: 22, y: 44, color: '#fab005' },
    { id: 'cn-inventory-1', type: 'inventory', label: 'Raw Materials', icon: Box, x: 22, y: 20, color: '#40c057' },

    { id: 'cn-proc-1', type: 'process', label: 'Regional Hub', icon: LayoutGrid, x: 40, y: 12, color: '#339af0' },
    { id: 'cn-proc-2', type: 'process', label: 'Component Mfg', icon: LayoutGrid, x: 40, y: 32, color: '#339af0' },
    { id: 'cn-mfg-1', type: 'process', label: 'Shenzhen Mfg', icon: Factory, x: 40, y: 52, color: '#339af0' },

    { id: 'cn-inventory-2', type: 'inventory', label: 'Intermediate', icon: Box, x: 58, y: 20, color: '#40c057' },
    { id: 'cn-proc-3', type: 'process', label: 'Assembly Line', icon: Factory, x: 58, y: 40, color: '#339af0' },
    { id: 'cn-mfg-2', type: 'process', label: 'Shanghai Port', icon: Factory, x: 58, y: 60, color: '#339af0' },

    { id: 'cn-export-1', type: 'inventory', label: 'EU Exports', icon: Box, x: 76, y: 20, color: '#e64980' },
    { id: 'cn-export-2', type: 'inventory', label: 'US Exports', icon: Box, x: 76, y: 44, color: '#e64980' },

    { id: 'cn-customer', type: 'customer', label: 'Global Market', icon: User, x: 92, y: 32, color: '#e64980' },
  ];

  const currentBaseNodes = flowType === 'US' ? usBaseNodes : chinaBaseNodes;

  // Merge base positions with custom dragged positions
  const nodes = currentBaseNodes.map(node => {
    if (customPositions[node.id]) {
      return { ...node, ...customPositions[node.id] };
    }
    return node;
  });

  const renderLink = (fromId: string, toId: string, customWeight?: string) => {
    if (dimensions.width === 0 || dimensions.height === 0) return null;

    const from = nodes.find(n => n.id === fromId);
    const to = nodes.find(n => n.id === toId);

    if (!from || !to) return null;

    // Convert % to pixels
    const startX = (from.x / 100) * dimensions.width;
    const startY = (from.y / 100) * dimensions.height;
    const endX = (to.x / 100) * dimensions.width;
    const endY = (to.y / 100) * dimensions.height;

    const cp1x = startX + (endX - startX) * 0.5;
    const cp1y = startY;
    const cp2x = startX + (endX - startX) * 0.5;
    const cp2y = endY;

    const isActive = !(
      (state.usStrategy === 'EXPORT_BANS' && fromId === 'inventory-1') ||
      (state.chinaStrategy === 'EXPORT_BANS' && fromId === 'inventory-2')
    );

    return (
      <g key={`${fromId}-${toId}`}>
        <path
          d={`M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`}
          fill="none"
          stroke={isActive ? '#adb5bd' : '#f1f3f5'}
          strokeWidth={isActive ? 2.5 : 1}
          strokeOpacity={isActive ? 0.4 : 0.1}
          className={isActive ? "flow-line" : ""}
          style={{ transition: draggingId ? 'none' : 'all 0.5s ease' }}
        />
        {isActive && Math.random() > 0.7 && (
          <text
            x={(startX + endX) / 2}
            y={(startY + endY) / 2 - 10}
            fontSize="10"
            fill="#868e96"
            fontFamily="monospace"
            className="select-none"
            textAnchor="middle"
          >
            {customWeight || (Math.random() * 50).toFixed(2)}
          </text>
        )}
      </g>
    );
  };

  return (
    <div ref={containerRef} className="absolute inset-0 p-10 overflow-hidden">

      {/* Flow Switcher */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-[#dee2e6] rounded-lg shadow-sm p-1 flex">
        <button
          onClick={() => setFlowType('US')}
          className={`px-4 py-1.5 text-[11px] font-bold rounded transition-all ${flowType === 'US' ? 'bg-[#e7f5ff] text-[#1971c2]' : 'text-[#868e96] hover:bg-[#f8f9fa]'}`}
        >
          US Flow
        </button>
        <button
          onClick={() => setFlowType('CHINA')}
          className={`px-4 py-1.5 text-[11px] font-bold rounded transition-all ${flowType === 'CHINA' ? 'bg-[#fff5f5] text-[#e03131]' : 'text-[#868e96] hover:bg-[#f8f9fa]'}`}
        >
          China Flow
        </button>
      </div>

      <svg className="w-full h-full pointer-events-none overflow-visible">
        {flowType === 'US' ? (
          <>
            {renderLink('us-source', 'inventory-1')}
            {renderLink('us-source', 'inventory-2')}
            {renderLink('us-source', 'inventory-3')}

            {['proc-1', 'proc-2', 'proc-3', 'proc-4', 'proc-5'].map(p => (
              <React.Fragment key={p}>
                {renderLink('inventory-1', p)}
                {renderLink('inventory-2', p)}
                {renderLink('inventory-3', p)}
              </React.Fragment>
            ))}

            {renderLink('proc-1', 'finished-1')}
            {renderLink('proc-2', 'finished-1')}
            {renderLink('proc-3', 'finished-1')}
            {renderLink('proc-4', 'finished-2')}
            {renderLink('proc-5', 'finished-2')}

            {renderLink('finished-1', 'customer', '220.77')}
            {renderLink('finished-2', 'customer', '211.18')}
          </>
        ) : (
          <>
            {renderLink('cn-source', 'cn-raw')}
            {renderLink('cn-source', 'cn-inventory-1')}

            {renderLink('cn-inventory-1', 'cn-proc-1')}
            {renderLink('cn-inventory-1', 'cn-proc-2')}

            {renderLink('cn-raw', 'cn-proc-2')}
            {renderLink('cn-raw', 'cn-mfg-1')}

            {renderLink('cn-proc-1', 'cn-inventory-2')}
            {renderLink('cn-proc-2', 'cn-inventory-2')}

            {renderLink('cn-inventory-2', 'cn-proc-3')}

            {renderLink('cn-mfg-1', 'cn-proc-3')}
            {renderLink('cn-mfg-1', 'cn-mfg-2')}

            {renderLink('cn-proc-3', 'cn-export-1')}
            {renderLink('cn-proc-3', 'cn-export-2')}

            {renderLink('cn-mfg-2', 'cn-export-1')}
            {renderLink('cn-mfg-2', 'cn-export-2')}

            {renderLink('cn-export-1', 'cn-customer')}
            {renderLink('cn-export-2', 'cn-customer')}
          </>
        )}
      </svg>

      {/* Nodes Render */}
      {nodes.map(node => (
        <div
          key={node.id}
          onMouseDown={(e) => {
            e.preventDefault();
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
          {/* Node Icon Box */}
          <div
            className={`w-9 h-9 rounded-sm border-[1.5px] bg-white flex items-center justify-center shadow-md transition-all ${node.type === 'inventory' ? 'rounded-md' :
                node.type === 'process' ? 'rounded-sm' : 'rounded-full'
              } ${
              // Highlight banned nodes
              (state.usStrategy === 'EXPORT_BANS' && node.id === 'inventory-1') ||
                (state.chinaStrategy === 'EXPORT_BANS' && node.id === 'inventory-2') ||
                (state.chinaStrategy === 'EXPORT_BANS' && node.id === 'cn-raw')
                ? 'border-red-500 border-[3px] animate-pulse bg-red-50'
                : ''
              }`}
            style={{
              borderColor: (state.usStrategy === 'EXPORT_BANS' && node.id === 'inventory-1') ||
                (state.chinaStrategy === 'EXPORT_BANS' && node.id === 'inventory-2') ||
                (state.chinaStrategy === 'EXPORT_BANS' && node.id === 'cn-raw')
                ? '#ef4444'
                : node.color
            }}
          >
            <node.icon className="w-5 h-5" style={{
              color: (state.usStrategy === 'EXPORT_BANS' && node.id === 'inventory-1') ||
                (state.chinaStrategy === 'EXPORT_BANS' && node.id === 'inventory-2') ||
                (state.chinaStrategy === 'EXPORT_BANS' && node.id === 'cn-raw')
                ? '#ef4444'
                : node.color
            }} strokeWidth={2.5} />

            {/* Export Ban Badge */}
            {((state.usStrategy === 'EXPORT_BANS' && node.id === 'inventory-1') ||
              (state.chinaStrategy === 'EXPORT_BANS' && node.id === 'inventory-2') ||
              (state.chinaStrategy === 'EXPORT_BANS' && node.id === 'cn-raw')) && (
                <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[6px] px-1.5 py-0.5 rounded-full font-black shadow-lg border border-white">
                  BANNED
                </div>
              )}

            {/* Overlay badge for process nodes */}
            {node.type === 'process' && !(
              (state.usStrategy === 'EXPORT_BANS' && node.id === 'inventory-1') ||
              (state.chinaStrategy === 'EXPORT_BANS' && node.id === 'inventory-2') ||
              (state.chinaStrategy === 'EXPORT_BANS' && node.id === 'cn-raw')
            ) && (
                <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[7px] px-1 rounded-sm font-bold shadow-sm">
                  1:2
                </div>
              )}

            {/* Multi-stack effect for customer */}
            {node.type === 'customer' && (
              <div className="absolute -z-10 w-9 h-9 border-[1.5px] border-pink-300 rounded-full translate-x-1 translate-y-1 bg-white opacity-50" />
            )}
          </div>

          {/* Label Card */}
          <div className="bg-white border border-[#dee2e6] rounded-sm px-2 py-0.5 shadow-sm min-w-[60px] text-center">
            <span className="text-[9px] font-bold text-[#495057] whitespace-nowrap">{node.label}</span>
          </div>

          {/* Sub-label for customer node */}
          {node.type === 'customer' && (
            <div className="bg-[#dee2e6] text-[#495057] text-[7px] font-bold px-1 rounded-sm uppercase tracking-tighter">
              30 Entities [IMPR...]
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
