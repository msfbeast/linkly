import React from 'react';
import { ProductAnalytics } from '../../services/aggregatedAnalyticsService';
import { Product } from '../../types';
import { DotColumns, fmt, Label, MonoPill, pctLabel, Tile } from '../ui/bento';

export const PRODUCT_STAT_RANGES = [7, 30, 90] as const;
export type ProductStatRange = typeof PRODUCT_STAT_RANGES[number];

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** "4.2%" clicks per view, or null when there were no views to divide by. */
export function clickRate(clicks: number, views: number): string | null {
    return views > 0 ? pctLabel((clicks / views) * 100) : null;
}

/** Store views, product clicks, clicks per view and the busiest products. */
const ProductStats: React.FC<{
    data: ProductAnalytics;
    products: Product[];
    range: ProductStatRange;
    onRange: (r: ProductStatRange) => void;
}> = ({ data, products, range, onRange }) => {
    const rate = clickRate(data.clicks, data.views);
    const byId = new Map(products.map(p => [p.id, p]));
    const top = data.products.filter(p => p.clicks > 0 && byId.has(p.id)).slice(0, 5);
    const points = data.daily.map(d => {
        const date = new Date(`${d.date}T00:00:00Z`);
        return { key: d.date, label: data.daily.length > 16 ? String(date.getUTCDate()) : DAYS[date.getUTCDay()], value: d.clicks };
    });
    // Daily views only exist from the day they started being counted.
    const firstViewDay = data.daily.find(d => d.views > 0)?.date;
    const partialViews = data.viewsAllTime > data.views && (!firstViewDay || firstViewDay > data.daily[0]?.date);

    return (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
            <Tile dark className="lg:col-span-7">
                <Label dark right={
                    <div role="group" aria-label="Period" className="flex gap-0.5 rounded-full bg-[#232326] p-0.5">
                        {PRODUCT_STAT_RANGES.map(r => (
                            <button key={r} onClick={() => onRange(r)} aria-pressed={range === r}
                                className={`rounded-full px-2.5 py-1 font-mono text-[11px] ${range === r ? 'bg-[#F2F1EE] text-[#18181A]' : 'text-[#8E8B84] hover:text-[#F2F1EE]'}`}>
                                {r}d
                            </button>
                        ))}
                    </div>
                }>Product clicks</Label>
                <div className="flex flex-wrap items-baseline gap-x-4">
                    <span className="font-mono text-[clamp(48px,6vw,80px)] font-medium leading-[0.95] tracking-[-0.04em]">{fmt(data.clicks)}</span>
                    <span className="font-mono text-[14px] text-[#8E8B84]">last {data.days} days · {fmt(data.clicksAllTime)} all time</span>
                </div>
                {/* Phones get the last 14 days; more columns don't fit. */}
                <div className="sm:hidden"><DotColumns points={points.slice(-14)} label="Product clicks per day, last 14 days" /></div>
                <div className="hidden sm:block"><DotColumns points={points} label={`Product clicks per day, last ${data.days} days`} /></div>
            </Tile>

            <Tile className="flex flex-col lg:col-span-5">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Store views</Label>
                        <span className="font-mono text-[clamp(28px,3vw,40px)] font-medium leading-none tracking-[-0.04em]">{fmt(data.views)}</span>
                        <p className="mt-1.5 font-mono text-[12px] text-[#8C8981]">{fmt(data.viewsAllTime)} all time</p>
                    </div>
                    <div>
                        <Label>Clicks per view</Label>
                        <span className="font-mono text-[clamp(28px,3vw,40px)] font-medium leading-none tracking-[-0.04em]">{rate ?? '–'}</span>
                        <p className="mt-1.5 text-[12px] text-[#8C8981]">{rate ? 'product clicks ÷ store views' : 'no store views yet'}</p>
                    </div>
                </div>
                {partialViews && (
                    <p className="mt-3 text-[11px] text-[#A19E97]">Views per day are counted from {firstViewDay ? new Date(`${firstViewDay}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'now'} on.</p>
                )}
                <div className="mt-6 flex-1">
                    <Label right={<MonoPill>last {data.days} days</MonoPill>}>Top products</Label>
                    {top.length === 0 ? (
                        <p className="text-[13px] text-[#8C8981]">No product clicks in this period.</p>
                    ) : (
                        <ol className="grid gap-2">
                            {top.map((p, i) => {
                                const product = byId.get(p.id)!;
                                return (
                                    <li key={p.id} className="grid grid-cols-[18px_1fr_auto] items-center gap-2.5">
                                        <span className="font-mono text-[11px] text-[#A19E97]">{i + 1}</span>
                                        <span className="truncate text-[13px]">{product.name}</span>
                                        <span className="font-mono text-[13px]">{fmt(p.clicks)}</span>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </div>
                <p className="mt-4 text-[11px] leading-relaxed text-[#A19E97]">Product clicks count every click on a product's short link, from your store page or anywhere else you shared it.</p>
            </Tile>
        </div>
    );
};

export default ProductStats;
