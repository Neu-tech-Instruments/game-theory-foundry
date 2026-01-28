
import React, { useRef, useMemo, useEffect, useState } from 'react';
import Globe from 'react-globe.gl';
import { GameState } from '../types';
import {
    ArrowRight,
    ShieldAlert,
    CheckCircle2,
    TrendingUp,
    Clock,
    MapPin,
    Ship,
    AlertTriangle,
    MoreHorizontal
} from 'lucide-react';

interface Props {
    state: GameState;
}

export const TradeRoutes: React.FC<Props> = ({ state }) => {
    const globeEl = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [selectedRoute, setSelectedRoute] = useState<number>(1);

    // Update dimensions on resize
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Auto-rotate
    useEffect(() => {
        if (globeEl.current) {
            globeEl.current.controls().autoRotate = true;
            globeEl.current.controls().autoRotateSpeed = 0.3;
            globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2 });
        }
    }, [globeEl.current]);

    const arcsData = useMemo(() => {
        const baseRoutes = [
            {
                startLat: 40.7128, startLng: -74.0060, // NYC
                endLat: 31.2304, endLng: 121.4737, // Shanghai
            },
            {
                startLat: 22.3193, startLng: 114.1694, // Hong Kong
                endLat: 37.7749, endLng: -122.4194, // SF
            },
            {
                startLat: 1.3521, startLng: 103.8198, // Singapore
                endLat: 25.2048, endLng: 55.2708, // Dubai
            }
        ];

        return baseRoutes.flatMap(route => {
            // Create 1-2 lines per route for better visibility
            return Array.from({ length: 2 }).map((_, i) => {
                const spread = 0.5; // Reduced spread
                // Offset start/end slightly to create subtle variation
                const startLatOffset = (Math.random() - 0.5) * spread;
                const startLngOffset = (Math.random() - 0.5) * spread;
                const endLatOffset = (Math.random() - 0.5) * spread;
                const endLngOffset = (Math.random() - 0.5) * spread;

                return {
                    startLat: route.startLat + startLatOffset,
                    startLng: route.startLng + startLngOffset,
                    endLat: route.endLat + endLatOffset,
                    endLng: route.endLng + endLngOffset,
                    color: ['rgba(180,180,180,0.3)', 'rgba(120,120,120,0.95)'],
                    dashAnimate: 20000 + Math.random() * 20000,
                    stroke: 0.8 + Math.random() * 0.4
                };
            });
        });
    }, []);

    const portsData = useMemo(() => [
        { lat: 40.7128, lng: -74.0060, name: 'New York', color: '#868e96', size: 0.5 },
        { lat: 31.2304, lng: 121.4737, name: 'Shanghai', color: '#868e96', size: 0.7 },
        { lat: 21.3193, lng: 114.1694, name: 'Hong Kong', color: '#868e96', size: 0.5 },
        { lat: 37.7749, lng: -122.4194, name: 'San Francisco', color: '#868e96', size: 0.5 },
        { lat: 38.9072, lng: -77.0369, name: 'Washington DC', color: '#868e96', size: 0.4 },
        { lat: 1.3521, lng: 103.8198, name: 'Singapore', color: '#868e96', size: 0.6 },
        { lat: 25.2048, lng: 55.2708, name: 'Dubai', color: '#868e96', size: 0.5 },
    ], []);

    const routeList = [
        { id: 1, name: 'Trans-Pacific Tech', status: 'active', vol: '$85B', eta: '14h 30m', risk: 'Low' },
        { id: 2, name: 'Atlantic Data Bridge', status: 'active', vol: '$42B', eta: '08h 15m', risk: 'Low' },
        { id: 3, name: 'Belt & Road Energy', status: 'warning', vol: '$120B', eta: 'Delayed', risk: 'High' },
    ];

    const currentRouteData = routeList.find(r => r.id === selectedRoute);

    return (
        <div className="h-full w-full flex flex-col bg-[#f1f3f5] relative overflow-hidden font-sans text-slate-700">

            {/* Globe Layer */}
            <div ref={containerRef} className="absolute inset-0 z-0">
                {dimensions.width > 0 && (
                    <Globe
                        ref={globeEl}
                        width={dimensions.width}
                        height={dimensions.height}
                        globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
                        backgroundColor="#f1f3f5"
                        arcsData={arcsData}
                        arcColor="color"
                        arcDashLength={0.05}
                        arcDashGap={0.02}
                        arcDashAnimateTime={(d: any) => d.dashAnimate}
                        arcStroke="stroke"
                        arcDashInitialGap={(d: any) => Math.random()}
                        pointsData={portsData}
                        pointAltitude={0.02}
                        pointColor="color"
                        pointRadius="size"
                        pointLabel="name"
                        labelsData={portsData}
                        labelLat="lat"
                        labelLng="lng"
                        labelText="name"
                        labelSize={1.6}
                        labelDotRadius={0.4}
                        labelColor={() => 'rgba(255, 255, 255, 0.9)'}
                        labelResolution={2}
                        atmosphereColor="#ffffff"
                        atmosphereAltitude={0.15}
                    />
                )}
            </div>

            {/* --- OVERLAYS --- */}

            {/* Left Panel: Alerts & List */}
            <div className="absolute top-4 left-4 w-72 flex flex-col gap-3 z-10 pointer-events-none">

                {/* Panel Header */}
                <div className="bg-white/95 backdrop-blur-sm border border-slate-200 shadow-sm rounded-lg p-3 pointer-events-auto">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Logistics Alerts</h2>
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    </div>
                    <div className="bg-red-50 border border-red-100 rounded p-2 flex gap-2">
                        <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <div className="text-[10px] font-bold text-red-700">Supply Chain Warning</div>
                            <p className="text-[9px] text-red-600/80 leading-relaxed mt-0.5">
                                Semiconductor shipment delayed at Shanghai Port due to new tariff enforcement.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Route List */}
                <div className="bg-white/95 backdrop-blur-sm border border-slate-200 shadow-sm rounded-lg overflow-hidden pointer-events-auto flex flex-col">
                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-slate-500">Active Corridors</span>
                        <span className="text-[9px] font-bold bg-slate-200 text-slate-500 px-1.5 rounded-full">3</span>
                    </div>
                    <div className="max-h-60 overflow-y-auto no-scrollbar">
                        {routeList.map(r => (
                            <div
                                key={r.id}
                                onClick={() => setSelectedRoute(r.id)}
                                className={`px-3 py-2.5 border-b border-slate-100 last:border-0 cursor-pointer transition-colors ${selectedRoute === r.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${r.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                        <span className={`text-[11px] font-bold ${selectedRoute === r.id ? 'text-blue-700' : 'text-slate-700'}`}>
                                            {r.name}
                                        </span>
                                    </div>
                                    <span className="text-[9px] font-mono text-slate-400">{r.eta}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-1.5 ml-3.5 opacity-60">
                                    <span className="text-[9px] flex items-center gap-1">
                                        <Ship className="w-3 h-3" /> {r.vol}
                                    </span>
                                    <span className="text-[9px] flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> {r.risk}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel: Details */}
            <div className="absolute top-4 right-4 w-64 z-10 pointer-events-none">
                <div className="bg-white/95 backdrop-blur-sm border border-slate-200 shadow-sm rounded-lg p-4 pointer-events-auto flex flex-col gap-4">

                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-widest text-[#228be6]">Route Details</h2>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: #TR-2024-{selectedRoute}</div>
                        </div>
                        <div className="p-1.5 bg-slate-50 rounded border border-slate-200 cursor-pointer hover:bg-slate-100">
                            <MoreHorizontal className="w-3 h-3 text-slate-500" />
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                            <div className="text-[9px] uppercase font-bold text-slate-400 mb-1">Vessel Count</div>
                            <div className="text-sm font-black text-slate-700">14</div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                            <div className="text-[9px] uppercase font-bold text-slate-400 mb-1">Total Volume</div>
                            <div className="text-sm font-black text-slate-700">{currentRouteData?.vol}</div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                            <div className="text-[9px] uppercase font-bold text-slate-400 mb-1">Efficiency</div>
                            <div className="text-sm font-black text-emerald-600">94.2%</div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                            <div className="text-[9px] uppercase font-bold text-slate-400 mb-1">Risk Score</div>
                            <div className="text-sm font-black text-amber-500">{currentRouteData?.risk === 'High' ? '72/100' : '12/100'}</div>
                        </div>
                    </div>

                    {/* Action Requirements */}
                    <div className="space-y-2">
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">Required Actions</div>
                        <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-100 rounded text-blue-800">
                            <span className="text-[10px] font-bold">Approve Reroute</span>
                            <button className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold rounded shadow-sm">
                                Execute
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded text-slate-600">
                            <span className="text-[10px] font-bold">Container Inspection</span>
                            <span className="text-[9px] font-mono text-slate-400">Scheduled</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Panel: Timeline */}
            <div className="absolute bottom-6 left-6 right-6 h-28 z-10 pointer-events-none">
                <div className="w-full h-full bg-white/95 backdrop-blur-sm border border-slate-200 shadow-sm rounded-lg pointer-events-auto flex flex-col">
                    <div className="h-8 border-b border-slate-100 flex items-center px-3 justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shipping Schedule</span>
                        <div className="flex gap-4 text-[9px] font-bold text-slate-400">
                            <span>00:00</span>
                            <span>04:00</span>
                            <span>08:00</span>
                            <span className="text-blue-500">12:00 (NOW)</span>
                            <span>16:00</span>
                            <span>20:00</span>
                            <span>24:00</span>
                        </div>
                    </div>
                    <div className="flex-1 p-3 relative overflow-hidden">
                        {/* Timeline Grid */}
                        <div className="absolute inset-0 flex justify-between px-10 pointer-events-none opacity-20">
                            {[...Array(7)].map((_, i) => <div key={i} className="w-px h-full bg-slate-300 transform translate-x-1/2" />)}
                        </div>

                        {/* Gantt Bars */}
                        <div className="space-y-3 relative z-10 pt-1">
                            <div className="relative h-4 bg-slate-100 rounded w-full overflow-hidden">
                                <div className="absolute left-[10%] w-[40%] h-full bg-blue-500/20 border border-blue-500/50 rounded flex items-center px-2">
                                    <span className="text-[8px] font-bold text-blue-700">Pacific Transit #882</span>
                                </div>
                            </div>
                            <div className="relative h-4 bg-slate-100 rounded w-full overflow-hidden">
                                <div className="absolute left-[30%] w-[25%] h-full bg-emerald-500/20 border border-emerald-500/50 rounded flex items-center px-2">
                                    <span className="text-[8px] font-bold text-emerald-700">Atlantic Crossing #11A</span>
                                </div>
                            </div>
                            <div className="relative h-4 bg-slate-100 rounded w-full overflow-hidden">
                                <div className="absolute left-[60%] w-[30%] h-full bg-amber-500/20 border border-amber-500/50 rounded flex items-center px-2">
                                    <span className="text-[8px] font-bold text-amber-700">Belt-Road #99C</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
