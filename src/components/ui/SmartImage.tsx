import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { ShieldAlert } from 'lucide-react';
import { getFileUrl } from '../../lib/constants';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  isVipEnabled?: boolean;
  fallback?: React.ReactNode;
}

/**
 * SmartImage displays an image, but if it's a GIF and membership is inactive,
 * it attempts to "freeze" it by drawing the first frame to a canvas.
 */
export const SmartImage: React.FC<SmartImageProps> = ({ 
  src, 
  alt, 
  className, 
  isVipEnabled = false,
  fallback,
  ...props 
}) => {
  const [error, setError] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const fullSrc = getFileUrl(src);

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
        setError(true);
        setIsFrozen(false);
      };
    } else {
      setIsFrozen(false);
    }
  }, [fullSrc, isVipEnabled]);

  if (error || !fullSrc) {
    return (
      <div className={cn("flex items-center justify-center bg-gray-900 text-gray-700", className)}>
        {fallback || <ShieldAlert size={24} />}
      </div>
    );
  }

  if (isVipEnabled) {
    return (
      <img 
        src={fullSrc} 
        alt={alt} 
        className={className} 
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
          {...props}
        />
      )}
    </div>
  );
};
