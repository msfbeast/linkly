import React, { useState, useEffect } from 'react';
import { supabaseAdapter } from '../../services/storage/supabaseAdapter';
import { Order, Product } from '../../types';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface OrdersListProps {
    sellerId: string | undefined;
    products: Product[];
}

const OrdersList: React.FC<OrdersListProps> = ({ sellerId, products }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');

    useEffect(() => {
        if (!sellerId) return;

        const fetchOrders = async () => {
            try {
                setLoading(true);
                const data = await supabaseAdapter.getOrders(sellerId);
                setOrders(data);
            } catch (error) {
                console.error('Error fetching orders:', error);
                toast.error('Failed to load orders');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [sellerId]);

    const getProductDetails = (productId: string) => {
        return products.find(p => p.id === productId);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'failed': return 'text-red-600 bg-red-50 border-red-200';
            case 'refunded': return 'text-stone-500 bg-stone-100 border-stone-200';
            default: return 'text-stone-500 bg-stone-100 border-stone-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'paid': return <CheckCircle2 className="w-4 h-4" />;
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'failed': return <XCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    const filteredOrders = orders.filter(order => {
        const product = getProductDetails(order.productId);
        const matchesSearch =
            (product?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (order.customerEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (order.razorpayOrderId || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-16 bg-white rounded-[2rem] border border-stone-200 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 border border-stone-200">
                    <ArrowUpRight className="w-6 h-6 text-stone-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No orders yet</h3>
                <p className="text-stone-500 max-w-sm mx-auto">
                    Orders will appear here once customers purchase your digital products.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                        type="text"
                        placeholder="Search orders, emails, or IDs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-slate-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto rounded-[2rem] border border-stone-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-stone-100">
                            <th className="px-6 py-4 font-bold text-[10px] text-stone-400 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 font-bold text-[10px] text-stone-400 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-4 font-bold text-[10px] text-stone-400 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-4 font-bold text-[10px] text-stone-400 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-4 font-bold text-[10px] text-stone-400 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {filteredOrders.map((order) => {
                            const product = getProductDetails(order.productId);
                            return (
                                <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                                    <td className="px-6 py-4 text-stone-500 whitespace-nowrap">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                        <div className="text-xs text-stone-400 mt-0.5">
                                            {new Date(order.createdAt).toLocaleTimeString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center overflow-hidden border border-stone-200">
                                                {product?.imageUrl ? (
                                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ArrowUpRight className="w-5 h-5 text-stone-400" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 line-clamp-1">{product?.name || 'Unknown Product'}</div>
                                                <div className="text-xs text-stone-400 font-mono mt-0.5">#{order.id.slice(0, 8)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-900 font-medium">{order.customerEmail || 'Anonymous'}</div>
                                        {order.razorpayPaymentId && (
                                            <div className="text-xs text-stone-400 font-mono mt-0.5">{order.razorpayPaymentId}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-900 font-bold">
                                        {order.currency} {order.amount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                                            {getStatusIcon(order.status)}
                                            <span className="capitalize">{order.status}</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-stone-500 text-sm">No orders found matching your filters.</p>
                </div>
            )}
        </div>
    );
};

export default OrdersList;
