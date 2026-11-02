import React from 'react';

/**
 * Building blocks of Gather's analytics design: light neutral tiles, one
 * charcoal anchor tile per page, orange as the only accent, monospaced
 * numerals, data drawn as dots and cells. Used by the dashboard overview and
 * the link analytics page.
 */

export const ACCENT = '#FF5A14';
export const SOURCE_SHADES = [ACCENT, '#18181A', '#FF9B6A', '#B9B5AD', '#FFD3BE', '#D9D6D0'];
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const fmt = (n: number) => Math.round(n).toLocaleString('en-IN');
export const share = (n: number, total: number) => (total > 0 ? (n / total) * 100 : 0);
export const pctLabel = (p: number) => (p >= 1 || p === 0 ? `${Math.round(p)}%` : `${p.toFixed(1)}%`);
export const hourLabel = (h: number) => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`;

/** The viewer's time zone abbreviation, e.g. "GMT+5:30". */
export const viewerZoneLabel = (() => {
    try {
        return new Intl.DateTimeFormat('en', { timeZoneName: 'short' }).formatToParts(new Date())
            .find(p => p.type === 'timeZoneName')?.value ?? 'local time';
    } catch { return 'local time'; }
})();

export const Tile: React.FC<{ className?: string; dark?: boolean; children: React.ReactNode }> = ({ className = '', dark, children }) => (
    <div className={`relative overflow-hidden rounded-3xl p-6 ${dark ? 'bg-[#18181A] text-[#F2F1EE]' : 'bg-[#FBFAF8] text-[#18181A]'} ${className}`}>
        {children}
    </div>
);

export const Label: React.FC<{ dark?: boolean; children: React.ReactNode; right?: React.ReactNode }> = ({ dark, children, right }) => (
    <div className={`mb-4 flex items-center gap-2 text-[13px] ${dark ? 'text-[#A19E97]' : 'text-[#8C8981]'}`}>
        <span className="h-2.5 w-2.5 shrink-0 rounded-[3px] bg-[#FF5A14]" />
        <span>{children}</span>
        {right && <span className="ml-auto">{right}</span>}
    </div>
);

export const MonoPill: React.FC<{ dark?: boolean; children: React.ReactNode }> = ({ dark, children }) => (
    <span className={`rounded-full px-2.5 py-1 font-mono text-[11px] ${dark ? 'bg-[#2A2A2D] text-[#8E8B84]' : 'bg-[#F0EEEA] text-[#8C8981]'}`}>{children}</span>
);

export const ChangeTag: React.FC<{ change: number }> = ({ change }) => (
    <span className="rounded-md bg-[#2E2A28] px-2 py-0.5 font-mono text-[11px] text-[#FF9B6A]">
        {change < 0 ? '↘' : '↗'} {Math.abs(change)}%
    </span>
);

/** A row of 25 dots, the first `percent / 4` filled. */
export const DotMeter: React.FC<{ label: string; percent: number }> = ({ label, percent }) => {
    const on = Math.round(percent / 4);
    return (
        <div className="mb-4 last:mb-0">
            <div className="mb-1.5 flex justify-between text-[13px]">
                <span>{label}</span>
                <span className="font-mono">{pctLabel(percent)}</span>
            </div>
            <div className="grid max-w-[300px] grid-cols-[repeat(25,minmax(0,1fr))] gap-[3px]">
                {Array.from({ length: 25 }, (_, i) => (
                    <i key={i} className={`aspect-square rounded-full ${i < on ? 'bg-[#FF5A14]' : 'bg-[#ECEAE6]'}`} />
                ))}
            </div>
        </div>
    );
};

/** Labelled share bars, e.g. countries or states. */
export const ShareBars: React.FC<{ rows: { name: string; value: number }[]; total: number; showCount?: boolean }> = ({ rows, total, showCount }) => (
    <div className="grid gap-3">
        {rows.map(r => {
            const p = share(r.value, total);
            return (
                <div key={r.name}>
                    <div className="mb-1.5 flex justify-between text-[13px]">
                        <span className="truncate pr-3">{r.name}</span>
                        <span className="font-mono text-[#8C8981]">{showCount ? fmt(r.value) : pctLabel(p)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#ECEAE6]">
                        <i className="block h-full rounded-full bg-[#FF5A14]" style={{ width: `${Math.max(p, 1.2)}%` }} />
                    </div>
                </div>
            );
        })}
    </div>
);

export const Sparkline: React.FC<{ values: number[]; highlight: boolean }> = ({ values, highlight }) => {
    const max = Math.max(...values, 1);
    const points = values.map((v, i) => `${(i / Math.max(values.length - 1, 1)) * 116 + 2},${26 - (v / max) * 22}`).join(' ');
    return (
        <svg viewBox="0 0 120 28" className="hidden h-7 w-[120px] sm:block" aria-hidden>
            <polyline points={points} fill="none" stroke={highlight ? ACCENT : '#8E8B84'} strokeWidth={1.6} strokeLinejoin="round" />
        </svg>
    );
};

/** Columns of dots, one per period; `highlight` marks the last (today) in orange. */
export const DotColumns: React.FC<{ points: { key: string; label: string; value: number; sub?: string }[]; label: string }> = ({ points, label }) => {
    const max = Math.max(...points.map(p => p.value), 1);
    const dense = points.length > 16;
    return (
        <>
            <div className={`mt-5 flex h-[130px] items-end ${dense ? 'gap-1' : 'gap-2.5'}`} role="img" aria-label={label}>
                {points.map((p, i) => (
                    <div key={p.key} title={`${p.key}: ${fmt(p.value)}`} className="flex flex-1 flex-col-reverse items-center gap-1">
                        {Array.from({ length: Math.max(1, Math.round((p.value / max) * 12)) }, (_, j) => (
                            <i key={j} className={`${dense ? 'h-1.5 w-1.5' : 'h-2 w-2'} rounded-full ${i === points.length - 1 ? 'bg-[#FF5A14]' : 'bg-[#5A5955]'}`} />
                        ))}
                    </div>
                ))}
            </div>
            <div className={`mt-2 flex ${dense ? 'gap-1' : 'gap-2.5'}`}>
                {points.map((p, i) => (
                    <span key={p.key} className="flex-1 text-center font-mono text-[10px] text-[#6E6B65]">
                        {!dense || i % 5 === 0 || i === points.length - 1 ? p.label : ''}
                        {p.sub && !dense && <em className="mt-0.5 block not-italic text-[#8E8B84]">{p.sub}</em>}
                    </span>
                ))}
            </div>
        </>
    );
};

/** Day x hour grid. `cells` maps "day-hour" (day 0 = Sunday) to clicks. */
export const HeatGrid: React.FC<{ cells: Map<string, number> }> = ({ cells }) => {
    const max = Math.max(...cells.values(), 1);
    const color = (n: number) => {
        const r = n / max;
        return r > 0.75 ? 'bg-[#FF5A14]' : r > 0.5 ? 'bg-[#FF9B6A]' : r > 0.25 ? 'bg-[#FFD3BE]' : 'bg-[#ECEAE6]';
    };
    return (
        <div className="grid grid-cols-[34px_repeat(24,minmax(0,1fr))] gap-1">
            {[1, 2, 3, 4, 5, 6, 0].map(day => (
                <React.Fragment key={day}>
                    <span className="flex items-center text-[11px] text-[#8C8981]">{DAY_NAMES[day]}</span>
                    {Array.from({ length: 24 }, (_, hour) => {
                        const n = cells.get(`${day}-${hour}`) ?? 0;
                        return <i key={hour} title={`${DAY_NAMES[day]} ${hourLabel(hour)}: ${fmt(n)} clicks`} className={`aspect-[1.5] rounded-[5px] ${color(n)}`} />;
                    })}
                </React.Fragment>
            ))}
            <span />
            {Array.from({ length: 24 }, (_, h) => (
                <span key={h} className="text-center font-mono text-[9px] text-[#8C8981]">{h % 3 === 0 ? hourLabel(h).replace('m', '') : ''}</span>
            ))}
        </div>
    );
};

export const HeatLegend: React.FC = () => (
    <span className="flex items-center gap-1.5 text-[11px]">fewer
        {['bg-[#ECEAE6]', 'bg-[#FFD3BE]', 'bg-[#FF9B6A]', 'bg-[#FF5A14]'].map(c => <i key={c} className={`inline-block h-2.5 w-3.5 rounded-[3px] ${c}`} />)}
        more</span>
);

/** The busiest cell of a day x hour map, or null when empty. */
export function busiestHour(cells: Map<string, number>): { day: number; hour: number; n: number } | null {
    let best: { day: number; hour: number; n: number } | null = null;
    cells.forEach((n, k) => {
        if (n > 0 && (!best || n > best.n)) {
            const [day, hour] = k.split('-').map(Number);
            best = { day, hour, n };
        }
    });
    return best;
}

/** A referrer as people say it: "YouTube", "Direct", "Instagram", else the site. */
export function sourceName(referrer: string | null | undefined): string {
    const raw = (referrer || '').trim();
    if (!raw || raw.toLowerCase() === 'direct' || raw === 'Unknown') return 'Direct';
    if (raw.startsWith('android-app://')) return 'Android app';
    let host = raw;
    try { host = new URL(raw).host; } catch { /* already a name */ }
    host = host.replace(/^www\./, '').replace(/^m\./, '').replace(/^l\./, '');
    const known: Record<string, string> = {
        'youtube.com': 'YouTube', 'youtu.be': 'YouTube', 'instagram.com': 'Instagram', 'facebook.com': 'Facebook',
        't.co': 'X', 'x.com': 'X', 'twitter.com': 'X', 'google.com': 'Google', 'whatsapp.com': 'WhatsApp',
        'linkedin.com': 'LinkedIn', 't.me': 'Telegram', 'telegram.org': 'Telegram', 'reddit.com': 'Reddit',
        'links.trak.in': 'Gather page', 'gather.link': 'Gather page',
    };
    return known[host] ?? host;
}

/** Referrer counts grouped by source name, largest first. */
export function groupSources(referrers: { name: string; value: number }[]): { name: string; value: number }[] {
    const m = new Map<string, number>();
    referrers.forEach(r => m.set(sourceName(r.name), (m.get(sourceName(r.name)) ?? 0) + Number(r.value)));
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

/** Big share of the top source, a split bar and the list. */
export const SourceShare: React.FC<{ sources: { name: string; value: number }[] }> = ({ sources }) => {
    const total = sources.reduce((s, r) => s + r.value, 0);
    if (!sources.length) return <p className="text-sm text-[#8C8981]">No clicks yet.</p>;
    return (
        <>
            <div className="flex flex-wrap items-baseline gap-x-2.5">
                <span className="font-mono text-[56px] font-medium leading-none tracking-[-0.04em]">{pctLabel(share(sources[0].value, total))}</span>
                <span className="font-mono text-[15px] text-[#8C8981]">from {sources[0].name}</span>
            </div>
            <div className="my-4 flex h-2.5 gap-[3px] overflow-hidden rounded-full">
                {sources.slice(0, 6).map((r, i) => <i key={r.name} style={{ flex: r.value, background: SOURCE_SHADES[i], minWidth: 4 }} />)}
            </div>
            <div className="grid gap-2">
                {sources.slice(0, 6).map((r, i) => (
                    <div key={r.name} className="flex justify-between text-[13px]">
                        <span className="flex items-center"><i className="mr-2 inline-block h-2 w-2 rounded-[2px]" style={{ background: SOURCE_SHADES[i] }} />{r.name}</span>
                        <span className="font-mono text-[#8C8981]">{fmt(r.value)}</span>
                    </div>
                ))}
            </div>
        </>
    );
};
