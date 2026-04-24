import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import Globe from 'react-globe.gl';
import { GameState, MapMode } from '../types';
import { SCENARIOS, BASE_SECTORS } from '../constants';

interface Props { state: GameState; }

// Industry Hub Definitions
const TECH_HUBS = new Set(['USA', 'TWN', 'KOR', 'JPN', 'NLD', 'ISR', 'IRL', 'CHN', 'SGP', 'GBR', 'SWE', 'FIN', 'CAN']);
const MANU_HUBS = new Set(['CHN', 'DEU', 'VNM', 'MEX', 'JPN', 'KOR', 'IND', 'USA', 'ITA', 'THA', 'MYS', 'TUR', 'POL', 'BGD', 'IDN']);
const ENERGY_HUBS = new Set(['USA', 'SAU', 'RUS', 'CAN', 'CHN', 'IRQ', 'ARE', 'BRA', 'KWT', 'NGA', 'NOR', 'AUS', 'QAT', 'DZA', 'AGO']);
const FINANCE_HUBS = new Set(['USA', 'GBR', 'SGP', 'HKG', 'CHN', 'CHE', 'JPN', 'FRA', 'DEU', 'CAN', 'AUS', 'LUX', 'NLD', 'ARE']);

const COUNTRY_CENTROIDS: Record<string, { lat: number; lng: number; name: string }> = {
  USA: { lat: 37.09, lng: -95.71, name: 'United States' },
  CHN: { lat: 35.86, lng: 104.19, name: 'China' },
  CAN: { lat: 56.13, lng: -106.35, name: 'Canada' },
  GBR: { lat: 55.37, lng: -3.43, name: 'United Kingdom' },
  AUS: { lat: -25.27, lng: 133.77, name: 'Australia' },
  JPN: { lat: 36.20, lng: 138.25, name: 'Japan' },
  DEU: { lat: 51.16, lng: 10.45, name: 'Germany' },
  FRA: { lat: 46.22, lng: 2.21, name: 'France' },
  ITA: { lat: 41.87, lng: 12.56, name: 'Italy' },
  ESP: { lat: 40.46, lng: -3.74, name: 'Spain' },
  RUS: { lat: 61.52, lng: 105.31, name: 'Russia' },
  IND: { lat: 20.59, lng: 78.96, name: 'India' },
  BRA: { lat: -14.23, lng: -51.92, name: 'Brazil' },
  MEX: { lat: 23.63, lng: -102.55, name: 'Mexico' },
  SAU: { lat: 23.88, lng: 45.07, name: 'Saudi Arabia' },
  ARE: { lat: 23.42, lng: 53.84, name: 'UAE' },
  IDN: { lat: -0.78, lng: 113.92, name: 'Indonesia' },
  VNM: { lat: 14.05, lng: 108.27, name: 'Vietnam' },
  KOR: { lat: 35.90, lng: 127.76, name: 'South Korea' },
  SGP: { lat: 1.35, lng: 103.81, name: 'Singapore' },
  MYS: { lat: 4.21, lng: 101.97, name: 'Malaysia' },
  TUR: { lat: 38.96, lng: 35.24, name: 'Turkey' },
  THA: { lat: 15.87, lng: 100.99, name: 'Thailand' },
  POL: { lat: 51.91, lng: 19.14, name: 'Poland' },
  SWE: { lat: 60.12, lng: 18.64, name: 'Sweden' },
  NOR: { lat: 60.47, lng: 8.46, name: 'Norway' },
  FIN: { lat: 61.92, lng: 25.74, name: 'Finland' },
  ISR: { lat: 31.04, lng: 34.85, name: 'Israel' },
  CHE: { lat: 46.81, lng: 8.22, name: 'Switzerland' },
  NLD: { lat: 52.13, lng: 5.29, name: 'Netherlands' },
  TWN: { lat: 23.69, lng: 120.96, name: 'Taiwan' },
  HKG: { lat: 22.31, lng: 114.16, name: 'Hong Kong' },
  IRQ: { lat: 33.22, lng: 43.67, name: 'Iraq' },
  KWT: { lat: 29.31, lng: 47.48, name: 'Kuwait' },
  NGA: { lat: 9.08, lng: 8.67, name: 'Nigeria' },
  QAT: { lat: 25.35, lng: 51.18, name: 'Qatar' },
  DZA: { lat: 28.03, lng: 1.65, name: 'Algeria' },
  AGO: { lat: -11.20, lng: 17.87, name: 'Angola' },
  LUX: { lat: 49.81, lng: 6.12, name: 'Luxembourg' },
  IRL: { lat: 53.41, lng: -8.24, name: 'Ireland' },
  BGD: { lat: 23.68, lng: 90.35, name: 'Bangladesh' }
};

const TRADE_ARCS = [
  { startLat: 37.09, startLng: -95.71, endLat: 23.69, endLng: 120.96, color: ['rgba(250,160,115,0)', 'rgba(25,113,194,0.9)', 'rgba(78,181,247,0.9)', 'rgba(78,181,247,0)'], stroke: 0.7, dash: 1500 },
  { startLat: 35.86, startLng: 104.19, endLat: 51.16, endLng: 10.45, color: ['rgba(250,160,115,0)', 'rgba(224,49,49,0.8)', 'rgba(250,160,115,0.8)', 'rgba(78,181,247,0)'], stroke: 0.5, dash: 1800 },
  { startLat: 55.37, startLng: -3.43, endLat: 1.35, endLng: 103.81, color: ['rgba(43,138,62,0)', 'rgba(43,138,62,0.8)', 'rgba(43,138,62,0)'], stroke: 0.5, dash: 1200 },
  { startLat: 23.88, startLng: 45.07, endLat: 35.86, endLng: 104.19, color: ['rgba(232,89,12,0)', 'rgba(232,89,12,0.7)', 'rgba(232,89,12,0)'], stroke: 0.4, dash: 2000 },
  { startLat: 37.09, startLng: -95.71, endLat: 55.37, endLng: -3.43, color: ['rgba(43,138,62,0)', 'rgba(43,138,62,0.7)', 'rgba(43,138,62,0)'], stroke: 0.4, dash: 2200 },
];

const GLOBAL_EVENTS = [
  // --- CONFLICTS ---
  { lat: 48.37, lng: 31.16, type: 'CONFLICT', label: 'Eastern European Conflict', color: '#ef4444' },
  { lat: 14.59, lng: 42.59, type: 'CONFLICT', label: 'Red Sea Shipping Attacks', color: '#ef4444' },
  { lat: 31.5, lng: 34.46, type: 'CONFLICT', label: 'Gaza Conflict', color: '#ef4444' },
  { lat: 34.8, lng: 38.99, type: 'CONFLICT', label: 'Syrian Civil War', color: '#ef4444' },
  { lat: 12.86, lng: 30.21, type: 'CONFLICT', label: 'Sudan Internal Conflict', color: '#ef4444' },
  { lat: -2.88, lng: 23.65, type: 'CONFLICT', label: 'DRC Resource Conflict', color: '#ef4444' },
  { lat: 21.91, lng: 95.95, type: 'CONFLICT', label: 'Myanmar Civil War', color: '#ef4444' },
  { lat: 5.15, lng: 46.19, type: 'CONFLICT', label: 'Horn of Africa Insurgency', color: '#ef4444' },
  { lat: 15.55, lng: 48.51, type: 'CONFLICT', label: 'Yemen Crisis', color: '#ef4444' },
  { lat: 13.53, lng: 2.46, type: 'CONFLICT', label: 'Sahel Region Insurgency', color: '#ef4444' },
  { lat: 33.93, lng: 67.7, type: 'CONFLICT', label: 'Afghanistan Instability', color: '#ef4444' },
  { lat: 4.57, lng: -74.29, type: 'CONFLICT', label: 'Colombia Cartel Clashes', color: '#ef4444' },

  // --- TENSIONS ---
  { lat: 23.69, lng: 120.96, type: 'TENSION', label: 'Strait Naval Tensions', color: '#f97316' },
  { lat: 14.05, lng: 114.27, type: 'TENSION', label: 'South China Sea Disputes', color: '#f97316' },
  { lat: 34.04, lng: 74.8, type: 'TENSION', label: 'Kashmir Border Standoff', color: '#f97316' },
  { lat: 40.33, lng: 127.51, type: 'TENSION', label: 'Korean Peninsula Escalation', color: '#f97316' },
  { lat: 9.14, lng: -79.73, type: 'TENSION', label: 'Canal Drought Constraints', color: '#f97316' },
  { lat: 5.92, lng: -59.3, type: 'TENSION', label: 'Essequibo Territorial Dispute', color: '#f97316' },
  { lat: 35.68, lng: 51.38, type: 'TENSION', label: 'Iran Nuclear Enrichment', color: '#f97316' },
  { lat: 42.6, lng: 20.9, type: 'TENSION', label: 'Balkans Ethnic Tensions', color: '#f97316' },
  { lat: 25.03, lng: -77.39, type: 'TENSION', label: 'Caribbean Smuggling Routes', color: '#f97316' },
  { lat: 45.42, lng: 36.67, type: 'TENSION', label: 'Black Sea Blockade', color: '#f97316' },
  { lat: 60.12, lng: 18.64, type: 'TENSION', label: 'Baltic Sea NATO Exercises', color: '#f97316' },
  { lat: 38.89, lng: -77.03, type: 'TENSION', label: 'US Domestic Political Strife', color: '#f97316' },

  // --- DISASTERS ---
  { lat: 36.20, lng: 138.25, type: 'DISASTER', label: 'Seismic Activity Risk', color: '#eab308' },
  { lat: 29.76, lng: -95.36, type: 'DISASTER', label: 'Gulf Hurricane Zone', color: '#eab308' },
  { lat: -0.78, lng: 113.92, type: 'DISASTER', label: 'Volcanic Eruption Threat', color: '#eab308' },
  { lat: 23.68, lng: 90.35, type: 'DISASTER', label: 'Monsoon Flooding Risk', color: '#eab308' },
  { lat: -35.67, lng: -71.54, type: 'DISASTER', label: 'Andean Fault Line', color: '#eab308' },
  { lat: 37.77, lng: -122.41, type: 'DISASTER', label: 'San Andreas Fault Risk', color: '#eab308' },
  { lat: 12.87, lng: 121.77, type: 'DISASTER', label: 'Typhoon Alley', color: '#eab308' },
  { lat: -3.46, lng: -62.21, type: 'DISASTER', label: 'Amazon Severe Drought', color: '#eab308' },
  { lat: -25.27, lng: 133.77, type: 'DISASTER', label: 'Australian Bushfire Season', color: '#eab308' },
  { lat: 46.22, lng: 2.21, type: 'DISASTER', label: 'European Heatwave', color: '#eab308' },
  { lat: 51.5, lng: -0.12, type: 'DISASTER', label: 'North Sea Storm Surge', color: '#eab308' },
  { lat: -18.87, lng: 46.88, type: 'DISASTER', label: 'Madagascar Cyclone Path', color: '#eab308' },
  { lat: 25.27, lng: 55.29, type: 'DISASTER', label: 'Extreme Heat Anomalies', color: '#eab308' },
  { lat: 10.48, lng: -66.9, type: 'DISASTER', label: 'Infrastructure Collapse', color: '#eab308' },
];

export const TradeRoutes: React.FC<Props> = ({ state }) => {
  const globeEl = useRef<any>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const userLocRef = useRef<{ lat: number; lng: number }>({ lat: 20, lng: -10 });
  // Tracks the current arc radius (AR) so the controls handler can read it without stale closures
  const ARRef = useRef<number>(0);
  const [dim, setDim] = useState({ w: 0, h: 0 });
  const [mapMode, setMapMode] = useState<MapMode>('TECH');
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredHub, setHoveredHub] = useState<any>(null);
  const [globeReady, setGlobeReady] = useState(false);
  const [polygonOpacity, setPolygonOpacity] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [countries, setCountries] = useState<{ features: any[] }>({ features: [] });
  const [liveJitter, setLiveJitter] = useState({ tech: 0, finance: 0, mfg: 0, energy: 0 });
  const [eventFilters, setEventFilters] = useState(new Set(['CONFLICT', 'TENSION', 'DISASTER']));

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

  const getLiveSector = (sector: any, jitter: number) => ({
    ...sector,
    points: Math.max(0, Math.min(10, Number((sector.points + jitter).toFixed(1)))),
    inflation: Math.max(0, Number((sector.inflation + jitter * 1.5).toFixed(1))),
    growth: Number((sector.growth + jitter * 4).toFixed(1)),
    stability: Math.max(0, Math.min(100, Math.round(sector.stability + jitter * 2)))
  });

  useEffect(() => {
    let mounted = true;
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then((data) => {
        if (!mounted) return;
        if (data.latitude && data.longitude) {
          userLocRef.current = { lat: data.latitude, lng: data.longitude };
          if (globeEl.current) {
            globeEl.current.pointOfView({ lat: data.latitude, lng: data.longitude, altitude: 3.0 }, 0);
          }
        }
      })
      .catch(() => { });
    return () => { mounted = false; };
  }, []);

  const whiteMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xdde8f0 }), []);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(r => r.json()).then(setCountries);
  }, []);

  useEffect(() => {
    const fn = () => {
      if (wrapRef.current)
        setDim({ w: wrapRef.current.clientWidth, h: wrapRef.current.clientHeight });
    };
    fn();
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const handleReady = () => {
    if (!globeEl.current) return;
    const controls = globeEl.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.18;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.zoomSpeed = 3.0;
    globeEl.current.pointOfView({ lat: userLocRef.current.lat, lng: userLocRef.current.lng, altitude: 3.0 });

    setTimeout(() => {
      if (globeEl.current) {
        globeEl.current.scene().traverse((obj: any) => {
          if (obj.isMesh) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((mat: any) => {
              if (!mat || mat === whiteMaterial) return;
              mat.polygonOffset = true;
              mat.polygonOffsetFactor = 1;
              mat.polygonOffsetUnits = 1;
              mat.needsUpdate = true;
            });
          }
        });
      }
      setGlobeReady(true);
    }, 600);

    controls.addEventListener('change', () => {
      if (overlayRef.current && globeEl.current) {
        const cam = globeEl.current.camera();
        const dist = cam.position.length();
        // Compute the globe's current on-screen radius in pixels.
        // react-globe.gl places the globe at THREE.js radius = 100 units.
        const sz = new THREE.Vector2();
        globeEl.current.renderer().getSize(sz);
        const tanHalfFov = Math.tan((cam.fov * Math.PI / 180) / 2);
        const screenGlobeR = 100 * (sz.height / 2) / (dist * tanHalfFov);
        // Fade: fully visible when globe is well inside the arcs,
        //        fully gone when globe edge reaches the arc circle.
        const arcR = ARRef.current;
        const fadeStart = arcR * 0.88;  // begin fading
        const fadeEnd = arcR;         // fully gone when globe == arc radius
        const opacity = Math.max(0, Math.min(1, (fadeEnd - screenGlobeR) / (fadeEnd - fadeStart)));
        overlayRef.current.style.opacity = opacity.toString();

        // LOD toggling based on altitude/distance
        if (wrapRef.current) {
          if (dist < 220) {
            wrapRef.current.classList.add('zoomed-in');
          } else {
            wrapRef.current.classList.remove('zoomed-in');
          }
        }
      }
    });
  };

  useEffect(() => {
    if (!globeReady || countries.features.length === 0) return;
    const start = performance.now();
    const duration = 1400;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setPolygonOpacity(eased);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [globeReady, countries.features.length]);

  const hexToRgba = (hex: string, a: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a.toFixed(3)})`;
  };

  const last = state.history[state.history.length - 1];
  const allSectors = last?.payoff.sectors || BASE_SECTORS;

  const activeJitter = mapMode === 'TECH' ? liveJitter.tech : mapMode === 'MANUFACTURING' ? liveJitter.mfg : mapMode === 'ENERGY' ? liveJitter.energy : liveJitter.finance;
  const sectorState = getLiveSector(allSectors[mapMode], activeJitter);

  const [displayState, setDisplayState] = useState(sectorState);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startStateRef = useRef(sectorState);

  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    startTimeRef.current = null;
    startStateRef.current = { ...displayState };

    const animate = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const elapsed = now - startTimeRef.current;
      const duration = 800;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const interpolate = (start: number, end: number) => start + (end - start) * eased;

      setDisplayState({
        ...sectorState,
        growth: interpolate(startStateRef.current.growth, sectorState.growth),
        points: interpolate(startStateRef.current.points, sectorState.points),
        stability: interpolate(startStateRef.current.stability, sectorState.stability),
        inflation: interpolate(startStateRef.current.inflation, sectorState.inflation),
      });

      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [mapMode, sectorState.growth, sectorState.points, sectorState.stability, sectorState.inflation]);

  const getColor = (d: any) => {
    const id = d.properties.ISO_A3;
    let base = '#eeeded';
    if (mapMode === 'TECH' && TECH_HUBS.has(id)) base = '#74c0fc';
    if (mapMode === 'MANUFACTURING' && MANU_HUBS.has(id)) base = '#ff8787';
    if (mapMode === 'ENERGY' && ENERGY_HUBS.has(id)) base = '#ffa94d';
    if (mapMode === 'FINANCE' && FINANCE_HUBS.has(id)) base = '#69db7c';
    return hexToRgba(base, polygonOpacity);
  };

  const { w, h } = dim;
  const cx = w / 2;
  const cy = h / 2;

  // --- ARC RADIUS FIX ---
  // react-globe.gl renders the globe at ~72% of the smaller container half-dimension.
  // We compute the globe's actual screen radius, then add 18px so the arc hugs it closely.
  const baseSize = Math.min(h * 0.48, w * 0.38, 420);
  const globeRadius = baseSize * 0.72;
  const AR = globeRadius + 18;
  ARRef.current = AR; // keep the zoom-fade handler in sync

  // ── Arc geometry helpers ──────────────────────────────────────────────────
  // Globalance-style arches: 160° total span, hugging the globe perimeter.
  // The arc travels clockwise on the right and counter-clockwise on the left
  // when measured from the top (12 o'clock = 0, bottom = π).
  const ARC_SPAN_DEG = 160;
  const ARC_SPAN = (ARC_SPAN_DEG * Math.PI) / 180;
  // Gap between segments in degrees (converted to fraction of total span)
  const GAP_DEG = 4;
  const GAP_FRAC = GAP_DEG / ARC_SPAN_DEG;

  /**
   * Build an SVG arc path along a circle of radius AR centred at (cx,cy).
   * fStart/fEnd are fractions [0,1] of the total ARC_SPAN.
   * side='left'  → arc runs from top-left to bottom-left  (CCW in SVG = sweepFlag 0)
   * side='right' → arc runs from top-right to bottom-right (CW  in SVG = sweepFlag 1)
   */
  const buildArcPath = (side: 'left' | 'right', fStart: number, fEnd: number) => {
    // Starting polar angle (measured from 12 o'clock = -π/2 in standard math,
    // but we use our own convention: angle 0 = top of circle, +angle = clockwise)
    const halfGap = (Math.PI - ARC_SPAN) / 2; // dead zone on each side
    // For right side: starts at +halfGap (top-right), sweeps clockwise
    // For left side:  starts at -halfGap (top-left), sweeps counter-clockwise
    const sign = side === 'right' ? 1 : -1;
    const a1 = sign * (halfGap + fStart * ARC_SPAN);
    const a2 = sign * (halfGap + fEnd * ARC_SPAN);

    // Convert to SVG coordinates (x right, y down; 0 = top)
    const x1 = cx + AR * Math.sin(a1);
    const y1 = cy - AR * Math.cos(a1);
    const x2 = cx + AR * Math.sin(a2);
    const y2 = cy - AR * Math.cos(a2);

    const sweep = Math.abs(a2 - a1);
    const largeArc = sweep > Math.PI ? 1 : 0;
    const sweepFlag = side === 'right' ? 1 : 0;

    return `M ${x1} ${y1} A ${AR} ${AR} 0 ${largeArc} ${sweepFlag} ${x2} ${y2}`;
  };

  /** XY position of a point at fraction f along a side's arc */
  const getArcPoint = (side: 'left' | 'right', f: number) => {
    const sign = side === 'right' ? 1 : -1;
    const halfGap = (Math.PI - ARC_SPAN) / 2;
    const angle = sign * (halfGap + f * ARC_SPAN);
    return { x: cx + AR * Math.sin(angle), y: cy - AR * Math.cos(angle) };
  };

  /** XY of a point slightly outside the arc radius (for label anchoring) */
  const getOuterPoint = (side: 'left' | 'right', f: number, extra = 28) => {
    const sign = side === 'right' ? 1 : -1;
    const halfGap = (Math.PI - ARC_SPAN) / 2;
    const angle = sign * (halfGap + f * ARC_SPAN);
    const r = AR + extra;
    return { x: cx + r * Math.sin(angle), y: cy - r * Math.cos(angle) };
  };

  // ── Right side: 3 proportional segments (Globalance style) ────────────────
  // Map sector data to 3 bands: HIGH (good/stable), MED, LOW (risk/stress)
  // Normalise to fractions that sum to 1
  const stability = Math.min(Math.max(displayState.stability, 0), 100);
  const rawHigh = stability;                          // stable zone  → blue
  const rawMed = Math.min(100 - stability, 50);      // moderate zone → amber
  const rawLow = Math.max(100 - stability - 50, 0);  // stress zone  → red
  const rawTotal = rawHigh + rawMed + rawLow || 1;
  const segFracs = [rawHigh / rawTotal, rawMed / rawTotal, rawLow / rawTotal];

  // Convert fractions into [fStart, fEnd] ranges with gaps
  const totalGapFrac = GAP_FRAC * 2; // 2 gaps for 3 segments
  const usable = 1 - totalGapFrac;
  const segColors = ['#4ab0f0', '#f09548', '#e03131'];
  const segLabels = [
    { range: 'STABILITY', pct: Math.round(segFracs[0] * 100) },
    { range: 'MODERATE', pct: Math.round(segFracs[1] * 100) },
    { range: 'RISK', pct: Math.round(segFracs[2] * 100) },
  ];

  let cursor = 0;
  const segments = segFracs.map((frac, i) => {
    const segLen = frac * usable;
    const start = cursor;
    const end = cursor + segLen;
    cursor = end + (i < segFracs.length - 1 ? GAP_FRAC : 0);
    return { start, end, color: segColors[i], label: segLabels[i] };
  });

  // ── Left side: single gradient arc + indicator position ──────────────────
  const vitalityVal = Math.min(Math.max(
    (displayState.growth / 20) * 0.5 + (displayState.points / 10) * 0.5, 0
  ), 1);
  const indicatorPos = getArcPoint('left', vitalityVal);

  // Label tick positions anchored to arc endpoints
  const leftTopPt = getOuterPoint('left', 0, 32);
  const leftBottomPt = getOuterPoint('left', 1, 32);
  const leftIndicPt = getOuterPoint('left', vitalityVal, 40);

  const countryInteractiveNodes = useMemo(() => {
    const nodes: any[] = [];
    const activeSet = mapMode === 'TECH' ? TECH_HUBS : mapMode === 'MANUFACTURING' ? MANU_HUBS : mapMode === 'ENERGY' ? ENERGY_HUBS : FINANCE_HUBS;
    const colors = { TECH: '#1971c2', MANUFACTURING: '#e03131', ENERGY: '#e8590c', FINANCE: '#2b8a3e' };

    // 1. Add normal hubs
    activeSet.forEach(iso => {
      if (COUNTRY_CENTROIDS[iso]) {
        nodes.push({ ...COUNTRY_CENTROIDS[iso], iso, c: colors[mapMode], state: sectorState, isHub: true });
      }
    });

    // 2. Add global events (filtered)
    GLOBAL_EVENTS.forEach(ev => {
      if (eventFilters.has(ev.type)) {
        nodes.push({ lat: ev.lat, lng: ev.lng, name: ev.label, type: ev.type, c: ev.color, isEvent: true });
      }
    });

    return nodes;
  }, [mapMode, sectorState, eventFilters]);

  return (
    <div
      ref={wrapRef}
      onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#edf3f7', fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @keyframes radar-pulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(3.5); opacity: 0; }
        }
        .lod-label {
          opacity: 0;
          pointer-events: none;
          position: absolute;
          left: 20px;
          top: -10px;
          white-space: nowrap;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(4px);
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 6px 10px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateX(-10px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .zoomed-in .lod-label {
          opacity: 1;
          transform: translateX(0);
        }
      `}</style>
      <div className="absolute top-10 w-full z-30 flex justify-center pointer-events-none">
        <h1 className="text-2xl font-bold text-[#1c1e21] tracking-tight m-0">Industry Radar: {mapMode}</h1>
      </div>

      <div className="absolute top-8 left-8 z-40">
        <div onClick={() => setShowDropdown(!showDropdown)} className="bg-white border border-[#dee2e6] shadow-sm rounded-lg py-2 px-4 inline-flex items-center text-[11px] font-bold pointer-events-auto cursor-pointer text-[#1c1e21] hover:bg-gray-50 transition-colors">
          INDUSTRY: {mapMode} <span className="text-gray-400 ml-2">▼</span>
        </div>
        {showDropdown && (
          <div className="absolute top-10 left-0 mt-1 w-48 bg-white border border-[#dee2e6] shadow-xl rounded-lg overflow-hidden z-50 pointer-events-auto">
            {['TECH', 'MANUFACTURING', 'ENERGY', 'FINANCE'].map(opt => (
              <div key={opt} onClick={() => { setMapMode(opt as MapMode); setShowDropdown(false); }} className={`px-4 py-3 text-[11px] font-bold cursor-pointer transition-colors hover:bg-gray-50 border-b border-[#f1f3f5] last:border-0 ${mapMode === opt ? 'text-blue-600 bg-blue-50/30' : 'text-[#1c1e21]'}`}>
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="absolute left-8 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3 pointer-events-none">
        {[
          { title: 'TECH & AI', sub: 'GROWTH', val: `${getLiveSector(allSectors.TECH, liveJitter.tech).growth > 0 ? '+' : ''}${getLiveSector(allSectors.TECH, liveJitter.tech).growth.toFixed(1)}%`, color: 'text-blue-600', dot: 'bg-blue-500' },
          { title: 'MANUFACTURING', sub: 'SCORE', val: `${getLiveSector(allSectors.MANUFACTURING, liveJitter.mfg).points.toFixed(1)}/10`, color: 'text-red-600', dot: 'bg-red-500' },
          { title: 'ENERGY', sub: 'STABILITY', val: `${getLiveSector(allSectors.ENERGY, liveJitter.energy).stability}%`, color: 'text-orange-600', dot: 'bg-orange-500' },
          { title: 'FINANCIAL', sub: 'INFLATION', val: `${getLiveSector(allSectors.FINANCE, liveJitter.finance).inflation.toFixed(1)}%`, color: 'text-emerald-600', dot: 'bg-emerald-500' }
        ].map((it, i) => (
          <div key={i} className="flex flex-col gap-1 p-3 rounded-lg bg-white border border-[#dee2e6] shadow-sm w-[160px] pointer-events-auto">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${it.color}`}>{it.title}</span>
              <div className={`w-2 h-2 rounded-full ${it.dot} opacity-80`} />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] uppercase font-bold text-[#1c1e21] opacity-50">{it.sub}</span>
              <span className="text-[16px] font-bold text-[#1c1e21] leading-none mt-1">{it.val}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 text-right">Intel Filters</div>
        {[
          { type: 'CONFLICT', color: '#ef4444' },
          { type: 'TENSION', color: '#f97316' },
          { type: 'DISASTER', color: '#eab308' }
        ].map((filter) => {
          const isActive = eventFilters.has(filter.type);
          return (
            <button
              key={filter.type}
              onClick={() => {
                const next = new Set(eventFilters);
                if (isActive) next.delete(filter.type);
                else next.add(filter.type);
                setEventFilters(next);
              }}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all pointer-events-auto w-[150px]
                ${isActive ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'}`}
            >
              <div style={{ backgroundColor: filter.color }} className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_${filter.color}] ${isActive ? 'animate-pulse' : 'opacity-40'}`} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>
                {filter.type}
              </span>
            </button>
          );
        })}
      </div>

      {w > 0 && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundColor: '#edf3f7' }}>
          <Globe
            ref={globeEl} width={w} height={h} backgroundColor="#edf3f7" globeMaterial={whiteMaterial}
            showAtmosphere={false}
            polygonsData={countries.features} polygonAltitude={0.008} polygonCapColor={getColor}
            polygonSideColor={() => 'rgba(0,0,0,0.02)'} polygonStrokeColor={() => 'rgba(255,255,255,0.25)'}
            arcsData={TRADE_ARCS} arcColor="color" arcDashLength={0.4} arcDashGap={0.6}
            arcDashAnimateTime={(d: any) => d.dash} arcStroke={(d: any) => d.stroke} arcAltitude={0.25}
            htmlElementsData={countryInteractiveNodes}
            htmlElement={(d: any) => {
              const el = document.createElement('div');
              el.style.pointerEvents = 'auto';
              el.style.cursor = 'pointer';

              if (d.isEvent) {
                // Event Marker (Conflict, Disaster, etc)
                el.style.width = '12px';
                el.style.height = '12px';
                el.style.borderRadius = '50%';
                el.style.backgroundColor = d.c;
                el.style.border = '2px solid white';
                el.style.boxShadow = `0 0 10px ${d.c}`;

                // Add pulsing ring
                const ring = document.createElement('div');
                ring.style.position = 'absolute';
                ring.style.inset = '-2px';
                ring.style.borderRadius = '50%';
                ring.style.border = `2px solid ${d.c}`;
                ring.style.animation = 'radar-pulse 2s infinite cubic-bezier(0.4, 0, 0.2, 1)';
                el.appendChild(ring);

                // Add LOD Label
                const label = document.createElement('div');
                label.className = 'lod-label';
                label.innerHTML = `
                  <div style="font-size:9px; font-weight:800; color:${d.c}; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:2px;">${d.type} ALERT</div>
                  <div style="font-size:12px; font-weight:900; color:#111827;">${d.name}</div>
                `;
                el.appendChild(label);

                el.onmouseenter = () => setHoveredHub(d);
                el.onmouseleave = () => setHoveredHub(null);
                return el;
              }

              // Normal Hub Marker
              el.style.width = '14px';
              el.style.height = '14px';
              el.style.borderRadius = '50%';
              el.style.backgroundColor = d.c;
              el.style.border = '3px solid white';
              el.style.boxShadow = '0 0 8px rgba(0,0,0,0.2)';

              // Add LOD Label
              const label = document.createElement('div');
              label.className = 'lod-label';
              label.innerHTML = `
                <div style="font-size:9px; font-weight:800; color:#6b7280; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:2px;">HUB / ${d.iso}</div>
                <div style="font-size:12px; font-weight:900; color:#111827;">${d.name || d.iso}</div>
              `;
              el.appendChild(label);

              el.onmouseenter = () => setHoveredHub(d);
              el.onmouseleave = () => setHoveredHub(null);
              return el;
            }}
            onPolygonHover={(feat: any) => {
              if (!feat) { setHoveredHub(null); return; }
              const iso = feat.properties.ISO_A3;
              const activeSet = mapMode === 'TECH' ? TECH_HUBS : mapMode === 'MANUFACTURING' ? MANU_HUBS : mapMode === 'ENERGY' ? ENERGY_HUBS : FINANCE_HUBS;
              if (activeSet.has(iso)) {
                setHoveredHub({
                  name: feat.properties.NAME || feat.properties.ADMIN,
                  iso,
                  state: sectorState,
                  c: mapMode === 'TECH' ? '#1971c2' : mapMode === 'MANUFACTURING' ? '#e03131' : mapMode === 'ENERGY' ? '#e8590c' : '#2b8a3e'
                });
              } else {
                setHoveredHub(null);
              }
            }}
            onGlobeReady={handleReady}
          />
        </div>
      )}

      {hoveredHub && (
        <div style={{
          position: 'absolute', left: mousePos.x + 20, top: mousePos.y - 120, zIndex: 100,
          pointerEvents: 'none', background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(16px)',
          border: '1px solid #e5e7eb', borderRadius: '16px', padding: '20px', width: '310px',
          boxShadow: '0 20px 40px -12px rgba(0,0,0,0.1)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {hoveredHub.isEvent ? (
            // Event Tooltip
            <>
              <div className="flex items-center gap-2 mb-2">
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: hoveredHub.c }} />
                <div style={{ fontSize: 10, fontWeight: 800, color: hoveredHub.c, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {hoveredHub.type} ALERT
                </div>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {hoveredHub.name}
              </h3>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', margin: 0, lineHeight: 1.4 }}>
                Active intelligence report indicates severe disruption risk to regional supply chain corridors.
              </p>
            </>
          ) : (
            // Normal Hub Tooltip
            <>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: hoveredHub.c }} />
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{mapMode} HUB</div>
                </div>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#111827', margin: '0 0 2px 0', letterSpacing: '-0.02em' }}>{hoveredHub.name}</h3>
              <div style={{ fontSize: '36px', fontWeight: 900, color: '#111827', margin: '0 0 16px 0', lineHeight: 1 }}>{hoveredHub.state?.points.toFixed(1)}/10</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: 8, fontWeight: 800, color: '#9ca3af', marginBottom: 2 }}>STABILITY</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{hoveredHub.state?.stability}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 8, fontWeight: 800, color: '#9ca3af', marginBottom: 2 }}>INFLATION</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: hoveredHub.state?.inflation > 6 ? '#ef4444' : '#111827' }}>{hoveredHub.state?.inflation}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 8, fontWeight: 800, color: '#9ca3af', marginBottom: 2 }}>GROWTH</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: hoveredHub.state?.growth > 0 ? '#10b981' : '#ef4444' }}>{hoveredHub.state?.growth > 0 ? '+' : ''}{hoveredHub.state?.growth.toFixed(1)}%</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {w > 0 && (
        <div ref={overlayRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: globeReady ? 1 : 0, transition: 'opacity 1s ease-in-out' }}>
          <svg style={{ position: 'absolute', inset: 0, zIndex: 10, overflow: 'visible' }} width={w} height={h}>
            <defs>
              {/* Left arc gradient: blue (top) → red (bottom) matching Globalance */}
              <linearGradient id="grad-left" gradientUnits="userSpaceOnUse"
                x1={cx} y1={cy - AR} x2={cx} y2={cy + AR}>
                <stop offset="0%" stopColor="#4ab0f0" />
                <stop offset="60%" stopColor="#f09548" />
                <stop offset="100%" stopColor="#e03131" />
              </linearGradient>
            </defs>

            {/* ── LEFT ARC: single gradient track (ghost + coloured) ── */}
            <path
              d={buildArcPath('left', 0, 1)}
              fill="none" stroke="#94a3b8" strokeWidth={4.5}
              strokeOpacity={0.13} strokeLinecap="round"
            />
            <path
              d={buildArcPath('left', 0, 1)}
              fill="none" stroke="url(#grad-left)" strokeWidth={4.5}
              strokeOpacity={0.9} strokeLinecap="round"
            />

            {/* Indicator dot on left arc */}
            <circle
              cx={indicatorPos.x} cy={indicatorPos.y}
              r={5} fill="#1c1e21" stroke="white" strokeWidth={2}
            />

            {/* ── RIGHT ARC: 3 proportional coloured segments ── */}
            {segments.map((seg, i) => (
              <path
                key={`seg-${i}`}
                d={buildArcPath('right', seg.start, seg.end)}
                fill="none" stroke={seg.color} strokeWidth={4.5}
                strokeOpacity={0.92} strokeLinecap="round"
              />
            ))}

            {/* Endpoint tick dots on right segments */}
            {segments.map((seg, i) => {
              const pt = getArcPoint('right', seg.start);
              return <circle key={`tick-${i}`} cx={pt.x} cy={pt.y} r={2.5} fill={seg.color} opacity={0.6} />;
            })}
            {(() => {
              const last = segments[segments.length - 1];
              const pt = getArcPoint('right', last.end);
              return <circle cx={pt.x} cy={pt.y} r={2.5} fill={last.color} opacity={0.6} />;
            })()}
          </svg>

          {/* ── LEFT SIDE LABELS ── */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 20 }}>
            {/* Top endpoint label */}
            <div style={{
              position: 'absolute',
              left: leftTopPt.x - 68, top: leftTopPt.y - 8,
              textAlign: 'right', width: 60,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4ab0f0', letterSpacing: '0.04em' }}>LOW</div>
            </div>

            {/* Bottom endpoint label */}
            <div style={{
              position: 'absolute',
              left: leftBottomPt.x - 68, top: leftBottomPt.y - 8,
              textAlign: 'right', width: 60,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#e03131', letterSpacing: '0.04em' }}>HIGH</div>
            </div>

            {/* Floating label next to the indicator dot */}
            <div style={{
              position: 'absolute',
              left: leftIndicPt.x - 110, top: leftIndicPt.y - 22,
              textAlign: 'right', width: 100,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 1 }}>
                VITALITY
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#1c1e21', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {displayState.growth > 0 ? '+' : ''}{displayState.growth.toFixed(1)}%
              </div>
            </div>

            {/* ── RIGHT SIDE LABELS (overlap-deconflicted) ── */}
            {(() => {
              const MIN_GAP = 40; // minimum px between label tops
              // Compute raw positions
              const raw = segments.map((seg) => {
                const mid = (seg.start + seg.end) / 2;
                const lp = getOuterPoint('right', mid, 26);
                return { x: lp.x, y: lp.y - 12 };
              });
              // Forward pass: push each label down if too close to the previous one
              const adjusted = [...raw];
              for (let i = 1; i < adjusted.length; i++) {
                if (adjusted[i].y - adjusted[i - 1].y < MIN_GAP) {
                  adjusted[i] = { ...adjusted[i], y: adjusted[i - 1].y + MIN_GAP };
                }
              }
              // Backward pass: pull labels back up if they were pushed too far
              for (let i = adjusted.length - 2; i >= 0; i--) {
                if (adjusted[i + 1].y - adjusted[i].y < MIN_GAP) {
                  adjusted[i] = { ...adjusted[i], y: adjusted[i + 1].y - MIN_GAP };
                }
              }
              return segments.map((seg, i) => (
                <div key={`rlabel-${i}`} style={{
                  position: 'absolute',
                  left: adjusted[i].x + 10, top: adjusted[i].y,
                  width: 100,
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: seg.color,
                    letterSpacing: '0.04em', marginBottom: 1,
                  }}>
                    {seg.label.range}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1c1e21' }}>
                    {seg.label.pct}%
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
};