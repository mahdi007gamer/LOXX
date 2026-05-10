import React from "react";
import { cn } from "@/src/lib/utils";

interface UserBadgesProps {
  badges: any[];
  className?: string;
  iconClassName?: string;
  showAll?: boolean;
}

export const UserBadges: React.FC<UserBadgesProps> = ({ 
  badges, 
  className, 
  iconClassName,
  showAll = false 
}) => {
  if (!badges || badges.length === 0) return null;

  // Filter for special badges unless showAll is true
  const displayBadges = showAll ? badges : badges.filter(b => b.isSpecial || b.isPinned);

  if (displayBadges.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-1 shrink-0", className)}>
      {displayBadges.map((badge, idx) => (
        <img 
          key={idx} 
          src={badge.iconUrl} 
          alt={badge.name} 
          title={badge.name} 
          className={cn("h-3 w-3 md:h-4 md:w-4 object-contain", iconClassName)} 
        />
      ))}
    </div>
  );
};
