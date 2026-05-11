import React from "react";
import { cn } from "../../lib/utils";
import { CheckCircle, ShieldCheck, Crown, Star, Wifi, Shield } from "lucide-react";

interface Badge {
  id: string;
  name: string;
  iconUrl?: string;
  isSpecial: boolean;
}

interface NameWithBadgeProps {
  name: string;
  badges?: Badge[];
  className?: string;
  nameClassName?: string;
}

export const NameWithBadge: React.FC<NameWithBadgeProps> = ({ 
  name, 
  badges = [], 
  className,
  nameClassName
}) => {
  const specialBadges = badges.filter(b => b?.isSpecial);

  // Map known badge names to icons if iconUrl is missing or just for fallback
  const getBadgeIcon = (badge: Badge) => {
    if (badge.iconUrl) {
      return <img src={badge.iconUrl} alt={badge.name} className="h-3 w-3 object-contain" />;
    }

    switch (badge.name.toLowerCase()) {
      case "verify":
      case "تایید شده":
        return <CheckCircle size={12} className="text-blue-400 fill-blue-400/20" />;
      case "streamer":
      case "استریمر":
        return <Wifi size={12} className="text-purple-400" />;
      case "helper":
      case "هلپر":
        return <ShieldCheck size={12} className="text-green-400" />;
      case "pro player":
        return <Star size={12} className="text-yellow-400" />;
      case "leader":
        return <Crown size={12} className="text-orange-400" />;
      case "admin":
        return <Shield size={12} className="text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className={cn("font-bold", nameClassName)}>{name}</span>
      <div className="flex items-center gap-0.5">
        {specialBadges.map(badge => (
          <div key={badge.id} title={badge.name} className="flex items-center justify-center">
            {getBadgeIcon(badge)}
          </div>
        ))}
      </div>
    </div>
  );
};
