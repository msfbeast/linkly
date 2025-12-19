import React from 'react';
import { X, HelpCircle, BookOpen, ExternalLink, Lightbulb, Zap } from 'lucide-react';
import { ViewState } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface ContextualHelpProps {
    isOpen: boolean;
    onClose: () => void;
    view: ViewState;
}

interface HelpContent {
    title: string;
    description: string;
    sections: {
        title: string;
        items: {
            icon?: React.ElementType;
            text: string;
        }[];
    }[];
    tips?: string[];
}

const HELP_CONTENT: Record<ViewState, HelpContent> = {
    [ViewState.DASHBOARD]: {
        title: 'Dashboard Overview',
        description: 'Your command center for monitoring performance and managing your digital presence.',
        sections: [
            {
                title: 'Key Features',
                items: [
                    { icon: Zap, text: 'View real-time click analytics and trends' },
                    { icon: BookOpen, text: 'Access your top performing links quickly' },
                    { icon: Lightbulb, text: 'See AI-driven insights about your audience' }
                ]
            }
        ],
        tips: ['Drag and drop cards to customize your dashboard layout.', 'Use keyboard shortcuts (press ?) to navigate faster.']
    },
    [ViewState.LINKS]: {
        title: 'Link Management',
        description: 'Create, organize, and track all your shortened links in one place.',
        sections: [
            {
                title: 'Actions',
                items: [
                    { icon: Zap, text: 'Create new links with the "New Link" button' },
                    { icon: BookOpen, text: 'Edit destinations, add tags, or set passwords' },
                    { icon: Lightbulb, text: 'View individual link analytics by clicking the chart icon' }
                ]
            }
        ],
        tips: ['Use tags to group related links together.', 'You can bulk select links to delete them.']
    },
    [ViewState.ANALYTICS]: {
        title: 'Global Analytics',
        description: 'Deep dive into your audience demographics and engagement metrics.',
        sections: [
            {
                title: 'Metrics',
                items: [
                    { icon: Zap, text: 'Track total clicks over time' },
                    { icon: BookOpen, text: 'Analyze geographic distribution with the interactive map' },
                    { icon: Lightbulb, text: 'Identify top referring sources and devices' }
                ]
            }
        ],
        tips: ['Hover over charts to see detailed data points.', 'Filter by date range to see specific trends.']
    },
    [ViewState.BIO_PAGES]: {
        title: 'Bio Profiles',
        description: 'Create beautiful "Link in Bio" pages to showcase your content.',
        sections: [
            {
                title: 'Customization',
                items: [
                    { icon: Zap, text: 'Choose from premium themes like Glass, Cyberpunk, or Minimal' },
                    { icon: BookOpen, text: 'Add your social links and bio description' },
                    { icon: Lightbulb, text: 'Drag and drop links to reorder them on your page' }
                ]
            }
        ],
        tips: ['Preview your bio page changes in real-time.', 'Share your unique handle (e.g., gather.link/p/yourname).']
    },
    [ViewState.PRODUCTS]: {
        title: 'Product Manager',
        description: 'Manage your digital storefront and products.',
        sections: [
            {
                title: 'Storefront',
                items: [
                    { icon: Zap, text: 'Add products with images, prices, and descriptions' },
                    { icon: BookOpen, text: 'Customize your storefront theme' },
                    { icon: Lightbulb, text: 'Share direct links to products or your entire store' }
                ]
            }
        ],
        tips: ['High-quality images increase conversion rates.', 'Use the "Featured" tag to highlight top products.']
    },
    [ViewState.SETTINGS]: {
        title: 'Settings',
        description: 'Manage your account preferences and application settings.',
        sections: [
            {
                title: 'Options',
                items: [
                    { icon: Zap, text: 'Update your profile information' },
                    { icon: BookOpen, text: 'Manage notification preferences' },
                    { icon: Lightbulb, text: 'Configure custom domains (Pro)' }
                ]
            }
        ]
    },
    [ViewState.API]: {
        title: 'Developer API',
        description: 'Integrate Gather features directly into your applications.',
        sections: [
            {
                title: 'Resources',
                items: [
                    { icon: Zap, text: 'Generate API keys for authentication' },
                    { icon: BookOpen, text: 'View documentation and code examples' },
                    { icon: Lightbulb, text: 'Monitor API usage and limits' }
                ]
            }
        ]
    },
    [ViewState.STOREFRONT]: {
        title: 'Storefront View',
        description: 'This is how your customers see your store.',
        sections: [
            {
                title: 'Features',
                items: [
                    { icon: Zap, text: 'Browse products' },
                    { icon: BookOpen, text: 'View product details' }
                ]
            }
        ]
    },
    [ViewState.TEAM_SETTINGS]: {
        title: 'Team Settings',
        description: 'Manage your team members and roles.',
        sections: [
            {
                title: 'Features',
                items: [
                    { icon: Zap, text: 'Invite members' },
                    { icon: BookOpen, text: 'Assign roles' }
                ]
            }
        ]
    },
    [ViewState.AFFILIATE]: {
        title: 'Affiliate Program',
        description: 'Manage your affiliate links and earnings.',
        sections: [
            {
                title: 'Features',
                items: [
                    { icon: Zap, text: 'Track referrals' },
                    { icon: BookOpen, text: 'View earnings' }
                ]
            }
        ]
    },
    [ViewState.AGENCY]: {
        title: 'Agency Dashboard',
        description: 'Manage multiple client accounts from one place.',
        sections: [
            {
                title: 'Features',
                items: [
                    { icon: Zap, text: 'Switch between accounts' },
                    { icon: BookOpen, text: 'Centralized billing' }
                ]
            }
        ]
    },
    [ViewState.ADD_PRODUCT]: {
        title: 'Add Product',
        description: 'Create a new product for your storefront.',
        sections: [
            {
                title: 'Features',
                items: [
                    { icon: Zap, text: 'Upload product images' },
                    { icon: BookOpen, text: 'Set price and stock' }
                ]
            }
        ]
    }
};

const ContextualHelp: React.FC<ContextualHelpProps> = ({ isOpen, onClose, view }) => {
    const content = HELP_CONTENT[view] || HELP_CONTENT[ViewState.DASHBOARD];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                    />

                    {/* Slide-over Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 border-l border-stone-200 overflow-y-auto"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                                        <HelpCircle className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900">Help & Guide</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-stone-400 hover:text-slate-900 hover:bg-stone-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-8">
                                {/* Header Section */}
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{content.title}</h3>
                                    <p className="text-stone-600 leading-relaxed">{content.description}</p>
                                </div>

                                {/* Content Sections */}
                                {content.sections.map((section, idx) => (
                                    <div key={idx} className="bg-stone-50 rounded-2xl p-6 border border-stone-100">
                                        <h4 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-xs">{section.title}</h4>
                                        <ul className="space-y-4">
                                            {section.items.map((item, itemIdx) => (
                                                <li key={itemIdx} className="flex items-start gap-3">
                                                    {item.icon && <item.icon className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />}
                                                    <span className="text-stone-700 text-sm font-medium">{item.text}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}

                                {/* Pro Tips */}
                                {content.tips && (
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <Lightbulb className="w-4 h-4 text-yellow-500" />
                                            Pro Tips
                                        </h4>
                                        <ul className="space-y-3">
                                            {content.tips.map((tip, idx) => (
                                                <li key={idx} className="flex items-start gap-3 text-sm text-stone-600 bg-yellow-50/50 p-3 rounded-lg border border-yellow-100">
                                                    <span className="text-yellow-500 font-bold">•</span>
                                                    {tip}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Documentation Link */}
                                <div className="pt-6 border-t border-stone-100">
                                    <a
                                        href="#"
                                        className="flex items-center justify-between p-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors group"
                                    >
                                        <span className="font-bold">View Full Documentation</span>
                                        <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ContextualHelp;
