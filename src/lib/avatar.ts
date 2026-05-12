
/**
 * Avatar utilities for generating default profiles.
 * Handles fallbacks if primary providers (like Dicebear) are blocked in certain regions.
 */

const PROVIDERS = {
  DICEBEAR: (seed: string, style: string = 'avataaars') => `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`,
  UI_AVATARS: (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
  ROBOHASH: (seed: string) => `https://robohash.org/${encodeURIComponent(seed)}?set=set4`,
  LOCAL_FALLBACK: '/public/pics/profiles/profile-boy.png'
};

export const getAvatarUrl = (seed: string, style?: string): string => {
  // We can eventually add logic here to rotate providers if one is slow or failing
  return PROVIDERS.DICEBEAR(seed || 'Gamer', style);
};

export const getAvatarFallbacks = (seed: string): string[] => {
  return [
    PROVIDERS.DICEBEAR(seed),
    PROVIDERS.ROBOHASH(seed),
    PROVIDERS.UI_AVATARS(seed),
    PROVIDERS.LOCAL_FALLBACK
  ];
};
