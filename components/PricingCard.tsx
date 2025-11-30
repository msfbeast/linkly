import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface PricingCardProps {
    title: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    isPopular?: boolean;
    buttonText: string;
    onSelect: () => void;
    isLoading?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
    title,
    price,
    period,
    description,
    features,
    isPopular = false,
    buttonText,
    onSelect,
    isLoading = false,
}) => {
    return (
        <div className={`relative p-8 bg-white rounded-2xl border ${isPopular ? 'border-blue-500 shadow-xl' : 'border-gray-200 shadow-sm'} flex flex-col h-full`}>
            {isPopular && (
                <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                    <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                        Most Popular
                    </span>
                </div>
            )}

            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                <p className="text-gray-500 mt-2 text-sm">{description}</p>
            </div>

            <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">{price}</span>
                <span className="text-gray-500 ml-2">/{period}</span>
            </div>

            <ul className="mb-8 space-y-4 flex-1">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 text-sm">{feature}</span>
                    </li>
                ))}
            </ul>

            <button
                onClick={onSelect}
                disabled={isLoading}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${isPopular
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {isLoading ? 'Processing...' : buttonText}
            </button>
        </div>
    );
};

export default PricingCard;
