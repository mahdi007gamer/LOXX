import React, { useState, useEffect, useRef } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";
import api from "../../lib/api";
import { getFileUrl } from "../../lib/constants";

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbacks?: string[];
  isVipEnabled?: boolean;
}

/**
 * SmartImage displays an image.
 * If the image is served from our API, it fetches it via Axios with Auth headers
 * to ensure maximum compatibility (especially in iframes or restricted environments).
 * It also handles GIF freezing for non-VIP users and fallbacks.
 */
export const SmartImage: React.FC<SmartImageProps> = ({ 
  src, 
  alt, 
  className, 
  fallbacks = [], 
  isVipEnabled = false,
  ...props 
}) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [displaySrc, setDisplaySrc] = useState<string>("");
  const [isFrozen, setIsFrozen] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(-1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMountedRef = useRef(true);

  // Memoize fallbacks to prevent infinite loops if literal arrays are passed in props
  const memoizedFallbacks = React.useMemo(() => fallbacks, [JSON.stringify(fallbacks)]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);
  
  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const loadImage = async () => {
      const currentRawSrc = fallbackIndex === -1 ? src : fallbacks[fallbackIndex];
      const fullUrl = getFileUrl(currentRawSrc);

      if (!fullUrl) {
        setLoading(false);
        return;
      }

      setError(false);
      
      // If it's a direct URL (external), or data URL, use it directly
      if (fullUrl.startsWith("http") && !fullUrl.includes("/api/v1/upload/")) {
        setDisplaySrc(fullUrl);
        setLoading(false);
        return;
      }
      
      if (fullUrl.startsWith("data:") || fullUrl.startsWith("blob:")) {
        setDisplaySrc(fullUrl);
        setLoading(false);
        return;
      }

      // If it's an API route or an internal path that might need auth headers
      if (fullUrl.includes("/api/v1/upload/")) {
        try {
          setLoading(true);
          // Extract the part after /api/v1 for the axios baseURL
          const urlPath = fullUrl.substring(fullUrl.indexOf("/api/v1") + 7);
          const response = await api.get(urlPath, { responseType: "blob" });
          
          if (isMounted) {
            objectUrl = URL.createObjectURL(response.data);
            setDisplaySrc(objectUrl);
            setLoading(false);
          }
        } catch (err) {
          console.error("SmartImage fetch error:", err);
          if (isMounted) {
            // As a last resort, try direct URL without auth headers
            setDisplaySrc(fullUrl);
            setLoading(false);
          }
        }
      } else {
        // Fallback for direct serving
        setDisplaySrc(fullUrl);
        setLoading(false);
      }
    };

    loadImage();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src, fallbackIndex, memoizedFallbacks]);

  const handleImageError = () => {
    if (fallbackIndex < memoizedFallbacks.length - 1) {
      setFallbackIndex(prev => prev + 1);
    } else {
      setError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!displaySrc) return;
    
    const isGif = displaySrc.toLowerCase().includes('.gif') || displaySrc.includes('data:image/gif');
    
    if (isGif && !isVipEnabled) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = displaySrc;
      
      img.onload = () => {
        if (canvasRef.current && isMountedRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            canvasRef.current.width = img.width;
            canvasRef.current.height = img.height;
            ctx.drawImage(img, 0, 0);
            setIsFrozen(true);
          }
        }
      };
    } else {
      setIsFrozen(false);
    }
  }, [displaySrc, isVipEnabled]);

  if (loading && !displaySrc && !error) {
    return (
      <div className={cn("flex items-center justify-center bg-white/5", className)}>
        <RefreshCw size={16} className="animate-spin text-neon-blue" />
      </div>
    );
  }

  if (error || !displaySrc) {
    const initials = alt ? alt.substring(0, 2).toUpperCase() : "??";
    const colors = [
      "bg-blue-500", "bg-purple-500", "bg-pink-500", 
      "bg-indigo-500", "bg-cyan-500", "bg-teal-500",
      "bg-emerald-500", "bg-amber-500", "bg-rose-500"
    ];
    const colorIndex = alt ? alt.length % colors.length : 0;
    const bgColor = colors[colorIndex];

    return (
      <div className={cn("flex flex-col items-center justify-center text-white/40 font-black italic select-none", bgColor, className)}>
        <span className="text-xl tracking-tighter">{initials}</span>
        <ShieldAlert size={12} className="mt-1 opacity-50" />
      </div>
    );
  }

  if (isVipEnabled || !displaySrc.toLowerCase().includes('.gif')) {
    return (
      <img 
        src={displaySrc} 
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
          src={displaySrc} 
          alt={alt} 
          className="w-full h-full object-cover" 
          onError={handleImageError}
          {...props}
        />
      )}
    </div>
  );
};
