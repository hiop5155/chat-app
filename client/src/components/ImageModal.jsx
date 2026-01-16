import React from 'react';
import { X, Download } from 'lucide-react';

const ImageModal = ({ src, onClose }) => {
    if (!src) return null;

    const handleDownload = async () => {
        try {
            const response = await fetch(src);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            // Extract filename from URL or use default
            const filename = src.split('/').pop() || 'downloaded-image.jpg';
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback for cross-origin or simple cases if fetch fails
            const link = document.createElement('a');
            link.href = src;
            link.target = '_blank';
            link.download = 'image.jpg';
            link.click();
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div 
                className="relative max-w-full max-h-full"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image wrapper
            >
                {/* Controls */}
                <div className="absolute -top-12 right-0 flex gap-4">
                    <button 
                        onClick={handleDownload}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        title="Download"
                    >
                        <Download size={24} />
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        title="Close"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Image */}
                <img 
                    src={src} 
                    alt="Full size preview" 
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                />
            </div>
        </div>
    );
};

export default ImageModal;
