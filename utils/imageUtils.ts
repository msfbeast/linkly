
/**
 * Utility for client-side image compression and resizing using the Canvas API.
 * 
 * @param file - The original File object
 * @param options - Configuration options for compression
 * @param options.maxWidth - Maximum width of the output image (default: 1200)
 * @param options.maxHeight - Maximum height of the output image (default: 1200)
 * @param options.quality - JPEG quality (0 to 1, default: 0.8)
 * @returns Promise<File> - The compressed File object
 */
export async function compressImage(
    file: File,
    options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<File> {
    const { maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = options;

    // If not an image, return original
    if (!file.type.startsWith('image/')) {
        return file;
    }

    // If SVG, return original (canvas rasterizes SVG)
    if (file.type === 'image/svg+xml') {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions preserving aspect ratio
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Better quality scaling
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Canvas to Blob conversion failed'));
                            return;
                        }
                        // Create a new file with the compressed blob
                        const optimizedFile = new File([blob], file.name, {
                            type: 'image/jpeg', // Force convert to JPEG for better compression
                            lastModified: Date.now(),
                        });
                        resolve(optimizedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = (error) => reject(error);
        };

        reader.onerror = (error) => reject(error);
    });
}
