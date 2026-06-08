import fs from 'fs';

let content = fs.readFileSync('src/components/modals/CreateLobbyModal.tsx', 'utf8');

const handleGameStart = 'const handleGameChange = (gameId: string) => {\n    const game = games?.find(g => g.id === gameId);\n    if (!game) return;\n\n    setSelectedGameData(game);\n\n    // Set safe default features';

const replaceStr = `const handleGameChange = (gameId: string) => {
    const game = games?.find(g => g.id === gameId);
    if (!game) return;

    setSelectedGameData(game);
    
    setFormData(prev => {
      const newTitle = (!prev.title || prev.title === selectedGameData?.title || prev.title.trim() === "") ? game.title : prev.title;
      return { ...prev, gameId: game.id, title: newTitle };
    });
    
    // Set safe default features`;

if (content.includes('const handleGameChange = (gameId: string) => {\n    const game = games?.find(g => g.id === gameId);\n    if (!game) return;\n\n    setSelectedGameData(game);\n\n    // Set safe default features')) {
  content = content.replace('const handleGameChange = (gameId: string) => {\n    const game = games?.find(g => g.id === gameId);\n    if (!game) return;\n\n    setSelectedGameData(game);\n\n    // Set safe default features', replaceStr);
} else {
  // Try another replacement if exact spacing fails
  content = content.replace(/const handleGameChange = \(gameId: string\) => \{\s*const game = games\?\.find\(g => g\.id === gameId\);\s*if \(!game\) return;\s*setSelectedGameData\(game\);\s*\/\/ Set safe default features/g, replaceStr);
}

fs.writeFileSync('src/components/modals/CreateLobbyModal.tsx', content);
console.log('Fixed lobby title issue!');
