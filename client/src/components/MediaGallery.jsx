import React from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { API_URL } from '../config';

const MediaGallery = ({ messages, onClose, onImageClick }) => {
    const images = messages.filter(msg => msg.type === 'image' && msg.fileUrl);

    return (
        <div className="fixed inset-0 z-40 bg-white dark:bg-gray-900 overflow-y-auto">
            <div className="sticky top-0 z-50 flex items-center justify-between p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur shadow-sm">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onClose}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors dark:text-gray-200"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">返回對話</span>
                    </button>
                    <h2 className="text-xl font-bold dark:text-white border-l pl-4 dark:border-gray-700">Media Gallery ({images.length})</h2>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-gray-200"
                >
                    <X size={24} />
                </button>
            </div>

            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((msg) => (
                    <div 
                        key={msg._id} 
                        className="aspect-square relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
                        onClick={() => onImageClick(`${API_URL.replace('/api', '')}${msg.fileUrl}`)}
                    >
                        <img 
                            src={`${API_URL.replace('/api', '')}${msg.fileUrl}`} 
                            alt={`Uploaded by ${msg.sender?.username}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                ))}
                {images.length === 0 && (
                    <div className="col-span-full text-center py-20 text-gray-500 dark:text-gray-400">
                        No images found in this chat.
                    </div>
                )}
            </div>
        </div>
    );
};

export default MediaGallery;
