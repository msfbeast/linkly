import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Download, Image as ImageIcon, Palette, Layout, X, Zap, Smartphone, Type } from 'lucide-react';
import { downloadQrCode } from '../utils/qrUtils';

interface QRCodeGeneratorProps {
    url: string;
    title?: string;
}

const GRADIENTS = [
    { name: 'None', value: '', stops: [] },
    { name: 'Sunset', value: 'linear-gradient(135deg, #f59e0b, #ef4444)', stops: [['#f59e0b', 0], ['#ef4444', 1]] },
    { name: 'Ocean', value: 'linear-gradient(135deg, #06b6d4, #3b82f6)', stops: [['#06b6d4', 0], ['#3b82f6', 1]] },
    { name: 'Forest', value: 'linear-gradient(135deg, #10b981, #059669)', stops: [['#10b981', 0], ['#059669', 1]] },
    { name: 'Berry', value: 'linear-gradient(135deg, #ec4899, #8b5cf6)', stops: [['#ec4899', 0], ['#8b5cf6', 1]] },
    { name: 'Midnight', value: 'linear-gradient(135deg, #1e293b, #0f172a)', stops: [['#1e293b', 0], ['#0f172a', 1]] },
];

const FRAMES = [
    { id: 'none', label: 'None', icon: Layout },
    { id: 'simple', label: 'Simple', icon: Layout },
    { id: 'scan-me', label: 'Scan Me', icon: Type },
    { id: 'phone', label: 'Phone', icon: Smartphone },
    { id: 'polaroid', label: 'Polaroid', icon: ImageIcon },
];

const DOT_COLORS = ['#000000', '#4f46e5', '#ec4899', '#10b981', '#f59e0b'];

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ url, title = 'qrcode' }) => {
    const [color, setColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#FFFFFF');
    // Store gradient object with stops for canvas drawing
    const [activeGradient, setActiveGradient] = useState<typeof GRADIENTS[0] | null>(null);
    const [logoUrl, setLogoUrl] = useState('');
    const [frame, setFrame] = useState<'none' | 'simple' | 'scan-me' | 'phone' | 'polaroid'>('none');
    const [showLogoInput, setShowLogoInput] = useState(false);
    const [logoSize, setLogoSize] = useState(40);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const qrId = `qr - ${Math.random().toString(36).substr(2, 9)} `;
    const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);

    const activeGradientValue = activeGradient?.value || '';

    // Helper for rounded rects
    const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.closePath();
    };

    // Handle Download Logic
    const handleDownload = () => {
        const sourceCanvas = hiddenCanvasRef.current;
        if (!sourceCanvas) return;

        // Create a new canvas for the final composition
        const finalCanvas = document.createElement('canvas');
        const ctx = finalCanvas.getContext('2d');
        if (!ctx) return;

        // Base Dimensions
        const qrSize = 1000; // High res
        const padding = frame === 'none' ? 0 : 100;

        let width = qrSize + (padding * 2);
        let height = qrSize + (padding * 2);

        // Adjust dimensions for Frames
        if (frame === 'scan-me') height += 100;
        if (frame === 'polaroid') {
            height += 300; // Bottom text space
            width += 100;
        }
        if (frame === 'phone') {
            height += 200;
            width += 100;
        }

        finalCanvas.width = width;
        finalCanvas.height = height;

        // 1. Draw Background / Frame
        if (frame === 'phone') {
            // Refined Phone Body
            ctx.fillStyle = '#1e293b'; // slate-800
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 50;
            ctx.shadowOffsetY = 20;
            roundRect(ctx, 0, 0, width, height, 80);
            ctx.fill();
            ctx.shadowColor = 'transparent';

            // Screen Area (White)
            ctx.fillStyle = '#ffffff';
            // Inner padding for screen
            roundRect(ctx, 25, 25, width - 50, height - 50, 60);
            ctx.fill();

            // Dynamic Island / Notch
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.roundRect((width / 2) - 80, 25, 160, 35, 18);
            ctx.fill();
        } else if (frame === 'polaroid') {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.1)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 5;
            ctx.shadowOffsetY = 10;
            ctx.fillRect(20, 20, width - 40, height - 40);
            ctx.shadowColor = 'transparent';

            // Inner border for photo area
            ctx.strokeStyle = '#f1f5f9';
            ctx.lineWidth = 2;
            ctx.strokeRect(60, 60, width - 120, width - 120);
        } else if (frame === 'simple') {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.1)';
            ctx.shadowBlur = 30;
            roundRect(ctx, 20, 20, width - 40, height - 40, 40);
            ctx.fill();
            ctx.shadowColor = 'transparent';
        } else if (frame === 'scan-me') {
            ctx.fillStyle = '#0f172a';
            roundRect(ctx, 0, 0, width, height, 50);
            ctx.fill();
            // Inner white box
            ctx.fillStyle = '#ffffff';
            roundRect(ctx, 25, 25, width - 50, height - 160, 30);
            ctx.fill();
            // Text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 50px "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("SCAN ME", width / 2, height - 50);
        } else {
            // None or default bg
            if (!activeGradientValue) {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, width, height);
            }
        }

        // 2. Prepare QR Code Positioning
        let qrSizeFinal = qrSize;
        let qrX = (width - qrSize) / 2;
        let qrY = (height - qrSize) / 2;

        // Custom adjustments per frame to fit nicely
        if (frame === 'phone') {
            qrSizeFinal = qrSize * 0.85; // Shrink slightly to fit in screen
            qrX = (width - qrSizeFinal) / 2;
            qrY = (height - qrSizeFinal) / 2 + 10; // Shift down slightly from notch
        } else if (frame === 'polaroid') {
            qrSizeFinal = qrSize * 0.8;
            qrX = (width - qrSizeFinal) / 2;
            qrY = 80; // Top aligned in photo area
        } else if (frame === 'scan-me') {
            qrSizeFinal = qrSize * 0.85;
            qrX = (width - qrSizeFinal) / 2;
            qrY = 50; // Top area
        }

        if (activeGradient && activeGradient.stops.length > 0) {
            // Create a temporary canvas to tint the QR
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = qrSizeFinal;
            tempCanvas.height = qrSizeFinal;
            const tCtx = tempCanvas.getContext('2d');
            if (tCtx) {
                // Draw original black QR
                tCtx.drawImage(sourceCanvas, 0, 0, qrSizeFinal, qrSizeFinal);

                // Composite Gradient
                tCtx.globalCompositeOperation = 'source-in';
                const grad = tCtx.createLinearGradient(0, 0, qrSizeFinal, qrSizeFinal);
                activeGradient.stops.forEach(stop => grad.addColorStop(stop[1] as number, stop[0] as string));
                tCtx.fillStyle = grad;
                tCtx.fillRect(0, 0, qrSizeFinal, qrSizeFinal);

                // Draw tinted QR to final
                ctx.drawImage(tempCanvas, qrX, qrY, qrSizeFinal, qrSizeFinal);
            }
        } else {
            // Draw normal QR
            ctx.drawImage(sourceCanvas, qrX, qrY, qrSizeFinal, qrSizeFinal);
        }

        // 3. Add Polaroid Text
        if (frame === 'polaroid') {
            ctx.fillStyle = '#475569';
            ctx.font = 'bold 50px sans-serif'; // Use system font as fallback
            ctx.textAlign = 'center';
            ctx.fillText(title, width / 2, height - 60);
        }

        // 4. Download
        const link = document.createElement('a');
        link.download = `${title} -${frame}.png`;
        link.href = finalCanvas.toDataURL('image/png');
        link.click();
    };

    return (
        <div className="flex flex-col xl:flex-row gap-8">
            {/* Hidden High-Res Canvas for Download Generation */}
            <div className="hidden">
                <QRCodeCanvas
                    ref={hiddenCanvasRef}
                    value={url}
                    size={1000} // High resolution source
                    fgColor={activeGradient ? '#000000' : color} // Always black if gradient (to be tinted)
                    bgColor={'rgba(0,0,0,0)'} // Transparent background for compositing
                    imageSettings={logoUrl ? {
                        src: logoUrl,
                        x: undefined,
                        y: undefined,
                        height: logoSize * 4, // Scale up for high res
                        width: logoSize * 4,
                        excavate: true,
                    } : undefined}
                    level="H"
                />
            </div>

            {/* Preview Area */}
            <div className="flex-1 flex items-center justify-center bg-stone-100 rounded-3xl p-8 border border-stone-200 min-h-[500px] relative overflow-hidden group">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `radial - gradient(#000 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />

                <div
                    id={qrId}
                    className={`relative transition-all duration-300 transform group-hover:scale-[1.02] ${frame === 'phone' ? 'bg-slate-800 p-3 rounded-[3rem] shadow-2xl border-4 border-slate-700' :
                        frame === 'polaroid' ? 'bg-white p-4 pb-32 shadow-xl rotate-[-2deg] hover:rotate-0' :
                            'p-6'
                        }`}
                    style={frame === 'polaroid' ? { width: 'fit-content', minWidth: '300px' } : undefined}
                >
                    {/* Phone Components */}
                    {frame === 'phone' && (
                        <>
                            {/* Inner Screen Border */}
                            <div className="absolute inset-2 bg-black rounded-[2.5rem]" />
                            {/* Notch */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-20 border border-slate-900" />
                        </>
                    )}

                    <div className={`relative ${frame === 'simple' ? 'p-6 bg-white rounded-2xl shadow-lg ring-1 ring-black/5' :
                        frame === 'scan-me' ? 'bg-slate-900 p-5 pb-16 rounded-2xl shadow-xl' :
                            'rounded-xl overflow-hidden'
                        } ${frame === 'phone' ? 'bg-white rounded-[2rem] overflow-hidden p-6 mt-1 mb-1 mx-1' : ''} ${frame === 'polaroid' ? 'border border-stone-100' : ''}`}>

                        {/* The QR Container */}
                        <div className="relative">

                            {/* QR Code Layer (Bottom) */}
                            <QRCodeSVG
                                value={url}
                                size={frame === 'phone' ? 240 : 250}
                                fgColor={activeGradientValue ? '#000000' : color} // Must be black for screen blend mode to work
                                bgColor={bgColor}
                                imageSettings={logoUrl ? {
                                    src: logoUrl,
                                    x: undefined,
                                    y: undefined,
                                    height: logoSize,
                                    width: logoSize,
                                    excavate: true,
                                } : undefined}
                                level="H"
                                className="relative z-0"
                            />

                            {/* Gradient Overlay Layer (Top - Screen Blend Mode) */}
                            {activeGradientValue && (
                                <div
                                    className="absolute inset-0 z-10 pointer-events-none mix-blend-screen"
                                    style={{ background: activeGradientValue }}
                                />
                            )}
                        </div>

                        {/* Scan Me Badge */}
                        {frame === 'scan-me' && (
                            <div className="absolute bottom-4 left-0 right-0 text-center">
                                <span className="bg-white/10 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-white/20 backdrop-blur-sm">
                                    Scan Me
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Polaroid Text */}
                    {frame === 'polaroid' && (
                        <div className="absolute bottom-6 left-4 right-4 text-center">
                            <p className="font-handwriting text-slate-700 font-bold transform -rotate-1 text-sm leading-tight line-clamp-3 break-words">
                                {title}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="flex-1 space-y-8 max-w-md">

                {/* Simple Mode - Toggle for Advanced */}
                <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Customization</h3>
                            <p className="text-xs text-stone-500">Colors, frames, and branding</p>
                        </div>
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${showAdvanced ? 'bg-slate-200 text-slate-700' : 'bg-slate-900 text-white hover:bg-slate-700'}`}
                        >
                            {showAdvanced ? 'Hide Options' : 'Customize'}
                        </button>
                    </div>
                </div>

                {showAdvanced && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
                        {/* Style Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                                <Palette className="w-4 h-4 text-amber-500" /> appearance
                            </h3>

                            {/* Gradients */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-stone-500">Gradients</label>
                                <div className="grid grid-cols-6 gap-2">
                                    {GRADIENTS.map((g, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveGradient(g.value ? g : null)}
                                            className={`w-full aspect-square rounded-lg border transition-all ${activeGradient?.name === g.name ? 'ring-2 ring-amber-500 ring-offset-2 border-transparent' : 'border-stone-200 hover:border-amber-300'}`}
                                            style={{ background: g.value || '#fff' }}
                                            title={g.name}
                                        >
                                            {!g.value && <div className="w-full h-full flex items-center justify-center text-stone-300"><X className="w-4 h-4" /></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Solid Colors (Only if no gradient) */}
                            {!activeGradient && (
                                <div className="space-y-2 animate-fadeIn">
                                    <label className="text-xs font-bold text-stone-500">Solid Color</label>
                                    <div className="flex gap-2">
                                        {DOT_COLORS.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setColor(c)}
                                                className={`w-8 h-8 rounded-full border border-stone-200 transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-stone-400 ring-offset-2' : ''}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                        <input
                                            type="color"
                                            value={color}
                                            onChange={(e) => setColor(e.target.value)}
                                            className="w-8 h-8 rounded-full overflow-hidden cursor-pointer border-none p-0"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Frames Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                                <Layout className="w-4 h-4 text-amber-500" /> Frame Style
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                {FRAMES.map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => setFrame(f.id as any)}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${frame === f.id ? 'bg-amber-50 border-amber-500 text-amber-900' : 'bg-white border-stone-200 text-stone-500 hover:border-amber-300 hover:bg-amber-50/50'}`}
                                    >
                                        <f.icon className="w-5 h-5" />
                                        <span className="text-xs font-bold">{f.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Logo Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-amber-500" /> Branding
                            </h3>

                            {!showLogoInput && !logoUrl ? (
                                <button
                                    onClick={() => setShowLogoInput(true)}
                                    className="w-full py-3 border-2 border-dashed border-stone-200 rounded-xl text-stone-500 text-sm font-bold hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Zap className="w-4 h-4" /> Add Logo
                                </button>
                            ) : (
                                <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={logoUrl}
                                            onChange={(e) => setLogoUrl(e.target.value)}
                                            placeholder="https://example.com/logo.png"
                                            className="flex-1 text-sm bg-white border border-stone-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        />
                                        <button
                                            onClick={() => { setLogoUrl(''); setShowLogoInput(false); }}
                                            className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium text-stone-500">
                                            <span>Size</span>
                                            <span>{logoSize}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="20"
                                            max="80"
                                            value={logoSize}
                                            onChange={(e) => setLogoSize(Number(e.target.value))}
                                            className="w-full accent-amber-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Download Button */}
                <button
                    onClick={handleDownload}
                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 active:scale-[0.98]"
                >
                    <Download className="w-5 h-5" />
                    Download High-Res PNG
                </button>
            </div>
        </div>
    );
};

export default QRCodeGenerator;
