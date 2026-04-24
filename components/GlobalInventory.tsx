import React, { useMemo } from 'react';
import { Database, TrendingUp, ShieldCheck, ArrowUpRight, Box, LayoutGrid, Search, Layers, ShoppingBag, ChevronRight, Activity } from 'lucide-react';
import { PredictionLogEntry } from '../types';

interface GlobalInventoryProps {
  networks: any[];
  predictionLog: PredictionLogEntry[];
  onSelectNode: (netId: string, nodeId: string) => void;
}

const getRiskColor = (risk: number) => {
  if (risk >= 75) return { text: 'text-red-500', bg: 'bg-red-500', badge: 'bg-red-50 text-red-600 border-red-100' };
  if (risk >= 45) return { text: 'text-amber-500', bg: 'bg-amber-500', badge: 'bg-amber-50 text-amber-600 border-amber-100' };
  return { text: 'text-emerald-500', bg: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
};

export const GlobalInventory: React.FC<GlobalInventoryProps> = ({
  networks,
  predictionLog,
  onSelectNode
}) => {
  const [search, setSearch] = React.useState('');

  const inventoryItems = useMemo(() => {
    const rawItems: Record<string, any> = {};

    networks.forEach(net => {
      const flattenGenes = (nodes: any[]) => {
        nodes.forEach(node => {
          if (node.category === 'RAW_MATERIAL') {
            if (!rawItems[node.name]) {
              rawItems[node.name] = {
                id: node.id,
                name: node.name,
                category: node.category,
                basePrice: node.basePrice || 100,
                riskScore: node.riskScore,
                unit: node.unit || 'unit',
                usedIn: [{ netId: net.id, netName: net.name }],
                totalSavings: predictionLog
                  .filter(p => p.materialName === node.name && p.status === 'REALIZED')
                  .reduce((sum, p) => sum + (p.savings || 0), 0),
                warningPrice: predictionLog
                  .filter(p => p.materialName === node.name)
                  .sort((a, b) => new Date(a.predictionDate).getTime() - new Date(b.predictionDate).getTime())[0]?.predictedPrice || null
              };
            } else {
              if (!rawItems[node.name].usedIn.find((u: any) => u.netId === net.id)) {
                rawItems[node.name].usedIn.push({ netId: net.id, netName: net.name });
              }
              rawItems[node.name].riskScore = (rawItems[node.name].riskScore + node.riskScore) / 2;
            }
          }
          if (node.children) flattenGenes(node.children);
        });
      };
      flattenGenes(net.genealogy);
    });

    return Object.values(rawItems).filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => b.riskScore - a.riskScore);
  }, [networks, predictionLog, search]);

  const stats = useMemo(() => {
    const totalMaterials = inventoryItems.length;
    const totalGlobalROI = inventoryItems.reduce((sum, i) => sum + i.totalSavings, 0);
    const avgRisk = inventoryItems.reduce((sum, i) => sum + i.riskScore, 0) / (totalMaterials || 1);
    const criticalCount = inventoryItems.filter(i => i.riskScore >= 75).length;
    return { totalMaterials, totalGlobalROI, avgRisk, criticalCount };
  }, [inventoryItems]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-hidden">

      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-8 py-4 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-blue-600" />
            <h1 className="text-[15px] font-black tracking-[0.15em] uppercase text-[#1c1e21]">
              Global Material <span className="text-blue-600">Index</span>
            </h1>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5 ml-6">
            Unified Warehouse & Price Telemetry Engine
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
          <input
            type="text"
            placeholder="Search materials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#f8f9fa] border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-[11px] font-semibold text-slate-700 outline-none focus:border-blue-400 focus:bg-white transition-all w-64 placeholder:text-slate-300 placeholder:font-normal"
          />
        </div>
      </div>

      {/* ── Stat Strip ──────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-slate-100 bg-white px-8 py-0 grid grid-cols-4 divide-x divide-slate-100">
        {[
          {
            label: 'Tracked Materials',
            value: stats.totalMaterials.toString(),
            sub: 'Raw input units indexed',
            icon: Box,
            color: 'text-blue-600',
            iconBg: 'bg-blue-50'
          },
          {
            label: 'Cross-Product ROI',
            value: `$${stats.totalGlobalROI.toLocaleString()}`,
            sub: 'Total capital protected',
            icon: ShieldCheck,
            color: 'text-emerald-600',
            iconBg: 'bg-emerald-50'
          },
          {
            label: 'Avg Scarcity Index',
            value: `${stats.avgRisk.toFixed(1)}%`,
            sub: 'Portfolio-wide risk score',
            icon: Activity,
            color: stats.avgRisk >= 70 ? 'text-red-500' : stats.avgRisk >= 45 ? 'text-amber-500' : 'text-emerald-600',
            iconBg: stats.avgRisk >= 70 ? 'bg-red-50' : stats.avgRisk >= 45 ? 'bg-amber-50' : 'bg-emerald-50'
          },
          {
            label: 'Critical Alerts',
            value: stats.criticalCount.toString(),
            sub: 'Materials at risk ≥ 75%',
            icon: TrendingUp,
            color: stats.criticalCount > 0 ? 'text-red-500' : 'text-slate-400',
            iconBg: stats.criticalCount > 0 ? 'bg-red-50' : 'bg-slate-50'
          }
        ].map((stat, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4">
            <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
              <span className={`text-[22px] font-black font-mono tracking-tighter leading-none mt-0.5 ${stat.color}`}>{stat.value}</span>
              <span className="text-[9px] text-slate-400 mt-0.5">{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 bg-white mx-6 my-4 rounded-xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Table Header */}
        <div className="shrink-0 grid grid-cols-[2fr,1fr,1fr,1fr,0.8fr] items-center px-6 py-3 border-b border-slate-100 bg-[#f8f9fa]">
          {['Material Architecture', 'Market Pricing', 'Structural Risk', 'Usage Footprint', 'ROI Index'].map((col, i) => (
            <div key={col} className={`text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ${i > 0 && i < 4 ? 'text-center' : i === 4 ? 'text-right' : ''}`}>
              {col}
            </div>
          ))}
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto">
          {inventoryItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 opacity-25">
              <ShoppingBag className="w-12 h-12 mb-3 text-slate-400" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">No Indexed Materials Found</h3>
              <p className="text-[10px] text-slate-400 mt-1">Commit a product architecture in SIM mode to populate this index.</p>
            </div>
          ) : (
            inventoryItems.map((item, idx) => {
              const risk = getRiskColor(item.riskScore);
              const livePrice = item.basePrice * (1 + item.riskScore / 100);
              const hasSpike = item.warningPrice && livePrice > item.warningPrice;
              const spikePercent = item.warningPrice ? Math.round((livePrice / item.warningPrice - 1) * 100) : 0;

              return (
                <div
                  key={item.id + idx}
                  className="grid grid-cols-[2fr,1fr,1fr,1fr,0.8fr] items-center px-6 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Material */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors">
                      <Box className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-slate-900 leading-tight">{item.name}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.category.replace('_', ' ')}</div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-baseline gap-1">
                      {item.warningPrice && (
                        <span className="text-[9px] font-medium text-slate-300 font-mono line-through">
                          ${item.warningPrice.toFixed(0)}
                        </span>
                      )}
                      <span className="text-[13px] font-black text-slate-900 font-mono">
                        ${livePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider">per {item.unit}</span>
                      {hasSpike && (
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${risk.badge}`}>
                          +{spikePercent}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Risk */}
                  <div className="flex flex-col items-center gap-1.5">
                    <span className={`text-[13px] font-black font-mono ${risk.text}`}>
                      {Math.round(item.riskScore)}%
                    </span>
                    <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${risk.bg}`}
                        style={{ width: `${item.riskScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Usage */}
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {item.usedIn.map((usage: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => onSelectNode(usage.netId, item.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[9px] font-bold text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all"
                      >
                        <LayoutGrid className="w-2.5 h-2.5 opacity-60" />
                        {usage.netName}
                        <ChevronRight className="w-2.5 h-2.5 opacity-40" />
                      </button>
                    ))}
                  </div>

                  {/* ROI */}
                  <div className="text-right">
                    {item.totalSavings > 0 ? (
                      <>
                        <div className="text-[13px] font-black font-mono text-emerald-600">
                          +${item.totalSavings.toLocaleString()}
                        </div>
                        <div className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">Protected</div>
                      </>
                    ) : (
                      <>
                        <div className="text-[13px] font-black text-slate-200">—</div>
                        <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">Unhedged</div>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Table Footer */}
        {inventoryItems.length > 0 && (
          <div className="shrink-0 border-t border-slate-100 px-6 py-2.5 flex items-center justify-between bg-[#f8f9fa]">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              {inventoryItems.length} material{inventoryItems.length !== 1 ? 's' : ''} indexed
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Sorted by Scarcity Risk ↓
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
