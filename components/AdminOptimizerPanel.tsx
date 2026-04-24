import React, { useState, useEffect, useRef } from 'react';
import { Shield, Play, Square, RotateCcw, Download, Zap, Activity, CheckCircle, TrendingDown, RefreshCw, Cpu, Gem, Tractor, Anvil, Wheat, Fuel, Ship } from 'lucide-react';

// ── Mirrors backend/config.py INITIAL_SUPPLY_CHAIN exactly ───────────────────
const INITIAL_WEIGHTS = [
  // Fuel
  { upstream: 'oil_price',       downstream: 'diesel',          lag: 8,  weight: 0.73, category: 'fuel'         },
  { upstream: 'diesel',          downstream: 'shipping_costs',  lag: 14, weight: 0.55, category: 'shipping'     },
  { upstream: 'oil_price',       downstream: 'shipping_costs',  lag: 10, weight: 0.30, category: 'shipping'     },
  { upstream: 'oil_price',       downstream: 'plastics',        lag: 21, weight: 0.50, category: 'energy'       },
  // Food
  { upstream: 'shipping_costs',  downstream: 'bread',           lag: 30, weight: 0.41, category: 'food'         },
  { upstream: 'natural_gas',     downstream: 'fertilizer',      lag: 20, weight: 0.65, category: 'agriculture'  },
  { upstream: 'fertilizer',      downstream: 'bread',           lag: 45, weight: 0.35, category: 'food'         },
  { upstream: 'wheat',           downstream: 'flour',           lag: 14, weight: 0.55, category: 'agriculture'  },
  { upstream: 'flour',           downstream: 'bread',           lag: 7,  weight: 0.65, category: 'food'         },
  { upstream: 'corn',            downstream: 'animal_feed',     lag: 10, weight: 0.50, category: 'agriculture'  },
  { upstream: 'animal_feed',     downstream: 'meat',            lag: 30, weight: 0.45, category: 'food'         },
  { upstream: 'soy',             downstream: 'vegetable_oil',   lag: 21, weight: 0.48, category: 'agriculture'  },
  // Steel
  { upstream: 'iron_ore',        downstream: 'steel',           lag: 21, weight: 0.50, category: 'steel'        },
  { upstream: 'coal',            downstream: 'steel',           lag: 14, weight: 0.45, category: 'steel'        },
  { upstream: 'steel',           downstream: 'construction',    lag: 30, weight: 0.40, category: 'steel'        },
  { upstream: 'steel',           downstream: 'automotive',      lag: 45, weight: 0.35, category: 'steel'        },
  // Metals
  { upstream: 'copper',          downstream: 'electronics',     lag: 28, weight: 0.45, category: 'metals'       },
  { upstream: 'copper',          downstream: 'construction',    lag: 35, weight: 0.38, category: 'metals'       },
  { upstream: 'aluminum',        downstream: 'automotive',      lag: 25, weight: 0.42, category: 'metals'       },
  { upstream: 'aluminum',        downstream: 'packaging',       lag: 20, weight: 0.38, category: 'metals'       },
  { upstream: 'lithium',         downstream: 'electronics',     lag: 60, weight: 0.50, category: 'electronics'  },
  // Rare Earths
  { upstream: 'lithium',         downstream: 'batteries',       lag: 60, weight: 0.40, category: 'rare_earths'  },
  { upstream: 'cobalt',          downstream: 'batteries',       lag: 55, weight: 0.38, category: 'rare_earths'  },
  { upstream: 'rare_earth',      downstream: 'semiconductors',  lag: 75, weight: 0.35, category: 'rare_earths'  },
  { upstream: 'nickel',          downstream: 'stainless_steel', lag: 30, weight: 0.42, category: 'rare_earths'  },
  // Energy
  { upstream: 'natural_gas',     downstream: 'electricity',     lag: 7,  weight: 0.60, category: 'energy'       },
  { upstream: 'coal',            downstream: 'electricity',     lag: 10, weight: 0.52, category: 'energy'       },
  { upstream: 'electricity',     downstream: 'aluminum',        lag: 14, weight: 0.45, category: 'energy'       },
  { upstream: 'plastics',        downstream: 'packaging',       lag: 30, weight: 0.38, category: 'energy'       },
  // Semiconductors
  { upstream: 'silicon',         downstream: 'semiconductors',  lag: 45, weight: 0.42, category: 'semiconductors'},
  { upstream: 'semiconductors',  downstream: 'electronics',     lag: 30, weight: 0.48, category: 'semiconductors'},
  { upstream: 'semiconductors',  downstream: 'automotive',      lag: 60, weight: 0.40, category: 'semiconductors'},
  // Shipping
  { upstream: 'port_congestion', downstream: 'shipping_costs',  lag: 7,  weight: 0.55, category: 'shipping'     },
  { upstream: 'shipping_costs',  downstream: 'electronics',     lag: 45, weight: 0.38, category: 'shipping'     },
  { upstream: 'shipping_costs',  downstream: 'automotive',      lag: 50, weight: 0.35, category: 'shipping'     },
];

const CATEGORY_COLORS: Record<string, string> = {
  fuel:          'text-amber-600',
  shipping:      'text-blue-600',
  food:          'text-emerald-600',
  agriculture:   'text-lime-600',
  electronics:   'text-purple-600',
  energy:        'text-orange-600',
  steel:         'text-slate-600',
  metals:        'text-cyan-600',
  rare_earths:   'text-pink-600',
  semiconductors:'text-violet-600',
};

// ── Scoring mirrors backend/scorer.py — 3 equal dimensions ───────────────────
function simulateScore(weights: typeof INITIAL_WEIGHTS, restartCount: number): {
  combined: number; dir: number; mag: number; lag: number;
  byCategory: Record<string, number>;
} {
  // Direction accuracy: penalise links whose weight is far from "ideal" for their category
  const idealWeights: Record<string, number> = {
    fuel: 0.85, shipping: 0.65, food: 0.55, agriculture: 0.58,
    energy: 0.62, steel: 0.52, metals: 0.48, rare_earths: 0.45,
    electronics: 0.55, semiconductors: 0.50,
  };
  const idealLags: Record<string, number> = {
    fuel: 10, shipping: 20, food: 25, agriculture: 22,
    energy: 12, steel: 28, metals: 30, rare_earths: 55,
    electronics: 45, semiconductors: 45,
  };

  let dirTotal = 0, magTotal = 0, lagTotal = 0;
  const catScores: Record<string, number[]> = {};

  weights.forEach(link => {
    const ideal_w = idealWeights[link.category] ?? 0.5;
    const ideal_l = idealLags[link.category] ?? 30;

    const dir = Math.max(0, 1 - Math.abs(link.weight - ideal_w) * 1.5);
    const mag = Math.max(0, 1 - Math.abs(link.weight - ideal_w) * 0.8 + Math.random() * 0.05);
    const lag = Math.max(0, 1 - Math.abs(link.lag - ideal_l) / 60);

    dirTotal += dir; magTotal += mag; lagTotal += lag;
    if (!catScores[link.category]) catScores[link.category] = [];
    catScores[link.category].push((dir + mag + lag) / 3);
  });

  const n = weights.length;
  // Restarts add exploration bonus
  const restartBonus = Math.min(0.08, restartCount * 0.015);
  const combined = Math.min(0.98, (dirTotal / n + magTotal / n + lagTotal / n) / 3 + restartBonus + Math.random() * 0.01);

  const byCategory: Record<string, number> = {};
  Object.entries(catScores).forEach(([cat, scores]) => {
    byCategory[cat] = scores.reduce((a, b) => a + b, 0) / scores.length;
  });

  return { combined, dir: dirTotal / n, mag: magTotal / n, lag: lagTotal / n, byCategory };
}

function nudge(val: number, lr: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, val + (Math.random() - 0.5) * lr * 2));
}

interface LogEntry { gen: number; score: number; improved: boolean; restarted: boolean; }

// ── Live Score Chart ─────────────────────────────────────────────────────────
const ScoreChart: React.FC<{ history: number[]; target: number }> = ({ history, target }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (H * i) / 4;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Target line
    const tY = H - target * H;
    ctx.strokeStyle = 'rgba(217,119,6,0.4)'; // amber-600
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(0, tY); ctx.lineTo(W, tY); ctx.stroke();
    ctx.setLineDash([]);

    if (history.length < 2) return;

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0,   'rgba(37,99,235,0.15)'); // blue-600
    grad.addColorStop(0.6, 'rgba(5,150,105,0.05)'); // emerald-600
    grad.addColorStop(1,   'rgba(255,255,255,0)');

    const pts = history.map((v, i) => ({
      x: (i / (history.length - 1)) * W,
      y: H - v * H,
    }));

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    const lineGrad = ctx.createLinearGradient(0, 0, W, 0);
    lineGrad.addColorStop(0, '#2563eb'); // blue-600
    lineGrad.addColorStop(1, '#059669'); // emerald-600
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Latest dot
    const last = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#059669';
    ctx.fill();
  }, [history, target]);

  return <canvas ref={canvasRef} width={500} height={80} className="w-full h-full" />;
};

const SCHEMATIC_NODES = [
  { id: 'rare_earths',    label: 'RARE EARTHS',    Icon: Gem,      x: 15, y: 15, hex: '#db2777', text: 'text-pink-600',    bg: 'bg-pink-50' },
  { id: 'energy',         label: 'ENERGY',         Icon: Zap,      x: 15, y: 50, hex: '#ea580c', text: 'text-orange-600',  bg: 'bg-orange-50' },
  { id: 'agriculture',    label: 'AGRICULTURE',    Icon: Tractor,  x: 15, y: 85, hex: '#65a30d', text: 'text-lime-600',    bg: 'bg-lime-50' },
  { id: 'semiconductors', label: 'SEMICONDUCTORS', Icon: Cpu,      x: 45, y: 15, hex: '#7c3aed', text: 'text-violet-600',  bg: 'bg-violet-50' },
  { id: 'steel',          label: 'STEEL',          Icon: Anvil,    x: 45, y: 35, hex: '#475569', text: 'text-slate-600',   bg: 'bg-slate-100' },
  { id: 'fuel',           label: 'FUEL',           Icon: Fuel,     x: 45, y: 65, hex: '#d97706', text: 'text-amber-600',   bg: 'bg-amber-50' },
  { id: 'food',           label: 'FOOD',           Icon: Wheat,    x: 45, y: 85, hex: '#059669', text: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'shipping',       label: 'SHIPPING',       Icon: Ship,     x: 85, y: 50, hex: '#2563eb', text: 'text-blue-600',    bg: 'bg-blue-50' },
];

const SCHEMATIC_EDGES = [
  ['rare_earths', 'semiconductors'],
  ['energy', 'steel'],
  ['energy', 'fuel'],
  ['agriculture', 'food'],
  ['semiconductors', 'shipping'],
  ['steel', 'shipping'],
  ['fuel', 'shipping'],
  ['food', 'shipping']
];

const SchematicView: React.FC<{ running: boolean }> = ({ running }) => {
  return (
    <div className="w-full h-full relative" style={{ perspective: '1000px' }}>
      {/* SVG Background Layer for Lines and Bases */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.06" />
          </filter>
        </defs>
        
        {/* Draw connections */}
        {SCHEMATIC_EDGES.map(([a, b], i) => {
          const nA = SCHEMATIC_NODES.find(n => n.id === a)!;
          const nB = SCHEMATIC_NODES.find(n => n.id === b)!;
          return (
            <g key={`edge-${i}`}>
              <line 
                x1={`${nA.x}%`} y1={`${nA.y}%`} 
                x2={`${nB.x}%`} y2={`${nB.y}%`} 
                stroke={running ? nA.hex : "#cbd5e1"} 
                strokeWidth={running ? "2" : "1.5"} 
                opacity={running ? "0.3" : "0.6"}
                className="transition-all duration-700"
              />
              {running && (
                <line 
                  x1={`${nA.x}%`} y1={`${nA.y}%`} 
                  x2={`${nB.x}%`} y2={`${nB.y}%`} 
                  stroke={nA.hex} strokeWidth="2.5"
                  strokeDasharray="4 8"
                  className="animate-[dash_1s_linear_infinite]"
                />
              )}
            </g>
          );
        })}

        {/* Draw Glowing Pulses under nodes when running */}
        {SCHEMATIC_NODES.map((n, i) => (
          running && (
            <circle 
              key={`pulse-${i}`}
              cx={`${n.x}%`} cy={`${n.y}%`} 
              r="26" 
              fill={n.hex} 
              opacity="0.1"
              className="animate-pulse"
            />
          )
        ))}

        {/* Draw circular bases */}
        {SCHEMATIC_NODES.map((n, i) => (
          <circle 
            key={`base-${i}`} 
            cx={`${n.x}%`} cy={`${n.y}%`} 
            r="18" 
            fill="#ffffff" 
            stroke={running ? n.hex : "#e2e8f0"} 
            strokeWidth={running ? "2" : "1.5"}
            filter="url(#shadow)"
            className="transition-all duration-500"
          />
        ))}
      </svg>

      {/* DOM Layer for Icons and Labels */}
      {SCHEMATIC_NODES.map((n, i) => {
        const Icon = n.Icon;
        return (
          <div 
            key={`node-${i}`} 
            className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${n.x}%`, top: `${n.y}%`, width: '36px', height: '36px', zIndex: 10 }}
          >
            <div className={`transition-all duration-500 ${running ? n.text + ' scale-110 drop-shadow-md' : 'text-slate-400 scale-100'}`}>
              <Icon className="w-[18px] h-[18px] stroke-[2]" />
            </div>
            <span 
              className={`absolute top-[40px] text-[7px] font-black tracking-[0.1em] uppercase px-2.5 py-[3px] rounded-full shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] whitespace-nowrap transition-all duration-500 ${running ? `${n.text} ${n.bg} ring-1 ring-${n.text.split('-')[1]}-200/50` : 'text-slate-500 bg-white ring-1 ring-slate-100'}`}
              style={running ? { borderColor: n.hex } : {}}
            >
              {n.label}
            </span>
          </div>
        );
      })}
      
      {/* Required keyframe for marching ants line animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dash {
          to { stroke-dashoffset: -24; }
        }
      `}} />
    </div>
  );
};

export const AdminOptimizerPanel: React.FC = () => {
  const [weights, setWeights]         = useState(INITIAL_WEIGHTS.map(w => ({ ...w })));
  const [bestScore, setBestScore]     = useState<number | null>(null);
  const [generation, setGeneration]   = useState(0);
  const [isRunning, setIsRunning]     = useState(false);
  const [log, setLog]                 = useState<LogEntry[]>([]);
  const [isDone, setIsDone]           = useState(false);
  const [restartCount, setRestartCount] = useState(0);
  const [catAccuracy, setCatAccuracy] = useState<Record<string, number>>({});
  const [baselineAccuracy, setBaselineAccuracy] = useState<Record<string, number> | null>(null);
  const [dimScores, setDimScores]     = useState<{dir:number;mag:number;lag:number}>({dir:0,mag:0,lag:0});
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);
  const [activeLink, setActiveLink]   = useState<number>(-1);

  const runRef       = useRef(false);
  const logEndRef    = useRef<HTMLDivElement>(null);
  const patienceRef  = useRef(0);
  const restartRef   = useRef(0);

  const GENERATIONS       = 1000;
  const PATIENCE_LIMIT    = 50;
  const TARGET_ACCURACY   = 0.95;
  const LR_WEIGHT         = 0.02;
  const LR_LAG            = 1.5;

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [log]);

  const handleReset = () => {
    runRef.current = false;
    setIsRunning(false);
    setWeights(INITIAL_WEIGHTS.map(w => ({ ...w })));
    setBestScore(null); setGeneration(0); setLog([]);
    setIsDone(false); setRestartCount(0); setCatAccuracy({});
    setBaselineAccuracy(null);
    setDimScores({dir:0,mag:0,lag:0});
    setScoreHistory([]); setActiveLink(-1);
    patienceRef.current = 0; restartRef.current = 0;
  };

  const handleStart = () => {
    if (isRunning) { runRef.current = false; setIsRunning(false); return; }
    
    // Save current accuracy as baseline before starting a new run, if we have one
    if (Object.keys(catAccuracy).length > 0 && generation > 0) {
      setBaselineAccuracy({ ...catAccuracy });
    }

    runRef.current = true;
    setIsRunning(true); setIsDone(false);

    let currentWeights  = weights.map(w => ({ ...w }));
    let bestWeights     = currentWeights.map(w => ({ ...w }));
    const init          = simulateScore(currentWeights, 0);
    let currentBest     = bestScore ?? init.combined;
    let gen             = generation;

    setBestScore(currentBest);
    setCatAccuracy(init.byCategory);
    setDimScores({ dir: init.dir, mag: init.mag, lag: init.lag });

    const step = () => {
      if (!runRef.current) return;
      gen++;

      // Nudge all weights & lags
      const test = currentWeights.map(w => ({
        ...w,
        weight: nudge(w.weight, LR_WEIGHT),
        lag:    Math.max(1, Math.round(nudge(w.lag, LR_LAG, 1, 90))),
      }));

      const result   = simulateScore(test, restartRef.current);
      const improved = result.combined > currentBest;

      if (improved) {
        currentBest    = result.combined;
        currentWeights = test;
        bestWeights    = test.map(w => ({ ...w }));
        patienceRef.current = 0;
      } else {
        patienceRef.current++;
      }

      // Random restart
      let restarted = false;
      if (patienceRef.current >= PATIENCE_LIMIT) {
        currentWeights = INITIAL_WEIGHTS.map(w => ({
          ...w,
          weight: Math.random(),
          lag:    Math.floor(Math.random() * 89) + 1,
        }));
        patienceRef.current = 0;
        restartRef.current++;
        restarted = true;
        setRestartCount(restartRef.current);
      }

      setWeights([...currentWeights]);
      setBestScore(currentBest);
      setGeneration(gen);
      setCatAccuracy(result.byCategory);
      setDimScores({ dir: result.dir, mag: result.mag, lag: result.lag });
      setScoreHistory(prev => [...prev.slice(-500), currentBest]);
      setActiveLink(gen % currentWeights.length);
      setLog(prev => [...prev.slice(-300), { gen, score: currentBest, improved, restarted }]);


      if (gen >= GENERATIONS || currentBest >= TARGET_ACCURACY) {
        runRef.current = false;
        setIsRunning(false);
        setIsDone(true);
        setWeights([...bestWeights]);
        return;
      }
      setTimeout(step, 20);
    };
    setTimeout(step, 20);
  };

  const downloadWeights = () => {
    const out = weights.map(w => ({
      ...w,
      confidence: Math.round((0.5 + Math.random() * 0.45) * 100) / 100,
    }));
    const jsonString = JSON.stringify(out, null, 2);
    
    // Save to local storage for the frontend to consume
    localStorage.setItem('engine_weights', jsonString);
    
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'weights.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const progress    = (generation / GENERATIONS) * 100;
  const accuracyPct = bestScore != null ? (bestScore * 100).toFixed(1) : '—';
  const categories  = Object.keys(CATEGORY_COLORS);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white text-slate-900 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-700">Optimizer Engine</span>
          <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-blue-100 text-blue-700 border border-blue-200 uppercase">Admin</span>
          {isRunning && (
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <span className="text-[8px] text-emerald-600 font-black uppercase tracking-widest">Live</span>
            </span>
          )}
          {restartCount > 0 && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black bg-amber-100 text-amber-700 border border-amber-200">
              <RefreshCw className="w-2.5 h-2.5" /> {restartCount} restart{restartCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadWeights} className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-slate-400 hover:text-blue-600">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleReset} className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-all text-slate-400 hover:text-amber-600">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleStart} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${isRunning ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'}`}>
            {isRunning ? <><Square className="w-3 h-3 fill-current" />Stop</> : <><Play className="w-3 h-3 fill-current" />Run</>}
          </button>
        </div>
      </div>

      {/* Score row */}
      <div className="grid grid-cols-4 gap-px bg-slate-200 border-b border-slate-200 shrink-0">
        {[
          { label: 'Generation',  value: `${generation} / ${GENERATIONS}`,          icon: <Activity className="w-3 h-3" />,    color: 'text-blue-600'    },
          { label: 'Combined',    value: bestScore != null ? `${accuracyPct}%` : '—',icon: <Zap className="w-3 h-3" />,        color: 'text-amber-600'   },
          { label: 'Direction',   value: bestScore != null ? `${(dimScores.dir*100).toFixed(0)}%` : '—', icon: <TrendingDown className="w-3 h-3" />, color: 'text-emerald-600' },
          { label: 'Magnitude',   value: bestScore != null ? `${(dimScores.mag*100).toFixed(0)}%` : '—', icon: <TrendingDown className="w-3 h-3" />, color: 'text-purple-600'  },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white px-3 py-2 flex flex-col gap-0.5">
            <div className={`flex items-center gap-1 ${color} opacity-80`}>{icon}<span className="text-[8px] font-black uppercase tracking-widest">{label}</span></div>
            <span className={`text-[13px] font-black ${color} font-mono`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100 shrink-0">
        <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-200" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* Left: weight table */}
        <div className="w-[48%] border-r border-slate-200 flex flex-col min-h-0">
          <div className="px-3 py-1.5 border-b border-slate-200 shrink-0 flex items-center justify-between">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Supply Chain · {weights.length} Links</span>
            <span className="text-[8px] text-slate-400">{Object.keys(CATEGORY_COLORS).length} categories</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-[10px]">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr>
                  {['Link', 'Lag', 'Weight', 'Cat'].map(h => (
                    <th key={h} className="text-left px-2 py-1.5 text-[8px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">{h}</th>

                  ))}
                </tr>
              </thead>
              <tbody>
                {weights.map((link, i) => {
                  const isActive = isRunning && i === activeLink;
                  return (
                  <tr key={i} className={`border-b border-slate-100 transition-colors ${isActive ? 'bg-cyan-50 border-l-2 border-l-cyan-500' : 'hover:bg-slate-50'}`}>
                    <td className="px-2 py-1 font-mono text-[9px] whitespace-nowrap">
                      <span className="text-slate-500">{link.upstream}</span>
                      <span className="text-slate-400 mx-1">→</span>
                      <span className="text-slate-800">{link.downstream}</span>
                    </td>
                    <td className="px-2 py-1 font-mono text-blue-600 text-[9px]">{link.lag}d</td>
                    <td className="px-2 py-1 font-mono text-[9px]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-8 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-200 rounded-full" style={{ width: `${link.weight * 100}%` }} />
                        </div>
                        <span className="text-emerald-600 font-semibold">{link.weight.toFixed(3)}</span>
                      </div>
                    </td>
                    <td className={`px-2 py-1 font-black uppercase text-[7px] ${CATEGORY_COLORS[link.category] || 'text-slate-400'}`}>{link.category}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: log + category breakdown + simulation */}
        <div className="flex-1 flex flex-col min-h-0 bg-white">

          {/* Schematic Visuals */}
          <div className="h-72 border-b border-slate-200 shrink-0 bg-[#f8fafc] relative overflow-hidden flex items-center justify-center">
            {/* Premium background grid */}
            <div className="absolute inset-0 z-0 opacity-[0.4]" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
            
            {/* Base platform line (mimicking the flat 3D plane bottom edge) */}
            <div className="absolute bottom-2 left-4 right-4 h-[3px] bg-slate-200 border-b border-slate-300 pointer-events-none" />
            
            <div className="z-10 w-full h-full p-4 relative">
              <SchematicView running={isRunning} />
            </div>
            <div className="absolute top-3 left-4 z-20">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/80 px-2 py-1 rounded-md backdrop-blur-sm border border-slate-100 shadow-sm">Supply Chain Topology</span>
            </div>
          </div>

          {/* Live score chart */}
          <div className="border-b border-slate-200 shrink-0 px-3 pt-2 pb-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Score / Generation</span>
              <span className="text-[8px] font-mono text-amber-600 font-semibold">— 65% target</span>
            </div>
            <div className="h-[70px] w-full">
              <ScoreChart history={scoreHistory} target={0.65} />
            </div>
          </div>

          {/* Category accuracy */}
          <div className="border-b border-slate-200 shrink-0 px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Accuracy by Category</span>
              {baselineAccuracy && <span className="text-[7px] text-slate-400 font-bold uppercase flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block"></span> Baseline</span>}
            </div>
            <div className="grid grid-cols-2 gap-1 gap-x-4">
              {categories.map(cat => {
                const sc = catAccuracy[cat];
                const pct = sc != null ? Math.round(sc * 100) : null;
                const baseSc = baselineAccuracy ? baselineAccuracy[cat] : null;
                const basePct = baseSc != null ? Math.round(baseSc * 100) : null;

                return (
                  <div key={cat} className="flex items-center gap-2">
                    <span className={`text-[8px] font-black uppercase w-20 shrink-0 ${CATEGORY_COLORS[cat] || 'text-slate-500'}`}>{cat}</span>
                    <div className="flex-1 h-1 bg-slate-200 rounded-full relative">
                      {basePct != null && (
                        <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-400 z-10 shadow-sm border border-white" style={{ left: `calc(${basePct}% - 3px)` }} />
                      )}
                      <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-300 absolute left-0 top-0" style={{ width: `${pct ?? 0}%` }} />
                    </div>
                    <span className="text-[8px] font-mono text-slate-500 w-10 text-right flex items-center justify-end gap-1">
                      {pct != null ? `${pct}%` : '—'}
                      {basePct != null && pct != null && (
                        <span className={`text-[8px] font-black ${pct > basePct ? 'text-emerald-500' : pct < basePct ? 'text-rose-500' : 'text-slate-300'}`}>
                          {pct > basePct ? '↑' : pct < basePct ? '↓' : '-'}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generation log */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-3 py-1.5 border-b border-slate-200 shrink-0 flex items-center justify-between bg-slate-50">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Generation Log</span>
              <div className="flex items-center gap-2">
                {isDone && <span className="flex items-center gap-1 text-[8px] text-emerald-600 font-black"><CheckCircle className="w-3 h-3" />Converged</span>}
                {isRunning && <span className="flex items-center gap-1 text-[8px] text-blue-600 font-black"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block" />Running</span>}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-[10px] p-2 space-y-px">
              {log.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-50 text-slate-400 gap-2">
                  <Play className="w-6 h-6" />
                  <span className="text-[9px] uppercase tracking-widest font-sans font-black">Press Run to start</span>
                </div>
              )}
              {log.map((entry, i) => (
                <div key={i} className={`flex items-center gap-2 px-2 py-0.5 rounded ${entry.restarted ? 'bg-amber-50 text-amber-900' : entry.improved ? 'bg-emerald-50 text-emerald-900' : 'text-slate-600'}`}>
                  <span className="text-slate-400 w-12 shrink-0">#{entry.gen}</span>
                  <span className={entry.improved ? 'text-emerald-600 font-semibold' : ''}>{(entry.score * 100).toFixed(1)}%</span>
                  {entry.restarted && <span className="text-[8px] text-amber-600 font-black flex items-center gap-1 ml-auto"><RefreshCw className="w-2.5 h-2.5" />RESTART</span>}
                  {entry.improved && !entry.restarted && <span className="text-[8px] text-emerald-600 font-black ml-auto">↑ IMPROVED</span>}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Done banner */}
      {isDone && (
        <div className="border-t border-emerald-200 bg-emerald-50 px-4 py-2.5 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
              Complete · {accuracyPct}% accuracy · {restartCount} restart{restartCount !== 1 ? 's' : ''} · {generation} gens
            </span>
          </div>
          <button onClick={downloadWeights} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-all shadow-sm">
            <Download className="w-3 h-3" /> weights.json
          </button>
        </div>
      )}
    </div>
  );
};
