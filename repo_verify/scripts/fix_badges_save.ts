import fs from 'fs';

let content = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

// 1. Add state items
content = content.replace(
  'const [userBadges, setUserBadges] = useState<any[]>([]);',
  `const [userBadges, setUserBadges] = useState<any[]>([]);\n  const [stagedUserBadges, setStagedUserBadges] = useState<any[]>([]);\n  const [hasUnsavedBadges, setHasUnsavedBadges] = useState(false);`
);

// 2. Update fetchUserBadges
content = content.replace(
  'setUserBadges(res.data.data.badges || []);',
  `const fetched = res.data.data.badges || [];\n      setUserBadges(fetched);\n      setStagedUserBadges(fetched);\n      setHasUnsavedBadges(false);`
);

const fnStr = 'const handleToggleBadgePin = async (badgeId: string) => {';
if (content.includes(fnStr)) {
  const toggleHandleOrigStr = content.substring(content.indexOf(fnStr), content.indexOf('};', content.indexOf('toast.error(err.response?.data?.error?.message || "خطا در بروزرسانی پین");')) + 2);
  const replaceStr = `const handleToggleBadgePin = (badgeId: string) => {
    const badge = stagedUserBadges.find(b => b.id === badgeId);
    if (!badge) return;

    const pinnedCount = stagedUserBadges.filter(b => b.isPinned).length;
    if (!badge.isPinned && pinnedCount >= 5) {
      toast.error("حداکثر می‌توانید ۵ نشان را پین کنید");
      return;
    }

    setStagedUserBadges(prev => prev.map(b => b.id === badgeId ? { ...b, isPinned: !b.isPinned } : b));
    setHasUnsavedBadges(true);
  };`;
  content = content.replace(toggleHandleOrigStr, replaceStr);
}

// 4. Update handleToggleStandardBadge & add handleSaveBadges
const toggleStdStr = 'const handleToggleStandardBadge = async (badgeId: string) => {';
if (content.includes(toggleStdStr)) {
  const toggleStdOrigEndStr = content.substring(content.indexOf(toggleStdStr), content.indexOf('};', content.indexOf('setSaving(false);')) + 2);
  const replaceStdStr = `const handleToggleStandardBadge = (badgeId: string) => {
    const badgeObj = availableChoiceBadges.find(b => b.id === badgeId);
    if (!badgeObj) return;

    const hasBadge = stagedUserBadges.some(ub => ub.id === badgeId);
    if (hasBadge) {
      setStagedUserBadges(prev => prev.filter(ub => ub.id !== badgeId));
    } else {
      setStagedUserBadges(prev => [...prev, { ...badgeObj, isPinned: false }]);
    }
    setHasUnsavedBadges(true);
  };

  const handleSaveBadges = async () => {
    setSaving(true);
    try {
      const origIds = userBadges.map(b => b.id);
      const stagedIds = stagedUserBadges.map(b => b.id);
      
      const added = stagedIds.filter(id => !origIds.includes(id));
      const removed = origIds.filter(id => !stagedIds.includes(id));
      const toggledIds = [...added, ...removed];
      
      for (const id of toggledIds) {
         await api.post(\`/badges/toggle-standard/\${id}\`);
      }

      for (const stagedBadge of stagedUserBadges) {
         const origBadge = userBadges.find(b => b.id === stagedBadge.id);
         if (!origBadge && stagedBadge.isPinned) {
            await api.patch("/user/profile", {
              badge_pins: { badgeId: stagedBadge.id, isPinned: true }
            });
         } else if (origBadge && origBadge.isPinned !== stagedBadge.isPinned) {
            await api.patch("/user/profile", {
              badge_pins: { badgeId: stagedBadge.id, isPinned: stagedBadge.isPinned }
            });
         }
      }
      
      await fetchUserBadges();
      toast.success(isRtlStyle ? "تغییرات نشان‌ها با موفقیت اعمال شد" : "Badges saved successfully");
    } catch (err: any) {
      toast.error("خطا در ذخیره سازی نشان ها");
    } finally {
      setSaving(false);
    }
  };`;
  content = content.replace(toggleStdOrigEndStr, replaceStdStr);
}

// 5. Update renderBadges userBadges -> stagedUserBadges
let badgesStart = content.indexOf('const renderBadges = () =>');
let badgesEnd = content.indexOf('const renderSecurity = () =>');
if (badgesStart !== -1 && badgesEnd !== -1) {
  let badgesSection = content.substring(badgesStart, badgesEnd);
  badgesSection = badgesSection.replace(/userBadges/g, 'stagedUserBadges');
  
  // Add Apply button block
  const buttonInject = `
    <div className="flex justify-between items-center mb-4">
      <div></div>
      {hasUnsavedBadges && (
        <GlowButton variant="blue" className="px-6 py-2 text-xs font-black uppercase" onClick={handleSaveBadges} disabled={saving}>
          {saving ? (isRtlStyle ? "در حال ذخیره..." : "Saving...") : (isRtlStyle ? "اعمال تغییرات" : "Apply Changes")}
        </GlowButton>
      )}
    </div>
  `;
  
  badgesSection = badgesSection.replace('<div className="space-y-6">', '<div className="space-y-6">\n' + buttonInject);
  
  content = content.substring(0, badgesStart) + badgesSection + content.substring(badgesEnd);
}

fs.writeFileSync('src/pages/SettingsPage.tsx', content);
console.log('Fixed badges script OK!');
