const fs = require('fs');

let txt = fs.readFileSync('src/components/modals/CreateLobbyModal.tsx', 'utf8');

// 1. Update handleGameChange
txt = txt.replace(
`    setFormData(prev => ({
      ...prev, 
      gameId,
      maxPlayers: game.metadata?.maxPlayers || 5,`,
`    setFormData(prev => ({
      ...prev, 
      title: game.title,
      gameId,
      maxPlayers: game.metadata?.maxPlayers || 5,`
);

// 2. Update the initial useEffect or when games load so the VERY FIRST game auto-selects its title.
// Actually handleGameChange is called initially if formData.gameId is empty or something?
// Let's just update the title input first.

const oldInput = `<input 
 type="text"
 placeholder={isRtl ? "مثال: رنک‌آپ سریع" : "e.g., Fast Rank-up"}
 className="w-full bg-[#16181c] border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-neon-blue transition-all text-white font-bold text-sm"
 value={formData.title}
 onChange={e => setFormData({...formData, title: e.target.value})}
 />`;
 
const newInput = `<input 
 type="text"
 placeholder={selectedGameData?.title || (isRtl ? "عنوان لابی..." : "Lobby Title...")}
 className="w-full bg-[#16181c] border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-neon-blue transition-all text-white font-bold text-sm"
 value={formData.title}
 onChange={e => setFormData({...formData, title: e.target.value})}
 onFocus={() => {
   if (formData.title === selectedGameData?.title) {
     setFormData({...formData, title: ""});
   }
 }}
 onBlur={() => {
   if (formData.title.trim() === "") {
     setFormData({...formData, title: selectedGameData?.title || ""});
   }
 }}
 />`;

// If replace using the exact block doesn't work, we replace it using regex.
const inputRegex = /<input\s+type="text"\s+placeholder=\{isRtl \? "مثال[^>]*value=\{formData.title\}\s*onChange=\{e => setFormData\(\{\.\.\.formData, title: e.target.value\}\)\}\s*\/>/s;

txt = txt.replace(inputRegex, newInput);

fs.writeFileSync('src/components/modals/CreateLobbyModal.tsx', txt);
