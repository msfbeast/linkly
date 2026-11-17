import React, { useEffect, useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Tooltip } from 'react-tooltip';
import { ClickEvent } from '../types';
import { subscribeToClickEvents } from '../services/realtimeService';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';

// URL to a valid TopoJSON file for the world map
const GEO_URL_WORLD = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
// URL to a valid TopoJSON file for the India map
const GEO_URL_INDIA = "/india-states.json";
// URL to a valid TopoJSON file for the US map
const GEO_URL_US = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

interface CityData {
    city: string;
    country: string;
    clickCount: number;
}

interface LiveWorldMapProps {
    clickHistory?: ClickEvent[];
    serverCityData?: CityData[];
    /** Precomputed per-country counts; with regionCounts, used instead of clickHistory. */
    countryCounts?: { name: string; value: number }[];
    /** Precomputed state counts for the USA and India views. */
    regionCounts?: { country: string; region: string; value: number }[];
    className?: string;
    /** Heading shown over the map; defaults to a live-view label. */
    title?: string;
}

interface MapClick {
    id: string;
    coordinates: [number, number];
    country: string;
    region?: string;
    timestamp: number;
}

export type ViewMode = 'world' | 'usa' | 'india';

/**
 * Clicks per country (world view) or per state (USA / India views). Uses the
 * precomputed counts when given, otherwise counts clickHistory.
 */
export function countLocations(
    viewMode: ViewMode,
    clickHistory: ClickEvent[],
    countryCounts?: { name: string; value: number }[],
    regionCounts?: { country: string; region: string; value: number }[],
): Record<string, number> {
    const counts: Record<string, number> = {};
    if (countryCounts || regionCounts) {
        // Precomputed on the server (link analytics page).
        if (viewMode === 'world') {
            countryCounts?.forEach(c => { if (c.name && c.name !== 'Unknown') counts[c.name] = (counts[c.name] || 0) + c.value; });
        } else {
            const country = viewMode === 'usa' ? 'United States' : 'India';
            regionCounts?.forEach(r => { if (r.country === country) counts[r.region] = (counts[r.region] || 0) + r.value; });
        }
        return counts;
    }
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
}

const LiveWorldMap: React.FC<LiveWorldMapProps> = ({ clickHistory = [], serverCityData = [], countryCounts, regionCounts, className = '', title }) => {
    const [recentClicks, setRecentClicks] = useState<MapClick[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('world');

    // Process historical data for heatmap
    const locationCounts = useMemo(
        () => countLocations(viewMode, clickHistory, countryCounts, regionCounts),
        [clickHistory, countryCounts, regionCounts, viewMode],
    );

    // City coordinates for markers
    const CITY_COORDS: Record<string, [number, number]> = {
        'Mumbai': [72.8777, 19.0760],
        'Pune': [73.8567, 18.5204],
        'Kolkata': [88.3639, 22.5726],
        'Bengaluru': [77.5946, 12.9716],
        'Delhi': [77.1025, 28.7041],
        'New Delhi': [77.2090, 28.6139],
        'Chennai': [80.2707, 13.0827],
        'Hyderabad': [78.4867, 17.3850],
        'Ahmedabad': [72.5714, 23.0225],
        'Jaipur': [75.7873, 26.9124],
        'Bhubaneswar': [85.8245, 20.2961],
        'Rajkot': [70.8022, 22.3039],
        'Lucknow': [80.9462, 26.8467],
        'Chandigarh': [76.7794, 30.7333],
        'Patna': [85.1376, 25.5941],
        'Indore': [75.8577, 22.7196],
        'Bhopal': [77.4126, 23.2599],
        'Nagpur': [79.0882, 21.1458],
        'Coimbatore': [76.9558, 11.0168],
        'Kochi': [76.2673, 9.9312],
        'Visakhapatnam': [83.2185, 17.6868],
        'Thiruvananthapuram': [76.9366, 8.5241],
        'Surat': [72.8311, 21.1702],
        'Vadodara': [73.1812, 22.3072],
    };

    // US City coordinates
    const US_CITY_COORDS: Record<string, [number, number]> = {
        'New York': [-74.0060, 40.7128],
        'Los Angeles': [-118.2437, 34.0522],
        'Chicago': [-87.6298, 41.8781],
        'Houston': [-95.3698, 29.7604],
        'Phoenix': [-112.0740, 33.4484],
        'Philadelphia': [-75.1652, 39.9526],
        'San Antonio': [-98.4936, 29.4241],
        'San Diego': [-117.1611, 32.7157],
        'Dallas': [-96.7970, 32.7767],
        'San Jose': [-121.8863, 37.3382],
        'Austin': [-97.7431, 30.2672],
        'San Francisco': [-122.4194, 37.7749],
        'Seattle': [-122.3321, 47.6062],
        'Miami': [-80.1918, 25.7617],
        'Boston': [-71.0589, 42.3601],
        'Denver': [-104.9903, 39.7392],
        'Las Vegas': [-115.1398, 36.1699],
        'Atlanta': [-84.3879, 33.7490],
        'Washington D.C.': [-77.0369, 38.9072],
        'Orlando': [-81.3792, 28.5383]
    };

    // Process city counts for markers (India and USA views)
    // Use server-side data if available, fallback to client-side
    const cityMarkers = useMemo(() => {
        if (viewMode === 'world') return [];

        const targetCoords = viewMode === 'india' ? CITY_COORDS : US_CITY_COORDS;
        const targetCountry = viewMode === 'india' ? 'India' : 'United States';

        // Prefer server-side data if available
        if (serverCityData.length > 0) {
            return serverCityData
                .filter(c => c.country === targetCountry)
                .map(city => ({
                    city: city.city,
                    count: city.clickCount,
                    coordinates: targetCoords[city.city] || null
                }))
                .filter(c => c.coordinates !== null)
                .slice(0, 15);
        }

        // Fallback to client-side data
        const counts: Record<string, number> = {};
        clickHistory.forEach(click => {
            if (click.country === targetCountry && click.city) {
                counts[click.city] = (counts[click.city] || 0) + 1;
            }
        });

        // If no data, show some default major cities with 0 clicks just for visuals?
        // No, only show if we have data or if it's strictly requested to "show markers".
        // Let's seed some "major cities" if empty so the map isn't barren? 
        // No, that's misleading. Only real data.

        return Object.entries(counts)
            .map(([city, count]) => ({
                city,
                count,
                coordinates: targetCoords[city] || null
            }))
            .filter(c => c.coordinates !== null)
            .sort((a, b) => b.count - a.count)
            .slice(0, 15);
    }, [clickHistory, viewMode, serverCityData]);

    const maxClicks = Math.max(...Object.values(locationCounts), 1);

    // Color scale for heatmap - Modern Light Theme
    const colorScale = scaleLinear<string>()
        .domain([0, maxClicks])
        .range(["#FFE3D5", "#FF5A14"]); // pale orange to the accent

    // Subscribe to real-time clicks
    useEffect(() => {
        const unsubscribe = subscribeToClickEvents((event) => {
            let coordinates: [number, number] = [0, 0];

            // Use precise coordinates if available
            if (event.click.longitude && event.click.latitude) {
                coordinates = [event.click.longitude, event.click.latitude];
            } else {
                // Fallback: Random placement (only for demo/testing if no lat/long)
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
                return { 
                    projection: "geoAlbersUsa", 
                    config: { scale: 1000 },
                    center: null // geoAlbersUsa doesn't use center like this
                };
            case 'india':
                return { 
                    projection: "geoMercator", 
                    config: { scale: 800 },
                    center: [80, 22] as [number, number]
                };
            default:
                return { 
                    projection: "geoMercator", 
                    config: { scale: 140 },
                    center: [0, 0] as [number, number]
                };
        }
    };

    const { projection, config, center } = getProjectionConfig();

    return (
        <div className={`relative overflow-hidden bg-[#FBFAF8] transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : 'h-[420px] rounded-3xl sm:h-[500px]'} ${className}`}>

            {/* Header / Controls */}
            <div className="absolute top-4 left-4 z-[5] flex items-center gap-4">
                <h3 className="flex items-center gap-2 rounded-full bg-[#FBFAF8]/90 px-3 py-1.5 text-[13px] text-[#8C8981] backdrop-blur-md">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-[3px] bg-[#FF5A14] opacity-60"></span>
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-[3px] bg-[#FF5A14]"></span>
                    </span>
                    {title ?? (viewMode === 'world' ? 'Live global view' : viewMode === 'usa' ? 'Live US view' : 'Live India view')}
                </h3>
            </div>

            <div className="absolute top-4 right-4 z-[5] flex gap-2">
                {/* View Toggle */}
                <div role="group" aria-label="Map" className="flex gap-0.5 rounded-full bg-[#F0EEEA] p-1">
                    <button
                        onClick={() => setViewMode('world')}
                        aria-pressed={viewMode === 'world'}
                        className={`rounded-full px-3 py-1 font-mono text-[11px] transition-colors ${viewMode === 'world' ? 'bg-[#18181A] text-white' : 'text-[#8C8981] hover:text-[#18181A]'}`}
                        title="World"
                    >
                        World
                    </button>
                    <button
                        onClick={() => setViewMode('usa')}
                        aria-pressed={viewMode === 'usa'}
                        className={`rounded-full px-3 py-1 font-mono text-[11px] transition-colors ${viewMode === 'usa' ? 'bg-[#18181A] text-white' : 'text-[#8C8981] hover:text-[#18181A]'}`}
                        title="United States"
                    >
                        US
                    </button>
                    <button
                        onClick={() => setViewMode('india')}
                        aria-pressed={viewMode === 'india'}
                        className={`rounded-full px-3 py-1 font-mono text-[11px] transition-colors ${viewMode === 'india' ? 'bg-[#18181A] text-white' : 'text-[#8C8981] hover:text-[#18181A]'}`}
                        title="India"
                    >
                        India
                    </button>
                </div>

                <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
                    className="rounded-full bg-[#F0EEEA] p-2 text-[#8C8981] transition-colors hover:text-[#18181A]"
                >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
            </div>

            {/* Map */}
            <ComposableMap
                key={viewMode}
                projection={projection as any}
                projectionConfig={config}
                className="h-full w-full bg-[#FBFAF8]"
            >
                <ZoomableGroup center={center || [0, 0]} zoom={1} minZoom={1} maxZoom={4}>
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
                                        fill={clickCount > 0 ? colorScale(clickCount) : "#ECEAE6"}
                                        stroke="#FBFAF8"
                                        strokeWidth={0.5}
                                        style={{
                                            default: { outline: "none", transition: "all 250ms" },
                                            hover: { fill: "#18181A", outline: "none", cursor: "pointer" },
                                            pressed: { fill: "#18181A", outline: "none" },
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
                                        stroke="#FF5A14"
                                    />
                                    <circle r={3} fill="#FF5A14" />
                                </g>
                            </Marker>
                        ))}
                    </AnimatePresence>

                    {/* City Markers (India & USA views) */}
                    {(viewMode === 'india' || viewMode === 'usa') && cityMarkers.map((city, i) => {
                        const maxCount = cityMarkers[0]?.count || 1;
                        const sizeScale = 4 + (city.count / maxCount) * 8; // Slightly smaller scale (4-12px)
                        return (
                            <Marker key={city.city} coordinates={city.coordinates as [number, number]}>
                                <g
                                    data-tooltip-id="map-tooltip"
                                    data-tooltip-content={`${city.city}: ${city.count.toLocaleString()} clicks`}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <circle
                                        r={sizeScale}
                                        fill="#FF5A14"
                                        fillOpacity={0.7}
                                        stroke="#18181A"
                                        strokeWidth={1.5}
                                    />
                                    <circle r={2} fill="#FEF2F2" />
                                    <text
                                        textAnchor="middle"
                                        y={sizeScale + 10}
                                        style={{
                                            fontFamily: 'system-ui',
                                            fontSize: 8,
                                            fontWeight: 600,
                                            fill: '#18181A',
                                            pointerEvents: 'none'
                                        }}
                                    >
                                        {city.city}
                                    </text>
                                </g>
                            </Marker>
                        );
                    })}
                </ZoomableGroup>
            </ComposableMap>

            <Tooltip id="map-tooltip" className="z-50 !rounded-lg !bg-[#18181A] !px-3 !py-2 !font-mono !text-xs !opacity-100" />

            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-[#FBFAF8]/90 px-3 py-1.5 font-mono text-[11px] text-[#8C8981] backdrop-blur-md">
                <span>fewer</span>
                <div className="h-2 w-20 rounded-full bg-gradient-to-r from-[#FFE3D5] to-[#FF5A14]"></div>
                <span>more clicks</span>
            </div>
        </div>
    );
};

export default LiveWorldMap;
