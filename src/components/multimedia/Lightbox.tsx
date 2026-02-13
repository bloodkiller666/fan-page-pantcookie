// Import necessary modules
import { useEffect } from 'react';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { AdvancedImage } from '@cloudinary/react';

import { createPortal } from 'react-dom';

const Lightbox = ({ images, currentIndex, onClose, onNext, onPrev }) => {
    const currentImage = images[currentIndex];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') onPrev();
            if (e.key === 'ArrowRight') onNext();
        };

        window.addEventListener('keydown', handleKeyDown);
        // Prevent background scrolling
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [onClose, onNext, onPrev]);

    const content = (
        <div
            className="fixed inset-0 bg-black/95 z-[9999] flex flex-col md:flex-row h-[100dvh] w-screen"
            onClick={onClose}
        >
            {/* Mobile Header / Close Button */}
            <div className="absolute top-0 left-0 right-0 p-4 z-[110] flex justify-end md:hidden bg-gradient-to-b from-black/80 to-transparent">
                <button
                    onClick={onClose}
                    className="text-white p-2 bg-black/50 rounded-full backdrop-blur-sm"
                >
                    <FiX className="w-6 h-6" />
                </button>
            </div>

            {/* Close Button Desktop */}
            <button
                onClick={onClose}
                className="hidden md:block absolute top-6 right-6 text-white hover:text-primary-pink transition p-2 rounded-full hover:bg-white/10 z-[110]"
            >
                <FiX className="w-10 h-10" />
            </button>

            {/* Navigation Buttons */}
            <button
                onClick={(e) => { e.stopPropagation(); onPrev(); }}
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-white hover:text-primary-pink transition p-3 rounded-full hover:bg-white/10 z-[110]"
            >
                <FiChevronLeft className="w-8 h-8 md:w-12 md:h-12" />
            </button>

            <button
                onClick={(e) => { e.stopPropagation(); onNext(); }}
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-white hover:text-primary-pink transition p-3 rounded-full hover:bg-white/10 z-[110]"
            >
                <FiChevronRight className="w-8 h-8 md:w-12 md:h-12" />
            </button>


            {/* Image Container - Flexible Height */}
            <div
                className="flex-1 w-full h-[60%] md:h-full flex items-center justify-center p-4 md:p-10 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {currentImage.cldImg ? (
                    <AdvancedImage
                        cldImg={currentImage.cldImg}
                        className="max-w-full max-h-full object-contain shadow-2xl drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]"
                        alt={currentImage.alt}
                    />
                ) : (
                    <img
                        src={currentImage.src}
                        alt={currentImage.alt}
                        className="max-w-full max-h-full object-contain shadow-2xl drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]"
                    />
                )}
            </div>

            {/* Info Sidebar / Bottom Sheet */}
            <div
                className="w-full md:w-[400px] h-[40%] md:h-full bg-white dark:bg-gray-900 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 flex flex-col z-[105] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                        <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
                            <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 overflow-hidden">
                                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Pantcookie Community</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Fan Page Oficial</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <span className="font-bold text-sm text-gray-900 dark:text-white">
                                {currentImage.alt}
                            </span>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {currentImage.description || "Sin descripción disponible."}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/50">
                            <span className="px-3 py-1 text-xs rounded-full bg-pink-50 dark:bg-pink-900/20 text-primary-pink font-medium">#FanArt</span>
                            <span className="px-3 py-1 text-xs rounded-full bg-blue-50 dark:bg-blue-900/20 text-primary-blue font-medium">#Pantcookie</span>
                        </div>
                    </div>
                </div>

                {/* Footer Meta */}
                <div className="p-4 md:p-6 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1">
                        Hace 2 días
                    </p>
                    <p className="text-xs text-gray-500">
                        Imagen {currentIndex + 1} de {images.length}
                    </p>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
};

export default Lightbox;
