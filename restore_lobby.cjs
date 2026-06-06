const { execSync } = require('child_process');
try {
  console.log('Restoring LobbyRoomPage.tsx via git checkout...');
  execSync('git checkout src/pages/LobbyRoomPage.tsx');
  console.log('Restructured pristine LobbyRoomPage.tsx file restored successfully!');
} catch (err) {
  console.error('Failed to run git checkout:', err.message);
}
