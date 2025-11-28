import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, ShoppingBag, Link as LinkIcon, BarChart2, Settings, Code2, LogOut, X } from 'lucide-react';
import { ViewState } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    currentView: ViewState;
    onChangeView: (view: ViewState) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, currentView, onChangeView }) => {
    const { signOut } = useAuth();

    const menuItems = [
        { id: ViewState.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
        { id: ViewState.PRODUCTS, icon: ShoppingBag, label: 'Products' },
        { id: ViewState.LINKS, icon: LinkIcon, label: 'Links' },
        { id: ViewState.ANALYTICS, icon: BarChart2, label: 'Analytics' },
        { id: ViewState.API, icon: Code2, label: 'Developer API' },
        { id: ViewState.SETTINGS, icon: Settings, label: 'Settings' },
    ];

    const handleItemClick = (id: ViewState) => {
        onChangeView(id);
        onClose();
    };

    const handleLogout = async () => {
        try {
            await signOut();
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

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
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    />

                    {/* Menu Drawer */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 h-full w-64 bg-[#FDFBF7] z-50 shadow-2xl md:hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 flex items-center justify-between border-b border-stone-200">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center shadow-sm">
                                    <ShoppingBag className="w-4 h-4 text-slate-900" />
                                </div>
                                <h1 className="text-lg font-bold text-slate-900">Gather<span className="text-yellow-500">.</span></h1>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-stone-500" />
                            </button>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = currentView === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleItemClick(item.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                                ? 'bg-yellow-100/50 text-slate-900 font-medium'
                                                : 'text-stone-500 hover:bg-stone-100 hover:text-slate-900'
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-yellow-600' : 'text-stone-400'}`} />
                                        {item.label}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Footer / Logout */}
                        <div className="p-4 border-t border-stone-200">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium"
                            >
                                <LogOut className="w-5 h-5" />
                                Sign Out
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default MobileMenu;
