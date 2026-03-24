import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { ChevronLeft, ChevronRight, Maximize2, X, Play } from 'lucide-react';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

interface MediaGalleryProps {
  media: MediaItem[];
  productName: string;
}

export default function MediaGallery({ media, productName }: MediaGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    const nextIndex = activeIndex + newDirection;
    if (nextIndex >= 0 && nextIndex < media.length) {
      setDirection(newDirection);
      setActiveIndex(nextIndex);
    }
  };

  return (
    <div className="relative w-full space-y-4">
      {/* Main Display */}
      <div 
        ref={containerRef}
        className="relative aspect-[4/5] bg-beige overflow-hidden rounded-b-[48px] shadow-sm"
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={activeIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          >
            {media[activeIndex].type === 'video' ? (
              <div className="relative w-full h-full">
                <video
                  src={media[activeIndex].url}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
                <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-md p-2 rounded-full text-white">
                  <Play size={16} fill="currentColor" />
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full group">
                <img
                  src={media[activeIndex].url}
                  alt={`${productName} - ${activeIndex + 1}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => setIsZoomed(true)}
                  className="absolute bottom-6 right-6 w-12 h-12 neumorphic-circle bg-white/80 backdrop-blur-md text-luxury-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Maximize2 size={20} strokeWidth={1.5} />
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows (Desktop) */}
        {media.length > 1 && (
          <>
            <button
              disabled={activeIndex === 0}
              onClick={() => paginate(-1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 neumorphic-circle bg-white/40 backdrop-blur-md text-luxury-black disabled:opacity-0 transition-all z-10 flex items-center justify-center"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              disabled={activeIndex === media.length - 1}
              onClick={() => paginate(1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 neumorphic-circle bg-white/40 backdrop-blur-md text-luxury-black disabled:opacity-0 transition-all z-10 flex items-center justify-center"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {media.length > 1 && (
        <div className="px-8 flex items-center space-x-3 overflow-x-auto no-scrollbar py-2">
          {media.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDirection(idx > activeIndex ? 1 : -1);
                setActiveIndex(idx);
              }}
              className={`relative flex-shrink-0 w-16 h-20 rounded-xl overflow-hidden transition-all duration-300 ${
                activeIndex === idx 
                  ? 'ring-2 ring-primary ring-offset-2 scale-105' 
                  : 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0'
              }`}
            >
              {item.type === 'video' ? (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Play size={16} className="text-gray-500" />
                </div>
              ) : (
                <img 
                  src={item.url} 
                  alt={`Thumbnail ${idx + 1}`} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Zoom Modal */}
      <AnimatePresence>
        {isZoomed && media[activeIndex].type === 'image' && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsZoomed(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative w-full max-w-4xl aspect-[4/5] md:aspect-auto md:h-[90vh] flex items-center justify-center"
            >
              <button 
                onClick={() => setIsZoomed(false)}
                className="absolute -top-12 right-0 w-10 h-10 neumorphic-circle bg-white/10 text-white flex items-center justify-center"
              >
                <X size={24} />
              </button>
              
              <div className="w-full h-full overflow-auto flex items-center justify-center no-scrollbar">
                <motion.img
                  src={media[activeIndex].url}
                  alt={productName}
                  className="max-w-none w-full h-full object-contain cursor-zoom-out"
                  onClick={() => setIsZoomed(false)}
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={0.1}
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
