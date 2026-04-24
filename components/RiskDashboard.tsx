import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Zap, 
  Target, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  Cpu, 
  Factory, 
  Building2, 
  Database,
  Plus,
  Trash2,
  Brain,
  Dna,
  Box,
  ShoppingBag,
  ShieldCheck,
  Search,
  Activity,
  Globe,
  ChevronRight,
  TrendingUp,
  Maximize2,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Edit3,
  Save,
  X,
  PlusCircle,
  RefreshCw,
  Crosshair,
  BarChart3,
  History,
  Info,
  LayoutGrid,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Eye
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MATERIAL_GENEALOGY, ProductTemplate, MaterialNode } from '../constants/material_genealogy';
import { synthesizeProduct } from '../hooks/growth_engine';

// Semantic Palette
const NEURAL_PALETTE: Record<string, string> = {
  'GENESIS': '#339af0',      // Genesis Core
  'ASSEMBLY': '#228be6',     // Assembly Blue
  'SUB_SYSTEM': '#0ca678',   // Cyber Cyan
  'MODULE': '#7950f2',       // Module Purple
  'COMPONENT': '#5c7cfa',    // Slate Indigo
  'PART': '#f59f00',         // Technical Amber
  'ELEMENT': '#f76707'       // Elemental Orange
};


type WizardStep = 'SELECT_SECTOR' | 'DEFINE_PRODUCT' | 'DECONSTRUCTION' | 'NEURAL_MAPPING' | 'FINALIZE_NAME' | 'REPOSITORY' | 'NETWORK_DETAIL' | 'VISION_SCAN';

interface RiskDashboardProps {
  selectedNetworkId: string | null;
  setSelectedNetworkId: (id: string | null) => void;
  selectedComponentId: string | null;
  setSelectedComponentId: (id: string | null) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  isEditMode: boolean;
  networks: any[];
  setNetworks: React.Dispatch<React.SetStateAction<any[]>>;
  onNodeSelected?: (node: any) => void;
  onStepChange?: (step: string | null) => void;
  onGraphStateChange?: (state: { allNodes: any[], viewState: any, setViewState: React.Dispatch<React.SetStateAction<any>> }) => void;
  hiddenCategories?: Set<string>;
}

export const RiskDashboard: React.FC<RiskDashboardProps> = ({
  selectedNetworkId,
  setSelectedNetworkId,
  selectedComponentId,
  setSelectedComponentId,
  selectedNodeId,
  setSelectedNodeId,
  isEditMode,
  networks,
  setNetworks,
  onNodeSelected,
  onStepChange,
  onGraphStateChange,
  hiddenCategories = new Set()
}) => {
  const [step, setStep] = useState<WizardStep>(selectedNetworkId ? 'NETWORK_DETAIL' : (networks.length === 0 ? 'SELECT_SECTOR' : 'GLOBAL_OVERVIEW'));
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const graphContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Canvas State: Zoom & Pan
  const [viewState, setViewState] = useState({ panX: 0, panY: 0, zoom: 0.85 });
  // Live refs — handlers always read current values without re-registering
  const viewStateRef = useRef(viewState);
  useEffect(() => { viewStateRef.current = viewState; }, [viewState]);

  const [isPanning, setIsPanning] = useState(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Dragging State (Node-specific)
  const [dragInfo, setDragInfo] = useState<{ id: string, startPos: { x: number, y: number }, initialOffset: { x: number, y: number } } | null>(null);
  const dragInfoRef = useRef<{ id: string, startPos: { x: number, y: number }, initialOffset: { x: number, y: number } } | null>(null);
  useEffect(() => { dragInfoRef.current = dragInfo; }, [dragInfo]);

  // Trap and handle zooming natively to prevent whole-page zoom
  useEffect(() => {
    const container = graphContainerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
        e.preventDefault();
        const zoomSpeed = e.ctrlKey ? 0.01 : 0.0015;
        const delta = -e.deltaY;
        setViewState(prev => {
            const newZoom = Math.min(Math.max(prev.zoom + delta * zoomSpeed, 0.3), 4);
            return { ...prev, zoom: newZoom };
        });
    };
    
    const updateSize = () => {
        if (graphContainerRef.current) {
            setContainerSize({ 
                width: graphContainerRef.current.clientWidth, 
                height: graphContainerRef.current.clientHeight 
            });
        }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
        container.removeEventListener('wheel', handleNativeWheel);
        window.removeEventListener('resize', updateSize);
    };
  }, [graphContainerRef.current]);

  // Single stable global mouse handler — all runtime values come from refs
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const di = dragInfoRef.current;
      if (di) {
        const zoom = viewStateRef.current.zoom;
        const dx = (e.clientX - di.startPos.x) / zoom;
        const dy = (e.clientY - di.startPos.y) / zoom;
        setNodeAbsolutePosition(di.id, di.initialOffset.x + dx, di.initialOffset.y + dy);
      } else if (isPanningRef.current) {
        setViewState(prev => ({
          ...prev,
          panX: prev.panX + e.movementX / prev.zoom,
          panY: prev.panY + e.movementY / prev.zoom
        }));
      }
    };
    const handleMouseUp = () => {
      dragInfoRef.current = null;
      isPanningRef.current = false;
      setDragInfo(null);
      setIsPanning(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

    const [wizardData, setWizardData] = useState({ sector: '', initialSeed: '', finalName: '' });
    const [activeTemplate, setActiveTemplate] = useState<ProductTemplate | null>(null);
    const [progress, setProgress] = useState(0);

    // Watch for external breadcrumb navigation resetting the network ID
    useEffect(() => {
        if (!selectedNetworkId) {
            // If the network ID is cleared (breadcrumb click), go back to Repository or Initialize
            if (networks.length > 0) {
                // Only reset if we were previously in a detail view or certain wizard steps
                if (step === 'NETWORK_DETAIL' || step === 'FINALIZE_NAME') {
                    setStep('GLOBAL_OVERVIEW');
                }
            } else {
                setStep('SELECT_SECTOR');
            }
        } else if (selectedNetworkId && step === 'GLOBAL_OVERVIEW') {
            setStep('NETWORK_DETAIL');
        }
    }, [selectedNetworkId, networks.length]);

    useEffect(() => {
        if (onStepChange) {
            // If we are in the repository overview, tell App we are not in a wizard
            if (step === 'GLOBAL_OVERVIEW') {
                onStepChange(null);
            } else {
                onStepChange(step);
            }
        }
    }, [step, onStepChange]);

    // Handle Wizard Transitions
    useEffect(() => {
        if (step === 'DECONSTRUCTION') {
            const timer = setTimeout(() => setStep('NEURAL_MAPPING'), 3000);
            return () => clearTimeout(timer);
        }
        if (step === 'NEURAL_MAPPING') {
            const interval = setInterval(() => {
                setProgress(p => {
                    if (p >= 100) {
                        clearInterval(interval);
                        setTimeout(() => setStep('FINALIZE_NAME'), 1000);
                        return 100;
                    }
                    return p + 2;
                });
            }, 30);
            return () => { clearInterval(interval); setProgress(0); };
        }
    }, [step]);
  const selectedNetwork = useMemo(() => networks.find(n => n.id === selectedNetworkId), [networks, selectedNetworkId]);

  // Assign default positions the first time a network is shown
  const getInitialPosition = (nodeId: string, index: number, total: number, layer: number) => {
    const centerX = 400;
    const centerY = 300;
    // Dynamic layer spacing
    const layerSpacing = 800; 
    
    // Densification: Split into columns if many nodes in a layer
    const nodesPerRow = total > 20 ? 3 : (total > 8 ? 2 : 1);
    const colIdx = index % nodesPerRow;
    const rowIdx = Math.floor(index / nodesPerRow);
    const rows = Math.ceil(total / nodesPerRow);

    const xOffset = (colIdx - (nodesPerRow - 1) / 2) * 180;
    const ySpacing = 110; // Guaranteed minimum spacing to prevent overlap
    const yOffset = (rowIdx - (rows - 1) / 2) * ySpacing;

    return { 
        x: centerX + layer * layerSpacing + xOffset, 
        y: centerY + yOffset 
    };
  };


// Hard cap: never render more than this many nodes (prevents browser OOM on huge products)
const MAX_RENDER_NODES = 1500;

    // Flatten and Position ALL nodes — no LOD culling (used for bounding box in Center View)
    const allNodesPositioned = useMemo(() => {
    if (!selectedNetwork) return [];

    interface PositionedNode extends MaterialNode {
        position: { x: number; y: number };
    }

    const layerCounts: Record<number, number> = {};
    const layerIndices: Record<number, number> = {};

    // Pass 1: Global count per layer
    const countLayers = (nodes: any[], layer: number) => {
        layerCounts[layer] = (layerCounts[layer] || 0) + nodes.length;
        nodes.forEach(n => {
            if (n.children && n.children.length > 0) {
                countLayers(n.children, layer + 1);
            }
        });
    };
    countLayers(selectedNetwork.genealogy, 0);

    // Pass 2: Position and Transform
    const transform = (nodes: any[], layer: number): PositionedNode[] => {
        return nodes.map((n) => {
            const globalIdx = layerIndices[layer] || 0;
            layerIndices[layer] = globalIdx + 1;

            const position = n.position || getInitialPosition(n.id, globalIdx, layerCounts[layer], layer);
            const isCollapsed = collapsedNodeIds.has(n.id);

            const countNested = (node: any): number => {
                if (!node.children) return 0;
                return node.children.length + node.children.reduce((acc: number, cur: any) => acc + countNested(cur), 0);
            };

            return {
                ...n,
                position,
                isCollapsed,
                hiddenChildCount: isCollapsed ? countNested(n) : 0,
                children: (n.children && !isCollapsed) ? transform(n.children, layer + 1) : undefined
            };
        });
    };

    const positionedGenealogy = transform(selectedNetwork.genealogy, 0);

    // Pass 3: Flatten — NO LOD filter here
    const flat: any[] = [];
    const walk = (nodes: any[]) => {
        nodes.forEach(n => {
            flat.push(n);
            if (n.children) walk(n.children);
        });
    };
        walk(positionedGenealogy);
        // Hard cap — avoid OOM/crash on huge products
        return flat.length > MAX_RENDER_NODES ? flat.slice(0, MAX_RENDER_NODES) : flat;
    }, [selectedNetwork, collapsedNodeIds]);


  // LOD-filtered view — only nodes inside the current viewport (for rendering performance) + category filter
  const allNodes = useMemo(() => {
    // For very large graphs, use a tighter buffer to keep the render list small
    const buffer = allNodesPositioned.length > 500 ? 120 : 300;
    return allNodesPositioned.filter(node => {
        if (hiddenCategories.size > 0 && hiddenCategories.has(node.category || 'COMPONENT')) return false;
        const x = (node.position.x + viewState.panX) * viewState.zoom;
        const y = (node.position.y + viewState.panY) * viewState.zoom;
        return (
            x > -buffer &&
            x < containerSize.width + buffer &&
            y > -buffer &&
            y < containerSize.height + buffer
        );
    });
  }, [allNodesPositioned, containerSize, viewState.zoom, viewState.panX, viewState.panY, hiddenCategories]);

  // Expose allNodes + viewState to parent (for sidebar legend/minimap)
  useEffect(() => {
    if (onGraphStateChange) {
      onGraphStateChange({ allNodes: allNodesPositioned, viewState, setViewState });
    }
  }, [allNodesPositioned, viewState, onGraphStateChange]);

  // Auto-fit to full horizontal view whenever a new network is selected
  const lastFittedNetworkId = useRef<string | null>(null);
  useEffect(() => {
    if (
      !allNodesPositioned.length ||
      !graphContainerRef.current ||
      containerSize.width === 0 ||
      selectedNetworkId === lastFittedNetworkId.current
    ) return;

    lastFittedNetworkId.current = selectedNetworkId;

    const xs = allNodesPositioned.map((n: any) => n.position.x);
    const ys = allNodesPositioned.map((n: any) => n.position.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const graphW = maxX - minX + 220; // node width padding
    const graphH = maxY - minY + 180; // node height padding

    const cW = containerSize.width;
    const cH = containerSize.height;

    // Fit zoom so the full graph fills the viewport horizontally (with some margin)
    const zoomX = (cW * 0.88) / graphW;
    const zoomY = (cH * 0.82) / graphH;
    const zoom = Math.min(Math.max(Math.min(zoomX, zoomY), 0.08), 1.2);

    // Center the graph in the canvas
    const panX = (cW / zoom - graphW) / 2 - minX + 110;
    const panY = (cH / zoom - graphH) / 2 - minY + 90;

    setViewState({ panX, panY, zoom });
  }, [allNodesPositioned, containerSize, selectedNetworkId]);


  // Path Highlighting Logic: Identify all ancestors and descendants of a hovered node
  const pathNodeIds = useMemo(() => {
    if (!hoveredNodeId || !allNodes.length) return new Set<string>();
    
    const activeIds = new Set<string>([hoveredNodeId]);
    
    // Find ancestors (walk up)
    const findAncestors = (targetId: string) => {
        allNodes.forEach(node => {
            if (node.children?.some((c: any) => c.id === targetId)) {
                activeIds.add(node.id);
                findAncestors(node.id);
            }
        });
    };
    
    // Find descendants (walk down)
    const findDescendants = (node: any) => {
        if (node.children) {
            node.children.forEach((child: any) => {
                activeIds.add(child.id);
                findDescendants(child);
            });
        }
    };

    const hoveredNode = allNodes.find(n => n.id === hoveredNodeId);
    if (hoveredNode) {
        findAncestors(hoveredNodeId);
        findDescendants(hoveredNode);
    }
    
    return activeIds;
  }, [hoveredNodeId, allNodes]);


  const setNodeAbsolutePosition = (nodeId: string, x: number, y: number) => {
    setNetworks(prev => prev.map(net => {
      if (net.id !== selectedNetworkId) return net;
      const move = (nodes: MaterialNode[]): MaterialNode[] =>
        nodes.map(n => {
          if (n.id === nodeId) return { ...n, position: { x, y } };
          if (n.children) return { ...n, children: move(n.children) };
          return n;
        });
      return { ...net, genealogy: move(net.genealogy) };
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const isNode = (e.target as HTMLElement).closest('.group\\/node');
    if (!isNode) {
        isPanningRef.current = true;
        setIsPanning(true);
    }
  };

  // Discovery Animations logic omitted for brevity
  const addNetwork = () => {
    const newNet = { id: Math.random().toString(36).substr(2, 9), name: wizardData.finalName || wizardData.initialSeed, sector: wizardData.sector, createdAt: new Date().toISOString().split('T')[0], riskScore: 50, genealogy: JSON.parse(JSON.stringify(activeTemplate?.genealogy || [])) };
    setNetworks(prev => [newNet, ...prev]);
    setStep('NETWORK_DETAIL');
    setSelectedNetworkId(newNet.id);
  };

  const deleteNode = (nodeId: string) => {
    setNetworks(prev => prev.map(net => {
      if (net.id === selectedNetworkId) {
        return { ...net, genealogy: net.genealogy.filter((c: any) => c.id !== nodeId).map((c: any) => ({ ...c, children: c.children?.filter((m: any) => m.id !== nodeId) })) };
      }
      return net;
    }));
  };

  return (
    <div 
        className={`flex-1 flex flex-col h-full bg-white relative overflow-hidden font-sans transition-colors ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`} 
        onMouseDown={handleMouseDown}
    >
        {step === 'NETWORK_DETAIL' && selectedNetwork ? (
            <div ref={graphContainerRef} className="flex-1 bg-white relative overflow-hidden group/graph">
                {/* SVG always outside transform - reads screen-space getBoundingClientRect */}
                <NeuralCanvasSynapses 
                    allNodes={allNodes} 
                    viewState={viewState}
                    hoveredNodeId={hoveredNodeId}
                    pathNodeIds={pathNodeIds}
                />

                <div className="absolute top-6 left-6 z-40 flex items-center gap-3">

                    <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedNetworkId(null); setStep('GLOBAL_OVERVIEW'); }}
                        className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded shadow-sm text-[10px] font-black uppercase tracking-widest hover:border-blue-400 hover:text-blue-600 transition-all flex items-center gap-2 group"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        Repository
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!allNodesPositioned.length || !graphContainerRef.current) {
                                setViewState({ panX: 0, panY: 0, zoom: 0.65 });
                                return;
                            }
                            const ys = allNodesPositioned.map((n: any) => n.position.y);
                            const minX = Math.min(...allNodesPositioned.map((n: any) => n.position.x));
                            const graphMidY = (Math.min(...ys) + Math.max(...ys)) / 2;
                            const cW = graphContainerRef.current.clientWidth;
                            const cH = graphContainerRef.current.clientHeight;
                            // Fixed readable zoom — graph is too wide to ever "fit" horizontally
                            const zoom = 0.65;
                            // Pin genesis (leftmost) at 20% from left, centre Y
                            const panX = (cW * 0.2 / zoom) - minX;
                            const panY = (cH / 2 / zoom) - graphMidY;
                            setViewState({ panX, panY, zoom });
                        }}
                        className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded shadow-sm text-[10px] font-black uppercase tracking-widest hover:border-blue-400 hover:text-blue-600 transition-all flex items-center gap-2 group"
                    >
                        <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        Center View
                    </button>
                    </div>

                    {/* Truncation warning banner for very large products */}
                    {allNodesPositioned.length >= MAX_RENDER_NODES && (
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 shadow-sm">
                            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-amber-700">
                                Rendering top {MAX_RENDER_NODES.toLocaleString()} nodes — use filters to explore specific tiers
                            </span>
                        </div>
                    )}

                {/* Free-form canvas: all nodes are absolutely positioned */}
                <div 
                    className="absolute inset-0"
                    style={{ 
                        transformOrigin: '0 0',
                        transform: `scale(${viewState.zoom}) translate(${viewState.panX}px, ${viewState.panY}px)`
                    }}
                >
                    {/* Background Depth Lanes */}
                    <div className="absolute inset-0 pointer-events-none opacity-20">
                        {['GENESIS', 'ASSEMBLY', 'SUB_SYSTEM', 'MODULE', 'COMPONENT', 'PART', 'ELEMENT'].map((label, i) => {
                            const x = 400 + i * 800;
                            return (
                                <div key={label} className="absolute inset-y-0" style={{ left: x, width: '1px', borderLeft: '2px dashed #cbd5e1' }}>
                                    <div className="absolute top-[10%] left-4 whitespace-nowrap">
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 rotate-90 origin-left block opacity-40">
                                            {label.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {allNodes.map((node: any) => {
                        const pos = node.position || { x: 200, y: 200 };
                        const isParent = selectedNetwork.genealogy.some((c: any) => c.id === node.id);
                        const isInFocusPath = hoveredNodeId ? pathNodeIds.has(node.id) : true;
                        
                        return (
                            <div
                                key={node.id}
                                style={{ 
                                    position: 'absolute', 
                                    left: pos.x, 
                                    top: pos.y, 
                                    transform: 'translate(-50%, -50%)',
                                    opacity: isInFocusPath ? 1 : 0.15,
                                    zIndex: isInFocusPath ? 40 : 10,
                                    transition: 'opacity 0.4s ease, transform 0.3s ease'
                                }}
                                onMouseEnter={() => setHoveredNodeId(node.id)}
                                onMouseLeave={() => setHoveredNodeId(null)}
                            >
                                <NeuralDrillCard
                                    ref={(el: any) => nodeRefs.current[node.id] = el}
                                    comp={node}
                                    isActive={selectedNodeId === node.id || selectedComponentId === node.id}
                                    isEditMode={isEditMode}
                                    palette={NEURAL_PALETTE}
                                    onClick={() => { 
                                        setSelectedNodeId(node.id); 
                                        if (isParent) setSelectedComponentId(node.id);
                                        if (onNodeSelected) onNodeSelected(node);
                                    }}
                                    onToggleCollapse={() => {
                                        setCollapsedNodeIds(prev => {
                                            const next = new Set(prev);
                                            if (next.has(node.id)) next.delete(node.id);
                                            else next.add(node.id);
                                            return next;
                                        });
                                    }}
                                    onDelete={() => deleteNode(node.id)}
                                    onDragStart={(e: any) => {
                                        e.stopPropagation();
                                        const info = { 
                                            id: node.id, 
                                            startPos: { x: e.clientX, y: e.clientY }, 
                                            initialOffset: pos
                                        };
                                        dragInfoRef.current = info;
                                        setDragInfo(info);
                                    }}
                                />
                            </div>
                        );
                    })}

                </div>
            </div>
        ) : step === 'GLOBAL_OVERVIEW' ? (
             <div className="flex-1 p-10 bg-[#f8f9fa] overflow-y-auto w-full h-full">
                <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between pb-6 border-b-2 border-slate-200 border-dashed">
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-widest text-[#1c1e21]">Global Architect Repository</h2>
                            <p className="text-sm text-slate-500 font-medium mt-2">Macro-level intelligence index of all operational neural networks.</p>
                        </div>
                        <button onClick={() => setStep('SELECT_SECTOR')} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 hover:shadow-md transition-all"><Plus className="w-3.5 h-3.5"/> Initialize New Stack</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {networks.map(net => (
                            <div key={net.id} onClick={() => { setSelectedNetworkId(net.id); setStep('NETWORK_DETAIL'); }} className="bg-white border-2 border-slate-200 rounded-xl p-5 cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all duration-300 group relative">
                                <button onClick={(e) => { e.stopPropagation(); setNetworks(prev => prev.filter(n => n.id !== net.id)); }} className="absolute top-4 right-4 p-1.5 bg-red-50 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"><Trash2 className="w-3.5 h-3.5" /></button>
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-lg flex items-center justify-center mb-3 text-blue-600 group-hover:scale-110 transition-transform duration-500"><Database className="w-4 h-4" /></div>
                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-1.5">{net.name}</h3>
                                <div className="flex items-center gap-1.5 mb-4">
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[8px] font-black uppercase tracking-widest">{net.sector.replace('_', ' ')}</span>
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black uppercase tracking-widest">Active Sim</span>
                                </div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between pt-4 border-t border-slate-100">
                                    <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-slate-300"/> {net.createdAt}</span>
                                    <span className="flex items-center gap-1.5 text-blue-500"><Layers className="w-3 h-3 text-blue-300"/> {(net.genealogy?.length || 0) + (net.genealogy?.reduce((acc: number, cur: any) => acc + (cur.children?.length || 0), 0) || 0)} Nodes</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
        ) : (
             <div className="h-full w-full flex items-center justify-center">
                 <button onClick={() => setStep('SELECT_SECTOR')} className="p-10 border-2 border-dashed border-[#f1f3f5] rounded-2xl flex flex-col items-center gap-4 hover:border-blue-400 transition-all">
                    <Database className="w-10 h-10 text-slate-200" />
                    <span className="text-[12px] font-black uppercase tracking-widest text-[#adb5bd]">Initialize_Neural_Stack</span>
                 </button>
             </div>
        )}

        {/* Discovery Overlay (Maintained) */}
        {['SELECT_SECTOR', 'DEFINE_PRODUCT', 'DECONSTRUCTION', 'NEURAL_MAPPING', 'FINALIZE_NAME'].includes(step) && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#f8f9fa] overflow-hidden">
                {/* Subtle tech background grid pattern */}
                <div className="absolute inset-0 opacity-[0.3]" style={{ backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>
                
                <div className="w-full max-w-7xl px-8 font-sans relative z-10">
                    <button onClick={() => setStep(selectedNetworkId ? 'NETWORK_DETAIL' : 'GLOBAL_OVERVIEW')} className="absolute -top-32 right-0 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded shadow-sm text-[10px] font-black uppercase tracking-widest hover:border-blue-400 hover:text-blue-600 transition-all flex items-center gap-2 group">
                        <X className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        Abort Sequence
                    </button>

                    {step === 'SELECT_SECTOR' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-2xl mx-auto">
                            <div className="text-center space-y-4">
                                <h2 className="text-3xl font-black text-[#1c1e21] uppercase tracking-[0.2em]">Neural Architect</h2>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Type a product name, strategic code, or upload visual DNA.</p>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="relative group flex items-center">
                                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                        <Search className="w-6 h-6 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input 
                                        autoFocus
                                        type="text" 
                                        placeholder="Product Name or Product Code..." 
                                        className="w-full bg-white border-2 border-slate-200 rounded-2xl py-6 pl-16 pr-24 text-xl font-black outline-none focus:border-blue-500 focus:shadow-2xl focus:shadow-blue-500/10 transition-all placeholder:text-slate-300"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                                                const res = synthesizeProduct((e.target as HTMLInputElement).value);
                                                setActiveTemplate(res.template);
                                                setWizardData(prev => ({ ...prev, sector: res.industry, initialSeed: (e.target as HTMLInputElement).value }));
                                                setStep('DECONSTRUCTION');
                                            }
                                        }}
                                    />
                                    <button 
                                        onClick={() => {
                                            const input = document.querySelector('input[placeholder="Product Name or Product Code..."]') as HTMLInputElement;
                                            if (input && input.value) {
                                                const res = synthesizeProduct(input.value);
                                                setActiveTemplate(res.template);
                                                setWizardData(prev => ({ ...prev, sector: res.industry, initialSeed: input.value }));
                                                setStep('DECONSTRUCTION');
                                            }
                                        }}
                                        className="absolute right-3 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 group/btn shadow-lg shadow-blue-500/20 active:scale-95"
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest leading-none mr-2">Architect</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-white hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group">
                                        <input type="file" className="hidden" onChange={() => { setStep('VISION_SCAN'); setTimeout(() => {
                                            const res = synthesizeProduct('Visual Reconstruction', true);
                                            setActiveTemplate(res.template);
                                            setWizardData(prev => ({ ...prev, sector: res.industry, initialSeed: 'Visual DNA Scan' }));
                                            setStep('DECONSTRUCTION');
                                        }, 2500); }} />
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-100 transition-all">
                                            <ImageIcon className="w-6 h-6" />
                                        </div>
                                        <div className="text-center">
                                            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-800">Upload Visual DNA</span>
                                            <span className="block text-[8px] font-bold uppercase tracking-tighter text-slate-400 mt-1">Schematics / CAD / Photo</span>
                                        </div>
                                    </label>

                                    <div className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-slate-200 rounded-2xl bg-slate-50/50 opacity-60 cursor-not-allowed">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300">
                                            <LinkIcon className="w-6 h-6" />
                                        </div>
                                        <div className="text-center">
                                            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Import from URL</span>
                                            <span className="block text-[8px] font-bold uppercase tracking-tighter text-slate-300 mt-1">Direct ERP/MRP Sync</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {step === 'VISION_SCAN' && (
                        <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
                            <div className="relative w-64 h-64">
                                <div className="absolute inset-0 border-4 border-blue-500 rounded-2xl animate-[ping_3s_infinite] opacity-20"></div>
                                <div className="absolute inset-0 border-2 border-blue-100 rounded-2xl"></div>
                                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-[scan_2s_infinite] shadow-[0_0_15px_#3b82f6]"></div>
                                <div className="h-full flex items-center justify-center text-blue-500">
                                    <ImageIcon className="w-20 h-20 opacity-20" />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-black text-[#1c1e21] uppercase tracking-[0.2em] animate-pulse">Analyzing Visual DNA</h3>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Deconstructing geometry into material clusters...</p>
                            </div>
                            <style dangerouslySetInnerHTML={{ __html: `@keyframes scan { 0% { top: 0% } 50% { top: 100% } 100% { top: 0% } }` }} />
                        </div>
                    )}

                    {step === 'DECONSTRUCTION' && <DeconstructionView template={activeTemplate} />}
                    {step === 'NEURAL_MAPPING' && <NeuralMappingView progress={progress} template={activeTemplate} />}
                    {step === 'FINALIZE_NAME' && (
                        <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700 max-w-4xl mx-auto flex flex-col items-center">
                            <div className="text-center space-y-4">
                                <h3 className="text-5xl font-black text-[#1c1e21] tracking-[0.2em] uppercase drop-shadow-sm italic">Commit_Stack</h3>
                                <p className="text-slate-500 font-medium uppercase tracking-widest text-[11px]">Finalize the network nomenclature for global indexing.</p>
                            </div>
                            <div className="relative w-full max-w-3xl">
                                <input autoFocus type="text" placeholder="e.g. Project Starship // Alpha" className="w-full bg-white/90 backdrop-blur border-2 border-slate-200 rounded-2xl py-8 px-12 text-[32px] font-black outline-none focus:border-blue-500 focus:shadow-2xl focus:shadow-blue-500/10 text-center transition-all placeholder:text-slate-300" value={wizardData.finalName} onChange={(e) => setWizardData(prev => ({ ...prev, finalName: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && addNetwork()} />
                            </div>
                            <button onClick={addNetwork} className="px-10 py-4 bg-blue-600 text-white rounded-full font-black text-[12px] uppercase tracking-[0.3em] hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-500/20 transition-all flex items-center gap-3 active:scale-95 group">
                                <CheckCircle2 className="w-5 h-5" />
                                Deploy To Repository
                            </button>
                        </div>
                    )}
                    {step === 'DEFINE_PRODUCT' && (
                        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700 max-w-4xl mx-auto flex flex-col items-center">
                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-black text-[#1c1e21] tracking-[0.2em] uppercase drop-shadow-sm">Seed Entity DNA</h3>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Define the fundamental nomenclature of the primary node.</p>
                            </div>
                            <div className="relative w-full max-w-xl">
                                <input 
                                    autoFocus 
                                    type="text" 
                                    placeholder="e.g. SpaceX Starship, Custom Drone..." 
                                    className="w-full bg-white/90 backdrop-blur border-2 border-slate-200 rounded-xl py-4 px-8 text-xl font-black outline-none focus:border-blue-500 focus:shadow-2xl focus:shadow-blue-500/10 text-center transition-all placeholder:text-slate-300" 
                                    value={wizardData.initialSeed} 
                                    onChange={(e) => setWizardData(prev => ({ ...prev, initialSeed: e.target.value }))} 
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && wizardData.initialSeed.trim()) {
                                            const res = synthesizeProduct(wizardData.initialSeed);
                                            setActiveTemplate(res.template);
                                            setWizardData(prev => ({ ...prev, sector: res.industry, initialSeed: wizardData.initialSeed }));
                                            setStep('DECONSTRUCTION');
                                        }
                                    }} 
                                />
                                <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Initialize Growth</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

// --- Sub-Components ---

/**
 * NeuralCanvasSynapses: High-performance canvas-based edge rendering
 * Supports LOD coloring and Bezier edge bundling.
 */
export const NeuralCanvasSynapses: React.FC<{ 
    allNodes: any[], 
    viewState: any, 
    hoveredNodeId: string | null,
    pathNodeIds: Set<string>
}> = ({ allNodes, viewState, hoveredNodeId, pathNodeIds }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.parentElement?.clientWidth ? canvas.parentElement.clientWidth * dpr : 0;
        canvas.height = canvas.parentElement?.clientHeight ? canvas.parentElement.clientHeight * dpr : 0;
        ctx.scale(dpr, dpr);

        const { zoom, panX, panY } = viewState;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Skip synapse drawing for very large graphs — canvas loop is O(n²) and kills framerate
        if (allNodes.length > 400) return;

        // Two-pass rendering: draw dim context edges first, bright focus edges on top
        const isFiltering = !!hoveredNodeId;

        // PASS 1 — Context: all edges as a subtle ambient texture
        ctx.setLineDash([]);

        allNodes.forEach(parent => {
            if (!parent.children) return;
            parent.children.forEach((child: any) => {
                const target = allNodes.find((n: any) => n.id === child.id);
                if (!target) return;

                const inPath = isFiltering
                    ? (pathNodeIds.has(parent.id) && pathNodeIds.has(target.id))
                    : false;
                if (inPath) return; // skip — will be drawn in pass 2

                const sX = (parent.position.x + panX) * zoom;
                const sY = (parent.position.y + panY) * zoom;
                const eX = (target.position.x + panX) * zoom;
                const eY = (target.position.y + panY) * zoom;
                const midX = (sX + eX) / 2;

                ctx.beginPath();
                ctx.moveTo(sX, sY);
                ctx.bezierCurveTo(midX, sY, midX, eY, eX, eY);
                // When in focus mode, crush unrelated edges to near-invisible
                ctx.globalAlpha = isFiltering ? 0.03 : 0.18;
                ctx.strokeStyle = '#94a3b8';
                ctx.lineWidth = 1.0;
                ctx.stroke();
            });
        });

        // PASS 2 — Focus: active lineage pops on top
        if (isFiltering) {
            ctx.setLineDash([]);
            allNodes.forEach(parent => {
                if (!parent.children) return;
                parent.children.forEach((child: any) => {
                    const target = allNodes.find((n: any) => n.id === child.id);
                    if (!target) return;
                    if (!pathNodeIds.has(parent.id) || !pathNodeIds.has(target.id)) return;

                    const sX = (parent.position.x + panX) * zoom;
                    const sY = (parent.position.y + panY) * zoom;
                    const eX = (target.position.x + panX) * zoom;
                    const eY = (target.position.y + panY) * zoom;
                    const midX = (sX + eX) / 2;

                    // Glow effect: draw a thick soft glow underneath
                    ctx.beginPath();
                    ctx.moveTo(sX, sY);
                    ctx.bezierCurveTo(midX, sY, midX, eY, eX, eY);
                    ctx.strokeStyle = '#93c5fd';
                    ctx.lineWidth = 6;
                    ctx.globalAlpha = 0.25;
                    ctx.stroke();

                    // Sharp bright line on top
                    ctx.beginPath();
                    ctx.moveTo(sX, sY);
                    ctx.bezierCurveTo(midX, sY, midX, eY, eX, eY);
                    ctx.strokeStyle = '#2563eb';
                    ctx.lineWidth = 2.0;
                    ctx.globalAlpha = 0.95;
                    ctx.stroke();
                });
            });
        }
    }, [allNodes, viewState, hoveredNodeId, pathNodeIds]);

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 pointer-events-none z-0" 
            style={{ width: '100%', height: '100%' }} 
        />
    );
};

export const NeuralDrillCard = React.forwardRef<HTMLDivElement, any>(({ comp, isActive, isEditMode, palette, onClick, onToggleCollapse, onDelete, onDragStart }, ref) => {
    const nodeType = comp.category || 'COMPONENT';
    // Use the palette color directly — same source as the minimap — so both views always match
    const color = palette?.[nodeType] || '#adb5bd';

    // Visual Encoding: Size based on Price
    const sizeScale = comp.basePrice ? Math.min(1.4, Math.max(0.85, (comp.basePrice / 2000) + 0.5)) : 1;

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDragStart(e, comp.position || { x: 0, y: 0 });
    };

    return (
        <div 
          ref={ref} 
          onClick={onClick} 
          onMouseDown={handleMouseDown}
          onDoubleClick={(e) => { e.stopPropagation(); onToggleCollapse?.(); }}
          className={`flex flex-col items-center gap-1.5 cursor-grab active:cursor-grabbing transition-all duration-300 group/node relative 
            ${isActive ? 'scale-110 z-30' : 'opacity-75 hover:opacity-100'}`}
          style={{ transform: `scale(${sizeScale})` }}
        >
            {isEditMode && <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="absolute -top-3 -right-3 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white z-40 transition-transform hover:rotate-90"><Plus className="w-3.5 h-3.5 rotate-45" /></button>}

            {/* Collapse Badge */}
            {comp.hiddenChildCount > 0 && (
                <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-blue-600 text-white text-[8px] font-black rounded-full border-2 border-white shadow-md animate-in zoom-in-50">
                    → {comp.hiddenChildCount}
                </div>
            )}

            {/* Icon Box */}
            <div className={`w-8 h-8 flex items-center justify-center rounded-sm bg-white shadow-sm border transition-all duration-300 
                ${isActive ? 'shadow-xl border-blue-500 scale-105' : 'border-slate-200'}`}
                style={{ borderColor: isActive ? undefined : color, backgroundColor: comp.isCollapsed ? '#f1f3f5' : 'white' }}
            >
                {nodeType === 'RAW_MATERIAL' ? <Database className="w-4 h-4" style={{ color }} /> : <Layers className="w-4 h-4" style={{ color }} />}
            </div>

            {/* Label Box - Revealed on Hover or Active */}
            <div className={`px-2.5 py-1.5 bg-white/90 backdrop-blur-sm border rounded-sm shadow-sm text-center transition-all duration-300 
                ${isActive ? 'border-blue-500 opacity-100 translate-y-0' : 'border-slate-100 opacity-0 group-hover/node:opacity-100 group-hover/node:-translate-y-1'}`}
            >
                <div className={`text-[8px] font-black tracking-widest truncate max-w-[100px] mb-0.5 ${nodeType === 'COMPONENT' ? 'uppercase text-[#1c1e21]' : 'capitalize text-slate-600'}`}>
                    {comp.name}
                </div>
                {comp.basePrice && (
                    <div className="text-[9px] font-black text-blue-600 font-mono">
                        ${((comp.basePrice || 100) * (1 + (comp.riskScore / 100))).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                )}
            </div>
        </div>
    );
});

export const SupplyChainLegend = ({
    inline = false,
    hiddenCategories,
    onToggleCategory,
    availableCategories
}: {
    inline?: boolean;
    hiddenCategories?: Set<string>;
    onToggleCategory?: (category: string) => void;
    availableCategories?: Set<string> | null;
}) => {
    const isFilterable = !!onToggleCategory;
    const ALL_LEGEND_ITEMS = [
        { label: 'Origin Genesis', category: 'GENESIS', icon: Dna },
        { label: 'Neural Assembly', category: 'ASSEMBLY', icon: Target },
        { label: 'Sub-System Logic', category: 'SUB_SYSTEM', icon: Cpu },
        { label: 'Neural Module', category: 'MODULE', icon: Zap },
        { label: 'Critical Component', category: 'COMPONENT', icon: Layers },
        { label: 'Modular Part', category: 'PART', icon: Box },
        { label: 'Elemental Material', category: 'ELEMENT', icon: Database }
    ];

    const LEGEND_ITEMS = availableCategories
        ? ALL_LEGEND_ITEMS.filter(item => availableCategories.has(item.category))
        : ALL_LEGEND_ITEMS;

    return (
        <div className={`${inline ? '' : 'absolute bottom-6 right-6 z-20 animate-in fade-in slide-in-from-right-4 duration-1000'} bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-4 shadow-xl`}>
            {!inline && (
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-2">
                    <LayoutGrid className="w-3 h-3" />
                    Architect Legend
                </div>
            )}
            {isFilterable && (
                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                    <Eye className="w-2.5 h-2.5" />
                    Click to filter canvas
                </div>
            )}
            <div className="space-y-1.5">
                {LEGEND_ITEMS.map((item) => {
                    const isHidden = hiddenCategories?.has(item.category) ?? false;
                    const color = NEURAL_PALETTE[item.category];
                    return (
                        <div
                            key={item.category}
                            onClick={() => onToggleCategory?.(item.category)}
                            className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-all duration-200 ${
                                isFilterable
                                    ? 'cursor-pointer hover:bg-slate-50 active:scale-[0.98] select-none'
                                    : ''
                            } ${isHidden ? 'opacity-35' : 'opacity-100'}`}
                        >
                            <div
                                className="w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-all duration-200"
                                style={{
                                    borderColor: isHidden ? '#cbd5e1' : color,
                                    backgroundColor: isHidden ? '#f8f9fa' : 'transparent'
                                }}
                            >
                                <item.icon
                                    className="w-3 h-3 transition-colors duration-200"
                                    style={{ color: isHidden ? '#94a3b8' : color }}
                                />
                                {isHidden && (
                                    <div className="absolute w-6 h-6 flex items-center justify-center pointer-events-none">
                                        <div className="w-4 h-px bg-slate-400 rotate-45 absolute" />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col flex-1">
                                <span className={`text-[10px] font-black uppercase tracking-tight leading-none transition-colors duration-200 ${
                                    isHidden ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-900'
                                }`}>
                                    {item.label}
                                </span>
                                <span className="text-[8px] font-bold text-slate-400 capitalize">
                                    {item.category.toLowerCase().replace('_', ' ')}
                                </span>
                            </div>
                            {isFilterable && (
                                <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-all duration-200 ${
                                    isHidden
                                        ? 'border-slate-300 bg-white'
                                        : 'border-blue-500 bg-blue-500'
                                }`}>
                                    {!isHidden && (
                                        <svg viewBox="0 0 10 10" className="w-full h-full text-white p-px">
                                            <polyline points="1.5,5 4,7.5 8.5,2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                <div className="pt-2 mt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2.5 px-2">
                        <div className="w-6 flex justify-center">
                            <div className="w-4 h-px bg-blue-500 border-t-2 border-blue-500" />
                        </div>
                        <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest">Active Focus Path</span>
                    </div>
                </div>
            </div>
        </div>
    );
};


export const NeuralMiniMap: React.FC<{ allNodes: any[], viewState: any, setViewState: any }> = ({ allNodes, viewState, setViewState }) => {
    const miniSize = 180;
    const padding = 20;
    const miniRef = useRef<HTMLDivElement>(null);
    const isDraggingMini = useRef(false);
    const didDrag = useRef(false);

    const bounds = useMemo(() => {
        if (!allNodes.length) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        allNodes.forEach(n => {
            const x = n.position?.x || 0;
            const y = n.position?.y || 0;
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        });
        return { minX: minX - 100, maxX: maxX + 100, minY: minY - 100, maxY: maxY + 100 };
    }, [allNodes]);

    const scale = Math.min((miniSize - padding * 2) / (bounds.maxX - bounds.minX), (miniSize - padding * 2) / (bounds.maxY - bounds.minY));
    const getMiniX = (x: number) => padding + (x - bounds.minX) * scale;
    const getMiniY = (y: number) => padding + (y - bounds.minY) * scale;

    const navigateTo = (clientX: number, clientY: number) => {
        if (!miniRef.current) return;
        const rect = miniRef.current.getBoundingClientRect();
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;
        const targetX = bounds.minX + (mouseX - padding) / scale;
        const targetY = bounds.minY + (mouseY - padding) / scale;
        setViewState((prev: any) => ({
            ...prev,
            panX: (400 / prev.zoom) - targetX,
            panY: (300 / prev.zoom) - targetY
        }));
    };

    // Stable global drag listeners for the minimap
    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!isDraggingMini.current) return;
            didDrag.current = true;
            navigateTo(e.clientX, e.clientY);
        };
        const onUp = () => { isDraggingMini.current = false; };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bounds, scale]);

    return (
        <div 
            ref={miniRef}
            className="relative w-full h-[160px] bg-white/80 backdrop-blur-md overflow-hidden cursor-crosshair select-none"
            onMouseDown={(e) => {
                e.preventDefault();
                isDraggingMini.current = true;
                didDrag.current = false;
                navigateTo(e.clientX, e.clientY);
            }}
        >
            <div className="absolute top-2 left-3 text-[8px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">Neural Radar</div>
            <svg width={miniSize} height={miniSize} className="opacity-60">
                {/* Connections */}
                {allNodes.flatMap(parent => (parent.children || []).map((child: any) => {
                    const c = allNodes.find(n => n.id === child.id);
                    if (!c) return null;
                    return (
                        <line 
                            key={`${parent.id}-${child.id}`}
                            x1={getMiniX(parent.position?.x)} y1={getMiniY(parent.position?.y)}
                            x2={getMiniX(c.position?.x)} y2={getMiniY(c.position?.y)}
                            stroke="#cbd5e1" strokeWidth="0.5"
                        />
                    );
                }))}
                {/* Nodes */}
                {allNodes.map(n => (
                    <circle 
                        key={n.id} 
                        cx={getMiniX(n.position?.x)} cy={getMiniY(n.position?.y)} 
                        r="1.5" fill={NEURAL_PALETTE[n.category] || '#94a3b8'} 
                    />
                ))}
            </svg>
            {/* Viewport Frame */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div 
                    className="absolute border border-blue-500 bg-blue-500/5 transition-all duration-75"
                    style={{
                        left: getMiniX(-viewState.panX),
                        top: getMiniY(-viewState.panY),
                        width: Math.max(10, (1200 / viewState.zoom) * scale),
                        height: Math.max(10, (900 / viewState.zoom) * scale)
                    }}
                />
            </div>
            <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 opacity-40"></div>
        </div>
    );
};


export const MaterialTrendChart: React.FC<{ risk: number }> = ({ risk }) => {
    const data = useMemo(() => {
        const points = []; let actual = 50; 
        for (let i = 0; i < 40; i++) { actual += (Math.random() - 0.5) * (risk / 10); points.push({ time: i, actual, predicted: actual + (Math.sin(i * 0.3) * (risk / 15)) + (Math.random() * 2) }); }
        return points;
    }, [risk]);
    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 0, right: 0, left: -40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f5" opacity={0.6} /><XAxis dataKey="time" hide /><YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                    <Tooltip contentStyle={{ fontSize: '9px', fontWeight: 'bold', borderRadius: '4px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }} />
                    <Area type="monotone" dataKey="actual" stroke="#1c7ed6" strokeWidth={2.5} fillOpacity={0.03} fill="#1c7ed6" name="Actual Trace" />
                    <Area type="monotone" dataKey="predicted" stroke="#f76707" strokeWidth={1} strokeDasharray="3 3" fill="none" name="Neural Forecast" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

const DeconstructionView: React.FC<{ template: ProductTemplate | null }> = ({ template }) => {
    if (!template) return null;
    
    // Flatten for animation
    const flatItems = useMemo(() => {
        const items: any[] = [];
        const walk = (nodes: any[]) => {
            nodes.forEach(n => {
                items.push(n);
                if (n.children) walk(n.children);
            });
        };
        walk(template.genealogy);
        return items;
    }, [template]);

    return (
        <div className="flex-1 flex flex-col items-center justify-center w-full relative">
            <h3 className="text-2xl font-black text-[#1c1e21] absolute top-10 uppercase tracking-widest">Neural <span className="text-blue-500">Deconstruct</span></h3>
            <div className="relative w-[600px] h-[600px] flex items-center justify-center">
                <div className="absolute w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-2xl border-4 border-blue-500 z-20"><Box className="w-10 h-10 text-blue-600 animate-pulse" /></div>
                {flatItems.slice(0, 150).map((comp, i) => { // Cap display for animation perf but still look massive
                    const angle = (i * 360) / Math.min(flatItems.length, 150); 
                    const radius = 180 + (i % 3) * 60; // Dynamic layers
                    return (
                        <div key={i} className="absolute opacity-0 animate-[burst_3.5s_forwards]" style={{ animationDelay: `${0.2 + (i * 0.02)}s`, '--angle': `${angle}deg`, '--radius': `${radius}px` } as any}>
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-10 h-10 bg-white border-2 border-slate-100 rounded-lg flex items-center justify-center shadow-sm">
                                    {comp.category === 'COMPONENT' ? <Layers className="w-4 h-4 text-blue-500" /> : <Database className="w-4 h-4 text-orange-500" />}
                                </div>
                                <span className="text-[7px] font-black text-slate-800 uppercase tracking-tighter whitespace-nowrap bg-white/80 px-1 rounded">{comp.name}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
            <style dangerouslySetInnerHTML={{ __html: `@keyframes burst { 0% { transform: rotate(var(--angle)) translate(0) scale(0); opacity: 0; } 20% { opacity: 1; } 100% { transform: rotate(var(--angle)) translate(var(--radius)) rotate(calc(-1 * var(--angle))) scale(1); opacity: 1; } }`}} />
        </div>
    );
};

const NeuralMappingView: React.FC<{ progress: number, template: ProductTemplate | null }> = ({ progress, template }) => {
    if (!template) return null;
    
    const flatItems = useMemo(() => {
        const items: any[] = [];
        const walk = (nodes: any[]) => {
            nodes.forEach(n => {
                items.push(n);
                if (n.children) walk(n.children);
            });
        };
        walk(template.genealogy);
        return items;
    }, [template]);

    return (
        <div className="flex-1 flex flex-col items-center justify-center w-full relative space-y-12 overflow-hidden px-20">
            <div className="text-center">
                <h3 className="text-3xl font-black text-[#1c1e21] mb-2 uppercase tracking-tight">Architect_Sync</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-4">Indexing {flatItems.length} Material Vectors</p>
                <div className="w-80 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-300 shadow-[0_0_10px_#3b82f6]" style={{ width: `${progress}%` }} />
                </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-6xl opacity-80">
                {flatItems.slice(0, 100).map((c, i) => (
                    <div key={i} className={`p-1.5 px-3 bg-white border border-slate-100 rounded-md font-black text-[8px] uppercase transition-all duration-700 ${progress > (i / flatItems.length) * 100 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-90'}`}>
                        {c.name}
                    </div>
                ))}
                {flatItems.length > 100 && <div className="text-[8px] font-black text-slate-300 uppercase">... + {flatItems.length - 100} More Vectors</div>}
            </div>
        </div>
    );
};
