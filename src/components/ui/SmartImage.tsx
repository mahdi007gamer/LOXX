import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import api from "../../lib/api";
import { getFileUrl } from "../../lib/constants";

// Global memory cache for fetched blobs to prevent duplicate HTTP requests and lag
const blobCache: Record<string, string> = {};
const activeFetches: Record<string, Promise<string>> = {};

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
        const urlPath = fullUrl.substring(fullUrl.indexOf("/api/v1") + 7);
        
        // 1. Check if we already have it in cache
        if (blobCache[urlPath]) {
          setDisplaySrc(blobCache[urlPath]);
          setLoading(false);
          return;
        }

        // 2. Check if there is already an active fetch for this path
        if (activeFetches[urlPath]) {
          setLoading(true);
          activeFetches[urlPath].then((cachedUrl) => {
            if (isMounted) {
              setDisplaySrc(cachedUrl);
              setLoading(false);
            }
          }).catch(() => {
            if (isMounted) {
              setDisplaySrc(fullUrl);
              setLoading(false);
            }
          });
          return;
        }

        // 3. Start a new fetch and register it globally
        try {
          setLoading(true);
          const fetchPromise = (async () => {
            const response = await api.get(urlPath, { responseType: "blob" });
            const objUrl = URL.createObjectURL(response.data);
            blobCache[urlPath] = objUrl;
            return objUrl;
          })();

          activeFetches[urlPath] = fetchPromise;

          const objUrl = await fetchPromise;
          if (isMounted) {
            setDisplaySrc(objUrl);
            setLoading(false);
          }
        } catch (err) {
          console.error("SmartImage fetch error:", err);
          delete activeFetches[urlPath];
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
      // We do not revoke cached object URLs here as they are recycled across all components in the session.
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
      <div className={cn("animate-pulse bg-white/10", className)} />
    );
  }

  if (error || !displaySrc) {
    const initials = alt ? alt.substring(0, 2).toUpperCase() : "LX";
    const colors = [
      "bg-gradient-to-br from-blue-500 to-indigo-600", 
      "bg-gradient-to-br from-purple-500 to-pink-600", 
      "bg-gradient-to-br from-emerald-400 to-teal-600",
      "bg-gradient-to-br from-amber-400 to-orange-600",
      "bg-gradient-to-br from-rose-400 to-red-600",
      "bg-gradient-to-br from-cyan-400 to-blue-600"
    ];
    const colorIndex = alt ? alt.length % colors.length : 0;
    const bgColor = colors[colorIndex];

    return (
      <div className={cn("flex items-center justify-center text-white font-black italic select-none !shadow-inner border border-white/10", bgColor, className)}>
        <span className="tracking-tighter drop-shadow-md text-sm md:text-base">{initials}</span>
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
