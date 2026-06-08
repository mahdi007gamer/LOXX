import React, { useState, useEffect, useRef } from "react";
import api from "../../lib/api";
import { toast } from "react-hot-toast";
import { 
  Music, User, ListMusic, Plus, Trash2, Upload, FileAudio, 
  Sparkles, Check, Search, X, FolderPlus, Compass, Headphones,
  Edit2, Save, RotateCcw, CheckSquare, PlusCircle, Bookmark, Disc
} from "lucide-react";

export const AdminMusicTab: React.FC = () => {
  // Query Data States
  const [tracks, setTracks] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sub-tab Navigation (tracks | playlists | artists | bots)
  const [subTab, setSubTab] = useState<"tracks" | "playlists" | "artists" | "bots">("tracks");

  // Bot Profile Management
  const [musicBotProfile, setMusicBotProfile] = useState<any>(null);
  const [melodyBotProfile, setMelodyBotProfile] = useState<any>(null);
  const [isLoadingBotProfile, setIsLoadingBotProfile] = useState(false);
  const [isSavingBotProfile, setIsSavingBotProfile] = useState(false);
  
  // Refresh bots config when subtab switches
  useEffect(() => {
    if (subTab === "bots") {
      fetchBotProfiles();
    }
  }, [subTab]);

  const fetchBotProfiles = async () => {
    setIsLoadingBotProfile(true);
    try {
      const musicRes = await api.get("/musicbot/profile");
      if (musicRes.data?.data) {
        setMusicBotProfile(musicRes.data.data);
      }
      // Assuming MelodyLox profile uses the same endpoint with a ?type=melody or separate logic,
      // but since they requested editing BOTH bots, let's enable an API for type=melody
      const melodyRes = await api.get("/musicbot/profile?type=melody");
      if (melodyRes.data?.data) {
        setMelodyBotProfile(melodyRes.data.data);
      }
    } catch (e: any) {
      toast.error("خطا در بارگذاری پروفایل ربات‌ها");
    } finally {
      setIsLoadingBotProfile(false);
    }
  };

  const handleSaveBotProfile = async (type: "music" | "melody", profileData: any) => {
    setIsSavingBotProfile(true);
    try {
      const res = await api.post(`/musicbot/profile?type=${type}`, profileData);
      if (res.data?.status === "success") {
        toast.success(`پروفایل ربات ${type === "melody" ? "ملودی لوکس" : "موزیک لوکس"} بروزرسانی شد`);
        if (type === "music") setMusicBotProfile(res.data.data);
        if (type === "melody") setMelodyBotProfile(res.data.data);
      }
    } catch (e: any) {
      toast.error("خطا در ذخیره پروفایل ربات");
    } finally {
      setIsSavingBotProfile(false);
    }
  };

  // Multi-select / Form parameters for new upload
  const [file, setFile] = useState<File | null>(null);
  const [manualTitle, setManualTitle] = useState("");
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<string[]>([]);
  const [selectedArtistIds, setSelectedArtistIds] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Selector Search Query inputs
  const [artistSelectorQuery, setArtistSelectorQuery] = useState("");
  const [playlistSelectorQuery, setPlaylistSelectorQuery] = useState("");

  // Edit Track mode states
  const [editingTrack, setEditingTrack] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSelectedArtistIds, setEditSelectedArtistIds] = useState<string[]>([]);
  const [editSelectedPlaylistIds, setEditSelectedPlaylistIds] = useState<string[]>([]);
  const [editArtistQuery, setEditArtistQuery] = useState("");
  const [editPlaylistQuery, setEditPlaylistQuery] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Auto-detection overlay feedback
  const [parsedFeedback, setParsedFeedback] = useState<{ title: string; artists: string[] } | null>(null);

  // Quick Inline Creators (Explicit tabs)
  const [newArtistName, setNewArtistName] = useState("");
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreatingArtist, setIsCreatingArtist] = useState(false);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  // Search Filters for Main lists
  const [trackSearch, setTrackSearch] = useState("");
  const [artistSearch, setArtistSearch] = useState("");
  const [playlistSearch, setPlaylistSearch] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    setLoading(true);
    try {
      const [tracksRes, artistsRes, playlistsRes] = await Promise.all([
        api.get("/musicbot/db-tracks"),
        api.get("/musicbot/artists"),
        api.get("/musicbot/db-playlists")
      ]);
      setTracks(tracksRes.data.data || []);
      setArtists(artistsRes.data.data || []);
      setPlaylists(playlistsRes.data.data || []);
    } catch (err: any) {
      toast.error("خطا در بارگذاری اطلاعات بانک موسیقی");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Automated filename analysis when file is selected
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    
    // Auto parsing:
    const cleanFilename = selectedFile.name.replace(/\.[^/.]+$/, ""); // strip extension
    const dashIdx = cleanFilename.indexOf("-");
    let detectedTitle = cleanFilename;
    const detectedArtists: string[] = [];

    if (dashIdx !== -1) {
      const part1 = cleanFilename.substring(0, dashIdx).trim();
      const part2 = cleanFilename.substring(dashIdx + 1).trim();

      // Check if any existing database artist matches
      const match1 = artists.find(a => a.name.toLowerCase() === part1.toLowerCase());
      const match2 = artists.find(a => a.name.toLowerCase() === part2.toLowerCase());

      if (match2) {
        detectedTitle = part1;
        detectedArtists.push(part2);
      } else if (match1) {
        detectedTitle = part2;
        detectedArtists.push(part1);
      } else {
        // Default layout: Artist - Title
        detectedTitle = part2;
        detectedArtists.push(part1);
      }
    }

    setManualTitle(detectedTitle);
    
    // Match parsed artists against our existing database IDs
    const matchedIds: string[] = [];
    detectedArtists.forEach(name => {
      const match = artists.find(a => a.name.toLowerCase() === name.toLowerCase());
      if (match) {
        matchedIds.push(match.id);
      }
    });
    
    setSelectedArtistIds(matchedIds);

    if (detectedArtists.length > 0) {
      setParsedFeedback({
        title: detectedTitle,
        artists: detectedArtists
      });
      toast.success(`مشخصات فایل استخراج گردید: ${detectedTitle}`);
    } else {
      setParsedFeedback(null);
    }
  };

  // Toggle selection aids
  const toggleArtistSelection = (id: string) => {
    setSelectedArtistIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const togglePlaylistSelection = (id: string) => {
    setSelectedPlaylistIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Live creation of missing Artist from selector
  const handleQuickAddArtist = async (name: string, source: "upload" | "edit") => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const res = await api.post("/musicbot/artist", { name: trimmed });
      if (res.data.status === "success") {
        toast.success(`خواننده جدید "${trimmed}" ساخته شد`);
        const item = res.data.data;
        setArtists(prev => [...prev, item]);
        if (source === "upload") {
          setSelectedArtistIds(prev => [...prev, item.id]);
          setArtistSelectorQuery("");
        } else {
          setEditSelectedArtistIds(prev => [...prev, item.id]);
          setEditArtistQuery("");
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در ساخت سریع خواننده");
    }
  };

  // Live creation of missing Playlist/Genre from selector
  const handleQuickAddPlaylist = async (name: string, source: "upload" | "edit") => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const res = await api.post("/musicbot/db-playlist", { name: trimmed });
      if (res.data.status === "success") {
        toast.success(`سبک جدید "${trimmed}" اضافه شد`);
        const item = res.data.data;
        setPlaylists(prev => [...prev, item]);
        if (source === "upload") {
          setSelectedPlaylistIds(prev => [...prev, item.id]);
          setPlaylistSelectorQuery("");
        } else {
          setEditSelectedPlaylistIds(prev => [...prev, item.id]);
          setEditPlaylistQuery("");
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در ساخت سبک جدید");
    }
  };

  // Handle manual tab creation of Artist
  const handleCreateArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtistName.trim()) return;

    try {
      setIsCreatingArtist(true);
      const res = await api.post("/musicbot/artist", { name: newArtistName.trim() });
      if (res.data.status === "success") {
        toast.success(`خواننده "${res.data.data.name}" با موفقیت ثبت شد`);
        
        const createdArtist = res.data.data;
        setArtists(prev => [...prev, createdArtist]);
        setSelectedArtistIds(prev => [...prev, createdArtist.id]);
        setNewArtistName("");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در ساخت خواننده جدید");
    } finally {
      setIsCreatingArtist(false);
    }
  };

  // Handle manual tab creation of Playlist
  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      setIsCreatingPlaylist(true);
      const res = await api.post("/musicbot/db-playlist", { name: newPlaylistName.trim() });
      if (res.data.status === "success") {
        toast.success(`پلی‌لیست "${res.data.data.name}" با موفقیت ایجاد گردید`);
        
        const createdPlaylist = res.data.data;
        setPlaylists(prev => [...prev, createdPlaylist]);
        setSelectedPlaylistIds(prev => [...prev, createdPlaylist.id]);
        setNewPlaylistName("");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در ایجاد پلی‌لیست");
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  // Track upload submission
  const handleTrackUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("لطفا ابتدا یک فایل صوتی انتخاب کنید");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("manualTitle", manualTitle.trim());
    formData.append("artistIds", JSON.stringify(selectedArtistIds));
    formData.append("playlistIds", JSON.stringify(selectedPlaylistIds));
    formData.append("category", "dynamic");

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const res = await api.post("/musicbot/db-track/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const totalLength = progressEvent.total;
          if (totalLength) {
            const percent = Math.round((progressEvent.loaded * 100) / totalLength);
            setUploadProgress(percent);
          }
        }
      });

      if (res.data.status === "success") {
        toast.success("آهنگ جدید با موفقیت با دسته‌بندی و خوانندگان متصل آپلود شد!");
        setFile(null);
        setManualTitle("");
        setSelectedPlaylistIds([]);
        setSelectedArtistIds([]);
        setParsedFeedback(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        
        // Refresh tracks list
        fetchMetadata();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در بارگذاری موسیقی");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Initialize track editing structure
  const startEditingTrack = (t: any) => {
    setEditingTrack(t);
    setEditTitle(t.title);
    setEditSelectedArtistIds(t.artists ? t.artists.map((a: any) => a.id) : []);
    setEditSelectedPlaylistIds(t.playlists ? t.playlists.map((p: any) => p.id) : []);
    setEditArtistQuery("");
    setEditPlaylistQuery("");
  };

  // Save Track Metadata Edits
  const handleSaveTrackEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrack) return;
    if (!editTitle.trim()) {
      toast.error("عنوان آهنگ نباید خالی باشد");
      return;
    }

    try {
      setIsSavingEdit(true);
      const res = await api.put(`/musicbot/db-track/${editingTrack.id}`, {
        title: editTitle.trim(),
        artistIds: editSelectedArtistIds,
        playlistIds: editSelectedPlaylistIds
      });

      if (res.data.status === "success") {
        toast.success("تغییرات آهنگ با موفقیت ثبت شد");
        setEditingTrack(null);
        fetchMetadata();
      }
    } catch (err: any) {
      toast.error("خطا در ذخیره‌سازی ویرایش ترانه");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Track
  const handleDeleteTrack = async (id: string, name: string) => {
    if (!window.confirm(`آیا از حذف آهنگ "${name}" اطمینان دارید؟ فایل به فیزیکی پاک خواهد شد.`)) return;

    try {
      const res = await api.delete(`/musicbot/db-track/${id}`);
      if (res.data.status === "success") {
        toast.success("آهنگ با موفقیت از سرور حذف گردید");
        setTracks(prev => prev.filter(t => t.id !== id));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در حذف آهنگ");
    }
  };

  // Delete dynamic Playlist
  const handleDeletePlaylist = async (id: string, name: string) => {
    if (!window.confirm(`آیا از حذف سبک "${name}" اطمینان دارید؟ خود آهنگ‌ها باقی خواهند ماند.`)) return;

    try {
      const res = await api.delete(`/musicbot/db-playlist/${id}`);
      if (res.data.status === "success") {
        toast.success("سبک با موفقیت حذف گردید");
        setPlaylists(prev => prev.filter(p => p.id !== id));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در حذف سبک");
    }
  };

  // Filter lists based on text searches
  const filteredTracks = tracks.filter(t => {
    const query = trackSearch.toLowerCase().trim();
    if (!query) return true;
    const titleMatch = t.title.toLowerCase().includes(query);
    const artistMatch = t.artists?.some((a: any) => a.name.toLowerCase().includes(query));
    const playlistMatch = t.playlists?.some((p: any) => p.name.toLowerCase().includes(query));
    return titleMatch || artistMatch || playlistMatch;
  });

  const filteredArtists = artists.filter(a => 
    a.name.toLowerCase().includes(artistSearch.toLowerCase().trim())
  );

  const filteredPlaylists = playlists.filter(p => 
    p.name.toLowerCase().includes(playlistSearch.toLowerCase().trim())
  );

  // Sub-selector filtered live listings for interactive togglers
  const uploadFilteredArtists = artists.filter(a => 
    a.name.toLowerCase().includes(artistSelectorQuery.toLowerCase().trim())
  );
  
  const uploadFilteredPlaylists = playlists.filter(p => 
    p.name.toLowerCase().includes(playlistSelectorQuery.toLowerCase().trim())
  );

  const editFilteredArtists = artists.filter(a =>
    a.name.toLowerCase().includes(editArtistQuery.toLowerCase().trim())
  );

  const editFilteredPlaylists = playlists.filter(p => 
    p.name.toLowerCase().includes(editPlaylistQuery.toLowerCase().trim())
  );

  return (
    <div className="space-y-6 dir-rtl text-right font-sans">
      {/* Tab Banner Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-950/20 via-cyan-950/15 to-transparent border border-white/5 p-8 rounded-[40px] shadow-2xl">
        <div className="absolute top-0 left-0 p-6 opacity-10">
          <Music size={120} className="text-neon-pink" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <h2 className="text-3xl font-black text-white">پنل مدیریت پیشرفته موسیقی لوکس ⚜️</h2>
          </div>
          <p className="text-xs text-gray-400 max-w-2xl leading-relaxed font-semibold">
            تنظیم مستقیم و متمرکز کل کتابخانه. در این سیستم پیشرفته، موزیک‌ها مستقیماً روی سرور آپلود می‌شوند. قابلیت پیوند چندگانه‌ی هر آهنگ به چند خواننده و سبک به همراه تحلیل هوشمند نام فایل به شما کمک می‌کند تمام فرآیندها را به سادگی کنترل نمایید.
          </p>
        </div>
      </div>

      {/* Primary Panels Toggle */}
      <div className="flex flex-wrap gap-3 bg-black/40 p-2 border border-white/5 rounded-3xl w-fit">
        <button
          onClick={() => { setSubTab("tracks"); setEditingTrack(null); }}
          className={`flex items-center gap-2 py-2.5 px-6 rounded-2xl text-xs font-black transition-all ${
            subTab === "tracks" 
              ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]" 
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Compass size={14} />
          مدیریت و آپلود آهنگ‌ها ({tracks.length})
        </button>

        <button
          onClick={() => { setSubTab("playlists"); setEditingTrack(null); }}
          className={`flex items-center gap-2 py-2.5 px-6 rounded-2xl text-xs font-black transition-all ${
            subTab === "playlists" 
              ? "bg-purple-500 text-black shadow-[0_0_15px_rgba(168,85,247,0.4)]" 
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <ListMusic size={14} />
          سبک‌ها و پلی‌لیست‌ها ({playlists.length})
        </button>

        <button
          onClick={() => { setSubTab("artists"); setEditingTrack(null); }}
          className={`flex items-center gap-2 py-2.5 px-6 rounded-2xl text-xs font-black transition-all ${
            subTab === "artists" 
              ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]" 
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <User size={14} />
          لیست آرتیست‌ها ({artists.length})
        </button>

        <button
          onClick={() => { setSubTab("bots"); setEditingTrack(null); }}
          className={`flex items-center gap-2 py-2.5 px-6 rounded-2xl text-xs font-black transition-all ${
            subTab === "bots" 
              ? "bg-rose-500 text-black shadow-[0_0_15px_rgba(243,63,113,0.4)]" 
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Sparkles size={14} />
          پروفایل ربات‌ها
        </button>
      </div>

      {subTab === "tracks" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Upload Panel or Edit Drawer */}
          <div className="lg:col-span-1 space-y-6">
            
            {editingTrack ? (
              /* --- EXQUISITE METADATA EDITOR PANEL --- */
              <div className="bg-gradient-to-b from-[#110e1a]/95 to-[#0b0c10]/95 border-2 border-purple-500/30 rounded-[32px] p-6 space-y-5 shadow-[0_0_40px_rgba(168,85,247,0.15)] select-none">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Edit2 size={16} className="text-purple-400" />
                    <h3 className="text-sm font-black text-white">ویرایش مشخصات آهنگ</h3>
                  </div>
                  <button 
                    onClick={() => setEditingTrack(null)}
                    className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="p-3 bg-white/5 rounded-xl text-center">
                  <Disc size={20} className="mx-auto text-purple-400 animate-spin mb-1" />
                  <span className="text-[10px] text-gray-400 block truncate" title={editingTrack.url}>
                    مسیر فیزیکی: {editingTrack.url}
                  </span>
                </div>

                <form onSubmit={handleSaveTrackEdit} className="space-y-4">
                  {/* Track Title Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400">عنوان آهنگ (پخش لابی)</label>
                    <input 
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-black/60 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-bold"
                      placeholder="مثال: Bad Bash"
                      required
                    />
                  </div>

                  {/* Playlists/Genres Selection inside Edit Mode */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-gray-400">اتصال به سبک‌ها / پلی‌لیست‌ها</label>
                      <span className="text-[9px] text-purple-400 font-mono">انتخاب: {editSelectedPlaylistIds.length}</span>
                    </div>

                    <div className="relative">
                      <Search size={11} className="absolute right-2.5 top-2.5 text-gray-500" />
                      <input 
                        type="text"
                        value={editPlaylistQuery}
                        onChange={(e) => setEditPlaylistQuery(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-lg pr-7 pl-3 py-1.5 text-[10px] text-white focus:outline-none focus:border-purple-500"
                        placeholder="جستجوی سبک..."
                      />
                    </div>

                    <div className="max-h-24 overflow-y-auto bg-black/50 border border-white/5 rounded-xl p-2.5 space-y-1">
                      {editFilteredPlaylists.length === 0 ? (
                        <div className="text-center py-2 space-y-1">
                          <p className="text-[9px] text-gray-500">سبکی مطابق با جستجوی شما یافت نشد.</p>
                          {editPlaylistQuery.trim() && (
                            <button
                              type="button"
                              onClick={() => handleQuickAddPlaylist(editPlaylistQuery, "edit")}
                              className="text-[9px] px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/20 text-purple-300 font-bold hover:bg-purple-500/25 transition-all"
                            >
                              + ساخت سریع سبک "{editPlaylistQuery}"
                            </button>
                          )}
                        </div>
                      ) : (
                        editFilteredPlaylists.map(p => {
                          const isSelected = editSelectedPlaylistIds.includes(p.id);
                          return (
                            <div 
                              key={p.id}
                              onClick={() => {
                                setEditSelectedPlaylistIds(prev => 
                                  isSelected ? prev.filter(x => x !== p.id) : [...prev, p.id]
                                );
                              }}
                              className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-[10px] transition-all ${
                                isSelected ? "bg-purple-500/20 text-purple-300 font-bold" : "text-gray-400 hover:bg-white/[0.02]"
                              }`}
                            >
                              <span>{p.name}</span>
                              {isSelected && <Check size={10} />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Artists Selection inside Edit Mode */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-gray-400">اتصال به خوانندگان (امکان چند آرتیست)</label>
                      <span className="text-[9px] text-amber-500 font-mono">انتخاب: {editSelectedArtistIds.length}</span>
                    </div>

                    <div className="relative">
                      <Search size={11} className="absolute right-2.5 top-2.5 text-gray-500" />
                      <input 
                        type="text"
                        value={editArtistQuery}
                        onChange={(e) => setEditArtistQuery(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-lg pr-7 pl-3 py-1.5 text-[10px] text-white focus:outline-none focus:border-amber-500"
                        placeholder="جستجوی خواننده جدید..."
                      />
                    </div>

                    <div className="max-h-28 overflow-y-auto bg-black/50 border border-white/5 rounded-xl p-2.5 space-y-1">
                      {editFilteredArtists.length === 0 ? (
                        <div className="text-center py-2 space-y-1">
                          <p className="text-[9px] text-gray-500">خواننده‌ای یافت نشد.</p>
                          {editArtistQuery.trim() && (
                            <button
                              type="button"
                              onClick={() => handleQuickAddArtist(editArtistQuery, "edit")}
                              className="text-[9px] px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/20 text-amber-300 font-bold hover:bg-amber-500/25 transition-all"
                            >
                              + ثبت سریع خواننده "{editArtistQuery}"
                            </button>
                          )}
                        </div>
                      ) : (
                        editFilteredArtists.map(a => {
                          const isSelected = editSelectedArtistIds.includes(a.id);
                          return (
                            <div 
                              key={a.id}
                              onClick={() => {
                                setEditSelectedArtistIds(prev => 
                                  isSelected ? prev.filter(x => x !== a.id) : [...prev, a.id]
                                );
                              }}
                              className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-[10px] transition-all ${
                                isSelected ? "bg-amber-500/20 text-amber-300 font-bold" : "text-gray-400 hover:bg-white/[0.02]"
                              }`}
                            >
                              <span>{a.name}</span>
                              {isSelected && <Check size={10} />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="submit"
                      disabled={isSavingEdit}
                      className="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 font-semibold text-black hover:scale-[1.01] transition-all text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:opacity-55"
                    >
                      <Save size={12} />
                      {isSavingEdit ? "درحال ذخیره..." : "ذخیره نهایی ترانه"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTrack(null)}
                      className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-all text-xs"
                    >
                      انصراف
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* --- PRIMARY HIGH-QUALITY METADATA UPLOAD FORM --- */
              <div className="bg-[#0c0d13]/90 border border-white/5 rounded-[32px] p-6 space-y-6 self-start shadow-xl">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <Sparkles size={18} className="text-cyan-400" />
                  <h3 className="text-md font-black text-white">آپلود و دسته‌بندی هوشمند</h3>
                </div>

                <form onSubmit={handleTrackUpload} className="space-y-4">
                  {/* Graphical Drag-n-drop file state */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-white/[0.02] relative group ${
                      file ? "border-cyan-500/60 bg-cyan-950/10" : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="audio/*"
                      className="hidden" 
                    />
                    
                    {file ? (
                      <div className="space-y-2">
                        <FileAudio size={40} className="mx-auto text-cyan-400 animate-pulse" />
                        <p className="text-xs text-white font-bold max-w-[200px] truncate mx-auto">{file.name}</p>
                        <p className="text-[10px] text-gray-400">حجم: {(file.size / (1024 * 1024)).toFixed(2)} مگا‌بایت</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Upload size={30} className="mx-auto text-gray-500 group-hover:text-cyan-400 group-hover:scale-110 transition-all" />
                        <p className="text-xs font-bold text-gray-300">یک ترانه انتخاب یا رها کنید</p>
                        <p className="text-[9px] text-gray-500 font-medium">فرمت‌های پشتیبانی: MP3, WAV, OGG, M4A</p>
                      </div>
                    )}
                  </div>

                  {/* Extract metadata feedback layout */}
                  {parsedFeedback && (
                    <div className="bg-cyan-950/20 border border-cyan-500/15 rounded-xl p-3.5 space-y-1.5 text-[11px] leading-relaxed">
                      <div className="flex items-center gap-1 text-cyan-400 font-bold mb-1">
                        <Sparkles size={12} />
                        <span>تشخیص صوتی مشخصات نام ترانه:</span>
                      </div>
                      <p className="text-gray-300">ترانه: <span className="text-white font-bold">{parsedFeedback.title}</span></p>
                      <div className="text-gray-300 mt-1 flex flex-wrap gap-1">
                        خوانندگان: 
                        {parsedFeedback.artists.map((name, idx) => {
                          const isFound = artists.some(a => a.name.toLowerCase() === name.toLowerCase());
                          return (
                            <span key={idx} className={`font-semibold px-1.5 py-0.5 rounded text-[9px] ${isFound ? "text-green-400 bg-green-500/5 border border-green-500/10" : "text-amber-400 bg-amber-500/5 border border-amber-500/10"}`}>
                              {name} {isFound ? "✓ (موجود)" : "+ (ساخت فوری)"}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Title field */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400">عنوان آهنگ</label>
                    <input 
                      type="text" 
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      placeholder="عنوان ترانه را وارد کنید..."
                      className="w-full bg-black/60 border border-white/5 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold"
                      required
                    />
                  </div>

                  {/* Highly Interactive Styles/Playlists subselector */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-gray-400">سبک‌ها و پلی‌لیست‌ها</label>
                      <span className="text-[10px] text-purple-400 font-bold">انتخاب شده: {selectedPlaylistIds.length}</span>
                    </div>

                    <div className="relative">
                      <Search size={11} className="absolute right-2.5 top-2.5 text-gray-500" />
                      <input 
                        type="text"
                        value={playlistSelectorQuery}
                        onChange={(e) => setPlaylistSelectorQuery(e.target.value)}
                        className="w-full bg-black/45 border border-white/5 rounded-xl pr-7 pl-3 py-1.5 text-[10px] text-white focus:outline-none focus:border-purple-500"
                        placeholder="جستجوی سبک موسیقی..."
                      />
                    </div>

                    <div className="max-h-28 overflow-y-auto border border-white/5 rounded-xl bg-black/30 p-2 space-y-1">
                      {uploadFilteredPlaylists.length === 0 ? (
                        <div className="text-center py-2 space-y-1">
                          <p className="text-[10px] text-gray-500">سبکی پیدا نشد.</p>
                          {playlistSelectorQuery.trim() && (
                            <button
                              type="button"
                              onClick={() => handleQuickAddPlaylist(playlistSelectorQuery, "upload")}
                              className="text-[9px] px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold hover:bg-purple-500/20 transition-all cursor-pointer"
                            >
                              + ساخت فوری سبک "{playlistSelectorQuery}"
                            </button>
                          )}
                        </div>
                      ) : (
                        uploadFilteredPlaylists.map(p => (
                          <div 
                            key={p.id}
                            onClick={() => togglePlaylistSelection(p.id)}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                              selectedPlaylistIds.includes(p.id) 
                                ? "bg-purple-500/15 text-purple-400 font-bold border border-purple-500/10" 
                                : "text-gray-400 hover:bg-white/[0.02]"
                            }`}
                          >
                            <span className="text-[10px]">{p.name}</span>
                            {selectedPlaylistIds.includes(p.id) && <Check size={10} />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Highly Interactive Artist subselector */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-gray-400">انتخاب به عنوان خواننده</label>
                      <span className="text-[10px] text-amber-500 font-bold">انتخاب شده: {selectedArtistIds.length}</span>
                    </div>

                    <div className="relative">
                      <Search size={11} className="absolute right-2.5 top-2.5 text-gray-500" />
                      <input 
                        type="text"
                        value={artistSelectorQuery}
                        onChange={(e) => setArtistSelectorQuery(e.target.value)}
                        className="w-full bg-black/45 border border-white/5 rounded-xl pr-7 pl-3 py-1.5 text-[10px] text-white focus:outline-none focus:border-amber-500"
                        placeholder="جستجو یا افزودن خواننده جدید..."
                      />
                    </div>

                    <div className="max-h-32 overflow-y-auto border border-white/5 rounded-xl bg-black/30 p-2 space-y-1">
                      {uploadFilteredArtists.length === 0 ? (
                        <div className="text-center py-2 space-y-1">
                          <p className="text-[10px] text-gray-500">خواننده‌ای یافت نشد.</p>
                          {artistSelectorQuery.trim() && (
                            <button
                              type="button"
                              onClick={() => handleQuickAddArtist(artistSelectorQuery, "upload")}
                              className="text-[9px] px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/20 text-amber-400 font-bold hover:bg-amber-500/20 transition-all cursor-pointer"
                            >
                              + ثبت سریع خواننده "{artistSelectorQuery}"
                            </button>
                          )}
                        </div>
                      ) : (
                        uploadFilteredArtists.map(a => (
                          <div 
                            key={a.id}
                            onClick={() => toggleArtistSelection(a.id)}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                              selectedArtistIds.includes(a.id) 
                                ? "bg-amber-500/15 text-amber-400 font-bold border border-amber-500/10" 
                                : "text-gray-400 hover:bg-white/[0.02]"
                            }`}
                          >
                            <span className="text-[10px]">{a.name}</span>
                            {selectedArtistIds.includes(a.id) && <Check size={10} />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Progress Bar under uploads */}
                  {isUploading && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-cyan-400 font-bold">
                        <span>در حال آپلود و ثبت در سرور...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Submit trigger button */}
                  <button
                    type="submit"
                    disabled={isUploading || !file}
                    className={`w-full mt-2 py-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                      !file || isUploading
                        ? "bg-white/5 text-gray-500 cursor-not-allowed"
                        : "bg-cyan-500 text-black hover:scale-[1.01] cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                    }`}
                  >
                    <Music size={14} />
                    آپلود و ذخیره نهایی
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Table List of Tracks */}
          <div className="lg:col-span-2 bg-[#0c0d13]/90 border border-white/5 rounded-[32px] p-6 space-y-6 flex flex-col shadow-xl">
            {/* Filter Search Input */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-black/30 p-4 border border-white/5 rounded-2xl">
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute right-3.5 top-3.5 text-gray-500" />
                <input 
                  type="text" 
                  value={trackSearch}
                  onChange={(e) => setTrackSearch(e.target.value)}
                  placeholder="جستجو در ترانه، سبک یا نام آرتیست..."
                  className="w-full bg-black/57 border border-white/5 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-cyan-500"
                />
              </div>
              <span className="text-[11px] text-gray-400 font-bold">نمایش {filteredTracks.length} از {tracks.length} ترانه آپلود شده</span>
            </div>

            {/* List Table Container */}
            <div className="flex-1 overflow-y-auto max-h-[550px] border border-white/5 rounded-2xl bg-black/10">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-8 h-8 rounded-full border-2 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent animate-spin mb-3" />
                  <p className="text-[11px] text-gray-400 font-bold">درحال بارگذاری داده‌های کتابخانه صوتی...</p>
                </div>
              ) : filteredTracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500 font-bold">
                  <Headphones size={42} className="mb-2 text-gray-600" />
                  <p className="text-xs">هیچ ترانه‌ای یافت نشد</p>
                  <p className="text-[10px] text-gray-600 mt-1">اولین فایل صوتی خود را از سمت راست آپلود کنید</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredTracks.map((t, idx) => {
                    const isBeingEdited = editingTrack?.id === t.id;
                    return (
                      <div 
                        key={t.id} 
                        className={`p-4 flex items-center justify-between hover:bg-white/[0.01] transition-all group ${
                          isBeingEdited ? "bg-purple-500/5 border-l-2 border-l-purple-500" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs text-gray-600 font-black">{(idx + 1).toString().padStart(2, "0")}</span>
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                            isBeingEdited 
                              ? "bg-purple-950/40 text-purple-300 border border-purple-500/30" 
                              : "bg-cyan-950/20 text-cyan-400 border border-cyan-500/10 group-hover:bg-cyan-500/10"
                          }`}>
                            <Music size={16} />
                          </div>
                          <div className="space-y-0.5 text-right min-w-0">
                            <span className="text-xs font-black text-white block truncate">{t.title}</span>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold text-gray-400">
                              {t.artists && t.artists.length > 0 ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-amber-500">خواننده:</span>
                                  <span className="text-gray-300 text-[10px] font-black">
                                    {t.artists.map((a: any) => a.name).join(" و ")}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-500">بدون خواننده مشخص</span>
                              )}
                              
                              {t.playlists && t.playlists.length > 0 ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-purple-400">سبک:</span>
                                  <span className="text-gray-300">
                                    {t.playlists.map((p: any) => p.name).join(", ")}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-500">بدون سبک مشخص</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Control Actions (Edit & Delete) */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEditingTrack(t)}
                            className="h-8 w-8 rounded-lg bg-black/60 text-gray-400 hover:text-purple-400 hover:bg-purple-500/15 border border-white/5 transition-all flex items-center justify-center cursor-pointer"
                            title="ویرایش متادیتا و دسته‌بندی"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteTrack(t.id, t.title)}
                            className="h-8 w-8 rounded-lg bg-black/60 text-gray-400 hover:text-red-400 hover:bg-red-500/15 border border-white/5 transition-all flex items-center justify-center cursor-pointer"
                            title="حذف آهنگ"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {subTab === "playlists" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Creator panel */}
          <div className="lg:col-span-1 bg-[#0c0d13]/90 border border-white/5 rounded-[32px] p-6 space-y-6 self-start shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <FolderPlus size={16} className="text-purple-400" />
              <h3 className="text-md font-black text-white">افزودن سبک (پلی‌لیست)</h3>
            </div>

            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400">نام پلی‌لیست / سبک جدید</label>
                <input 
                  type="text" 
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="مثلا: پاپ، رپ، سنتی"
                  className="w-full bg-black/60 border border-white/5 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500 font-bold"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingPlaylist || !newPlaylistName.trim()}
                className="w-full py-3 rounded-2xl bg-purple-500 text-black hover:scale-[1.02] cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all font-black text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Plus size={14} />
                افزودن دسته‌بندی سبک
              </button>
            </form>
          </div>

          {/* List panel */}
          <div className="lg:col-span-2 bg-[#0c0d13]/90 border border-white/5 rounded-[32px] p-6 space-y-6 flex flex-col shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="relative w-64">
                <Search size={14} className="absolute right-3 top-3 text-gray-500" />
                <input 
                  type="text" 
                  value={playlistSearch}
                  onChange={(e) => setPlaylistSearch(e.target.value)}
                  placeholder="جستجو در بین دسته‌بندی‌ها..."
                  className="w-full bg-black/60 border border-white/5 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-purple-500"
                />
              </div>
              <span className="text-[11px] text-gray-400 font-bold">تعداد: {filteredPlaylists.length} سبک موسیقی</span>
            </div>

            <div className="border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5 bg-black/10">
              {filteredPlaylists.length === 0 ? (
                <p className="text-center py-10 text-xs text-gray-500 font-bold">سبک یا پلی‌لیستی یافت نشد</p>
              ) : (
                filteredPlaylists.map((p, idx) => (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-white/[0.01] transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 font-black">{(idx + 1).toString().padStart(2, "0")}</span>
                      <div className="h-9 w-9 rounded-xl bg-purple-950/20 border border-purple-500/10 flex items-center justify-center text-purple-400">
                        <ListMusic size={15} />
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-white">{p.name}</span>
                        <span className="text-[10px] text-gray-500 font-bold block mt-0.5">{p._count?.tracks || 0} ترانه فعال در این سبک</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeletePlaylist(p.id, p.name)}
                      className="h-8 w-8 rounded-lg bg-black/60 text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-white/5 transition-all flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === "artists" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Creator panel */}
          <div className="lg:col-span-1 bg-[#0c0d13]/90 border border-white/5 rounded-[32px] p-6 space-y-6 self-start shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <User size={16} className="text-amber-400" />
              <h3 className="text-md font-black text-white">ثبت خواننده جدید</h3>
            </div>

            <form onSubmit={handleCreateArtist} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400">نام خواننده/آرتیست</label>
                <input 
                  type="text" 
                  value={newArtistName}
                  onChange={(e) => setNewArtistName(e.target.value)}
                  placeholder="مثلا: Sami Beigi"
                  className="w-full bg-black/60 border border-white/5 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingArtist || !newArtistName.trim()}
                className="w-full py-3 rounded-2xl bg-amber-500 text-black hover:scale-[1.02] cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all font-black text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Plus size={14} />
                ثبت خواننده
              </button>
            </form>
          </div>

          {/* List panel */}
          <div className="lg:col-span-2 bg-[#0c0d13]/90 border border-white/5 rounded-[32px] p-6 space-y-6 flex flex-col shadow-xl font-sans">
            <div className="flex items-center justify-between gap-4">
              <div className="relative w-64">
                <Search size={14} className="absolute right-3 top-3 text-gray-500" />
                <input 
                  type="text" 
                  value={artistSearch}
                  onChange={(e) => setArtistSearch(e.target.value)}
                  placeholder="جستجو در بین خواننده‌ها..."
                  className="w-full bg-black/60 border border-white/5 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
              <span className="text-[11px] text-gray-400 font-bold">تعداد: {filteredArtists.length} آرتیست موسیقی</span>
            </div>

            <div className="border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5 bg-black/10">
              {filteredArtists.length === 0 ? (
                <p className="text-center py-10 text-xs text-gray-500 font-bold">خواننده‌ای یافت نشد</p>
              ) : (
                filteredArtists.map((a, idx) => (
                  <div key={a.id} className="p-4 flex items-center justify-between hover:bg-white/[0.01] transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 font-black">{(idx + 1).toString().padStart(2, "0")}</span>
                      <div className="h-9 w-9 rounded-xl bg-amber-950/20 border border-amber-500/10 flex items-center justify-center text-amber-400">
                        <User size={15} />
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-white">{a.name}</span>
                        <span className="text-[10px] text-gray-500 font-bold block mt-0.5">{a._count?.tracks || 0} آهنگ ثبت شده</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === "bots" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Loxx Music Bot */}
          <div className="bg-[#0c0d13]/90 border border-cyan-500/20 rounded-[32px] p-6 space-y-6 shadow-[0_0_30px_rgba(0,229,255,0.05)]">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="h-10 w-10 bg-cyan-500/10 rounded-xl border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Music size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">پروفایل ربات موزیک (دی‌جی هوشمند)</h3>
                <p className="text-[10px] text-gray-400 mt-1 font-bold">نمایش به عنوان ربات استاندارد فضای لابی</p>
              </div>
            </div>

            {isLoadingBotProfile ? (
              <div className="text-center py-10"><div className="w-8 h-8 rounded-full border-2 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent animate-spin mx-auto"></div></div>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.target as any;
                  handleSaveBotProfile("music", {
                    avatarUrl: target.avatar.value,
                    bannerUrl: target.banner.value,
                    bio: target.bio.value,
                    miniProfileBg: target.miniBg.value
                  });
                }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400">آدرس عکس آواتار (URL)</label>
                  <input name="avatar" defaultValue={musicBotProfile?.avatarUrl || ""} className="w-full bg-black/60 border border-cyan-500/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400">آدرس عکس بنر پس‌زمینه پروفایل (URL)</label>
                  <input name="banner" defaultValue={musicBotProfile?.bannerUrl || ""} className="w-full bg-black/60 border border-cyan-500/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400">گرادیانت پس‌زمینه مینی پروفایل</label>
                  <input name="miniBg" defaultValue={musicBotProfile?.miniProfileBg || ""} className="w-full bg-black/60 border border-cyan-500/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400" dir="ltr" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400">متن بایو (Bio)</label>
                  <textarea name="bio" defaultValue={musicBotProfile?.bio || ""} className="w-full bg-black/60 border border-cyan-500/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 h-24" />
                </div>
                <button type="submit" disabled={isSavingBotProfile} className="w-full py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30 font-black text-cyan-300 hover:bg-cyan-500 hover:text-black hover:scale-[1.02] transition-all text-xs">
                  {isSavingBotProfile ? "ردحال انجام..." : "ذخیره تغییرات ربات اصلی"}
                </button>
              </form>
            )}
          </div>

          {/* Melody Lox Bot */}
          <div className="bg-[#0c0d13]/90 border border-yellow-500/20 rounded-[32px] p-6 space-y-6 shadow-[0_0_30px_rgba(255,215,0,0.05)]">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="h-10 w-10 bg-yellow-500/10 rounded-xl border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">پروفایل ملودی لوکس (ربات طلایی)</h3>
                <p className="text-[10px] text-gray-400 mt-1 font-bold">ربات عمومی لابی با ویژگی‌های طلایی</p>
              </div>
            </div>

            {isLoadingBotProfile ? (
              <div className="text-center py-10"><div className="w-8 h-8 rounded-full border-2 border-t-yellow-500 border-r-transparent border-b-transparent border-l-transparent animate-spin mx-auto"></div></div>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.target as any;
                  handleSaveBotProfile("melody", {
                    avatarUrl: target.avatar.value,
                    bannerUrl: target.banner.value,
                    bio: target.bio.value,
                    miniProfileBg: target.miniBg.value
                  });
                }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400">آدرس عکس آواتار (URL)</label>
                  <input name="avatar" defaultValue={melodyBotProfile?.avatarUrl || ""} className="w-full bg-black/60 border border-yellow-500/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-400" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400">آدرس عکس بنر پس‌زمینه پروفایل (URL)</label>
                  <input name="banner" defaultValue={melodyBotProfile?.bannerUrl || ""} className="w-full bg-black/60 border border-yellow-500/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400">گرادیانت پس‌زمینه مینی پروفایل</label>
                  <input name="miniBg" defaultValue={melodyBotProfile?.miniProfileBg || ""} className="w-full bg-black/60 border border-yellow-500/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-400" dir="ltr" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400">متن بایو (Bio)</label>
                  <textarea name="bio" defaultValue={melodyBotProfile?.bio || ""} className="w-full bg-black/60 border border-yellow-500/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-400 h-24" />
                </div>
                <button type="submit" disabled={isSavingBotProfile} className="w-full py-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30 font-black text-yellow-300 hover:bg-yellow-500 hover:text-black hover:scale-[1.02] transition-all text-xs">
                  {isSavingBotProfile ? "ردحال انجام..." : "ذخیره تغییرات ملودی لوکس"}
                </button>
              </form>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
