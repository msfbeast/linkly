import React, { useEffect, useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Tooltip } from 'react-tooltip';
import { ClickEvent } from '../types';
import { subscribeToClickEvents } from '../services/realtimeService';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, Globe, Map as MapIcon } from 'lucide-react';

// URL to a valid TopoJSON file for the world map
const GEO_URL_WORLD = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
// URL to a valid TopoJSON file for the US map
const GEO_URL_US = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

interface LiveWorldMapProps {
    clickHistory: ClickEvent[];
    className?: string;
}

interface MapClick {
    id: string;
    coordinates: [number, number];
    country: string;
    region?: string;
    timestamp: number;
}

type ViewMode = 'world' | 'usa';

const LiveWorldMap: React.FC<LiveWorldMapProps> = ({ clickHistory, className = '' }) => {
    const [recentClicks, setRecentClicks] = useState<MapClick[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('world');

    // Process historical data for heatmap
    const locationCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        clickHistory.forEach(click => {
            if (viewMode === 'world') {
                if (click.country) {
                    counts[click.country] = (counts[click.country] || 0) + 1;
                }
            } else {
                // In USA mode, aggregate by region (State)
                // We check if the click is from US to avoid pollution
                if (click.country === 'United States' && click.region) {
                    counts[click.region] = (counts[click.region] || 0) + 1;
                }
            }
        });
        return counts;
    }, [clickHistory, viewMode]);

    const maxClicks = Math.max(...Object.values(locationCounts), 1);

    // Color scale for heatmap
    const colorScale = scaleLinear<string>()
        .domain([0, maxClicks])
        .range(["#1e293b", "#06b6d4"]); // slate-800 to cyan-500

    // Subscribe to real-time clicks
    useEffect(() => {
        const unsubscribe = subscribeToClickEvents((event) => {
            let coordinates: [number, number] = [0, 0];

            // Use precise coordinates if available
            if (event.click.longitude && event.click.latitude) {
                coordinates = [event.click.longitude, event.click.latitude];
            } else {
                // Fallback: Random placement
                coordinates = [
                    (Math.random() * 360) - 180,
                    (Math.random() * 160) - 80
                ];
            }

            const newClick: MapClick = {
                id: Math.random().toString(36).substr(2, 9),
                coordinates,
                country: event.click.country || 'Unknown',
                region: event.click.region,
                timestamp: Date.now(),
            };

            setRecentClicks(prev => [...prev, newClick]);

            // Remove click marker after animation
            setTimeout(() => {
                setRecentClicks(prev => prev.filter(c => c.id !== newClick.id));
            }, 2000);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className={`relative bg-[#12121a] border border-white/5 rounded-2xl overflow-hidden transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : 'h-[500px]'} ${className}`}>

            {/* Header / Controls */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-4">
                <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        {viewMode === 'world' ? 'Live Global View' : 'Live US View'}
                    </h3>
                </div>
            </div>

            <div className="absolute top-4 right-4 z-10 flex gap-2">
                {/* View Toggle */}
                <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-1 rounded-xl flex">
                    <button
                        onClick={() => setViewMode('world')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'world' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
                        title="World View"
                    >
                        <Globe className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('usa')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'usa' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
                        title="USA View"
                    >
                        <MapIcon className="w-5 h-5" />
                    </button>
                </div>

                <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
            </div>

            {/* Map */}
            <ComposableMap
                projection={viewMode === 'world' ? "geoMercator" : "geoAlbersUsa"}
                projectionConfig={viewMode === 'world' ? { scale: 140 } : { scale: 1000 }}
                className="w-full h-full bg-[#0a0a0f]"
            >
                <ZoomableGroup center={[0, 0]} zoom={1}>
                    <Geographies geography={viewMode === 'world' ? GEO_URL_WORLD : GEO_URL_US}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const locationName = geo.properties.name;
                                const clickCount = locationCounts[locationName] || 0;

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={clickCount > 0 ? colorScale(clickCount) : "#1e293b"}
                                        stroke="#0f172a"
                                        strokeWidth={0.5}
                                        style={{
                                            default: { outline: "none", transition: "all 250ms" },
                                            hover: { fill: "#22d3ee", outline: "none", cursor: "pointer" },
                                            pressed: { fill: "#06b6d4", outline: "none" },
                                        }}
                                        data-tooltip-id="map-tooltip"
                                        data-tooltip-content={`${locationName}: ${clickCount} clicks`}
                                    />
                                );
                            })
                        }
                    </Geographies>

                    {/* Real-time Click Markers */}
                    <AnimatePresence>
                        {recentClicks.map(click => (
                            <Marker key={click.id} coordinates={click.coordinates}>
                                <g>
                                    <motion.circle
                                        initial={{ r: 2, opacity: 1, strokeWidth: 0 }}
                                        animate={{ r: 20, opacity: 0, strokeWidth: 2 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        fill="none"
                                        stroke="#22d3ee"
                                    />
                                    <circle r={3} fill="#fff" />
                                </g>
                            </Marker>
                        ))}
                    </AnimatePresence>
                </ZoomableGroup>
            </ComposableMap>

            <Tooltip id="map-tooltip" className="z-50 !bg-slate-900 !opacity-100 !border !border-white/10 !rounded-lg !px-3 !py-2 !text-sm !font-medium" />

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                <span>Low Activity</span>
                <div className="w-24 h-2 bg-gradient-to-r from-slate-800 to-cyan-500 rounded-full"></div>
                <span>High Activity</span>
            </div>
        </div>
    );
};

export default LiveWorldMap;
