import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Image as ImageIcon, Palette, Layout, X } from 'lucide-react';
import { downloadQrCode } from '../utils/qrUtils';

interface QRCodeGeneratorProps {
    url: string;
    title?: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ url, title = 'qrcode' }) => {
    const [color, setColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#FFFFFF');
    const [logoUrl, setLogoUrl] = useState('');
    const [frame, setFrame] = useState<'none' | 'simple' | 'scan-me'>('none');
    const [showLogoInput, setShowLogoInput] = useState(false);

    const qrId = `qr-${Math.random().toString(36).substr(2, 9)}`;

    const handleDownload = () => {
        downloadQrCode(qrId, `${title}-qr`);
    };

    return (
        <div className="flex flex-col md:flex-row gap-8">
            {/* Preview Area */}
            <div className="flex-1 flex items-center justify-center bg-stone-100 rounded-2xl p-8 border border-stone-200 min-h-[300px]">
                <div
                    id={qrId}
                    className={`relative p-4 bg-white shadow-lg transition-all duration-300 ${frame === 'simple' ? 'border-8 border-slate-900 rounded-xl' :
                            frame === 'scan-me' ? 'pb-12 pt-4 px-4 bg-slate-900 rounded-xl' : 'rounded-xl'
                        }`}
                >
                    {frame === 'scan-me' && (
                        <div className="absolute bottom-3 left-0 right-0 text-center text-white font-bold uppercase tracking-widest text-sm">
                            Scan Me
                        </div>
                    )}

                    <div className="bg-white p-2 rounded-lg">
                        <QRCodeSVG
                            value={url}
                            size={200}
                            fgColor={color}
                            bgColor={bgColor}
                            imageSettings={logoUrl ? {
                                src: logoUrl,
                                x: undefined,
                                y: undefined,
                                height: 40,
                                width: 40,
                                excavate: true,
                            } : undefined}
                            level="H" // High error correction for logos
                        />
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex-1 space-y-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Customize QR Code</h3>
                    <p className="text-sm text-stone-500">Make it stand out.</p>
                </div>

                {/* Colors */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                        <Palette className="w-3 h-3" /> Colors
                    </label>
                    <div className="flex gap-4">
                        <div>
                            <label className="text-xs text-stone-500 block mb-1">Dots</label>
                            <div className="flex gap-2">
                                {['#000000', '#4f46e5', '#ec4899', '#10b981', '#f59e0b'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={`w-6 h-6 rounded-full border border-stone-200 transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-stone-400 ring-offset-2' : ''}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-6 h-6 rounded-full overflow-hidden cursor-pointer border-none p-0"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-stone-500 block mb-1">Background</label>
                            <div className="flex gap-2">
                                {['#FFFFFF', '#F5F5F4', '#FEF3C7', '#ECFEFF'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setBgColor(c)}
                                        className={`w-6 h-6 rounded-full border border-stone-200 transition-transform hover:scale-110 ${bgColor === c ? 'ring-2 ring-stone-400 ring-offset-2' : ''}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logo */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                        <ImageIcon className="w-3 h-3" /> Logo
                    </label>

                    {!showLogoInput && !logoUrl ? (
                        <button
                            onClick={() => setShowLogoInput(true)}
                            className="text-sm text-slate-600 hover:text-slate-900 font-medium flex items-center gap-2 border border-stone-200 rounded-lg px-3 py-2 hover:bg-stone-50 transition-colors w-full justify-center"
                        >
                            + Add Logo URL
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                placeholder="https://example.com/logo.png"
                                className="flex-1 text-sm border border-stone-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                            />
                            <button
                                onClick={() => { setLogoUrl(''); setShowLogoInput(false); }}
                                className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Frames */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                        <Layout className="w-3 h-3" /> Frame
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => setFrame('none')}
                            className={`px-3 py-2 text-sm border rounded-lg transition-all ${frame === 'none' ? 'border-slate-900 bg-slate-50 text-slate-900 font-bold' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}
                        >
                            None
                        </button>
                        <button
                            onClick={() => setFrame('simple')}
                            className={`px-3 py-2 text-sm border rounded-lg transition-all ${frame === 'simple' ? 'border-slate-900 bg-slate-50 text-slate-900 font-bold' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}
                        >
                            Simple
                        </button>
                        <button
                            onClick={() => setFrame('scan-me')}
                            className={`px-3 py-2 text-sm border rounded-lg transition-all ${frame === 'scan-me' ? 'border-slate-900 bg-slate-50 text-slate-900 font-bold' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}
                        >
                            Scan Me
                        </button>
                    </div>
                </div>

                {/* Download */}
                <button
                    onClick={handleDownload}
                    className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 active:scale-[0.98]"
                >
                    <Download className="w-4 h-4" />
                    Download PNG
                </button>
            </div>
        </div>
    );
};

export default QRCodeGenerator;
