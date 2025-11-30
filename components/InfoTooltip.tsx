import React from 'react';
import { Tooltip } from 'react-tooltip';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
    id: string;
    content: string;
    place?: 'top' | 'bottom' | 'left' | 'right';
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ id, content, place = 'top' }) => {
    return (
        <div className="inline-flex items-center ml-2 align-middle">
            <button
                data-tooltip-id={id}
                data-tooltip-content={content}
                className="text-stone-400 hover:text-yellow-500 transition-colors focus:outline-none"
                type="button"
            >
                <Info className="w-4 h-4" />
            </button>
            <Tooltip
                id={id}
                place={place}
                style={{
                    backgroundColor: '#1c1917', // stone-900
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    maxWidth: '250px',
                    zIndex: 50,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                }}
            />
        </div>
    );
};

export default InfoTooltip;
