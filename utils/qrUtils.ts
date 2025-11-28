
/**
 * Downloads an SVG element as a PNG image
 * @param svgId The ID of the SVG element
 * @param filename The name of the file to download
 */
export const downloadQrCode = (svgId: string, filename: string) => {
    const svgElement = document.getElementById(svgId) as unknown as SVGElement;
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgElement);

    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);

    img.onload = () => {
        const canvas = document.createElement('canvas');
        // Increase resolution for better quality
        const scale = 2;
        canvas.width = (svgElement.clientWidth || 200) * scale;
        canvas.height = (svgElement.clientHeight || 200) * scale;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Fill white background (transparent SVGs might look bad)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `${filename}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };
};
