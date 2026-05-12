import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import { RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";

interface AuthorizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

export const AuthorizedImage: React.FC<AuthorizedImageProps> = ({ src, className, ...props }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchImage = async () => {
      if (!src) return;
      
      // If it's already a full URL or data URL, just use it
      if (src.startsWith("http") || src.startsWith("data:")) {
        setObjectUrl(src);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(false);
        
        let urlPath = src;
        if (src.startsWith("/api/v1")) {
          urlPath = src.replace("/api/v1", "");
        }
        
        const response = await api.get(urlPath, { responseType: "blob" });
        const url = URL.createObjectURL(response.data);
        if (isMounted) {
          setObjectUrl(url);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load authorized image:", err);
        if (isMounted) {
          // Fallback to direct URL
          setObjectUrl(src.startsWith("/api/v1") ? src : `/api/v1${src.startsWith("/") ? "" : "/"}${src}`);
          setLoading(false);
          setError(false);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      if (objectUrl && !src.startsWith("http") && !src.startsWith("data:")) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center bg-white/5", className)}>
        <RefreshCw size={16} className="animate-spin text-neon-blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center bg-red-500/10 text-red-500", className)}>
        <AlertCircle size={16} />
      </div>
    );
  }

  return <img src={objectUrl || ""} className={className} {...props} />;
};
