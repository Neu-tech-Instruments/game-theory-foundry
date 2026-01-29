
import React, { useState, useEffect } from 'react';
import {
  GameState,
  Strategy,
  ScenarioID,
  US_BanItem,
  CHINA_BanItem,
  AIStrategyType,
  HistoryEntry,
  EconomyState,
  Payoff
} from './types';
import { SCENARIOS } from './constants';
import { ScenarioSelector } from './components/ScenarioSelector';
import { StrategyToggle } from './components/StrategyToggle';
import { EconomyHUD } from './components/EconomyHUD';
import { AIAdvisor } from './components/AIAdvisor';
import { SupplyChainGraph } from './components/SupplyChainGraph';
import { TrendChart, MetricType } from './components/TrendChart';
import { GameMatrix } from './components/GameMatrix';
import { useTradeEngine } from './hooks/useTradeEngine';
import { TradeRoutes } from './components/TradeRoutes';
import {
  Settings2,
  Layers,
  Search,
  Info,
  History,
  Play,
  RotateCcw,
  Maximize2,
  RectangleHorizontal,
  ChevronDown,
  ChevronRight,
  Database,
  Menu,
  X,
  Trash2,
  Terminal,
  Brain,
  Zap,
  ShieldAlert,
  Target
} from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<GameState>({
    scenario: 'NEUTRAL',
    usStrategy: 'FREE_TRADE',
    chinaStrategy: 'FREE_TRADE',
    usBanFocus: 'AI_CHIPS',
    chinaBanFocus: 'RARE_EARTHS',
    chinaStrategyMode: 'MANUAL',
    currentRound: 1,
    history: []
  });

  const [currentView, setCurrentView] = useState<'simulation' | 'trade_routes'>('simulation');
  const [activeTab, setActiveTab] = useState<'config' | 'intel'>('config');
  const [bottomTab, setBottomTab] = useState<'trends' | 'matrix' | 'log'>('trends');
  const [activeMetric, setActiveMetric] = useState<MetricType>('pts_us');
  const currentPayoff = useTradeEngine(state);

  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isPanelMaximized, setIsPanelMaximized] = useState(false);
  const [panelHeight, setPanelHeight] = useState(300); // Default medium height for better visibility
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(0);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalcTrigger, setRecalcTrigger] = useState(0);

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [flowType, setFlowType] = useState<'US' | 'CHINA'>('US');

  // Breakpoint detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);

      // Auto-close sidebar on desktop
      if (width >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drag to resize panel
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const windowHeight = window.innerHeight;
      const newHeight = windowHeight - e.clientY - 16; // 16px for bottom margin

      // Clamp between 40px (collapsed) and full screen minus top margin
      let clampedHeight = Math.max(40, Math.min(newHeight, windowHeight - 90));

      // Snap to medium size (300px) when within 30px range
      if (Math.abs(clampedHeight - 300) < 30) {
        clampedHeight = 300;
      }

      setPanelHeight(clampedHeight);

      // Update states based on height
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

      // SENIOR DEV INTERACTION PATTERN: Directional Hysteresis
      // The threshold to "leave" a state depends on direction.
      // It should be EASY to leave (low threshold) and Sticky to arrive.

      if (isDraggingUp) {
        // DRAGGING UP (Expanding)
        if (panelHeight > MAX_HEIGHT - 200) {
          finalHeight = MAX_HEIGHT; // Easy to hit Max
        } else if (panelHeight > 70) {
          // SUPER EAGER: unique "flick" feel. 
          // Collapsed is 40px. If you drag up just 30px (to 70px), it snaps to Medium (300px).
          finalHeight = MID_HEIGHT;
        } else {
          finalHeight = MIN_HEIGHT; // Stay collapsed if barely matched
        }
      } else {
        // DRAGGING DOWN (Collapsing)
        if (panelHeight > MAX_HEIGHT - 100) {
          finalHeight = MAX_HEIGHT; // Sticky Max
        } else if (panelHeight > 240) {
          finalHeight = MID_HEIGHT; // Sticky Mid
        } else {
          finalHeight = MIN_HEIGHT; // Very easy to collapse
        }
      }

      setPanelHeight(finalHeight);

      // Update states based on final height
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
  }, [isDragging]);

  const advanceRound = () => {
    setIsRecalculating(true);
    setRecalcTrigger(p => p + 1);

    setTimeout(() => {
      setState(prev => {
        // 1. Commit current state to history
        const newEntry: HistoryEntry = {
          round: prev.currentRound,
          usStrategy: prev.usStrategy,
          chinaStrategy: prev.chinaStrategy,
          payoff: currentPayoff
        };

        const newHistory = [...prev.history, newEntry];
        let nextChinaStrategy = prev.chinaStrategy;

        // 2. Determine China's NEXT strategy based on mode
        if (prev.chinaStrategyMode === 'TIT_FOR_TAT') {
          // Copy US strategy from this round for the next
          nextChinaStrategy = prev.usStrategy;
        } else if (prev.chinaStrategyMode === 'GRIM_TRIGGER') {
          // If US EVER escalated to Export Bans (in this round or previous), stay in Export Bans
          const hasEscalated = newHistory.some(h => h.usStrategy === 'EXPORT_BANS');
          if (hasEscalated) {
            nextChinaStrategy = 'EXPORT_BANS';
          }
        } else if (prev.chinaStrategyMode === 'RANDOM') {
          const strategies: Strategy[] = ['FREE_TRADE', 'TARIFFS', 'EXPORT_BANS'];
          nextChinaStrategy = strategies[Math.floor(Math.random() * strategies.length)];
        }

        return {
          ...prev,
          history: newHistory,
          currentRound: prev.currentRound + 1,
          chinaStrategy: nextChinaStrategy
        };
      });
      setIsRecalculating(false);
    }, 600);
  };

  const resetSimulation = () => {
    setState({
      scenario: 'NEUTRAL',
      usStrategy: 'FREE_TRADE',
      chinaStrategy: 'FREE_TRADE',
      usBanFocus: 'AI_CHIPS',
      chinaBanFocus: 'RARE_EARTHS',
      chinaStrategyMode: 'MANUAL',
      currentRound: 1,
      history: []
    });
    setRecalcTrigger(p => p + 1);
  };



  return (
    <div className="h-screen bg-[#f1f3f5] text-[#1c1e21] flex flex-col font-sans overflow-hidden select-none">
      {/* Top Breadcrumb Header */}
      <header className="h-10 shrink-0 border-b border-[#dfe3e6] bg-white flex items-center px-4 gap-2 text-[12px] font-medium text-[#4a5056]">
        {/* Mobile/Tablet Menu Button */}
        {(isMobile || isTablet) && (
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mr-2 p-1 hover:bg-[#f8f9fa] rounded"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <span className={`text-[#868e96] ${isMobile ? 'hidden' : ''}`}>Geopolitical Engine</span>
        <ChevronRight className={`w-3 h-3 text-[#adb5bd] ${isMobile ? 'hidden' : ''}`} />
        <span className="text-[#1c1e21] font-semibold">Strategic Flow Analysis</span>
        <span className={`ml-2 text-[#adb5bd] ${isMobile ? 'hidden' : ''}`}>...</span>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#f8f9fa] border border-[#dee2e6] rounded px-3 py-1">
            <History className="w-3 h-3 text-[#228be6]" />
            <span className="text-[11px] font-black text-[#495057]">ROUND {state.currentRound}</span>
          </div>
          <button
            onClick={resetSimulation}
            className="p-1 px-2 border border-[#dee2e6] rounded bg-white text-[#fa5252] hover:bg-[#fff5f5] text-[10px] font-bold transition-all flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" /> Reset
          </button>

          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
              } else {
                document.exitFullscreen();
              }
            }}
            className="p-1.5 border border-[#dee2e6] rounded bg-white text-[#495057] hover:bg-[#f8f9fa] transition-all"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <div className={`w-2 h-2 rounded-full mx-1 transition-colors ${isRecalculating ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span className={`text-[11px] font-bold text-[#495057] ${isMobile ? 'hidden sm:inline' : ''}`}>{isRecalculating ? 'Processing...' : 'Simulation Active'}</span>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex min-h-0 relative">

        {/* Left Toolbar (Vertical) - Desktop Only */}
        {!isMobile && !isTablet && (
          <aside className="w-10 border-r border-[#dfe3e6] bg-white flex flex-col items-center py-4 gap-6 shrink-0">
            <button onClick={() => setCurrentView('simulation')}>
              <Info className={`w-5 h-5 cursor-pointer transition-colors ${currentView === 'simulation' ? 'text-[#228be6]' : 'text-[#868e96] hover:text-[#228be6]'}`} />
            </button>
            <button onClick={() => setCurrentView('trade_routes')}>
              <Layers className={`w-5 h-5 cursor-pointer transition-colors ${currentView === 'trade_routes' ? 'text-[#228be6]' : 'text-[#868e96] hover:text-[#228be6]'}`} />
            </button>
            <Search className="w-5 h-5 text-[#868e96] hover:text-[#228be6] cursor-pointer" />
            <div className="mt-auto mb-2 flex flex-col items-center gap-4">
              <Settings2 className="w-5 h-5 text-[#868e96] hover:text-[#228be6] cursor-pointer" />
            </div>
          </aside>
        )}

        {/* Center Canvas */}
        <main className="flex-1 flex flex-col min-h-0 bg-[#f8f9fa] relative overflow-hidden">

          {currentView === 'simulation' ? (
            <>
              {/* Canvas Toolbar */}
              <div className="h-12 border-b border-[#dee2e6] bg-white flex items-center px-4 gap-3 z-10 shrink-0 relative justify-between">
                <button
                  onClick={advanceRound}
                  disabled={isRecalculating}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded text-[13px] font-black shadow-md transition-all h-8
                    ${isRecalculating
                      ? 'bg-blue-400 text-white/80 cursor-not-allowed'
                      : 'bg-[#228be6] text-white hover:bg-[#1c7ed6] hover:-translate-y-0.5 active:translate-y-0'
                    }`}
                >
                  <Play className={`w-3.5 h-3.5 fill-white ${isRecalculating ? 'hidden' : ''}`} />
                  {isRecalculating && <RotateCcw className="w-3.5 h-3.5 animate-spin" />}
                  {isRecalculating ? 'Committing...' : 'NEXT ROUND'}
                </button>

                {/* Flow Switcher - Breadcrumb Style */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
                  <button
                    onClick={() => setFlowType('US')}
                    className={`text-[13px] transition-all ${flowType === 'US'
                      ? 'text-slate-900 font-bold'
                      : 'text-slate-400 font-medium hover:text-slate-600'
                      }`}
                  >
                    United States Flow
                  </button>

                  <span className="text-slate-300 font-light">/</span>

                  <button
                    onClick={() => setFlowType('CHINA')}
                    className={`text-[13px] transition-all ${flowType === 'CHINA'
                      ? 'text-slate-900 font-bold'
                      : 'text-slate-400 font-medium hover:text-slate-600'
                      }`}
                  >
                    China Flow
                  </button>
                </div>

                <div className="text-[11px] text-[#868e96] flex items-center gap-4">
                  <span className="flex items-center gap-1"><Database className="w-3 h-3" /> Source: Global Trade Monitor v4.2</span>
                </div>
              </div>

              {/* Graph Workspace */}
              <div className="flex-1 relative overflow-hidden">
                <SupplyChainGraph state={state} payoff={currentPayoff} resetKey={recalcTrigger} flowType={flowType} />

                {/* Bottom Panel (Floating) */}
                <div
                  className={`absolute left-4 right-4 bg-white border border-[#dee2e6] rounded-lg shadow-2xl flex flex-col overflow-hidden z-20 ${isDragging ? 'transition-none' : 'transition-all duration-300 ease-out'
                    }`}
                  style={{
                    bottom: '16px',
                    height: isPanelMaximized
                      ? 'calc(100% - 16px)'
                      : isPanelCollapsed
                        ? '40px'
                        : `${panelHeight}px`
                  }}
                >
                  <div
                    className={`h-10 border-b border-[#dee2e6] flex items-center px-4 bg-[#f8f9fa] shrink-0 ${isDragging ? 'cursor-ns-resize' : 'cursor-pointer'
                      } hover:bg-[#e9ecef] transition-colors relative group`}
                    onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                    onMouseDown={(e) => {
                      // Only start dragging if clicking on the header itself, not buttons
                      if ((e.target as HTMLElement).closest('button')) return;
                      setIsDragging(true);
                      setDragStartY(e.clientY);
                      setDragStartHeight(panelHeight);
                      e.preventDefault();
                    }}
                  >
                    {/* Drag Handle Indicator */}
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-slate-300 rounded-full group-hover:bg-slate-400 transition-colors" />
                    <div className="flex border border-[#dee2e6] rounded overflow-hidden shadow-sm my-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => { setBottomTab('trends'); setIsPanelCollapsed(false); }}
                        className={`px-3 py-1 text-[11px] font-bold transition-all ${bottomTab === 'trends'
                          ? 'bg-[#e7f5ff] text-[#1971c2] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]'
                          : 'bg-white text-[#495057] hover:bg-[#f8f9fa]'
                          }`}
                      >
                        Economic Trends
                      </button>
                      <div className="w-px bg-[#dee2e6]" />
                      <button
                        onClick={() => { setBottomTab('matrix'); setIsPanelCollapsed(false); }}
                        className={`px-3 py-1 text-[11px] font-bold transition-all ${bottomTab === 'matrix'
                          ? 'bg-[#e7f5ff] text-[#1971c2] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]'
                          : 'bg-white text-[#495057] hover:bg-[#f8f9fa]'
                          }`}
                      >
                        Prisoner's Dilemma
                      </button>
                      <div className="w-px bg-[#dee2e6]" />
                      <button
                        onClick={() => { setBottomTab('log'); setIsPanelCollapsed(false); }}
                        className={`px-3 py-1 text-[11px] font-bold transition-all ${bottomTab === 'log'
                          ? 'bg-[#e7f5ff] text-[#1971c2] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]'
                          : 'bg-white text-[#495057] hover:bg-[#f8f9fa]'
                          }`}
                      >
                        Game Log
                      </button>
                    </div>
                    <div className="ml-auto flex items-center gap-2 pr-1">
                      {/* Red: Close/Collapse */}
                      <div
                        className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e] cursor-pointer hover:bg-[#ff3b30] shadow-sm transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsPanelCollapsed(true);
                        }}
                        title="Close Panel"
                      />
                      {/* Yellow: Reset to Medium */}
                      <div
                        className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#d89e24] cursor-pointer hover:bg-[#ffcc00] shadow-sm transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsPanelMaximized(false);
                          setIsPanelCollapsed(false);
                          setPanelHeight(300);
                        }}
                        title="Restore Default Size"
                      />
                      {/* Green: Maximize */}
                      <div
                        className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29] cursor-pointer hover:bg-[#32d74b] shadow-sm transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsPanelMaximized(true);
                          setIsPanelCollapsed(false);
                        }}
                        title="Maximize"
                      />
                    </div>
                  </div>
                  <div className="flex-1 p-4 flex gap-6">
                    {bottomTab === 'trends' && (
                      <div className="w-64 shrink-0 flex flex-col gap-1.5 overflow-y-auto no-scrollbar border-r border-[#f1f3f5] pr-4">
                        <button
                          onClick={() => setActiveMetric('pts_us')}
                          className={`p-1.5 border rounded text-[10px] text-left transition-all ${activeMetric === 'pts_us'
                            ? 'bg-[#e7f5ff] border-[#74c0fc]'
                            : 'bg-white border-[#dee2e6] hover:bg-[#f8f9fa]'
                            }`}
                        >
                          <div className={`font-bold leading-tight ${activeMetric === 'pts_us' ? 'text-[#1971c2]' : 'text-[#495057]'}`}>@pts_us</div>
                          <div className={`text-[9px] leading-tight ${activeMetric === 'pts_us' ? 'text-[#1971c2]' : 'text-[#868e96]'}`}>United States</div>
                        </button>

                        <button
                          onClick={() => setActiveMetric('pts_china')}
                          className={`p-1.5 border rounded text-[10px] text-left transition-all ${activeMetric === 'pts_china'
                            ? 'bg-[#fff5f5] border-[#ff8787]'
                            : 'bg-white border-[#dee2e6] hover:bg-[#f8f9fa]'
                            }`}
                        >
                          <div className={`font-bold leading-tight ${activeMetric === 'pts_china' ? 'text-[#e03131]' : 'text-[#495057]'}`}>@pts_china</div>
                          <div className={`text-[9px] leading-tight ${activeMetric === 'pts_china' ? 'text-[#e03131]' : 'text-[#868e96]'}`}>China</div>
                        </button>

                        <button
                          onClick={() => setActiveMetric('inflation_index')}
                          className={`p-1.5 border rounded text-[10px] text-left transition-all ${activeMetric === 'inflation_index'
                            ? 'bg-[#f8f9fa] border-[#adb5bd]'
                            : 'bg-white border-[#dee2e6] hover:bg-[#f8f9fa]'
                            }`}
                        >
                          <div className={`font-bold leading-tight ${activeMetric === 'inflation_index' ? 'text-[#495057]' : 'text-[#495057]'}`}>@inflation_index</div>
                          <div className={`text-[9px] leading-tight ${activeMetric === 'inflation_index' ? 'text-[#495057]' : 'text-[#868e96]'}`}>Global Average</div>
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
                          {/* Cumulative Outcome Summary Header */}
                          {state.history.length > 0 && (
                            <div className="shrink-0 bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="bg-slate-100 p-1.5 rounded-md">
                                    <Terminal className="w-4 h-4 text-slate-600" />
                                  </div>
                                  <h4 className="text-[12px] font-black uppercase tracking-wider text-slate-700">Cumulative Simulation Result</h4>
                                </div>
                                <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[9px] font-black">
                                  <RotateCcw className="w-3 h-3" /> {state.history.length} ROUNDS COMPLETED
                                </div>
                              </div>

                              {(() => {
                                // Calculate cumulative points
                                const usTotal = state.history.reduce((sum, h) => sum + h.payoff.us.points, 0);
                                const chinaTotal = state.history.reduce((sum, h) => sum + h.payoff.china.points, 0);
                                const avgDiff = (usTotal - chinaTotal) / state.history.length;

                                let status = "STALEMATE";
                                let desc = "Global Optimum: Maximum growth for both.";
                                if (state.usStrategy === 'TARIFFS' && state.chinaStrategy === 'TARIFFS') {
                                  desc = "Nash Equilibrium: Both retaliate; mutual loss.";
                                }
                                let icon = <ShieldAlert className="w-6 h-6 text-slate-400" />;
                                let colorClass = "bg-slate-50 border-slate-200 text-slate-700";

                                if (usTotal / state.history.length < 3 && chinaTotal / state.history.length < 3) {
                                  status = "MUTUAL ATTRITION";
                                  desc = "Economic Catastrophe: Decoupling complete; global recession.";
                                  icon = <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />;
                                  colorClass = "bg-amber-50 border-amber-200 text-amber-900";
                                } else if (avgDiff > 0.8) {
                                  status = "US STRATEGIC LEAD";
                                  desc = "US protects jobs; China loses export revenue.";
                                  icon = <Target className="w-6 h-6 text-blue-500" />;
                                  colorClass = "bg-blue-50 border-blue-200 text-blue-900";
                                } else if (avgDiff < -0.8) {
                                  status = "CHINA STRATEGIC LEAD";
                                  desc = "US loses manufacturing; China gains via protectionism.";
                                  icon = <Brain className="w-6 h-6 text-red-500" />;
                                  colorClass = "bg-red-50 border-red-200 text-red-900";
                                }

                                return (
                                  <div className={`flex items-center gap-6 p-4 rounded-xl border-2 ${colorClass}`}>
                                    <div className="bg-white p-3 rounded-full shadow-sm">
                                      {icon}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-4">
                                        <span className="text-[20px] font-black tracking-tight uppercase leading-none">{status}</span>
                                        <div className="flex items-center gap-4 ml-auto font-black text-[16px]">
                                          <div className="flex flex-col items-center">
                                            <span className="text-[10px] opacity-60 font-black uppercase tracking-widest">TOTAL UNITED STATES</span>
                                            <span>{usTotal.toFixed(1)}</span>
                                          </div>
                                          <div className="w-px h-6 bg-current opacity-20" />
                                          <div className="flex flex-col items-center">
                                            <span className="text-[10px] opacity-60 font-black uppercase tracking-widest">TOTAL CN</span>
                                            <span>{chinaTotal.toFixed(1)}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <p className="text-[13px] font-bold opacity-80 mt-1">{desc}</p>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* History Timeline */}
                          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                            {state.history.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center opacity-40 py-10">
                                <History className="w-10 h-10 mb-2" />
                                <p className="text-[12px] font-black uppercase tracking-widest">No history recorded</p>
                                <p className="text-[10px] mt-2 text-center max-w-[200px]">Advance the round to start the simulation log.</p>
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
                                  <div className="flex-1 bg-white border border-slate-100 rounded-xl p-3 shadow-sm group-hover:border-slate-300 group-hover:shadow-md transition-all">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex gap-6">
                                        <div className="flex flex-col">
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">UNITED STATES MOVE</span>
                                          <span className={`text-[12px] font-black ${entry.usStrategy === 'FREE_TRADE' ? 'text-emerald-600' : 'text-blue-600'}`}>{entry.usStrategy.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">CN MOVE</span>
                                          <span className={`text-[12px] font-black ${entry.chinaStrategy === 'FREE_TRADE' ? 'text-emerald-600' : 'text-red-600'}`}>{entry.chinaStrategy.replace('_', ' ')}</span>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">OUTCOME</span>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[14px] font-black text-blue-600">{entry.payoff.us.points.toFixed(1)}</span>
                                          <span className="text-[10px] font-bold text-slate-300">vs</span>
                                          <span className="text-[14px] font-black text-red-600">{entry.payoff.china.points.toFixed(1)}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="mt-2 text-[11px] text-slate-500 font-bold italic leading-relaxed border-t border-slate-50 pt-2 opacity-90">
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
          ) : (
            <TradeRoutes state={state} />
          )}
        </main>

        {/* Right Sidebar (Config) */}
        <aside className="w-80 border-l border-[#dfe3e6] bg-white flex flex-col shrink-0">
          <div className="h-12 border-b border-[#dee2e6] flex items-center px-4 gap-6 shrink-0">
            <button
              onClick={() => setActiveTab('config')}
              className={`text-[11px] font-bold uppercase tracking-wider h-12 ${activeTab === 'config' ? 'text-[#228be6] border-b-2 border-[#228be6]' : 'text-[#adb5bd]'}`}
            >
              Model Config
            </button>
            <button
              onClick={() => setActiveTab('intel')}
              className={`text-[11px] font-bold uppercase tracking-wider h-12 ${activeTab === 'intel' ? 'text-[#228be6] border-b-2 border-[#228be6]' : 'text-[#adb5bd]'}`}
            >
              Simulation
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#f8f9fa]/50">
            {activeTab === 'config' ? (
              <>


                <section>
                  <label className="text-[10px] font-black text-[#868e96] uppercase tracking-widest block mb-2">Policy Levers</label>
                  <div className="flex flex-col gap-6">
                    <StrategyToggle
                      label="United States Protocol"
                      value={state.usStrategy}
                      focusValue={state.usBanFocus}
                      onChange={(s) => setState(prev => ({ ...prev, usStrategy: s }))}
                      onFocusChange={(f) => setState(prev => ({ ...prev, usBanFocus: f }))}
                      accentColor="blue"
                      options={['AI_CHIPS', 'CHIP_GEAR', 'CLOUD_TECH']}
                    />

                    <div className="h-px bg-slate-100" />

                    <StrategyToggle
                      label="China Protocol"
                      value={state.chinaStrategy}
                      focusValue={state.chinaBanFocus}
                      onChange={(s) => setState(prev => ({ ...prev, chinaStrategy: s }))}
                      onFocusChange={(f) => setState(prev => ({ ...prev, chinaBanFocus: f }))}
                      accentColor="red"
                      options={['RARE_EARTHS', 'EV_MINERALS', 'LEGACY_CHIPS']}
                    />
                  </div>
                </section>
              </>
            ) : (
              <div className="space-y-4">
                <AIAdvisor state={state} scenario={SCENARIOS[state.scenario]} />
                <div className="bg-white border border-[#dee2e6] p-4 rounded-lg shadow-sm">
                  <h4 className="text-[11px] font-bold text-[#495057] uppercase mb-3 flex items-center gap-2">
                    <History className="w-3 h-3" /> Graph History
                  </h4>
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="text-[10px] p-2 bg-[#f8f9fa] rounded flex items-center justify-between border border-[#f1f3f5]">
                        <span className="text-[#495057]">Checkpoint v1.{i}</span>
                        <span className="text-[#adb5bd]">2m ago</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Side HUD Footer */}
          <div className="border-t border-[#dee2e6] p-4 space-y-2 bg-white">
            <EconomyHUD country="United States" state={currentPayoff.us} color="blue" />
            <EconomyHUD country="China" state={currentPayoff.china} color="red" />

          </div>
        </aside>
      </div>

      {/* Tiny Status Footer */}
      <footer className="h-6 bg-[#1c1e21] flex items-center px-4 justify-between text-[10px] text-[#adb5bd] font-medium shrink-0">
        <div className="flex gap-4">
          <span>Project: GEOPOLITICAL_CORE_V4</span>
          <span>Workspace: Main Flow</span>
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
