import fs from 'fs';
let code = fs.readFileSync('src/pages/LobbyRoomPage.tsx', 'utf8');

const anchor = 'const [activeProfileUserId, setActiveProfileUserId] = useState<string | null>(null);';
const insertion = `
const [showHighPingModal, setShowHighPingModal] = useState(false);
const hasShownHighPingModalRef = useRef<boolean>(false);

useEffect(() => {
  const myPing = user?.id ? (peerPings[user.id] || 0) : 0;
  if (myPing > 150 && !hasShownHighPingModalRef.current) {
    hasShownHighPingModalRef.current = true;
    setShowHighPingModal(true);
  }
}, [peerPings, user?.id]);
`;

code = code.replace(anchor, anchor + '\n' + insertion);
fs.writeFileSync('src/pages/LobbyRoomPage.tsx', code);
console.log("Fixed Ping State");
