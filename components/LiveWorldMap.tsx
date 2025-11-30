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
// URL to a valid TopoJSON file for the India map
const GEO_URL_INDIA = "/india-states.json";
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

type ViewMode = 'world' | 'usa' | 'india';

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
            } else if (viewMode === 'usa') {
                // In USA mode, aggregate by region (State)
                if (click.country === 'United States' && click.region) {
                    counts[click.region] = (counts[click.region] || 0) + 1;
                }
            } else if (viewMode === 'india') {
                // In India mode, aggregate by region (State)
                if (click.country === 'India' && click.region) {
                    counts[click.region] = (counts[click.region] || 0) + 1;
                }
            }
        });
        return counts;
    }, [clickHistory, viewMode]);

    const maxClicks = Math.max(...Object.values(locationCounts), 1);

    // Color scale for heatmap - Modern Light Theme
    const colorScale = scaleLinear<string>()
        .domain([0, maxClicks])
        .range(["#F1F5F9", "#93C5FD"]); // slate-100 to blue-300

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

    const getProjectionConfig = () => {
        switch (viewMode) {
            case 'usa':
                return { projection: "geoAlbersUsa", config: { scale: 1000 } };
            case 'india':
                return { projection: "geoMercator", config: { center: [80, 22] as [number, number], scale: 800 } };
            default:
                return { projection: "geoMercator", config: { scale: 140 } };
        }
    };

    const { projection, config } = getProjectionConfig();

    return (
        <div className={`relative bg-white border border-stone-200 rounded-2xl overflow-hidden transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : 'h-[500px]'} ${className}`}>

            {/* Header / Controls */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-4">
                <div className="bg-white/80 backdrop-blur-md border border-stone-200 px-4 py-2 rounded-xl shadow-sm">
                    <h3 className="text-slate-900 font-bold flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                        {viewMode === 'world' ? 'Live Global View' : viewMode === 'usa' ? 'Live US View' : 'Live India View'}
                    </h3>
                </div>
            </div>

            <div className="absolute top-4 right-4 z-10 flex gap-2">
                {/* View Toggle */}
                <div className="bg-white/80 backdrop-blur-md border border-stone-200 p-1 rounded-xl flex shadow-sm">
                    <button
                        onClick={() => setViewMode('world')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'world' ? 'bg-blue-50 text-blue-600' : 'text-stone-400 hover:text-slate-900'}`}
                        title="World View"
                    >
                        <Globe className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('usa')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'usa' ? 'bg-blue-50 text-blue-600' : 'text-stone-400 hover:text-slate-900'}`}
                        title="USA View"
                    >
                        <span className="text-xs font-bold">US</span>
                    </button>
                    <button
                        onClick={() => setViewMode('india')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'india' ? 'bg-blue-50 text-blue-600' : 'text-stone-400 hover:text-slate-900'}`}
                        title="India View"
                    >
                        <span className="text-xs font-bold">IN</span>
                    </button>
                </div>

                <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="bg-white/80 backdrop-blur-md border border-stone-200 p-2 rounded-xl text-stone-500 hover:text-slate-900 transition-colors shadow-sm"
                >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
            </div>

            {/* Map */}
            <ComposableMap
                key={viewMode}
                projection={projection as any}
                projectionConfig={config}
                className="w-full h-full bg-[#FAFAFA]" // Very light grey background
            >
                <ZoomableGroup center={[0, 0]} zoom={1} minZoom={1} maxZoom={4}>
                    <Geographies geography={viewMode === 'world' ? GEO_URL_WORLD : viewMode === 'usa' ? GEO_URL_US : GEO_URL_INDIA}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                // Adjust property name based on map source
                                const locationName = geo.properties.name;
                                const clickCount = locationCounts[locationName] || 0;

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={clickCount > 0 ? colorScale(clickCount) : "#F1F5F9"} // slate-100 default
                                        stroke="#E2E8F0" // slate-200 borders
                                        strokeWidth={0.5}
                                        style={{
                                            default: { outline: "none", transition: "all 250ms" },
                                            hover: { fill: "#BFDBFE", outline: "none", cursor: "pointer" }, // blue-200 hover
                                            pressed: { fill: "#60A5FA", outline: "none" }, // blue-400 pressed
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
                                        stroke="#3B82F6" // blue-500
                                    />
                                    <circle r={3} fill="#2563EB" /> {/* blue-600 */}
                                </g>
                            </Marker>
                        ))}
                    </AnimatePresence>
                </ZoomableGroup>
            </ComposableMap>

            <Tooltip id="map-tooltip" className="z-50 !bg-slate-900 !opacity-100 !border !border-white/10 !rounded-lg !px-3 !py-2 !text-sm !font-medium" />

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-md border border-stone-200 px-4 py-2 rounded-xl text-xs text-stone-500 flex items-center gap-2 shadow-sm">
                <span>Low Activity</span>
                <div className="w-24 h-2 bg-gradient-to-r from-slate-100 to-blue-300 rounded-full"></div>
                <span>High Activity</span>
            </div>
        </div>
    );
};

export default LiveWorldMap;
