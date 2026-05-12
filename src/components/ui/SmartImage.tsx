import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { ShieldAlert } from 'lucide-react';
import { getFileUrl } from '../../lib/constants';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  isVipEnabled?: boolean;
  fallbacks?: string[];
}

/**
 * SmartImage displays an image, but if it's a GIF and membership is inactive,
 * it attempts to "freeze" it by drawing the first frame to a canvas.
 * It also handles multiple fallback URLs if the primary one fails.
 */
export const SmartImage: React.FC<SmartImageProps> = ({ 
  src, 
  alt, 
  className, 
  isVipEnabled = false,
  fallbacks = [],
  onError,
  ...props 
}) => {
  const [error, setError] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(-1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const currentSrc = fallbackIndex === -1 ? src : fallbacks[fallbackIndex];
  const fullSrc = getFileUrl(currentSrc);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (fallbackIndex + 1 < fallbacks.length) {
      setFallbackIndex(prev => prev + 1);
    } else {
      setError(true);
      if (onError) onError(e);
    }
  };

  useEffect(() => {
    // Reset fallback if src changes
    setFallbackIndex(-1);
    setError(false);
  }, [src]);

  useEffect(() => {
    if (!fullSrc) return;
    
    const isGif = fullSrc.toLowerCase().includes('.gif') || fullSrc.includes('data:image/gif');
    
    if (isGif && !isVipEnabled) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = fullSrc;
      
      img.onload = () => {
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            canvasRef.current.width = img.width;
            canvasRef.current.height = img.height;
            ctx.drawImage(img, 0, 0);
            setIsFrozen(true);
          }
        }
      };
      img.onerror = () => {
        handleImageError({} as any);
      };
    } else {
      setIsFrozen(false);
    }
  }, [fullSrc, isVipEnabled, fallbackIndex]);

  if (error || !fullSrc) {
    return (
      <div className={cn("flex items-center justify-center bg-gray-900/50 text-gray-700 animate-pulse", className)}>
        <ShieldAlert size={24} className="opacity-20" />
      </div>
    );
  }

  if (isVipEnabled) {
    return (
      <img 
        src={fullSrc} 
        alt={alt} 
        className={className} 
        onError={handleImageError}
        {...props} 
      />
    );
  }

  return (
    <div className={cn("relative overflow-hidden group/freeze flex items-center justify-center", className)}>
      <canvas 
        ref={canvasRef} 
        className={cn("w-full h-full object-cover", !isFrozen && "hidden")} 
      />
      {!isFrozen && (
        <img 
          src={fullSrc} 
          alt={alt} 
          className="w-full h-full object-cover" 
          onError={handleImageError}
          {...props}
        />
      )}
    </div>
  );
};
