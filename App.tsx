import React, { useState, useEffect, useMemo } from 'react';
import {
  GameState,
  ScenarioID,
  AIStrategyType,
  HistoryEntry,
  MetricType,
  SectorState,
  Payoff,
  PolicyStrategy,
  IndustryStrategy,
  BannedAsset
} from './types';
import { SCENARIOS } from './constants';
import { StrategyToggle } from './components/StrategyToggle';
import { EconomyHUD } from './components/EconomyHUD';
import { AIAdvisor } from './components/AIAdvisor';
import { SupplyChainGraph } from './components/SupplyChainGraph';
import { TrendChart } from './components/TrendChart';
import { GameMatrix } from './components/GameMatrix';
import { useTradeEngine } from './hooks/useTradeEngine';
import { TradeRoutes } from './components/TradeRoutes';
import { RiskDashboard, NeuralDrillCard, NeuralSynapses, MaterialTrendChart, SupplyChainLegend, NeuralMiniMap } from './components/RiskDashboard';
import { AppSettings } from './components/AppSettings';
import { AdminOptimizerPanel } from './components/AdminOptimizerPanel';
import { LoginScreen } from './components/LoginScreen';
import { MATERIAL_GENEALOGY, MaterialNode } from './constants/material_genealogy';
import {
  Settings2,
  Layers,
  Info,
  History,
  Play,
  RotateCcw,
  Maximize2,
  Database,
  Menu,
  X,
  Trash2,
  Terminal,
  Brain,
  Zap,
  FlaskConical,
  Target,
  ChevronRight,
  Calendar,
  Search,
  MapPin,
  Clock,
  Globe,
  List
} from 'lucide-react';
import { EventIntelCard } from './components/EventIntelCard';
import { usePolymarket } from './hooks/usePolymarket';
import { SavingsDashboard } from './components/SavingsDashboard';
import { GlobalInventory } from './components/GlobalInventory';

const App: React.FC = () => {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem('simulation_state');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error("Sim State Load Error", e); }
    }
    return {
      scenario: 'BULL_MARKET',
      policyStrategy: 'FREE_TRADE',
      industryStrategy: 'EXPANSION',
      bannedAsset: 'SEMICONDUCTORS',
      industryMode: 'MANUAL',
      currentRound: 1,
      history: [],
      predictionLog: []
    };
  });

  useEffect(() => {
    localStorage.setItem('simulation_state', JSON.stringify(state));
  }, [state]);

  const [currentView, setCurrentView] = useState<'simulation' | 'trade_routes' | 'risk_dashboard' | 'inventory' | 'settings' | 'admin'>('simulation');
  const [activeTab, setActiveTab] = useState<'config' | 'intel'>('config');
  const [bottomTab, setBottomTab] = useState<'trends' | 'matrix' | 'log'>('trends');
  const [activeMetric, setActiveMetric] = useState<MetricType>('pts_tech');
  const [simulationDate, setSimulationDate] = useState('2026-04-16');
  const [liveJitter, setLiveJitter] = useState({ tech: 0, finance: 0, mfg: 0, energy: 0 });

  // Simulate Live Market Data Feed
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveJitter({
        tech: (Math.random() - 0.5) * 0.15,
        finance: (Math.random() - 0.5) * 0.1,
        mfg: (Math.random() - 0.5) * 0.08,
        energy: (Math.random() - 0.5) * 0.25,
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const getLiveSector = (sector: SectorState, jitter: number): SectorState => ({
    ...sector,
    points: Math.max(0, Math.min(10, Number((sector.points + jitter).toFixed(1)))),
    inflation: Math.max(0, Number((sector.inflation + jitter * 1.5).toFixed(1))),
    growth: Number((sector.growth + jitter * 4).toFixed(1)),
    stability: Math.max(0, Math.min(100, Math.round(sector.stability + jitter * 2)))
  });
  const [targetDate, setTargetDate] = useState('2028-06-01');
  const [activeEvents, setActiveEvents] = useState<any[]>([
    { id: '1', title: 'Suez Canal Expansion Complete', severity: 'MID', impact: 'Positive - Trade Flow', timestamp: '2026-03-20', type: 'GEOPOLITICAL' },
    { id: '2', title: 'Rare Earth Mineral Sanctions', severity: 'HIGH', impact: 'Negative - Manufacturing', timestamp: '2026-04-12', type: 'TRADE' }
  ]);
  const { markets: marketData, loading: marketsLoading } = usePolymarket();
  const currentPayoff = useTradeEngine(state);

  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isPanelMaximized, setIsPanelMaximized] = useState(false);
  const [panelHeight, setPanelHeight] = useState(300);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(0);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalcTrigger, setRecalcTrigger] = useState(0);

  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- Architect State (Lifted from RiskDashboard) ---
  const [networks, setNetworks] = useState<any[]>(() => {
    const saved = localStorage.getItem('neural_networks');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error("Persistence Load Error", e); }
    }
    return [
      {
        id: '1',
        name: 'Veranda Alpha-1',
        sector: 'HEAVY_INDUSTRY',
        createdAt: '2026-03-20',
        riskScore: 82.5,
        genealogy: JSON.parse(JSON.stringify(MATERIAL_GENEALOGY['CHAIR'].genealogy))
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('neural_networks', JSON.stringify(networks));
  }, [networks]);

  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<string | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [graphState, setGraphState] = useState<{ allNodes: any[], viewState: any, setViewState: any } | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<string>('SECTOR_TRENDS');
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    setHiddenCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const selectedNetwork = useMemo(() => networks.find(n => n.id === (selectedNetworkId || '1')), [networks, selectedNetworkId]);
  const selectedNode = useMemo(() => {
    if (!selectedNetwork || !selectedNodeId) return null;
    const allNodes: any[] = [];
    const walk = (nodes: any[]) => {
      nodes.forEach(n => {
        allNodes.push(n);
        if (n.children) walk(n.children);
      });
    };
    walk(selectedNetwork.genealogy);
    return allNodes.find((n: any) => n.id === selectedNodeId) || null;
  }, [selectedNetwork, selectedNodeId]);

  const availableCategories = useMemo(() => {
    if (!selectedNetwork) return null;
    const categories = new Set<string>();
    const walk = (nodes: any[]) => {
      nodes.forEach(n => {
        if (n.category) categories.add(n.category);
        else categories.add('COMPONENT'); // Default fallback
        if (n.children) walk(n.children);
      });
    };
    walk(selectedNetwork.genealogy);
    return categories;
  }, [selectedNetwork]);

  useEffect(() => {
    if (selectedNetwork && !selectedComponentId) {
      setSelectedComponentId(selectedNetwork.genealogy[0]?.id);
    }
  }, [selectedNetwork, selectedComponentId]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      if (width >= 1024) setIsSidebarOpen(false);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const windowHeight = window.innerHeight;
      const newHeight = windowHeight - e.clientY - 16;
      let clampedHeight = Math.max(40, Math.min(newHeight, windowHeight - 90));
      if (Math.abs(clampedHeight - 300) < 30) clampedHeight = 300;
      setPanelHeight(clampedHeight);
      if (clampedHeight <= 50) {
        setIsPanelCollapsed(true);
        setIsPanelMaximized(false);
      } else if (clampedHeight >= windowHeight - 150) {
        setIsPanelMaximized(true);
        setIsPanelCollapsed(false);
      } else {
        setIsPanelCollapsed(false);
        setIsPanelMaximized(false);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      const windowHeight = window.innerHeight;
      const MAX_HEIGHT = windowHeight - 90;
      const MID_HEIGHT = 300;
      const MIN_HEIGHT = 40;

      let finalHeight = panelHeight;
      const dragDistance = panelHeight - dragStartHeight;
      const isDraggingUp = dragDistance > 0;

      if (isDraggingUp) {
        if (panelHeight > MAX_HEIGHT - 200) finalHeight = MAX_HEIGHT;
        else if (panelHeight > 70) finalHeight = MID_HEIGHT;
        else finalHeight = MIN_HEIGHT;
      } else {
        if (panelHeight > MAX_HEIGHT - 100) finalHeight = MAX_HEIGHT;
        else if (panelHeight > 240) finalHeight = MID_HEIGHT;
        else finalHeight = MIN_HEIGHT;
      }

      setPanelHeight(finalHeight);
      if (finalHeight <= 50) {
        setIsPanelCollapsed(true);
        setIsPanelMaximized(false);
      } else if (finalHeight >= MAX_HEIGHT - 50) {
        setIsPanelMaximized(true);
        setIsPanelCollapsed(false);
      } else {
        setIsPanelCollapsed(false);
        setIsPanelMaximized(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, panelHeight, dragStartHeight]);

  const calculateFutureProjection = () => {
    setIsRecalculating(true);
    setRecalcTrigger(p => p + 1);

    // Integrate Engine Room Weights with Timeline Projector
    setTimeout(() => {
      const yearDiff = Math.max(0.1, (new Date(targetDate).getTime() - new Date(simulationDate).getTime()) / (1000 * 60 * 60 * 24 * 365));

      // 1. Load optimized weights from the Admin Optimizer
      const rawWeights = localStorage.getItem('engine_weights');
      let engineWeights: any[] = [];
      if (rawWeights) {
        try {
          engineWeights = JSON.parse(rawWeights);
        } catch (e) {
          console.error("Failed to parse engine weights");
        }
      }

      // 2. Deterministic Volatility Engine
      let eventDrift = 0;
      if (engineWeights.length > 0) {
        activeEvents.forEach(evt => {
           // Determine direction (Negative impact = higher risk/drift)
           const isNegative = evt.impact.toLowerCase().includes('negative');
           const dir = isNegative ? 1 : -1;
           
           // Base multiplier on severity
           const sevMultiplier = evt.severity === 'HIGH' ? 2 : evt.severity === 'MID' ? 1 : 0.5;
           const conf = evt.confidence ? (evt.confidence / 100) : 0.8;
           
           // Map event to an engine weight category
           let targetCategory = 'shipping'; // Default fallback
           if (evt.impact.toLowerCase().includes('manufacturing')) targetCategory = 'electronics';
           if (evt.impact.toLowerCase().includes('trade')) targetCategory = 'shipping';
           
           const weightObj = engineWeights.find(w => w.category === targetCategory) || engineWeights[0];
           const weightVal = weightObj ? weightObj.weight : 0.5;
           const lagVal = weightObj ? weightObj.lag : 30;
           
           // Mathematical principle: Short lag = acute short-term impact. Long lag = smoothed out.
           const lagImpact = Math.max(0.1, 1 - (lagVal / 365)); 
           
           // Calculate the precise event-driven drift
           eventDrift += dir * sevMultiplier * weightVal * conf * lagImpact * 20;
        });
      }

      // 3. Apply Certainty Decay Model
      // Confidence drops as we look further out: C = 1 / sqrt(1 + years)
      const confidenceFactor = 1 / Math.sqrt(1 + yearDiff);
      const volatilityBase = 15;
      
      // Calculate final deterministic neural drift using engine's mapped output
      // Preserve the sign so negative events increase risk, positive events decrease risk
      const neuralDriftPower = (eventDrift) * (1 - Math.min(0.9, confidenceFactor) + 0.1) * yearDiff;

      const scenarios: ScenarioID[] = ['BULL_MARKET', 'BEAR_MARKET', 'RECESSION', 'SUPPLY_SHOCK'];
      const nextScenario = scenarios[Math.floor(Math.random() * scenarios.length)];

      // Realize Pending Predictions
      setState(prev => {
        const updatedLog = prev.predictionLog.map(entry => {
          if (entry.status === 'PENDING' && new Date(entry.targetDate) <= new Date(targetDate)) {
            // Find current node in networks to get realized price
            const node = networks[0].genealogy.find((n: any) => n.id === entry.materialId) ||
              networks[0].genealogy.flatMap((n: any) => n.children || []).find((c: any) => c.id === entry.materialId);

            if (node) {
              const sectorPanic = currentPayoff.sectors[networks[0].sector as MapMode]?.panicIndex || 0;
              const hoardingMultiplier = 1 + (sectorPanic / 100) * 0.5; // Simulate up to 1.5x hoarding spike on realization

              const realizedPrice = (node.basePrice || 100) * (1 + (node.riskScore / 100)) * hoardingMultiplier;
              const savings = Math.max(0, (realizedPrice - entry.predictedPrice) * entry.quantity);
              return { ...entry, status: 'REALIZED', realizedPrice, savings };
            }
          }
          return entry;
        });

        return {
          ...prev,
          scenario: nextScenario,
          currentRound: prev.currentRound + Math.ceil(yearDiff),
          history: [
            ...prev.history,
            { round: prev.currentRound, policyStrategy: prev.policyStrategy, industryStrategy: prev.industryStrategy, payoff: currentPayoff }
          ],
          predictionLog: updatedLog
        };
      });

      setSimulationDate(targetDate);

      // Deep Neural Drift - Scale randomness by certainty decay
      setNetworks(prevNets => prevNets.map(net => {
        const sectorPanic = currentPayoff.sectors[net.sector as MapMode]?.panicIndex || 0;
        const panicDrift = 1 + (sectorPanic / 100) * 2; // Up to 3x drift speed during panic

        const newGenealogy = net.genealogy.map((comp: any) => ({
          ...comp,
          // Deterministic update using the calculated drift power
          riskScore: Math.max(5, Math.min(98, comp.riskScore + neuralDriftPower * panicDrift)),
          children: comp.children?.map((m: any) => ({
            ...m,
            // Children nodes are 1.5x more volatile to macro shifts
            riskScore: Math.max(5, Math.min(98, m.riskScore + (neuralDriftPower * 1.5) * panicDrift))
          }))
        }));

        // Generate NEW Predictions based on high risk scores after drift
        const newPredictions: any[] = [];
        newGenealogy.forEach((comp: any) => {
          if (comp.riskScore > 70) {
            newPredictions.push({
              id: Math.random().toString(36).substr(2, 9),
              materialId: comp.id,
              materialName: comp.name,
              predictionDate: targetDate, // The new "current" date
              targetDate: new Date(new Date(targetDate).setFullYear(new Date(targetDate).getFullYear() + 1)).toISOString().split('T')[0],
              predictedPrice: (comp.basePrice || 100) * (1 + (comp.riskScore / 100)),
              quantity: 100, // Assumed small business quantity
              status: 'PENDING'
            });
          }
          comp.children?.forEach((child: any) => {
            if (child.riskScore > 70) {
              newPredictions.push({
                id: Math.random().toString(36).substr(2, 9),
                materialId: child.id,
                materialName: child.name,
                predictionDate: targetDate,
                targetDate: new Date(new Date(targetDate).setFullYear(new Date(targetDate).getFullYear() + 1)).toISOString().split('T')[0],
                predictedPrice: (child.basePrice || 100) * (1 + (child.riskScore / 100)),
                quantity: 100,
                status: 'PENDING'
              });
            }
          });
        });

        setState(prev => ({
          ...prev,
          predictionLog: [...prev.predictionLog, ...newPredictions]
        }));

        return { ...net, genealogy: newGenealogy };
      }));

      // Inject Market Data into Events
      const marketEvents = marketData.slice(0, 3).map(m => ({
        id: m.id,
        title: m.title,
        severity: m.probability > 50 ? 'HIGH' : 'MID',
        impact: `${m.probability}% Market Probability`,
        timestamp: targetDate,
        type: m.category as any,
        marketProb: m.probability,
        confidence: Math.round(confidenceFactor * 100)
      }));

      setActiveEvents(prev => [...marketEvents, ...prev.slice(0, 2)]);
      setIsRecalculating(false);
    }, 1800);
  };

  const resetSimulation = () => {
    setState({
      scenario: 'BULL_MARKET',
      policyStrategy: 'FREE_TRADE',
      industryStrategy: 'EXPANSION',
      bannedAsset: 'SEMICONDUCTORS',
      industryMode: 'MANUAL',
      currentRound: 1,
      history: []
    });
    setRecalcTrigger(p => p + 1);

    // Reset all node positions to force the layout engine to re-seed default values
    setNetworks(prevNets => prevNets.map(net => {
      const clearPositions = (nodes: any[]): any[] => {
        return nodes.map(n => {
          const { position, ...rest } = n;
          return {
            ...rest,
            ...(n.children ? { children: clearPositions(n.children) } : {})
          };
        });
      };
      return { ...net, genealogy: clearPositions(net.genealogy) };
    }));
  };

  return (
    <div className="h-screen bg-[#f1f3f5] text-[#1c1e21] flex flex-col font-sans overflow-hidden select-none">
      <header className="h-10 shrink-0 border-b border-[#dfe3e6] bg-white flex items-center pl-4 gap-2 text-[12px] font-medium text-[#4a5056]">
        {(isMobile || isTablet) && (
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="mr-2 p-1 hover:bg-[#f8f9fa] rounded">
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}
        <button
          onClick={() => { setCurrentView('simulation'); setSelectedNetworkId(null); }}
          className={`hover:text-[#228be6] transition-colors ${currentView !== 'simulation' ? 'text-[#868e96] cursor-pointer' : 'text-[#868e96] cursor-default'} ${isMobile ? 'hidden' : ''}`}
        >
          Geopolitical Engine
        </button>
        <ChevronRight className={`w-3 h-3 text-[#adb5bd] ${isMobile ? 'hidden' : ''}`} />
        <button
          onClick={() => { if (currentView === 'risk_dashboard') setSelectedNetworkId(null); }}
          className={`font-semibold hover:text-[#228be6] transition-colors ${currentView === 'risk_dashboard' && selectedNetworkId ? 'text-[#495057] cursor-pointer' : 'text-[#1c1e21] cursor-default'}`}
        >
          {currentView === 'risk_dashboard'
            ? (wizardStep ? 'Neural Architect' : 'Neural Material Architecture')
            : currentView === 'trade_routes' ? 'Global Trade Radar' : currentView === 'inventory' ? 'Global Inventory' : currentView === 'settings' ? 'System Configuration' : 'Macroeconomic Industry Simulator'}
        </button>
        {currentView === 'risk_dashboard' && selectedNetworkId && (
          <>
            <ChevronRight className={`w-3 h-3 text-[#adb5bd] ${isMobile ? 'hidden' : ''}`} />
            <span className="text-[#1c1e21] font-semibold">{networks.find(n => n.id === selectedNetworkId)?.name || 'Network Detail'}</span>
          </>
        )}
        <span className={`ml-2 text-[#adb5bd] ${isMobile ? 'hidden' : ''}`}>...</span>

        <div className="ml-auto flex items-center h-full w-[340px] border-l border-[#dfe3e6] px-4 gap-3 bg-white">
          {/* Reset Action */}
          <button
            onClick={resetSimulation}
            className="h-7 px-3 border border-slate-200 rounded bg-white text-red-500 hover:bg-red-50 hover:border-red-200 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-sm active:translate-y-px"
          >
            <Trash2 className="w-3 h-3" /> Reset
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => { if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); } else { document.exitFullscreen(); } }}
            className="h-7 w-7 border border-slate-200 rounded bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center shadow-sm active:translate-y-px"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Simulation Status */}
          <div className="flex-1 flex items-center justify-end gap-2">
            <div className={`w-2 h-2 rounded-full transition-colors ${isRecalculating ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className={`text-[10px] font-black text-slate-600 uppercase tracking-widest truncate ${isMobile ? 'hidden sm:inline' : ''}`}>
              {isRecalculating ? 'Processing' : 'Active'}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 relative">
        {!isMobile && (
          <aside className="w-10 border-r border-[#dfe3e6] bg-white flex flex-col items-center py-4 gap-6 shrink-0">
            <button onClick={() => setCurrentView('simulation')}>
              <Info className={`w-5 h-5 cursor-pointer transition-colors ${currentView === 'simulation' ? 'text-[#228be6]' : 'text-[#868e96] hover:text-[#228be6]'}`} />
            </button>
            <button onClick={() => setCurrentView('trade_routes')}>
              <Layers className={`w-5 h-5 cursor-pointer transition-colors ${currentView === 'trade_routes' ? 'text-[#228be6]' : 'text-[#868e96] hover:text-[#228be6]'}`} />
            </button>
            <button onClick={() => setCurrentView('risk_dashboard')}>
              <Database className={`w-5 h-5 cursor-pointer transition-colors ${currentView === 'risk_dashboard' ? 'text-[#228be6]' : 'text-[#868e96] hover:text-[#228be6]'}`} />
            </button>
            <button onClick={() => setCurrentView('inventory')}>
              <List className={`w-5 h-5 cursor-pointer transition-colors ${currentView === 'inventory' ? 'text-[#228be6]' : 'text-[#868e96] hover:text-[#228be6]'}`} />
            </button>
            <div className="mt-auto mb-2 flex flex-col items-center gap-4">
              <button onClick={() => setCurrentView('settings')}>
                <Settings2 className={`w-5 h-5 cursor-pointer transition-colors ${currentView === 'settings' ? 'text-[#228be6]' : 'text-[#868e96] hover:text-[#228be6]'}`} />
              </button>
              <button onClick={() => setCurrentView('admin')} title="Admin Optimizer">
                <FlaskConical className={`w-5 h-5 cursor-pointer transition-colors ${currentView === 'admin' ? 'text-blue-500' : 'text-[#868e96] hover:text-blue-400'}`} />
              </button>
            </div>
          </aside>
        )}

        <main className="flex-1 flex flex-col min-h-0 bg-[#f8f9fa] relative overflow-hidden">
          {currentView === 'admin' ? (
            <AdminOptimizerPanel />
          ) : currentView === 'inventory' ? (
            <GlobalInventory
              networks={networks}
              predictionLog={state.predictionLog}
              onSelectNode={(netId, nodeId) => {
                setSelectedNetworkId(netId);
                setSelectedNodeId(nodeId);
                setCurrentView('risk_dashboard');
                setActiveBottomTab('PROTECTION_ROI');
                setIsPanelCollapsed(false);
              }}
            />
          ) : currentView === 'simulation' ? (
            <>
              <div className="h-12 border-b border-[#dee2e6] bg-white flex items-center px-4 gap-3 z-10 shrink-0 relative justify-between">
                <div className="text-[11px] text-[#868e96] flex items-center gap-4">
                  <span className="flex items-center gap-1"><Database className="w-3 h-3" /> Source: Global Macro Engine v5.0</span>
                </div>
              </div>

              <div className="flex-1 relative overflow-hidden">
                <SupplyChainGraph state={state} payoff={currentPayoff} resetKey={recalcTrigger} />

                <div
                  className={`absolute left-4 right-4 bg-white border border-[#dee2e6] rounded-lg shadow-2xl flex flex-col overflow-hidden z-20 ${isDragging ? 'transition-none' : 'transition-all duration-300 ease-out'}`}
                  style={{
                    bottom: '16px',
                    height: isPanelMaximized ? 'calc(100% - 16px)' : isPanelCollapsed ? '40px' : `${panelHeight}px`
                  }}
                >
                  <div
                    className={`h-10 border-b border-[#dee2e6] flex items-center px-4 bg-[#f8f9fa] shrink-0 ${isDragging ? 'cursor-ns-resize' : 'cursor-pointer'} hover:bg-[#e9ecef] transition-colors relative group`}
                    onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                    onMouseDown={(e) => {
                      if ((e.target as HTMLElement).closest('button')) return;
                      setIsDragging(true);
                      setDragStartY(e.clientY);
                      setDragStartHeight(panelHeight);
                      e.preventDefault();
                    }}
                  >
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-slate-300 rounded-full group-hover:bg-slate-400 transition-colors" />
                    <div className="flex border border-[#dee2e6] rounded overflow-hidden shadow-sm my-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => { setBottomTab('trends'); setIsPanelCollapsed(false); }}
                        className={`px-3 py-1 text-[11px] font-bold transition-all ${bottomTab === 'trends' ? 'bg-[#e7f5ff] text-[#1971c2] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]' : 'bg-white text-[#495057] hover:bg-[#f8f9fa]'}`}
                      >
                        Sector Trends
                      </button>
                      <div className="w-px bg-[#dee2e6]" />
                      <button
                        onClick={() => { setBottomTab('matrix'); setIsPanelCollapsed(false); }}
                        className={`px-3 py-1 text-[11px] font-bold transition-all ${bottomTab === 'matrix' ? 'bg-[#e7f5ff] text-[#1971c2] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]' : 'bg-white text-[#495057] hover:bg-[#f8f9fa]'}`}
                      >
                        Macro Logic
                      </button>
                      <div className="w-px bg-[#dee2e6]" />
                      <button
                        onClick={() => { setBottomTab('log'); setIsPanelCollapsed(false); }}
                        className={`px-3 py-1 text-[11px] font-bold transition-all ${bottomTab === 'log' ? 'bg-[#e7f5ff] text-[#1971c2] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]' : 'bg-white text-[#495057] hover:bg-[#f8f9fa]'}`}
                      >
                        Timeline
                      </button>
                    </div>
                    <div className="ml-auto flex items-center gap-2 pr-1">
                      <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e] cursor-pointer hover:bg-[#ff3b30]" onClick={(e) => { e.stopPropagation(); setIsPanelCollapsed(true); }} />
                      <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#d89e24] cursor-pointer hover:bg-[#ffcc00]" onClick={(e) => { e.stopPropagation(); setIsPanelMaximized(false); setIsPanelCollapsed(false); setPanelHeight(300); }} />
                      <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29] cursor-pointer hover:bg-[#32d74b]" onClick={(e) => { e.stopPropagation(); setIsPanelMaximized(true); setIsPanelCollapsed(false); }} />
                    </div>
                  </div>
                  <div className="flex-1 p-4 flex gap-6">
                    {bottomTab === 'trends' && (
                      <div className="w-64 shrink-0 flex flex-col gap-1.5 overflow-y-auto no-scrollbar border-r border-[#f1f3f5] pr-4">
                        <button
                          onClick={() => setActiveMetric('pts_tech')}
                          className={`p-1.5 border rounded text-[10px] text-left transition-all ${activeMetric === 'pts_tech' ? 'bg-[#e7f5ff] border-[#74c0fc]' : 'bg-white border-[#dee2e6] hover:bg-[#f8f9fa]'}`}
                        >
                          <div className={`font-bold leading-tight ${activeMetric === 'pts_tech' ? 'text-[#1971c2]' : 'text-[#495057]'}`}>Technology & AI</div>
                        </button>
                        <button
                          onClick={() => setActiveMetric('pts_manufacturing')}
                          className={`p-1.5 border rounded text-[10px] text-left transition-all ${activeMetric === 'pts_manufacturing' ? 'bg-[#fff5f5] border-[#ff8787]' : 'bg-white border-[#dee2e6] hover:bg-[#f8f9fa]'}`}
                        >
                          <div className={`font-bold leading-tight ${activeMetric === 'pts_manufacturing' ? 'text-[#e03131]' : 'text-[#495057]'}`}>Global Manufacturing</div>
                        </button>
                        <button
                          onClick={() => setActiveMetric('pts_energy')}
                          className={`p-1.5 border rounded text-[10px] text-left transition-all ${activeMetric === 'pts_energy' ? 'bg-[#fff4e6] border-[#ffa94d]' : 'bg-white border-[#dee2e6] hover:bg-[#f8f9fa]'}`}
                        >
                          <div className={`font-bold leading-tight ${activeMetric === 'pts_energy' ? 'text-[#e8590c]' : 'text-[#495057]'}`}>Energy & Resources</div>
                        </button>
                        <button
                          onClick={() => setActiveMetric('pts_finance')}
                          className={`p-1.5 border rounded text-[10px] text-left transition-all ${activeMetric === 'pts_finance' ? 'bg-[#ebfbee] border-[#69db7c]' : 'bg-white border-[#dee2e6] hover:bg-[#f8f9fa]'}`}
                        >
                          <div className={`font-bold leading-tight ${activeMetric === 'pts_finance' ? 'text-[#2b8a3e]' : 'text-[#495057]'}`}>Financial Markets</div>
                        </button>
                        <button
                          onClick={() => setActiveMetric('inflation_index')}
                          className={`p-1.5 border rounded text-[10px] text-left transition-all ${activeMetric === 'inflation_index' ? 'bg-[#f8f9fa] border-[#adb5bd]' : 'bg-white border-[#dee2e6] hover:bg-[#f8f9fa]'}`}
                        >
                          <div className={`font-bold leading-tight ${activeMetric === 'inflation_index' ? 'text-[#495057]' : 'text-[#495057]'}`}>Global Average Inflation</div>
                        </button>
                      </div>
                    )}
                    <div className="flex-1 min-w-0 h-full">
                      {bottomTab === 'trends' ? (
                        <TrendChart payoff={currentPayoff} metric={activeMetric} />
                      ) : bottomTab === 'matrix' ? (
                        <GameMatrix state={state} />
                      ) : (
                        <div className="h-full flex flex-col gap-3 min-h-0">
                          {state.history.length > 0 && (
                            <div className="shrink-0 bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="bg-slate-100 p-1.5 rounded-md">
                                    <Terminal className="w-4 h-4 text-slate-600" />
                                  </div>
                                  <h4 className="text-[12px] font-black uppercase tracking-wider text-slate-700">Cumulative Market State</h4>
                                </div>
                                <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[9px] font-black">
                                  <RotateCcw className="w-3 h-3" /> {state.history.length} PERIODS
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                            {state.history.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center opacity-40 py-10">
                                <History className="w-10 h-10 mb-2" />
                                <p className="text-[12px] font-black uppercase tracking-widest">No history recorded</p>
                              </div>
                            ) : (
                              [...state.history].reverse().map((entry, index) => (
                                <div key={index} className="flex gap-4 group">
                                  <div className="flex flex-col items-center">
                                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-black text-slate-500 shrink-0">
                                      {entry.round}
                                    </div>
                                    {index !== state.history.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1.5" />}
                                  </div>
                                  <div className="flex-1 bg-white border border-slate-100 rounded-xl p-3 shadow-sm group-hover:border-slate-300 transition-all">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex gap-6">
                                        <div className="flex flex-col">
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">POLICY ACTION</span>
                                          <span className={`text-[12px] font-black ${entry.policyStrategy === 'FREE_TRADE' ? 'text-emerald-600' : 'text-blue-600'}`}>{entry.policyStrategy.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">INDUSTRY RESPONSE</span>
                                          <span className={`text-[12px] font-black ${entry.industryStrategy === 'EXPANSION' ? 'text-emerald-600' : 'text-amber-600'}`}>{entry.industryStrategy.replace('_', ' ')}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="mt-2 text-[11px] text-slate-500 font-bold italic border-t border-slate-50 pt-2 opacity-90">
                                      {entry.payoff.description}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : currentView === 'trade_routes' ? (
            <TradeRoutes state={state} />
          ) : currentView === 'risk_dashboard' ? (
            <div className="flex-1 flex flex-col relative overflow-hidden bg-white">
              <RiskDashboard
                selectedNetworkId={selectedNetworkId}
                setSelectedNetworkId={setSelectedNetworkId}
                selectedComponentId={selectedComponentId}
                setSelectedComponentId={setSelectedComponentId}
                selectedNodeId={selectedNodeId}
                setSelectedNodeId={setSelectedNodeId}
                onNodeSelected={() => {
                  setBottomTab('log');
                  setIsPanelCollapsed(false);
                }}
                onStepChange={(step) => setWizardStep(step)}
                isEditMode={isEditMode}
                networks={networks}
                setNetworks={setNetworks}
                onGraphStateChange={setGraphState}
                hiddenCategories={hiddenCategories}
              />

              {/* Re-using identical bottom dock logic but with Neural data - only show if a network is selected */}
              {selectedNetworkId && (
                <div
                  className={`absolute left-4 right-4 bg-white border border-[#dee2e6] rounded-t-lg shadow-2xl flex flex-col overflow-hidden z-20 ${isDragging ? 'transition-none' : 'transition-all duration-300 ease-out'}`}
                  style={{
                    bottom: '0',
                    height: isPanelMaximized ? 'calc(100% - 16px)' : isPanelCollapsed ? '40px' : `${panelHeight}px`
                  }}
                >
                  <div
                    className={`h-10 border-b border-[#dee2e6] flex items-center px-4 bg-[#f8f9fa] shrink-0 ${isDragging ? 'cursor-ns-resize' : 'cursor-pointer'} hover:bg-[#e9ecef] transition-colors relative group`}
                    onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                  >
                    <div className="flex border border-[#dee2e6] rounded overflow-hidden shadow-sm my-1.5" onClick={(e) => e.stopPropagation()}>
                      {['Sector Trends', 'Macro Logic', 'Protection ROI'].map(t => (
                        <button
                          key={t}
                          onClick={() => { setActiveBottomTab(t.toUpperCase().replace(' ', '_')); setIsPanelCollapsed(false); }}
                          className={`px-3 py-1 text-[11px] font-bold transition-all ${activeBottomTab === t.toUpperCase().replace(' ', '_') ? 'bg-[#e7f5ff] text-[#1971c2]' : 'bg-white text-[#495057] hover:bg-[#f8f9fa]'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <div className="ml-auto flex items-center gap-2 pr-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                    </div>
                  </div>
                  <div className="flex-1 p-6 flex gap-10 overflow-hidden">
                    {activeBottomTab === 'SECTOR_TRENDS' && (
                      <div className="flex-1 flex gap-10">
                        <div className="w-64 shrink-0 flex flex-col gap-1.5 overflow-y-auto no-scrollbar pr-4">
                          {(selectedNetwork?.genealogy || []).map((c: any) => (
                            <button
                              key={c.id}
                              onClick={() => setSelectedComponentId(c.id)}
                              className={`p-2 border rounded text-[10px] text-left transition-all ${selectedComponentId === c.id ? 'bg-[#e7f5ff] border-blue-400' : 'bg-white border-slate-200'}`}
                            >
                              <div className="font-black uppercase">{c.name}</div>
                            </button>
                          ))}
                        </div>
                        <div className="flex-1 h-full min-w-0">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="text-[10px] font-black text-[#1c1e21] uppercase tracking-widest">Architect Price Delta // {selectedNode?.name}</h5>
                          </div>
                          <MaterialTrendChart risk={selectedNode?.riskScore || 50} />
                        </div>
                      </div>
                    )}
                    {activeBottomTab === 'PROTECTION_ROI' && (
                      <SavingsDashboard
                        predictionLog={state.predictionLog}
                        selectedMaterialId={selectedNodeId}
                        selectedMaterialName={selectedNode?.name}
                        currentPrice={selectedNode ? (selectedNode.basePrice || 100) * (1 + (selectedNode.riskScore / 100)) : null}
                        unit={selectedNode?.unit}
                        onSimulate={calculateFutureProjection}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <AppSettings />
          )}
        </main>

        {!(currentView === 'risk_dashboard' && !selectedNetworkId) && (
          <aside className="w-[340px] border-l border-[#dfe3e6] bg-white flex flex-col shrink-0">
            <div className="h-12 border-b border-[#dee2e6] flex items-center px-4 gap-6 shrink-0 bg-white">
              <button
                onClick={() => setActiveTab('config')}
                className={`text-[10px] font-black uppercase tracking-[0.2em] h-12 transition-all ${activeTab === 'config' ? 'text-[#228be6] border-b-2 border-[#228be6]' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Forecast Intelligence
              </button>
              <button
                onClick={() => setActiveTab('intel')}
                className={`text-[10px] font-black uppercase tracking-[0.2em] h-12 transition-all ${activeTab === 'intel' ? 'text-[#228be6] border-b-2 border-[#228be6]' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Simulation Overrides
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
              {currentView === 'risk_dashboard' ? (
                selectedNetworkId ? (
                  <div className="space-y-6">
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 ml-1">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Architect Mode</span>
                          <div className="w-0.5 h-2.5 rounded-full bg-slate-300" />
                        </div>
                        <button onClick={() => setIsEditMode(!isEditMode)} className={`px-2 py-0.5 rounded text-[8px] font-black ${isEditMode ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {isEditMode ? 'COMMIT DNA' : 'EDIT MODE'}
                        </button>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                        <div>
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Entity Name</label>
                          <input
                            type="text"
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-[12px] font-black outline-none focus:border-blue-500"
                            value={selectedNode?.name || ''}
                            onChange={(e) => {
                              const name = e.target.value;
                              setNetworks(prev => prev.map(net => {
                                if (net.id === selectedNetworkId) {
                                  return { ...net, genealogy: net.genealogy.map((comp: any) => comp.id === selectedNodeId ? { ...comp, name } : { ...comp, children: comp.children?.map((m: any) => m.id === selectedNodeId ? { ...m, name } : m) }) };
                                }
                                return net;
                              }));
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Risk Index</label>
                            <input
                              type="number"
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-[11px] font-black outline-none focus:border-blue-500"
                              value={selectedNode?.riskScore || 0}
                              onChange={(e) => {
                                const riskScore = parseInt(e.target.value);
                                setNetworks(prev => prev.map(net => {
                                  if (net.id === selectedNetworkId) {
                                    return { ...net, genealogy: net.genealogy.map((comp: any) => comp.id === selectedNodeId ? { ...comp, riskScore } : { ...comp, children: comp.children?.map((m: any) => m.id === selectedNodeId ? { ...m, riskScore } : m) }) };
                                  }
                                  return net;
                                }));
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Ticker ID</label>
                            <input
                              type="text"
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-[11px] font-black outline-none focus:border-blue-500"
                              value={selectedNode?.ticker || ''}
                              onChange={(e) => {
                                const ticker = e.target.value;
                                setNetworks(prev => prev.map(net => {
                                  if (net.id === selectedNetworkId) {
                                    return { ...net, genealogy: net.genealogy.map((comp: any) => comp.id === selectedNodeId ? { ...comp, ticker } : { ...comp, children: comp.children?.map((m: any) => m.id === selectedNodeId ? { ...m, ticker } : m) }) };
                                  }
                                  return net;
                                }));
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2"><Brain className="w-3.5 h-3.5 text-blue-600" /><span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Architect Insights</span></div>
                      <p className="text-[11px] text-blue-800/80 leading-relaxed italic">DNA modifications will propagate to the global macro simulation in the next round.</p>
                    </section>

                    {/* Neural Radar MiniMap */}
                    {graphState && graphState.allNodes.length > 0 && (
                      <section>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                          Neural Radar
                        </div>
                        <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                          <NeuralMiniMap
                            allNodes={graphState.allNodes}
                            viewState={graphState.viewState}
                            setViewState={graphState.setViewState}
                          />
                        </div>
                      </section>
                    )}

                    {/* Architect Legend — interactive filter */}
                    <section>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                          Architect Legend
                        </div>
                        {hiddenCategories.size > 0 && (
                          <button
                            onClick={() => setHiddenCategories(new Set())}
                            className="text-[7px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 transition-all"
                          >
                            Show All
                          </button>
                        )}
                      </div>
                      <SupplyChainLegend
                        inline
                        hiddenCategories={hiddenCategories}
                        onToggleCategory={toggleCategory}
                        availableCategories={availableCategories}
                      />
                    </section>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-4 pb-20">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Layers className="w-6 h-6 text-slate-300" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#868e96] mb-2">Global Repository Active</h4>
                    <p className="text-[10px] font-medium text-slate-400">Select an operational neural network from the repository or initialize a new stack to view and modify component DNA parameters.</p>
                  </div>
                )
              ) : activeTab === 'config' ? (
                <div className="flex flex-col h-full overflow-hidden px-4">
                  <div className="space-y-6 flex-1 overflow-y-auto pr-2 pb-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent min-h-0">
                    {/* Timeline Projector */}
                    <section className="space-y-4">
                      <div className="flex items-center gap-2 ml-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Timeline Projector</span>
                        <div className="w-0.5 h-3 rounded-full bg-blue-500" />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-colors group relative">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Injected Context</span>
                            {simulationDate !== '2026-04-16' && (
                              <button 
                                onClick={() => setSimulationDate('2026-04-16')}
                                className="text-[7px] font-black uppercase text-blue-500 hover:text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Reset Timeline to Today"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                          <div className="text-[12px] font-black text-slate-700 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            {simulationDate}
                          </div>
                        </div>
                        <div className="bg-white border border-blue-100 rounded-lg p-3 shadow-sm ring-1 ring-blue-50 hover:border-blue-200 transition-colors">
                          <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest block mb-1">Target Horizon</span>
                          <input
                            type="date"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                            className="w-full text-[12px] font-black text-blue-600 outline-none bg-transparent cursor-pointer"
                          />
                        </div>
                      </div>
                    </section>

                    {/* Market Sync Status */}
                    <div className="flex items-center justify-between px-3 py-2 bg-blue-50/50 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <Globe className={`w-3.5 h-3.5 ${marketsLoading ? 'animate-spin text-blue-400' : 'text-blue-600'}`} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-700">Polymarket Genesis Sync</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {marketsLoading ? (
                          <span className="text-[8px] font-bold text-blue-400 uppercase animate-pulse">Polling Data...</span>
                        ) : (
                          <>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[8px] font-bold text-emerald-600 uppercase">Live Index</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Intelligence Feed */}
                    <section className="space-y-4">
                      <div className="flex items-center justify-between ml-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Automated Intelligence Feed</span>
                          <div className="w-0.5 h-3 rounded-full bg-amber-500" />
                        </div>
                        <div className="flex items-center gap-1.5 opacity-60">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[8px] font-black uppercase tracking-widest">LIVE</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {activeEvents.map(event => (
                          <EventIntelCard key={event.id} event={event} />
                        ))}
                      </div>
                    </section>
                  </div>
                  
                  {/* Main Action Call - Pinned to bottom */}
                  <div className="pt-4 mt-auto border-t border-slate-100 shrink-0">
                    <button
                      onClick={calculateFutureProjection}
                      disabled={isRecalculating}
                      className={`w-full py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2
                            ${isRecalculating
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] shadow-sm hover:shadow'
                        }`}
                    >
                      {isRecalculating ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          Sync Global Future
                        </>
                      )}
                    </button>
                    <p className="text-[9px] text-center text-slate-400 mt-4 font-bold uppercase tracking-widest italic opacity-60">
                      Inference engine scales with target horizon volatility.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <AIAdvisor state={state} scenario={SCENARIOS[state.scenario]} payoff={currentPayoff} />
                </div>
              )}
            </div>

            <div className="border-t border-[#dee2e6] bg-[#f8f9fa] shadow-[0_-4px_16px_rgba(0,0,0,0.02)] shrink-0 max-h-[300px] overflow-y-auto">
              <div className="p-3 bg-[#e9ecef] border-b border-[#dee2e6] flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2 ml-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#495057]">Global Sector Health</span>
                  <div className="w-0.5 h-2.5 rounded-full bg-slate-400" />
                </div>
              </div>
              <div className="p-3 grid grid-cols-2 gap-3">
                <EconomyHUD sector={getLiveSector(currentPayoff.sectors.TECH, liveJitter.tech)} color="blue" />
                <EconomyHUD sector={getLiveSector(currentPayoff.sectors.FINANCE, liveJitter.finance)} color="green" />
                <EconomyHUD sector={getLiveSector(currentPayoff.sectors.MANUFACTURING, liveJitter.mfg)} color="red" />
                <EconomyHUD sector={getLiveSector(currentPayoff.sectors.ENERGY, liveJitter.energy)} color="orange" />
              </div>
            </div>
          </aside>
        )}
      </div>

      <footer className="h-6 bg-[#1c1e21] flex items-center px-4 justify-between text-[10px] text-[#adb5bd] font-medium shrink-0">
        <div className="flex gap-4">
          <span>Project: GEOPOLITICAL_CORE_V5</span>
          <span>Workspace: Industry Simulator</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#37b24d]" />
          <span className="text-[#f8f9fa]">READY</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
