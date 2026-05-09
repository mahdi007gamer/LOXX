import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { ShieldAlert } from 'lucide-react';

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
  const [frozenUrl, setFrozenUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) return;
    
    const isGif = src.toLowerCase().endsWith('.gif') || src.toLowerCase().includes('.gif?');
    
    if (isGif && !isVipEnabled) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          try {
            setFrozenUrl(canvas.toDataURL('image/png'));
          } catch (e) {
            console.warn("Failed to freeze GIF due to CORS, showing original (unfrozen)", e);
            setFrozenUrl(src);
          }
        }
      };
      img.onerror = () => setError(true);
    } else {
      setFrozenUrl(src);
    }
  }, [src, isVipEnabled]);

  if (error || !src) {
    return (
      <div className={cn("flex items-center justify-center bg-gray-900 text-gray-700", className)}>
        {fallback || <ShieldAlert size={24} />}
      </div>
    );
  }

  return (
    <img 
      src={frozenUrl || src} 
      alt={alt} 
      className={className} 
      {...props} 
    />
  );
};
