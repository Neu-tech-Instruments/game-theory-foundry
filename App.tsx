
import React, { useState, useEffect } from 'react';
import { GameState, Strategy } from './types';
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
  ChevronDown,
  ChevronRight,
  Database,
  Menu,
  X
} from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<GameState>({
    scenario: 'NEUTRAL',
    usStrategy: 'FREE_TRADE',
    chinaStrategy: 'FREE_TRADE',
    usBanFocus: 'AI_CHIPS',
    chinaBanFocus: 'RARE_EARTHS',
    history: []
  });

  const [currentView, setCurrentView] = useState<'simulation' | 'trade_routes'>('simulation');
  const [activeTab, setActiveTab] = useState<'config' | 'intel'>('config');
  const [bottomTab, setBottomTab] = useState<'trends' | 'matrix'>('trends');
  const [activeMetric, setActiveMetric] = useState<MetricType>('trade_surplus');
  const currentPayoff = useTradeEngine(state);

  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalcTrigger, setRecalcTrigger] = useState(0);

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const handleRecalculate = () => {
    setIsRecalculating(true);
    setRecalcTrigger(p => p + 1);
    // Simulate complex calculation lag
    setTimeout(() => {
      setIsRecalculating(false);
    }, 800);
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

        <div className="ml-auto flex items-center gap-1 bg-[#f8f9fa] border border-[#dee2e6] rounded px-2 py-0.5">
          <div className={`w-2 h-2 rounded-full mr-1 transition-colors ${isRecalculating ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
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
              <div className="h-12 border-b border-[#dee2e6] bg-white flex items-center px-4 gap-3 z-10 shrink-0">
                <div className="flex border border-[#dee2e6] rounded overflow-hidden">
                  <button className="px-3 py-1 bg-white hover:bg-[#f1f3f5] border-r border-[#dee2e6]"><RotateCcw className="w-4 h-4 text-[#495057}" /></button>
                  <button className="px-3 py-1 bg-white hover:bg-[#f1f3f5]"><RotateCcw className="w-4 h-4 text-[#495057] flip-x rotate-180" /></button>
                </div>
                <div className="h-6 w-px bg-[#dee2e6]" />
                <button
                  onClick={handleRecalculate}
                  disabled={isRecalculating}
                  className={`flex items-center gap-2 px-3 py-1 rounded text-[12px] font-bold shadow-sm transition-all
                    ${isRecalculating
                      ? 'bg-blue-400 text-white/80 cursor-not-allowed'
                      : 'bg-[#228be6] text-white hover:bg-[#1c7ed6]'
                    }`}
                >
                  <Play className={`w-3 h-3 fill-white ${isRecalculating ? 'hidden' : ''}`} />
                  {isRecalculating && <RotateCcw className="w-3 h-3 animate-spin" />}
                  {isRecalculating ? 'Calculations...' : 'Recalculate'}
                </button>
                <div className="ml-auto text-[11px] text-[#868e96] flex items-center gap-4">
                  <span className="flex items-center gap-1"><Database className="w-3 h-3" /> Source: Global Trade Monitor v4.2</span>
                </div>
              </div>

              {/* Graph Workspace */}
              <div className="flex-1 relative overflow-hidden">
                <SupplyChainGraph state={state} payoff={currentPayoff} resetKey={recalcTrigger} />

                {/* Bottom Panel (Floating) */}
                <div className={`absolute bottom-4 left-4 right-4 bg-white border border-[#dee2e6] rounded-lg shadow-2xl flex flex-col overflow-hidden z-20 transition-all duration-300 ${isPanelCollapsed ? 'h-10' : 'h-64'}`}>
                  <div
                    className="h-10 border-b border-[#dee2e6] flex items-center px-4 bg-[#f8f9fa] shrink-0 cursor-pointer"
                    onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                  >
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
                        Stability Forecast
                      </button>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                      <Maximize2
                        className="w-3 h-3 text-[#adb5bd] cursor-pointer hover:text-[#228be6]"
                        onClick={(e) => { e.stopPropagation(); setIsPanelCollapsed(false); }}
                      />
                      <ChevronDown
                        className={`w-4 h-4 text-[#adb5bd] cursor-pointer hover:text-[#228be6] transition-transform duration-300 ${isPanelCollapsed ? 'rotate-180' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setIsPanelCollapsed(true); }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 p-4 flex gap-6">
                    <div className="w-64 shrink-0 flex flex-col gap-2 overflow-y-auto no-scrollbar border-r border-[#f1f3f5] pr-4">
                      <button
                        onClick={() => setActiveMetric('trade_surplus')}
                        className={`p-2 border rounded text-[11px] text-left transition-all ${activeMetric === 'trade_surplus'
                          ? 'bg-[#e7f5ff] border-[#339af0]'
                          : 'bg-white border-[#dee2e6] hover:bg-[#f8f9fa]'
                          }`}
                      >
                        <div className={`font-bold ${activeMetric === 'trade_surplus' ? 'text-[#1971c2]' : 'text-[#495057]'}`}>@trade_surplus</div>
                        <div className={`${activeMetric === 'trade_surplus' ? 'text-[#1971c2]' : 'text-[#868e96]'}`}>United States</div>
                      </button>

                      <button
                        onClick={() => setActiveMetric('gdp_forecast')}
                        className={`p-2 border rounded text-[11px] text-left transition-all ${activeMetric === 'gdp_forecast'
                          ? 'bg-[#e7f5ff] border-[#339af0]'
                          : 'bg-white border-[#dee2e6] hover:bg-[#f8f9fa]'
                          }`}
                      >
                        <div className={`font-bold ${activeMetric === 'gdp_forecast' ? 'text-[#1971c2]' : 'text-[#495057]'}`}>@gdp_forecast</div>
                        <div className={`${activeMetric === 'gdp_forecast' ? 'text-[#1971c2]' : 'text-[#868e96]'}`}>China Projection</div>
                      </button>

                      <button
                        onClick={() => setActiveMetric('inflation_index')}
                        className={`p-2 border rounded text-[11px] text-left transition-all ${activeMetric === 'inflation_index'
                          ? 'bg-[#fff5f5] border-[#ff8787]'
                          : 'bg-white border-[#dee2e6] hover:bg-[#f8f9fa]'
                          }`}
                      >
                        <div className={`font-bold ${activeMetric === 'inflation_index' ? 'text-[#e03131]' : 'text-[#495057]'}`}>@inflation_index</div>
                        <div className={`${activeMetric === 'inflation_index' ? 'text-[#e03131]' : 'text-[#868e96]'}`}>Global Average</div>
                      </button>
                    </div>
                    <div className="flex-1 min-w-0 h-full">
                      {bottomTab === 'trends' ? (
                        <TrendChart payoff={currentPayoff} metric={activeMetric} />
                      ) : (
                        <GameMatrix state={state} />
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
                  <label className="text-[10px] font-black text-[#868e96] uppercase tracking-widest block mb-2">Scenario Context</label>
                  <ScenarioSelector current={state.scenario} onChange={(s) => setState(p => ({ ...p, scenario: s }))} />
                </section>

                <section>
                  <label className="text-[10px] font-black text-[#868e96] uppercase tracking-widest block mb-2">Policy Levers</label>
                  <div className="space-y-4">
                    <StrategyToggle
                      label="US Protocol"
                      value={state.usStrategy}
                      focusValue={state.usBanFocus}
                      onChange={(s) => setState(p => ({ ...p, usStrategy: s }))}
                      onFocusChange={(f) => setState(p => ({ ...p, usBanFocus: f }))}
                      accentColor="blue"
                      options={['AI_CHIPS', 'CHIP_GEAR', 'CLOUD_TECH']}
                    />
                    <StrategyToggle
                      label="China Protocol"
                      value={state.chinaStrategy}
                      focusValue={state.chinaBanFocus}
                      onChange={(s) => setState(p => ({ ...p, chinaStrategy: s }))}
                      onFocusChange={(f) => setState(p => ({ ...p, chinaBanFocus: f }))}
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
            <EconomyHUD country="US" state={currentPayoff.us} color="blue" />
            <EconomyHUD country="China" state={currentPayoff.china} color="red" />
            <EconomyHUD country="EU" state={currentPayoff.eu} color="amber" />
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
