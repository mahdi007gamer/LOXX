import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { QuickProfilePopover, QuickProfileUser } from '../components/ui/QuickProfilePopover';

interface ProfilePopoverContextType {
 openProfile: (user: QuickProfileUser, isSelf: boolean) => void;
 closeProfile: () => void;
}

const ProfilePopoverContext = createContext<ProfilePopoverContextType | undefined>(undefined);

export const useProfilePopover = () => {
 const context = useContext(ProfilePopoverContext);
 if (!context) {
 throw new Error('useProfilePopover must be used within a ProfilePopoverProvider');
 }
 return context;
};

export const ProfilePopoverProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
 const [profileData, setProfileData] = useState<{ user: QuickProfileUser; isSelf: boolean } | null>(null);

 const openProfile = (user: QuickProfileUser, isSelf: boolean) => {
 setProfileData({ user, isSelf });
 };

 const closeProfile = () => {
 setProfileData(null);
 };

 return (
 <ProfilePopoverContext.Provider value={{ openProfile, closeProfile }}>
 {children}
 <AnimatePresence>
 {profileData && (
 <>
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={closeProfile}
 className="fixed inset-0 z-[20000] bg-black/40 cursor-default"
 />
 <div className="fixed inset-0 z-[20001] flex items-center justify-center pointer-events-none p-4">
 <div className="pointer-events-auto">
 <QuickProfilePopover 
 onClose={closeProfile} 
 user={profileData.user}
 isSelf={profileData.isSelf}
 />
 </div>
 </div>
 </>
 )}
 </AnimatePresence>
 </ProfilePopoverContext.Provider>
 );
};
