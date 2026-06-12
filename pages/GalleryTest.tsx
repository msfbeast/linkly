import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Download, Maximize2, ChevronLeft, ChevronRight, 
    Sparkles, Info, ExternalLink, Zap, Camera, Sliders, ShieldCheck, 
    Share2, Eye, Compass, ShoppingBag, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface SampleImage {
    id: string;
    title: string;
    category: string;
    description: string;
    url: string;
    camera: string;
    sensor: string;
    aperture: string;
    iso: string;
    shutter: string;
    size: string;
}

const mockSamples: SampleImage[] = [
    {
        id: '1',
        title: 'Main Sensor: Sunset Landscape',
        category: 'Main (1x)',
        description: 'Captured at dusk showing dynamic range recovery in shadows and highlighted sky control.',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        camera: 'Vivo X300 Ultra',
        sensor: 'Sony LYT-900 (1-inch type)',
        aperture: 'f/1.75',
        iso: '50',
        shutter: '1/120s',
        size: '18.4 MB (RAW)'
    },
    {
        id: '2',
        title: 'Periscope Zoom: Mountain Peak',
        category: 'Telephoto (3.7x)',
        description: 'Ultra-clear resolution using the 200MP periscope sensor under harsh mid-day lighting.',
        url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
        camera: 'Vivo X300 Ultra',
        sensor: 'Samsung ISOCELL HP9 (1/1.4-inch)',
        aperture: 'f/2.67',
        iso: '80',
        shutter: '1/800s',
        size: '22.1 MB (RAW)'
    },
    {
        id: '3',
        title: 'Night Mode: Cyber Cityscape',
        category: 'Night (1x)',
        description: '3-second handheld exposure showing low-noise architecture details and neon light highlights.',
        url: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=80',
        camera: 'Vivo X300 Ultra',
        sensor: 'Sony LYT-900 (1-inch type)',
        aperture: 'f/1.75',
        iso: '1250',
        shutter: '1/4s (Handheld)',
        size: '14.9 MB (RAW)'
    },
    {
        id: '4',
        title: 'Ultrawide Macro: Water Droplet',
        category: 'Ultrawide (0.6x)',
        description: 'Focus locked at 2.5cm distance, capturing sub-millimeter details on a forest leaf.',
        url: 'https://images.unsplash.com/photo-1533038590840-1cde6b66b72f?auto=format&fit=crop&w=1200&q=80',
        camera: 'Vivo X300 Ultra',
        sensor: 'Sony LYX-600 (50MP)',
        aperture: 'f/2.0',
        iso: '100',
        shutter: '1/250s',
        size: '12.3 MB (RAW)'
    }
];

const GalleryTest: React.FC = () => {
    const navigate = useNavigate();
    const [activeIndex, setActiveIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showExif, setShowExif] = useState(true);
    const [countdown, setCountdown] = useState(8);
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Before/After Slider state
    const [sliderPosition, setSliderPosition] = useState(50);
    const isResizingRef = useRef(false);
    const sliderContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (countdown > 0 && !isRedirecting) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0 && !isRedirecting) {
            handleDownloadDrive();
        }
    }, [countdown, isRedirecting]);

    const handleDownloadDrive = () => {
        setIsRedirecting(true);
        toast.info("Opening uncompressed Google Drive folder...");
        setTimeout(() => {
            window.open("https://drive.google.com", "_blank");
            setIsRedirecting(false);
            setCountdown(10); // Reset timer
        }, 1500);
    };

    const handlePrev = () => {
        setActiveIndex(prev => (prev === 0 ? mockSamples.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setActiveIndex(prev => (prev === mockSamples.length - 1 ? 0 : prev + 1));
    };

    // Before/After Slider handlers
    const handleMove = (clientX: number) => {
        if (!sliderContainerRef.current) return;
        const rect = sliderContainerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPosition(position);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length > 0) {
            handleMove(e.touches[0].clientX);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (e.buttons === 1 || isResizingRef.current) {
            handleMove(e.clientX);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-slate-900 font-sans antialiased relative overflow-x-hidden selection:bg-yellow-200">
            {/* Background Blob Blurs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-yellow-200/20 via-purple-200/10 to-transparent blur-3xl -z-10 rounded-full opacity-60 pointer-events-none" />

            {/* Sticky Countdown Header Bar */}
            <div className="sticky top-0 bg-[#FDFBF7]/80 backdrop-blur-md border-b border-stone-200/60 z-50 px-6 py-3.5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-stone-100 rounded-xl text-stone-500 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="font-bold tracking-tight text-slate-900">links.trak.in</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-stone-500 hidden sm:inline">
                        {isRedirecting ? "Connecting..." : `Redirecting to Google Drive in ${countdown}s...`}
                    </span>
                    <button
                        onClick={handleDownloadDrive}
                        disabled={isRedirecting}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] flex items-center gap-1.5 shadow-md shadow-slate-950/10 disabled:opacity-50"
                    >
                        {isRedirecting ? (
                            <span>Redirecting...</span>
                        ) : (
                            <>
                                <span>Get RAW Files</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Area: Gallery Slideshow & Details (Col Span 8) */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* Header info */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="bg-yellow-400/20 text-yellow-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                                Camera Samples
                            </span>
                            <span className="text-xs text-stone-400 flex items-center gap-1 font-medium">
                                <Eye className="w-3.5 h-3.5" /> 13.2k views
                            </span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                            Vivo X300 Ultra Media Showcase
                        </h1>
                        <p className="text-stone-500 text-sm leading-relaxed">
                            High-res untouched camera files. Swipe through to check detail performance, lens profile, or download original RAWs.
                        </p>
                    </div>

                    {/* Main Slideshow Container */}
                    <div className="relative rounded-[2rem] overflow-hidden border border-stone-200 bg-white aspect-video shadow-xl shadow-stone-100/40 group">
                        
                        {/* Slideshow controls */}
                        <button 
                            onClick={handlePrev}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white text-slate-900 rounded-full z-20 backdrop-blur-md border border-stone-200/50 shadow-md transition-all hover:scale-105"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={handleNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white text-slate-900 rounded-full z-20 backdrop-blur-md border border-stone-200/50 shadow-md transition-all hover:scale-105"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>

                        {/* Image Frame */}
                        <div className="w-full h-full flex items-center justify-center relative bg-stone-50">
                            <img 
                                src={mockSamples[activeIndex].url} 
                                alt={mockSamples[activeIndex].title}
                                className="w-full h-full object-contain transition-all duration-300"
                            />
                            
                            {/* Category overlay */}
                            <span className="absolute top-4 left-4 bg-slate-900 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-xl shadow-sm">
                                {mockSamples[activeIndex].category}
                            </span>

                            {/* Info overlay toggle */}
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button 
                                    onClick={() => setShowExif(!showExif)}
                                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${showExif ? 'bg-yellow-400 border-yellow-400 text-slate-900 font-extrabold' : 'bg-white border-stone-200 text-stone-500 hover:text-slate-900'}`}
                                    title="Toggle Camera Info"
                                >
                                    <Info className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* EXIF Data Panel Overlay */}
                        {showExif && (
                            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-stone-200/60 text-xs grid grid-cols-2 md:grid-cols-5 gap-3 text-stone-600 shadow-xl shadow-stone-900/5">
                                <div className="space-y-0.5">
                                    <span className="text-[9px] text-stone-400 uppercase font-bold block">Camera</span>
                                    <span className="font-bold text-slate-900 flex items-center gap-1">
                                        <Camera className="w-3.5 h-3.5 text-yellow-500" />
                                        {mockSamples[activeIndex].camera}
                                    </span>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[9px] text-stone-400 uppercase font-bold block">Sensor</span>
                                    <span className="font-bold text-slate-900 truncate block">{mockSamples[activeIndex].sensor}</span>
                                </div>
                                <div className="space-y-0.5 text-right md:text-left">
                                    <span className="text-[9px] text-stone-400 uppercase font-bold block">Aperture</span>
                                    <span className="font-bold text-slate-900 font-mono">{mockSamples[activeIndex].aperture}</span>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[9px] text-stone-400 uppercase font-bold block">Exposure</span>
                                    <span className="font-bold text-slate-900 font-mono">{mockSamples[activeIndex].shutter} @ ISO {mockSamples[activeIndex].iso}</span>
                                </div>
                                <div className="space-y-0.5 text-right">
                                    <span className="text-[9px] text-stone-400 uppercase font-bold block">Size</span>
                                    <span className="font-bold text-orange-600 font-mono">{mockSamples[activeIndex].size}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Thumbnail Selector Bar */}
                    <div className="grid grid-cols-4 gap-4">
                        {mockSamples.map((sample, idx) => (
                            <button
                                key={sample.id}
                                onClick={() => setActiveIndex(idx)}
                                className={`rounded-[1.2rem] overflow-hidden aspect-video border-2 bg-stone-100 transition-all ${idx === activeIndex ? 'border-yellow-400 scale-[1.02] shadow-md shadow-stone-200' : 'border-stone-200 opacity-60 hover:opacity-100'}`}
                            >
                                <img src={sample.url} className="w-full h-full object-cover" alt="" />
                            </button>
                        ))}
                    </div>

                    {/* Interactive Before/After Camera Comparison Slider */}
                    <div className="bg-white border border-stone-200 rounded-[2rem] p-6 space-y-4 shadow-sm">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                                    <Sliders className="w-4 h-4 text-yellow-500" />
                                    Dynamic Performance Slider
                                </h3>
                                <p className="text-xs text-stone-500">Drag the handle to compare standard HDR processing vs Raw recovery.</p>
                            </div>
                            <span className="bg-yellow-400/20 text-yellow-800 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md border border-yellow-400/30">
                                Raw Compare
                            </span>
                        </div>

                        {/* Slider frame */}
                        <div 
                            ref={sliderContainerRef}
                            onMouseMove={handleMouseMove}
                            onTouchMove={handleTouchMove}
                            onMouseDown={() => { isResizingRef.current = true; }}
                            onMouseUp={() => { isResizingRef.current = false; }}
                            onMouseLeave={() => { isResizingRef.current = false; }}
                            className="relative w-full aspect-video rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 cursor-ew-resize select-none shadow-inner"
                        >
                            {/* Standard HDR (Right / Background) */}
                            <img 
                                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80" 
                                alt="Standard HDR"
                                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                            />
                            <div className="absolute bottom-4 right-4 bg-slate-900/90 text-white text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md shadow-sm">
                                Standard HDR
                            </div>

                            {/* Raw recovery (Left / Overlay) */}
                            <div 
                                className="absolute inset-0 overflow-hidden pointer-events-none"
                                style={{ width: `${sliderPosition}%` }}
                            >
                                <img 
                                    src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80&monochrome" 
                                    alt="RAW Recovery"
                                    className="absolute inset-0 w-full h-full object-cover max-w-none"
                                    style={{ width: sliderContainerRef.current?.getBoundingClientRect().width }}
                                />
                                <div className="absolute bottom-4 left-4 bg-yellow-400 text-slate-900 text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md font-bold shadow-sm">
                                    Raw Recovery
                                </div>
                            </div>

                            {/* Slider Handle Line */}
                            <div 
                                className="absolute top-0 bottom-0 w-1 bg-yellow-400 pointer-events-none shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                                style={{ left: `${sliderPosition}%` }}
                            >
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-yellow-400 text-slate-950 rounded-full flex items-center justify-center border-4 border-[#FDFBF7] font-bold text-xs select-none shadow-md">
                                    ↔
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Area: Premium Store Promotion & Info (Col Span 4) */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* Native Sponsor Banner (Monetization Slot 1) */}
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50/60 border border-yellow-200/50 rounded-[2rem] p-6 shadow-md shadow-yellow-100/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-200/20 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
                        
                        <div className="space-y-4 relative z-10">
                            <span className="bg-slate-900/10 text-slate-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-slate-900/15">
                                Recommended Store Deal
                            </span>

                            <div className="space-y-1">
                                <h3 className="text-lg font-extrabold text-slate-900 leading-tight">Vivo X300 Ultra (5G)</h3>
                                <p className="text-xs text-stone-500 leading-relaxed">Get the best launch discounts, official bank cashbacks, and our free custom camera preset bundle today.</p>
                            </div>

                            <a 
                                href="https://amazon.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold text-sm text-center block transition-all active:scale-[0.98] shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
                            >
                                <ShoppingBag className="w-4 h-4 text-yellow-400" />
                                Buy on Amazon (Exclusive Offers)
                            </a>
                        </div>
                    </div>

                    {/* Native Product / Wallpaper Pack Ad (Monetization Slot 2) */}
                    <div className="bg-white border border-stone-200 rounded-[2rem] p-6 shadow-md shadow-stone-100/40 relative overflow-hidden group">
                        <div className="space-y-6">
                            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest block">Featured Creator Product</span>
                            
                            {/* Product Image mockup */}
                            <div className="aspect-video bg-stone-50 rounded-2xl border border-stone-200 overflow-hidden relative shadow-inner">
                                <img 
                                    src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80" 
                                    alt="LUT Pack Preview" 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-slate-900/5" />
                                <span className="absolute bottom-2 right-2 bg-yellow-400 text-slate-950 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                                    ₹299
                                </span>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-base font-bold text-slate-900">Ultra Cinematic LUTs (Mobile & PC)</h4>
                                <p className="text-xs text-stone-500 leading-relaxed">12 stylized presets designed specifically to optimize Vivo LYT-900 log camera color outputs.</p>
                            </div>

                            <a 
                                href="/store"
                                className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 py-3.5 rounded-xl font-bold text-sm text-center block transition-all active:scale-[0.98] shadow-lg shadow-yellow-400/10 flex items-center justify-center gap-1.5"
                            >
                                <span>Get Preset Pack</span>
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Technical Verification widget */}
                    <div className="bg-white border border-stone-200 rounded-[2rem] p-6 space-y-4 shadow-sm">
                        <h4 className="text-xs uppercase tracking-widest font-bold text-stone-400">File Verification</h4>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 text-xs">
                                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                                <div>
                                    <span className="font-bold text-slate-900 block">Virustotal Clean</span>
                                    <span className="text-stone-400 text-[10px]">MD5: c4ca4238a0b923820dcc509a6f75849b</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 text-xs">
                                <Zap className="w-5 h-5 text-yellow-500 shrink-0" />
                                <div>
                                    <span className="font-bold text-slate-900 block">Uncompressed Original</span>
                                    <span className="text-stone-400 text-[10px]">Zero compression. High dynamic range intact.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Redirection timer fallback info */}
                    <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-500 space-y-1">
                        <p>Having trouble opening Google Drive?</p>
                        <button 
                            onClick={handleDownloadDrive}
                            className="text-yellow-600 hover:text-yellow-700 hover:underline font-bold"
                        >
                            Click here to bypass timer and redirect now.
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default GalleryTest;
