import React from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

interface CityData {
    city: string;
    country: string;
    count: number;
    percentage: number;
}

interface TopCitiesTableProps {
    data: CityData[];
}

const TopCitiesTable: React.FC<TopCitiesTableProps> = ({ data }) => {
    return (
        <div className="bg-white rounded-[2rem] p-6 border border-stone-200 shadow-sm h-full min-h-[320px] flex flex-col">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Top Cities</h3>
                    <p className="text-stone-500 text-sm">Most active locations</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-blue-500" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {data.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-stone-400">
                        <MapPin className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-sm">No city data yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.map((city, index) => (
                            <motion.div
                                key={`${city.city}-${city.country}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center gap-3 p-2 hover:bg-stone-50 rounded-xl transition-colors"
                            >
                                <div className="flex-shrink-0 w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-xs font-bold text-stone-600">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-slate-700 truncate">
                                            {city.city || 'Unknown'}
                                        </span>
                                        <span className="text-xs font-bold text-slate-900">
                                            {city.count.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${city.percentage}%` }}
                                            transition={{ duration: 1, delay: 0.2 }}
                                            className="h-full bg-blue-500 rounded-full"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopCitiesTable;
