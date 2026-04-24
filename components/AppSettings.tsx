import React, { useState } from 'react';
import { Database, Shield, Zap, Globe, Sliders, Key, Save, Server, Eye } from 'lucide-react';

export const AppSettings: React.FC = () => {
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'engine' | 'api' | 'appearance'>('engine');
  const [panicThreshold, setPanicThreshold] = useState<number>(75);

  return (
    <div className="flex-1 w-full h-full bg-[#f8f9fa] flex flex-row overflow-hidden absolute inset-0 z-0">
      
      {/* Internal Settings Menu (Behaves like a secondary sidebar constraint) */}
      <div className="w-56 bg-white border-r border-[#dfe3e6] flex flex-col shrink-0">
        <div className="h-12 border-b border-[#dee2e6] flex items-center px-4 shrink-0">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#1c1e21]">Dashboard Config</span>
        </div>
        
        <div className="flex flex-col gap-0.5 p-3">
          <button
            onClick={() => setActiveSettingsTab('general')}
            className={`flex items-center gap-3 px-3 py-2 rounded text-[11px] font-bold transition-colors ${
              activeSettingsTab === 'general' ? 'bg-[#e7f5ff] text-[#1971c2]' : 'text-[#495057] hover:bg-[#f8f9fa]'
            }`}
          >
            <Sliders className="w-4 h-4" /> GENERAL
          </button>
          <button
            onClick={() => setActiveSettingsTab('engine')}
            className={`flex items-center gap-3 px-3 py-2 rounded text-[11px] font-bold transition-colors ${
              activeSettingsTab === 'engine' ? 'bg-[#e7f5ff] text-[#1971c2]' : 'text-[#495057] hover:bg-[#f8f9fa]'
            }`}
          >
            <Zap className="w-4 h-4" /> RISK ENGINE
          </button>
          <button
            onClick={() => setActiveSettingsTab('api')}
            className={`flex items-center gap-3 px-3 py-2 rounded text-[11px] font-bold transition-colors ${
              activeSettingsTab === 'api' ? 'bg-[#e7f5ff] text-[#1971c2]' : 'text-[#495057] hover:bg-[#f8f9fa]'
            }`}
          >
            <Database className="w-4 h-4" /> DATA SOURCES
          </button>
          <button
            onClick={() => setActiveSettingsTab('appearance')}
            className={`flex items-center gap-3 px-3 py-2 rounded text-[11px] font-bold transition-colors ${
              activeSettingsTab === 'appearance' ? 'bg-[#e7f5ff] text-[#1971c2]' : 'text-[#495057] hover:bg-[#f8f9fa]'
            }`}
          >
            <Eye className="w-4 h-4" /> APPEARANCE
          </button>
        </div>
      </div>

      {/* Settings Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#f8f9fa] flex justify-center">
        <div className="w-full max-w-5xl p-8 lg:p-12">
        
          {activeSettingsTab === 'engine' && (
            <div className="animate-in fade-in duration-300 flex flex-col">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#dee2e6]">
                <div>
                  <h3 className="text-[18px] font-black text-[#1c1e21] tracking-tight flex items-center gap-2 uppercase">
                    <Zap className="w-5 h-5 text-[#228be6]" />
                    Contrarian Risk Engine
                  </h3>
                  <p className="text-[#868e96] text-[12px] font-medium mt-1">Adjust threshold sensitivities and Game Theory multipliers used by the backend AI.</p>
                </div>
                <button className="flex items-center gap-1.5 bg-[#228be6] hover:bg-[#1c7ed6] text-white px-5 py-2 rounded text-[11px] font-black transition-all shadow-sm">
                  <Save className="w-3.5 h-3.5" /> SAVE CHANGES
                </button>
              </div>

              {/* Grid Layout to utilize horizontal space */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Setting 1 - Primary Span */}
                <div className="bg-white border border-[#dee2e6] rounded shadow-sm p-6 lg:col-span-2 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-[13px] font-black text-[#1c1e21] uppercase tracking-wide">Panic Hoarding Threshold</h4>
                      <p className="text-[11px] text-[#868e96] font-medium mt-1">The `base_contrarian_risk` trigger point (0-100) before market panic scaling applies.</p>
                    </div>
                    <div className="bg-[#f8f9fa] border border-[#dee2e6] px-3 py-1 rounded text-[13px] font-black text-[#228be6]">
                      {Number(panicThreshold).toFixed(1)}
                    </div>
                  </div>
                  <input type="range" className="w-full h-1.5 bg-[#dee2e6] rounded appearance-none cursor-pointer accent-[#228be6]" min="0" max="100" value={panicThreshold} onChange={(e) => setPanicThreshold(Number(e.target.value))} />
                  <div className="flex justify-between text-[10px] font-bold text-[#adb5bd] mt-3 uppercase tracking-widest">
                    <span>Rational Markets</span>
                    <span>Hyper-Sensitive</span>
                  </div>
                </div>

                {/* Setting 2 - Left Half */}
                <div className="bg-white border border-[#dee2e6] rounded shadow-sm p-6 flex flex-col justify-between">
                  <div className="mb-4">
                    <h4 className="text-[13px] font-black text-[#1c1e21] uppercase tracking-wide">Stress Factor Multipliers</h4>
                    <p className="text-[11px] text-[#868e96] font-medium mt-1">Which alternative data points inform the stress factor weights?</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="w-4 h-4 rounded border border-[#228be6] bg-[#228be6] flex justify-center items-center">
                         <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-[12px] font-bold text-[#495057] uppercase tracking-wide">Local Energy Tariffs</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="w-4 h-4 rounded border border-[#228be6] bg-[#228be6] flex justify-center items-center">
                         <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-[12px] font-bold text-[#495057] uppercase tracking-wide">Port Congestion Metrics</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group hover:opacity-100 opacity-60">
                      <div className="w-4 h-4 rounded border border-[#dee2e6] bg-[#f8f9fa] flex justify-center items-center"></div>
                      <span className="text-[12px] font-bold text-[#868e96] uppercase tracking-wide">Supplier Social Sentiment (Beta)</span>
                    </label>
                  </div>
                </div>

                {/* Setting 3 & 4 - Right Half */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white border border-[#dee2e6] rounded shadow-sm p-6 flex items-center justify-between">
                        <div className="pr-8">
                            <h4 className="text-[13px] font-black text-[#1c1e21] uppercase tracking-wide">Prisoner's Dilemma Mode</h4>
                            <p className="text-[11px] text-[#868e96] font-medium mt-1">If disabled, the backend acts linearly without human irrationality spikes.</p>
                        </div>
                        <div className="relative w-10 h-5 bg-[#228be6] rounded-full cursor-pointer shadow-inner shrink-0">
                            <div className="absolute right-0.5 top-0.5 bg-white w-4 h-4 rounded-full shadow" />
                        </div>
                    </div>

                    <div className="bg-white border border-[#dee2e6] rounded shadow-sm p-6 flex items-center justify-between">
                        <div className="pr-8">
                            <h4 className="text-[13px] font-black text-[#1c1e21] uppercase tracking-wide">Macro-Economic Smoothing</h4>
                            <p className="text-[11px] text-[#868e96] font-medium mt-1">Tames violent day-to-day volatility by applying a 7-day rolling average to TNX/VIX.</p>
                        </div>
                        <div className="relative w-10 h-5 bg-[#dee2e6] rounded-full cursor-pointer shadow-inner shrink-0">
                            <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full shadow" />
                        </div>
                    </div>
                </div>

              </div>
            </div>
          )}

          {activeSettingsTab === 'api' && (
             <div className="animate-in fade-in duration-300 flex flex-col">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#dee2e6]">
                  <div>
                    <h3 className="text-[18px] font-black text-[#1c1e21] tracking-tight flex items-center gap-2 uppercase">
                      <Database className="w-5 h-5 text-[#2b8a3e]" />
                      Data Sources & APIs
                    </h3>
                    <p className="text-[#868e96] text-[12px] font-medium mt-1">Manage live data connections and real-time backend integrations.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="p-5 bg-white border border-[#dee2e6] rounded shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#f8f9fa] border border-[#e5e7eb] rounded flex items-center justify-center font-black text-[10px] text-[#495057]">YF</div>
                                <div>
                                    <h5 className="font-bold text-[13px] text-[#1c1e21] uppercase tracking-wide">Yahoo Finance</h5>
                                    <p className="text-[11px] text-[#868e96] font-medium mt-0.5">VIX, TNX, and Commodities.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#e6fcf5] text-[#0ca678] text-[10px] font-black uppercase tracking-widest rounded border border-[#63e6be]">
                                <div className="w-1.5 h-1.5 bg-[#0ca678] rounded-full animate-pulse" />
                                CONNECTED
                            </div>
                        </div>
                        <div className="w-full bg-[#f8f9fa] rounded p-3 text-[10px] font-mono text-[#868e96] border border-[#f1f3f5]">
                            yfinance 1.2.0 • Last sync: 2m ago • Latency: 110ms
                        </div>
                    </div>

                    <div className="p-5 bg-white border border-[#dee2e6] rounded shadow-sm flex flex-col justify-between opacity-70 grayscale">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#f8f9fa] border border-[#e5e7eb] rounded flex items-center justify-center font-black text-[10px] text-[#495057]">AV</div>
                                <div>
                                    <h5 className="font-bold text-[13px] text-[#1c1e21] uppercase tracking-wide">Alpha Vantage API</h5>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <Key className="w-3.5 h-3.5 text-[#adb5bd]" />
                                        <input type="password" value="**************" disabled className="text-[11px] text-[#868e96] font-medium bg-transparent outline-none w-24" />
                                    </div>
                                </div>
                            </div>
                            <button className="px-4 py-1.5 bg-[#f8f9fa] text-[#495057] hover:bg-[#e9ecef] transition-colors text-[10px] font-black uppercase tracking-widest rounded border border-[#dee2e6]">
                                EDIT KEY
                            </button>
                        </div>
                        <div className="w-full bg-[#f8f9fa] rounded p-3 text-[10px] font-mono text-[#868e96] border border-[#f1f3f5]">
                            DISCONNECTED • Requires Premium Key
                        </div>
                    </div>

                    <div className="p-5 bg-white border border-[#dee2e6] rounded shadow-sm flex flex-col justify-between opacity-70 grayscale lg:col-span-2 xl:col-span-1">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#f8f9fa] border border-[#e5e7eb] rounded flex items-center justify-center font-black text-[10px] text-[#495057]">SB</div>
                                <div>
                                    <h5 className="font-bold text-[13px] text-[#1c1e21] uppercase tracking-wide">Supabase Edge Function</h5>
                                    <p className="text-[11px] text-[#868e96] font-medium mt-0.5">Remote python engine hosting via REST.</p>
                                </div>
                            </div>
                            <button className="px-4 py-1.5 bg-[#f8f9fa] text-[#495057] hover:bg-[#e9ecef] transition-colors text-[10px] font-black uppercase tracking-widest rounded border border-[#dee2e6]">
                                CONNECT
                            </button>
                        </div>
                         <div className="w-full bg-[#f8f9fa] rounded p-3 text-[10px] font-mono text-[#868e96] border border-[#f1f3f5] overflow-hidden text-ellipsis whitespace-nowrap">
                            Endpoint: https://[project-id].supabase.co/functions/v1/engine
                        </div>
                    </div>
                </div>
             </div>
          )}

          {(activeSettingsTab === 'general' || activeSettingsTab === 'appearance') && (
            <div className="flex flex-col items-center justify-center text-center opacity-40 mt-32 bg-white border border-dashed border-[#dee2e6] rounded-xl p-16">
               <Server className="w-12 h-12 text-[#adb5bd] mb-4" />
               <h3 className="text-[14px] font-black uppercase tracking-wider text-[#495057]">System Module Pending</h3>
               <p className="text-[11px] font-medium text-[#868e96] max-w-sm mt-2">The '{activeSettingsTab}' category is pending integration with your Foundry profile logic. Please check back after next release.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
