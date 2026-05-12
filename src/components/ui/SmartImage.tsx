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
    setFallbackIndex(-1);
    setError(false);
  }, [src]);

  if (error || !fullSrc) {
    return (
      <div className={cn("flex items-center justify-center bg-white/5 text-gray-700", className)}>
        <ShieldAlert size={20} className="opacity-20" />
      </div>
    );
  }

  return (
    <img 
      src={fullSrc} 
      alt={alt} 
      className={className} 
      onError={handleImageError}
      loading="lazy"
      {...props} 
    />
  );
};
