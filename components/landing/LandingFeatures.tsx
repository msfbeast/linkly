import React from 'react';
import { Label, Tile } from '../ui/bento';

// Illustrative numbers for the pictures below; they don't come from any account.
const DAYS = [38, 52, 44, 71, 63, 88, 96];
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const SOURCES = [['YouTube', 46], ['Instagram', 21], ['Direct', 18], ['WhatsApp', 9], ['Other', 6]] as const;
const SHADES = ['#FF5A14', '#18181A', '#FF9B6A', '#B9B5AD', '#D9D6D0'];

/** What Gather does, as tiles drawn like the app itself. */
const LandingFeatures: React.FC<{ freeLinkLimit: number }> = ({ freeLinkLimit }) => {
    const max = Math.max(...DAYS);
    return (
        <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-8">
            <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
                {/* Clicks */}
                <Tile dark className="lg:col-span-7">
                    <Label dark>Every click, counted</Label>
                    <p className="max-w-md text-[15px] leading-relaxed text-[#A19E97]">
                        Clicks per day, where people are, what they click from and when. For every link, and for all of them together.
                    </p>
                    <div className="mt-8 flex h-[120px] items-end gap-3" aria-hidden="true">
                        {DAYS.map((v, i) => (
                            <div key={i} className="flex flex-1 flex-col-reverse items-center gap-1">
                                {Array.from({ length: Math.round((v / max) * 11) }, (_, j) => (
                                    <i key={j} className={`h-2 w-2 rounded-full ${i === DAYS.length - 1 ? 'bg-[#FF5A14]' : 'bg-[#5A5955]'}`} />
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="mt-2 flex gap-3" aria-hidden="true">
                        {DAY_LABELS.map((d, i) => <span key={i} className="flex-1 text-center font-mono text-[10px] text-[#6E6B65]">{d}</span>)}
                    </div>
                </Tile>

                {/* Sources */}
                <Tile className="lg:col-span-5">
                    <Label>Where clicks come from</Label>
                    <div className="flex items-baseline gap-2.5">
                        <span className="font-mono text-[56px] font-medium leading-none tracking-[-0.04em]">46%</span>
                        <span className="font-mono text-[14px] text-[#8C8981]">from YouTube</span>
                    </div>
                    <div className="my-4 flex h-2.5 gap-[3px] overflow-hidden rounded-full" aria-hidden="true">
                        {SOURCES.map(([name, v], i) => <i key={name} style={{ flex: v, background: SHADES[i] }} />)}
                    </div>
                    <div className="grid gap-1.5">
                        {SOURCES.map(([name, v], i) => (
                            <div key={name} className="flex justify-between text-[13px]">
                                <span className="flex items-center"><i className="mr-2 inline-block h-2 w-2 rounded-[2px]" style={{ background: SHADES[i] }} />{name}</span>
                                <span className="font-mono text-[#8C8981]">{v}%</span>
                            </div>
                        ))}
                    </div>
                    <p className="mt-4 text-[11px] text-[#A19E97]">Example numbers.</p>
                </Tile>

                {/* Store page */}
                <Tile className="lg:col-span-5">
                    <Label>A store page for your picks</Label>
                    <p className="text-[15px] leading-relaxed text-[#5F5C56]">
                        Paste product links and they become a page at <span className="font-mono text-[#18181A]">/@yourname</span>, with names, prices and pictures filled in. Visitors filter by category; you see which products get clicked.
                    </p>
                    <div className="mt-5 grid grid-cols-3 gap-2" aria-hidden="true">
                        {['Phones', 'Audio', 'Desk'].map((c, i) => (
                            <div key={c} className="rounded-2xl bg-[#F3F2EF] p-2.5">
                                <div className={`mb-2 aspect-square rounded-xl ${['bg-[#18181A]', 'bg-[#FF9B6A]', 'bg-[#D9D6D0]'][i]}`} />
                                <div className="text-[11px] text-[#8C8981]">{c}</div>
                                <div className="font-mono text-[12px]">₹{['72,999', '1,799', '10,995'][i]}</div>
                            </div>
                        ))}
                    </div>
                </Tile>

                {/* Affiliate tags */}
                <Tile className="lg:col-span-4">
                    <Label>Your affiliate tags, added for you</Label>
                    <p className="text-[15px] leading-relaxed text-[#5F5C56]">
                        Save your Amazon Associates tag and Flipkart ID once. Every Amazon and Flipkart link you shorten carries them, amzn.to links included.
                    </p>
                    <div className="mt-5 overflow-hidden rounded-2xl bg-[#18181A] p-3 font-mono text-[11px] leading-relaxed text-[#A19E97]" aria-hidden="true">
                        amazon.in/dp/B0…<span className="text-[#FF9B6A]">?tag=yourname-21</span>
                    </div>
                </Tile>

                {/* Plans */}
                <Tile dark className="flex flex-col lg:col-span-3">
                    <Label dark>Free to start</Label>
                    <span className="font-mono text-[56px] font-medium leading-none tracking-[-0.04em]">{freeLinkLimit}</span>
                    <p className="mt-2 text-[13px] text-[#A19E97]">links on the free plan, with analytics, a store page and QR codes.</p>
                </Tile>
            </div>
        </div>
    );
};

export default LandingFeatures;
