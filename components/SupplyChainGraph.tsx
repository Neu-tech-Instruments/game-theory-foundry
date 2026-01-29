
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
  LayoutGrid,
  TriangleAlert,
  ShieldBan,
  CircleAlert
} from 'lucide-react';

interface Props {
  state: GameState;
  payoff: Payoff;
  resetKey?: number;
  flowType: 'US' | 'CHINA';
}

export const SupplyChainGraph: React.FC<Props> = ({ state, payoff, resetKey, flowType }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Track dragging state
  const [draggingId, setDraggingId] = useState<string | null>(null);

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

  /* ZOOM & PAN STATE */
  const [viewState, setViewState] = useState({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  // Handle Zoom (Wheel / Trackpad Pinch)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setViewState(prev => {
        // Sensitivity factor - negative deltaY means zoom in (scrolling up)
        const zoomFactor = -e.deltaY * 0.01;
        const newScale = Math.min(Math.max(0.5, prev.scale + zoomFactor), 4);

        // Calculate the mouse position relative to the content before scaling
        const contentX = (mouseX - prev.x) / prev.scale;
        const contentY = (mouseY - prev.y) / prev.scale;

        // Calculate new X/Y to keep mouse point stable
        const newX = mouseX - (contentX * newScale);
        const newY = mouseY - (contentY * newScale);

        return { scale: newScale, x: newX, y: newY };
      });
    };

    // Use passive: false to allow preventing default scroll
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Handle global mouse move/up for dragging & panning
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 1. Handle Node Dragging
      if (draggingId && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();

        // Mouse position in Container space
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Inverse Transform: Convert to Inner Content space
        const innerX = (mx - viewState.x) / viewState.scale;
        const innerY = (my - viewState.y) / viewState.scale;

        // Convert to percentage
        let newX = (innerX / rect.width) * 100;
        let newY = (innerY / rect.height) * 100;

        // Clamp
        newX = Math.max(0, Math.min(100, newX));
        newY = Math.max(0, Math.min(100, newY));

        setCustomPositions(prev => ({
          ...prev,
          [draggingId]: { x: newX, y: newY }
        }));
      }
      // 2. Handle Canvas Panning
      else if (isPanning) {
        setViewState(prev => ({
          ...prev,
          x: prev.x + e.movementX,
          y: prev.y + e.movementY
        }));
      }
    };

    const handleMouseUp = () => {
      setDraggingId(null);
      setIsPanning(false);
    };

    if (draggingId || isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, isPanning, viewState, dimensions]);

  // Define base node positions
  const usBaseNodes = [
    { id: 'us-source', type: 'warehouse', label: 'United States Hub', icon: Building2, x: 10, y: 40, color: '#339af0' },
    { id: 'inventory-1', type: 'inventory', label: BAN_METRICS[state.usBanFocus].label, icon: Box, x: 25, y: 30, color: '#40c057' },
    { id: 'inventory-2', type: 'inventory', label: BAN_METRICS[state.chinaBanFocus].label, icon: Box, x: 25, y: 40, color: '#40c057' },
    { id: 'inventory-3', type: 'inventory', label: 'Commodities', icon: Box, x: 25, y: 50, color: '#40c057' },

    { id: 'proc-1', type: 'process', label: 'NYC Tech', icon: LayoutGrid, x: 55, y: 15, color: '#fab005' },
    { id: 'proc-2', type: 'process', label: 'DC Systems', icon: LayoutGrid, x: 55, y: 25, color: '#fab005' },
    { id: 'proc-3', type: 'process', label: 'PIT Infrastructure', icon: LayoutGrid, x: 55, y: 35, color: '#fab005' },
    { id: 'proc-4', type: 'process', label: 'Global SaaS', icon: LayoutGrid, x: 55, y: 45, color: '#fab005' },
    { id: 'proc-5', type: 'process', label: 'Global Network', icon: LayoutGrid, x: 55, y: 55, color: '#fab005' },

    { id: 'finished-1', type: 'inventory', label: 'Market Access', icon: Box, x: 75, y: 30, color: '#40c057' },
    { id: 'finished-2', type: 'inventory', label: 'Trade Balance', icon: Box, x: 75, y: 55, color: '#40c057' },

    { id: 'customer', type: 'customer', label: 'Global Consumer', icon: User, x: 92, y: 40, color: '#e64980' },
  ];

  const chinaBaseNodes = [
    { id: 'cn-source', type: 'warehouse', label: 'China Hub', icon: Building2, x: 8, y: 32, color: '#e03131' },

    { id: 'cn-us-import', type: 'inventory', label: BAN_METRICS[state.usBanFocus].label, icon: Box, x: 22, y: 8, color: '#339af0' },
    { id: 'cn-raw', type: 'inventory', label: 'Rare Earths', icon: Database, x: 22, y: 44, color: '#fab005' },
    { id: 'cn-inventory-1', type: 'inventory', label: 'Raw Materials', icon: Box, x: 22, y: 26, color: '#40c057' },

    { id: 'cn-proc-1', type: 'process', label: 'Regional Hub', icon: LayoutGrid, x: 40, y: 12, color: '#339af0' },
    { id: 'cn-proc-2', type: 'process', label: 'Component Mfg', icon: LayoutGrid, x: 40, y: 32, color: '#339af0' },
    { id: 'cn-mfg-1', type: 'process', label: 'Shenzhen Mfg', icon: Factory, x: 40, y: 52, color: '#339af0' },

    { id: 'cn-inventory-2', type: 'inventory', label: 'Intermediate', icon: Box, x: 58, y: 20, color: '#40c057' },
    { id: 'cn-proc-3', type: 'process', label: 'Assembly Line', icon: Factory, x: 58, y: 40, color: '#339af0' },
    { id: 'cn-mfg-2', type: 'process', label: 'Shanghai Port', icon: Factory, x: 58, y: 60, color: '#339af0' },

    { id: 'cn-export-1', type: 'inventory', label: 'World Markets', icon: Box, x: 76, y: 20, color: '#40c057' },
    { id: 'cn-export-2', type: 'inventory', label: 'United States Exports', icon: Box, x: 76, y: 44, color: '#40c057' },

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
      (state.chinaStrategy === 'EXPORT_BANS' && fromId === 'inventory-2') ||
      (state.usStrategy === 'EXPORT_BANS' && fromId === 'cn-us-import')
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
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-[#f8f9fa] cursor-grab active:cursor-grabbing"
      onMouseDown={() => setIsPanning(true)}
    >
      <div
        className="w-full h-full origin-top-left will-change-transform"
        style={{
          transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.scale})`
        }}
      >
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
              {renderLink('cn-source', 'cn-us-import')}
              {renderLink('cn-source', 'cn-raw')}
              {renderLink('cn-source', 'cn-inventory-1')}

              {renderLink('cn-us-import', 'cn-proc-1')}
              {renderLink('cn-us-import', 'cn-proc-2')}

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
              e.stopPropagation(); // Stop panning when dragging starts
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
              className={`relative w-9 h-9 rounded-sm border-[1.5px] bg-white flex items-center justify-center shadow-md transition-all ${node.type === 'inventory' ? 'rounded-md' :
                node.type === 'process' ? 'rounded-sm' : 'rounded-full'
                } ${
                // Highlight banned nodes
                (state.usStrategy === 'EXPORT_BANS' && (node.id === 'inventory-1' || node.id === 'cn-us-import')) ||
                  (state.chinaStrategy === 'EXPORT_BANS' && node.id === 'inventory-2') ||
                  (state.chinaStrategy === 'EXPORT_BANS' && node.id === 'cn-raw')
                  ? 'border-red-500 border-[3px] animate-pulse bg-red-50'
                  : ''
                }`}
              style={{
                borderColor: (state.usStrategy === 'EXPORT_BANS' && (node.id === 'inventory-1' || node.id === 'cn-us-import')) ||
                  (state.chinaStrategy === 'EXPORT_BANS' && node.id === 'inventory-2') ||
                  (state.chinaStrategy === 'EXPORT_BANS' && node.id === 'cn-raw')
                  ? '#ef4444'
                  : node.color
              }}
            >
              <node.icon className="w-5 h-5" style={{
                color: (state.usStrategy === 'EXPORT_BANS' && (node.id === 'inventory-1' || node.id === 'cn-us-import')) ||
                  (state.chinaStrategy === 'EXPORT_BANS' && node.id === 'inventory-2') ||
                  (state.chinaStrategy === 'EXPORT_BANS' && node.id === 'cn-raw')
                  ? '#ef4444'
                  : node.color
              }} strokeWidth={2.5} />

              {/* Export Ban Badge */}
              {((state.usStrategy === 'EXPORT_BANS' && (node.id === 'inventory-1' || node.id === 'cn-us-import')) ||
                (state.chinaStrategy === 'EXPORT_BANS' && node.id === 'inventory-2') ||
                (state.chinaStrategy === 'EXPORT_BANS' && node.id === 'cn-raw')) && (
                  <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[6px] px-1.5 py-0.5 rounded-full font-black shadow-lg border border-white">
                    BANNED
                  </div>
                )}

              {/* Tariff Warning Triangle */}
              {node.type === 'process' && (
                (flowType === 'US' && (state.chinaStrategy === 'TARIFFS' || state.chinaStrategy === 'EXPORT_BANS')) ||
                (flowType === 'CHINA' && (state.usStrategy === 'TARIFFS' || state.usStrategy === 'EXPORT_BANS'))
              ) && (
                  <div className="absolute -top-8 -right-8 z-20 drop-shadow-sm">
                    <TriangleAlert className="w-6 h-6 fill-[#fab005] text-white" strokeWidth={1.5} />
                  </div>
                )}

              {/* Blockade Icon for Finished Goods (Tariffs & Bans) */}
              {['finished-1', 'finished-2', 'cn-export-1', 'cn-export-2'].includes(node.id) && (
                (flowType === 'US' && (state.chinaStrategy === 'TARIFFS' || state.chinaStrategy === 'EXPORT_BANS')) ||
                (flowType === 'CHINA' && (state.usStrategy === 'TARIFFS' || state.usStrategy === 'EXPORT_BANS'))
              ) && (
                  <div className="absolute -top-7 -right-7 z-20 drop-shadow-sm">
                    <div className="bg-emerald-600 text-white p-0.5 rounded-full border border-white">
                      <ShieldBan className="w-4 h-4" strokeWidth={2} />
                    </div>
                  </div>
                )}





              {/* Red Blinking Alert for Consumer (Impact Warning) */}
              {node.type === 'customer' && (
                (state.usStrategy === 'TARIFFS' || state.usStrategy === 'EXPORT_BANS' || state.chinaStrategy === 'TARIFFS' || state.chinaStrategy === 'EXPORT_BANS')
              ) && (
                  <div className="absolute -top-6 -right-6 z-20 drop-shadow-sm animate-pulse">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-7 h-7 text-red-600"
                    >
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" className="invisible" />
                      <path d="M12 6a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 1 1-3 0v-7A1.5 1.5 0 0 1 12 6Zm0 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
                    </svg>
                  </div>
                )}
            </div>

            {/* Label Card */}
            <div className="bg-white border border-[#dee2e6] rounded-sm px-2 py-0.5 shadow-sm min-w-[60px] text-center">
              <span className="text-[9px] font-bold text-[#495057] whitespace-nowrap">{node.label}</span>
            </div>


          </div>
        ))}
      </div>
    </div>
  );
};
