import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { 
  Music, User, ListMusic, Plus, Trash2, Upload, FileAudio, 
  Sparkles, Check, Search, X, FolderPlus, Compass, Headphones,
  Edit2, Save, RotateCcw, CheckSquare, PlusCircle, Bookmark, Disc,
  Camera, Image, ArrowRight, Shield, Play, Pause, ChevronRight, CheckCircle2
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

export interface UploadQueueItem {
  id: string;
  file: File;
  title: string;
  artistIds: string[];
  playlistIds: string[];
  coverUrl: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
}

export const AdminMusicPage: React.FC = () => {
  const { isSidebarCollapsed, user } = useAuth();
  
  // Tab Navigation: upload | tracks | artists | playlists
  const [activeTab, setActiveTab] = useState<"upload" | "tracks" | "artists" | "playlists">("upload");

  // Query Data States
  const [tracks, setTracks] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search Filters
  const [trackSearch, setTrackSearch] = useState("");
  const [artistSearch, setArtistSearch] = useState("");
  const [playlistSearch, setPlaylistSearch] = useState("");

  // Upload Track form params
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [manualTitle, setManualTitle] = useState("");
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<string[]>([]);
  const [selectedArtistIds, setSelectedArtistIds] = useState<string[]>([]);
  const [customCoverFile, setCustomCoverFile] = useState<File | null>(null);
  const [customCoverUrl, setCustomCoverUrl] = useState("");
  const [bannerLoading, setBannerLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedFeedback, setParsedFeedback] = useState<{ title: string; artists: string[] } | null>(null);

  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const isQueueProcessing = useRef(false);

  // Edit Track mode states
  const [editingTrack, setEditingTrack] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSelectedArtistIds, setEditSelectedArtistIds] = useState<string[]>([]);
  const [editSelectedPlaylistIds, setEditSelectedPlaylistIds] = useState<string[]>([]);
  const [editCoverUrl, setEditCoverUrl] = useState("");
  const [editCoverLoading, setEditCoverLoading] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Quick Inline Creators / Selectors
  const [artistSelectorQuery, setArtistSelectorQuery] = useState("");
  const [playlistSelectorQuery, setPlaylistSelectorQuery] = useState("");
  const [editArtistSelectorQuery, setEditArtistSelectorQuery] = useState("");
  const [editPlaylistSelectorQuery, setEditPlaylistSelectorQuery] = useState("");

  // Create new Entities
  const [newArtistName, setNewArtistName] = useState("");
  const [newArtistBio, setNewArtistBio] = useState("");
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [playlistBannerFile, setPlaylistBannerFile] = useState<File | null>(null);
  const [playlistBannerUrl, setPlaylistBannerUrl] = useState("");
  const [isCreatingArtistChange, setIsCreatingArtistChange] = useState(false);
  const [isCreatingPlaylistChange, setIsCreatingPlaylistChange] = useState(false);

  // Currently Auditioning Audio inside the Admin panel
  const [activeAuditionUrl, setActiveAuditionUrl] = useState<string | null>(null);
  const auditionAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPlayingAudition, setIsPlayingAudition] = useState(false);

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

  // Safe file size converter
  const formatBytes = (bytes: number, decimals = 1) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Handlers for Audio Upload (Chunked Upload to prevent 413 Payload too large errors)
  const handleAudioDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const fileDropped = e.dataTransfer.files?.[0];
    if (fileDropped) processSelectedAudio(fileDropped);
  };

  const processSelectedAudio = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("audio/") && !/\.(mp3|wav|ogg|m4a)$/i.test(selectedFile.name)) {
      toast.error("فرمت فایل نامعتبر است. فقط فایل‌های صوتی مورد تایید هستند.");
      return;
    }
    setAudioFile(selectedFile);

    // Auto extract ID3 cover image using jsmediatags
    try {
      (window as any).jsmediatags.read(selectedFile, {
      onSuccess: function(tag: any) {
        if (tag.tags && tag.tags.picture) {
          const data = tag.tags.picture.data;
          const format = tag.tags.picture.format;
          let base64String = "";
          for (let i = 0; i < data.length; i++) {
            base64String += String.fromCharCode(data[i]);
          }
          const base64 = btoa(base64String);
          const blob = fetch(`data:${format};base64,${base64}`).then(res => res.blob()).then(blob => {
             const coverFile = new File([blob], "cover.jpg", { type: format });
             setCustomCoverFile(coverFile);
             
             // Auto upload it to have a URL ready
             setBannerLoading(true);
             const formData = new FormData();
             formData.append("file", coverFile);
             api.post("/upload?target=cover", formData, {
               headers: { "Content-Type": "multipart/form-data" }
             }).then(res => {
               setCustomCoverUrl(res.data.url);
               toast.success("کاور از فایل صوتی استخراج شد!");
             }).catch(() => {
               toast.error("آپلود کاور استخراجی ناموفق بود");
             }).finally(() => {
               setBannerLoading(false);
             });
          });
        }
      },
      onError: function(error: any) {
        console.log("No ID3 tags found or error reading: ", error.type, error.info);
      }
    });
    } catch (e) {
      console.log("Error running jsmediatags", e);
    }

    // Auto parsing artist and title from filename
    const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "");
    const dashIdx = cleanName.indexOf("-");
    let detectedTitle = cleanName;
    const detectedArtists: string[] = [];

    if (dashIdx !== -1) {
      const part1 = cleanName.substring(0, dashIdx).trim();
      const part2 = cleanName.substring(dashIdx + 1).trim();

      // Check if matches known DB artist
      const match1 = artists.find(a => a.name.toLowerCase() === part1.toLowerCase());
      const match2 = artists.find(a => a.name.toLowerCase() === part2.toLowerCase());

      if (match2) {
        detectedTitle = part1;
        detectedArtists.push(part2);
      } else if (match1) {
        detectedTitle = part2;
        detectedArtists.push(part1);
      } else {
        detectedTitle = part2;
        detectedArtists.push(part1);
      }
    }

    setManualTitle(detectedTitle);
    
    // Auto set artist checkboxes if we matches existing
    const matchedIds: string[] = [];
    detectedArtists.forEach(name => {
      const match = artists.find(a => a.name.toLowerCase() === name.toLowerCase());
      if (match) matchedIds.push(match.id);
    });
    setSelectedArtistIds(matchedIds);

    if (detectedArtists.length > 0) {
      setParsedFeedback({
        title: detectedTitle,
        artists: detectedArtists
      });
    } else {
      setParsedFeedback(null);
    }
  };

  // Chunked audio file uploader logic
  const uploadAudioInChunks = async (fileToUpload: File, onProgress?: (percent: number) => void): Promise<string> => {
    const fileId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const chunkSize = 2048 * 1024; // 2MB for faster uploads
    const totalChunks = Math.ceil(fileToUpload.size / chunkSize);
    let assembledUrl = "";

    for (let index = 0; index < totalChunks; index++) {
      const start = index * chunkSize;
      const end = Math.min(start + chunkSize, fileToUpload.size);
      const chunk = fileToUpload.slice(start, end);

      const formData = new FormData();
      formData.append("file", chunk, fileToUpload.name);
      formData.append("fileId", fileId);
      formData.append("chunkIndex", index.toString());
      formData.append("totalChunks", totalChunks.toString());
      formData.append("filename", fileToUpload.name);
      formData.append("target", "audio");

      const res = await api.post("/upload/chunk", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const percent = Math.floor(((index + 1) / totalChunks) * 100);
      if (onProgress) {
        onProgress(percent);
      } else {
        setUploadProgress(percent);
      }

      if (res.data && res.data.url) {
        assembledUrl = res.data.url;
      }
    }

    return assembledUrl;
  };

  // Custom Track cover image uploader (complying with metadata and sharp compression)
  const handleCustomCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileSelected = e.target.files?.[0];
    if (!fileSelected) return;

    setBannerLoading(true);
    const formData = new FormData();
    formData.append("file", fileSelected);

    try {
      const res = await api.post("/upload?target=cover", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setCustomCoverUrl(res.data.url);
      setCustomCoverFile(fileSelected);
      toast.success("کاور دلخواه با موفقیت آپلود و فشرده شد!");
    } catch {
      toast.error("خطا در آپلود عکس کاور");
    } finally {
      setBannerLoading(false);
    }
  };

  // Queue Processing Logic
  useEffect(() => {
    if (isQueueProcessing.current) return;
    
    const processQueue = async () => {
      const pendingItemList = uploadQueue.filter(q => q.status === 'pending');
      if (pendingItemList.length === 0) return;
      
      const item = pendingItemList[0];
      isQueueProcessing.current = true;
      
      setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'uploading' as const } : q));
      
      try {
        const finalAudioUrl = await uploadAudioInChunks(item.file, (progress) => {
          setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress } : q));
        });
        
        if (!finalAudioUrl) {
          throw new Error("خطا در تکمیل انتقال فایل صوتی");
        }

        const data = {
          manualTitle: item.title,
          url: finalAudioUrl,
          coverUrl: item.coverUrl,
          artistIds: JSON.stringify(item.artistIds),
          playlistIds: JSON.stringify(item.playlistIds)
        };

        const res = await api.post("/musicbot/db-track/upload", data);
        if (res.data.status === "success") {
          toast.success(`آهنگ ${item.title} با موفقیت در دیتابیس ثبت شد!`);
          setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'success' as const, progress: 100 } : q));
          fetchMetadata();
        } else {
          throw new Error("خطا در پاسخ سرور");
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message || "خطا در آپلود";
        toast.error(`آپلود ${item.title} ناموفق بود: ${errorMsg}`);
        setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error' as const, errorMsg } : q));
      } finally {
        isQueueProcessing.current = false;
      }
    };
    
    processQueue();
  }, [uploadQueue, fetchMetadata]);

  // Submitting the Upload Track Form
  const handleSubmitTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
      toast.error("لطفا ابتدا فایل صوتی موزیک را انتخاب کنید");
      return;
    }
    if (!manualTitle.trim()) {
      toast.error("وارد کردن عنوان موزیک الزامی است");
      return;
    }

    const newItem: UploadQueueItem = {
      id: Math.random().toString(36).substring(7),
      file: audioFile,
      title: manualTitle.trim(),
      artistIds: [...selectedArtistIds],
      playlistIds: [...selectedPlaylistIds],
      coverUrl: customCoverUrl,
      progress: 0,
      status: 'pending'
    };

    setUploadQueue(prev => [...prev, newItem]);
    toast.success("آهنگ به صف آپلود اضافه شد");
    
    // Reset Form
    setAudioFile(null);
    setManualTitle("");
    setCustomCoverUrl("");
    setCustomCoverFile(null);
    setSelectedArtistIds([]);
    setSelectedPlaylistIds([]);
    setParsedFeedback(null);
  };

  // Inline Quick creators for Artist & Playlists inside selectors
  const handleQuickAddArtist = async (name: string, isFromEdit = false) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const res = await api.post("/musicbot/artist", { name: trimmed });
      if (res.data.status === "success") {
        toast.success(`خواننده جدید "${trimmed}" ثبت شد`);
        const item = res.data.data;
        setArtists(prev => [...prev, item]);
        if (isFromEdit) {
          setEditSelectedArtistIds(prev => [...prev, item.id]);
          setEditArtistSelectorQuery("");
        } else {
          setSelectedArtistIds(prev => [...prev, item.id]);
          setArtistSelectorQuery("");
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در ساخت سریع خواننده");
    }
  };

  const handleQuickAddPlaylist = async (name: string, isFromEdit = false) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const res = await api.post("/musicbot/db-playlist", { name: trimmed });
      if (res.data.status === "success") {
        toast.success(`سبک/پلی‌لیست "${trimmed}" ایجاد شد`);
        const item = res.data.data;
        setPlaylists(prev => [...prev, item]);
        if (isFromEdit) {
          setEditSelectedPlaylistIds(prev => [...prev, item.id]);
          setEditPlaylistSelectorQuery("");
        } else {
          setSelectedPlaylistIds(prev => [...prev, item.id]);
          setPlaylistSelectorQuery("");
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در ثبت گروه");
    }
  };

  // Manage Tracks: Edit Metadata & Cover URL
  const handleStartEditTrack = (track: any) => {
    setEditingTrack(track);
    setEditTitle(track.title);
    setEditSelectedArtistIds(track.artists.map((a: any) => a.id));
    setEditSelectedPlaylistIds(track.playlists.map((p: any) => p.id));
    setEditCoverUrl(track.coverUrl || "");
  };

  const handleEditCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileSelected = e.target.files?.[0];
    if (!fileSelected) return;

    setEditCoverLoading(true);
    const formData = new FormData();
    formData.append("file", fileSelected);

    try {
      const res = await api.post("/upload?target=cover", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setEditCoverUrl(res.data.url);
      toast.success("عکس کاور جدید آپلود و بهینه شد");
    } catch {
      toast.error("خطا در آپلود عکس کاور");
    } finally {
      setEditCoverLoading(false);
    }
  };

  const handleSaveTrackEdit = async () => {
    if (!editTitle.trim()) {
      toast.error("عنوان آهنگ نباید خالی باشد");
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await api.put(`/musicbot/db-track/${editingTrack.id}`, {
        title: editTitle.trim(),
        artistIds: editSelectedArtistIds,
        playlistIds: editSelectedPlaylistIds,
        coverUrl: editCoverUrl
      });
      
      toast.success("اطلاعات آهنگ با موفقیت ویرایش شد!");
      setEditingTrack(null);
      fetchMetadata();
    } catch (err: any) {
      toast.error("خطا در ذخیره ویرایش موزیک");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteTrack = async (id: string) => {
    if (!window.confirm("آیا از حذف دائم این موزیک از روی دیسک سرور و دیتابیس اطمینان دارید؟")) return;
    try {
      await api.delete(`/musicbot/db-track/${id}`);
      toast.success("آهنگ با موفقیت به همراه فایل اصلی و ملحقات حذف شد");
      fetchMetadata();
    } catch {
      toast.error("خطا در حذف دائم موزیک");
    }
  };

  // Artist Avatar Upload and auto compression logic
  const handleArtistAvatarUpload = async (artistId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const imgFile = e.target.files?.[0];
    if (!imgFile) return;

    const imgToast = toast.loading("در حال آپلود و فشرده‌سازی تصویر آرتیست...");
    try {
      // 1. Core Profile target uploads are automatically compressed by the server's sharp to 256 size
      const formData = new FormData();
      formData.append("file", imgFile);

      const uploadRes = await api.post("/upload?target=profile", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      const compressedUrl = uploadRes.data.url;

      // 2. Save avatarUrl on DB
      await api.put(`/musicbot/artist/${artistId}`, { avatarUrl: compressedUrl });
      
      toast.success("پروفایل آرتیست با موفقیت فشرده و جایگزین شد!", { id: imgToast });
      fetchMetadata();
    } catch (err) {
      toast.error("خطا در فشرده سازی و آپلود تصویر خواننده", { id: imgToast });
    }
  };

  // Create & Manage Artists Forms
  const handleAddNewArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtistName.trim()) return;

    try {
      const res = await api.post("/musicbot/artist", {
        name: newArtistName.trim(),
        bio: newArtistBio.trim()
      });
      toast.success(`خواننده جدید "${newArtistName}" با موفقیت اضافه شد.`);
      setNewArtistName("");
      setNewArtistBio("");
      fetchMetadata();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در ساخت خواننده جدید");
    }
  };

  const handleDeleteArtist = async (artistId: string) => {
    if (!window.confirm("آیا از حذف دائم این خواننده اطمینان دارید؟")) return;
    try {
      await api.delete(`/musicbot/artist/${artistId}`);
      toast.success("خواننده با موفقیت حذف گردید");
      fetchMetadata();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در حذف خواننده");
    }
  };

  // Playlist Banner Image upload
  const handlePlaylistBannerUpload = async (playlistId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const fileSelected = e.target.files?.[0];
    if (!fileSelected) return;

    const bannerToast = toast.loading("در حال آپلود بنر سبک...");
    try {
      const formData = new FormData();
      formData.append("file", fileSelected);

      const res = await api.post("/upload?target=cover", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      await api.put(`/musicbot/db-playlist/${playlistId}`, { bannerUrl: res.data.url });
      toast.success("تصویر سبک با موفقیت ذخیره شد!", { id: bannerToast });
      fetchMetadata();
    } catch {
      toast.error("خطا در آپلود بنر سبک", { id: bannerToast });
    }
  };

  // Create & Manage Genres/Playlists Forms
  const handleAddNewPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      await api.post("/musicbot/db-playlist", {
        name: newPlaylistName.trim()
      });
      toast.success(`سبک/پلی‌لیست "${newPlaylistName}" با موفقیت ایجاد شد.`);
      setNewPlaylistName("");
      fetchMetadata();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در ساخت پلی‌لیست");
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!window.confirm("آیا از حذف این پلی لیست اطمینان دارید؟ آهنگ‌های داخل آن حذف نخواهند شد.")) return;
    try {
      await api.delete(`/musicbot/db-playlist/${playlistId}`);
      toast.success("پلی‌لیست حذف شد");
      fetchMetadata();
    } catch {
      toast.error("خطا در حذف پلی‌لیست");
    }
  };

  // Audition playback controllers
  const handleToggleAudition = (trackUrl: string) => {
    let resolvedUrl = trackUrl;
    if (!trackUrl.startsWith("http") && !trackUrl.startsWith("/api")) {
      resolvedUrl = `${api.defaults.baseURL || ""}${trackUrl}`;
    }

    if (activeAuditionUrl === resolvedUrl) {
      if (isPlayingAudition) {
        auditionAudioRef.current?.pause();
        setIsPlayingAudition(false);
      } else {
        auditionAudioRef.current?.play().catch(() => {});
        setIsPlayingAudition(true);
      }
    } else {
      setActiveAuditionUrl(resolvedUrl);
      setIsPlayingAudition(true);
      setTimeout(() => {
        if (auditionAudioRef.current) {
          auditionAudioRef.current.src = resolvedUrl;
          auditionAudioRef.current.play().catch((e) => {
            console.error("Audio playback interrupted", e);
            toast.error("امکان پخش آهنگ به صورت مستقیم در بروزر وجود ندارد.");
            setIsPlayingAudition(false);
          });
        }
      }, 50);
    }
  };

  // Direct return to dashboard
  const handleReturnToDashboard = () => {
    window.location.href = "/admin";
  };

  // Filter lists
  const filteredTracks = tracks.filter(t => 
    t.title.toLowerCase().includes(trackSearch.toLowerCase()) || 
    t.url.toLowerCase().includes(trackSearch.toLowerCase()) ||
    t.artists.some((a: any) => a.name.toLowerCase().includes(trackSearch.toLowerCase()))
  );

  const filteredArtists = artists.filter(a => 
    a.name.toLowerCase().includes(artistSearch.toLowerCase())
  );

  const filteredPlaylists = playlists.filter(p => 
    p.name.toLowerCase().includes(playlistSearch.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-dark-bg text-white overflow-hidden font-sans">
      <Sidebar />
      
      {/* Invisible HTML5 Audio component for pre-audition of uploaded tracks */}
      <audio 
        ref={auditionAudioRef} 
        onEnded={() => setIsPlayingAudition(false)} 
        className="hidden" 
      />

      <div className={cn(
        "flex-1 min-w-0 p-4 md:p-8 pb-32 md:pb-8 overflow-y-auto custom-scrollbar transition-all duration-300 relative",
        !isSidebarCollapsed ? "md:mr-64" : "md:mr-20"
      )}>
        <div className="max-w-6xl mx-auto space-y-8" dir="rtl">
          
          {/* Header section with back button */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-2xl bg-neon-pink/10 flex items-center justify-center text-neon-pink border border-neon-pink/20">
                  <Music size={24} />
                </div>
                <h1 className="text-4xl font-black text-white">مدیریت کتابخانه موسیقی</h1>
              </div>
              <p className="text-gray-400 font-bold uppercase text-[10px] opacity-60">
                Lobby Music Bot Server Orchestrator
              </p>
            </div>
            
            <button 
              onClick={handleReturnToDashboard}
              className="flex items-center gap-2 px-5 h-11 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-xs font-bold"
            >
              <span>بازگشت به پنل مدیریت اصلی</span>
              <ArrowRight size={14} />
            </button>
          </header>

          {/* Subheader and Tab selectors */}
          <div className="flex gap-2 border-b border-white/5 pb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab("upload")}
              className={`pb-4 px-6 text-sm font-black transition-all relative ${
                activeTab === "upload" ? "text-neon-pink" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Upload size={16} />
                <span>آپلود موزیک جدید</span>
              </div>
              {activeTab === "upload" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-pink shadow-[0_0_15px_#FF0080]" />}
            </button>
            
            <button
              onClick={() => setActiveTab("tracks")}
              className={`pb-4 px-6 text-sm font-black transition-all relative ${
                activeTab === "tracks" ? "text-neon-blue" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Headphones size={16} />
                <span>مدیریت آهنگ‌ها({tracks.length})</span>
              </div>
              {activeTab === "tracks" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue shadow-[0_0_15px_#00E5FF]" />}
            </button>

            <button
              onClick={() => setActiveTab("artists")}
              className={`pb-4 px-6 text-sm font-black transition-all relative ${
                activeTab === "artists" ? "text-neon-purple" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>لیست آرتیست‌ها({artists.length})</span>
              </div>
              {activeTab === "artists" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-purple shadow-[0_0_15px_#B24BF3]" />}
            </button>

            <button
              onClick={() => setActiveTab("playlists")}
              className={`pb-4 px-6 text-sm font-black transition-all relative ${
                activeTab === "playlists" ? "text-neon-pink" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <ListMusic size={16} />
                <span>پلی‌لیست‌ها و سبک‌ها({playlists.length})</span>
              </div>
              {activeTab === "playlists" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-pink shadow-[0_0_15px_#FF0080]" />}
            </button>
          </div>

          {/* Core dynamic body loading panels */}
          {loading ? (
            <div className="flex py-32 justify-center items-center">
              <div className="h-12 w-12 rounded-full border-t-2 border-r-2 border-neon-pink animate-spin" />
            </div>
          ) : (
            <div>
              {/* Tab: Upload Track form */}
              {activeTab === "upload" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                  
                  {/* Left Column - Form Control */}
                  <form onSubmit={handleSubmitTrack} className="lg:col-span-2 space-y-6 bg-white/5 border border-white/5 p-6 md:p-8 rounded-3xl">
                    <h3 className="text-xl font-black text-white flex items-center gap-2 mb-4">
                      <Sparkles className="text-neon-pink" size={18} />
                      <span>مشخصات آهنگ جدید</span>
                    </h3>

                    {/* Integrated drag drop audio installer */}
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleAudioDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer text-center",
                        audioFile 
                          ? "border-green-500/40 bg-green-950/10 text-green-400" 
                          : "border-white/10 hover:border-white/20 hover:bg-white/5 text-gray-400"
                      )}
                    >
                      <input 
                        type="file"
                        ref={fileInputRef}
                        accept="audio/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) processSelectedAudio(f);
                        }}
                        className="hidden"
                      />
                      {audioFile ? (
                        <>
                          <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                            <FileAudio size={32} />
                          </div>
                          <div>
                            <span className="font-bold text-white block mb-0.5 max-w-md truncate">{audioFile.name}</span>
                            <span className="text-xs text-gray-500 font-mono block">{formatBytes(audioFile.size)}</span>
                          </div>
                          <span className="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full font-bold">
                            صدا بارگذاری شد - آماده همگام‌سازی
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center text-gray-400 border border-white/10">
                            <Upload size={28} />
                          </div>
                          <div>
                            <span className="font-bold text-gray-300 block mb-1">فایل صوتی موزیک را رها کنید یا کلیک کنید</span>
                            <span className="text-xs text-gray-500 block">پشتیبانی کامل از MP3, WAV, OGG, M4A تا سقف ۵۰ مگابایت</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Custom title parameters */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 block">عنوان آهنگ (فارسی یا انگلیسی)</label>
                      <input 
                        type="text"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        placeholder="مثال: گل گلدون من"
                        className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-neon-pink/40 font-semibold"
                      />
                    </div>

                    {/* Multi selection selector for target artists */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gray-400 block">انتخاب خواننده‌ها (یک یا چند مورد)</label>
                        <span className="text-[10px] text-neon-pink font-mono font-bold">{selectedArtistIds.length} برگزیده شده</span>
                      </div>

                      {/* Search box to locate existing / create missing */}
                      <div className="relative">
                        <Search className="absolute right-3 top-3.5 text-gray-500" size={16} />
                        <input 
                          type="text"
                          value={artistSelectorQuery}
                          onChange={(e) => setArtistSelectorQuery(e.target.value)}
                          placeholder="جستجو یا افزودن سریع خواننده ملحق شده..."
                          className="w-full h-11 pr-10 pl-24 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-neon-purple/40"
                        />
                        {artistSelectorQuery.trim() && !artists.some(a => a.name.toLowerCase() === artistSelectorQuery.trim().toLowerCase()) && (
                          <button
                            type="button"
                            onClick={() => handleQuickAddArtist(artistSelectorQuery, false)}
                            className="absolute left-2 top-2 h-7 px-3 bg-neon-purple text-[10px] font-black rounded-lg text-white hover:bg-neon-purple/80 transition-all"
                          >
                            ساخت خواننده جدید +
                          </button>
                        )}
                      </div>

                      {/* Displaying checked / filter block of artists */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto custom-scrollbar p-2 bg-black/20 rounded-xl border border-white/5">
                        {artists
                          .filter(a => a.name.toLowerCase().includes(artistSelectorQuery.toLowerCase()))
                          .map((a: any) => {
                            const isChecked = selectedArtistIds.includes(a.id);
                            return (
                              <button
                                type="button"
                                key={a.id}
                                onClick={() => {
                                  if (isChecked) setSelectedArtistIds(prev => prev.filter(x => x !== a.id));
                                  else setSelectedArtistIds(prev => [...prev, a.id]);
                                }}
                                className={cn(
                                  "h-9 px-3 flex items-center justify-between text-xs font-semibold rounded-lg border text-right transition-all",
                                  isChecked 
                                    ? "bg-neon-purple/10 border-neon-purple text-neon-purple"
                                    : "bg-white/5 border-white/5 text-gray-400 hover:border-white/10"
                                )}
                              >
                                <span className="truncate">{a.name}</span>
                                {isChecked && <Check size={12} className="shrink-0" />}
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    {/* Style / Category assignment */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gray-400 block">انتخاب سبک‌ها / مناسبت‌ها</label>
                        <span className="text-[10px] text-neon-blue font-mono font-bold">{selectedPlaylistIds.length} تخصیص یافته</span>
                      </div>

                      <div className="relative">
                        <Search className="absolute right-3 top-3.5 text-gray-500" size={16} />
                        <input 
                          type="text"
                          value={playlistSelectorQuery}
                          onChange={(e) => setPlaylistSelectorQuery(e.target.value)}
                          placeholder="جستجو یا افزودن سریع سبک..."
                          className="w-full h-11 pr-10 pl-24 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-neon-blue/40"
                        />
                        {playlistSelectorQuery.trim() && !playlists.some(p => p.name.toLowerCase() === playlistSelectorQuery.trim().toLowerCase()) && (
                          <button
                            type="button"
                            onClick={() => handleQuickAddPlaylist(playlistSelectorQuery, false)}
                            className="absolute left-2 top-2 h-7 px-3 bg-neon-blue text-[10px] font-black rounded-lg text-white hover:bg-neon-blue/80 transition-all"
                          >
                            ثبت سبک جدید +
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto custom-scrollbar p-2 bg-black/20 rounded-xl border border-white/5">
                        {playlists
                          .filter(p => p.name.toLowerCase().includes(playlistSelectorQuery.toLowerCase()))
                          .map((p: any) => {
                            const isChecked = selectedPlaylistIds.includes(p.id);
                            return (
                              <button
                                type="button"
                                key={p.id}
                                onClick={() => {
                                  if (isChecked) setSelectedPlaylistIds(prev => prev.filter(x => x !== p.id));
                                  else setSelectedPlaylistIds(prev => [...prev, p.id]);
                                }}
                                className={cn(
                                  "h-9 px-3 flex items-center justify-between text-xs font-semibold rounded-lg border text-right transition-all",
                                  isChecked 
                                    ? "bg-neon-blue/10 border-neon-blue text-neon-blue"
                                    : "bg-white/5 border-white/5 text-gray-400 hover:border-white/10"
                                )}
                              >
                                <span className="truncate">{p.name}</span>
                                {isChecked && <Check size={12} className="shrink-0" />}
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    {/* Submit layout and chunk upload bar */}
                    <div className="pt-4 border-t border-white/5 space-y-4">
                      <button
                        type="submit"
                        disabled={bannerLoading || isQueueProcessing.current && !audioFile}
                        className="w-full h-12 bg-gradient-to-r from-neon-pink to-neon-purple text-sm font-black rounded-xl text-white hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,0,128,0.3)] border border-neon-pink/30 hover:shadow-[0_0_30px_rgba(255,0,128,0.5)]"
                      >
                        اضافه به لیست آپلود (همزمان) 🚀
                      </button>
                    </div>
                  </form>

                  {/* Right Column - Music artwork and analyzer preview */}
                  <div className="space-y-6">
                    <div className="bg-white/5 border border-white/5 p-6 rounded-3xl space-y-6">
                      <h4 className="text-sm font-black text-white">تصویر و کاور آرت آهنگ</h4>
                      
                      {/* Interactive graphic block represent cover */}
                      <div className="relative group aspect-square rounded-2xl overflow-hidden bg-black/40 border border-white/10 flex flex-col items-center justify-center">
                        {customCoverUrl ? (
                          <img 
                            src={customCoverUrl} 
                            alt="Muisc Cover" 
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-center p-4">
                            <Disc size={48} className="text-gray-400 group-hover:animate-spin block mb-3 opacity-60" />
                            <span className="text-xs text-gray-500 font-bold max-w-xs leading-relaxed">
                              عکس کاور برای نمایش در لابی چت و رادیو موزیک ربات
                            </span>
                          </div>
                        )}
                        
                        {bannerLoading ? (
                          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                            <div className="h-8 w-8 rounded-full border-t-2 border-neon-pink animate-spin" />
                          </div>
                        ) : (
                          <label className="absolute bottom-4 right-4 h-9 px-4 bg-black/80 backdrop-blur border border-white/10 hover:border-white/20 transition-all rounded-xl text-[10px] font-black text-white cursor-pointer flex items-center gap-1.5 shadow-lg">
                            <input 
                              type="file"
                              accept="image/*"
                              onChange={handleCustomCoverChange}
                              className="hidden"
                            />
                            <Camera size={14} />
                            <span>آپلود تصویر کاور دلخواه</span>
                          </label>
                        )}
                      </div>

                      <div className="bg-black/20 p-4 border border-white/5 rounded-2xl text-xs space-y-2">
                        <span className="font-bold text-gray-400 block border-b border-white/5 pb-2">ویژگی‌های بهینه‌سازی موزیک</span>
                        <p className="text-gray-500 leading-relaxed font-semibold">
                          🔊 **کیفیت ۱۲۸ استاندارد**: سیستم پس از دریافت فایل موسیقی شما، در صورتی که بیت‌ریت آن از حد نیاز فراتر باشد آن را به طور خودکار به فرکانس ایده‌آل ۱۲۸ کیلوبیت فشرده می کند تا ضمن حفظ استاندارد کیفیت صوتی بدون آسیب، به شدت حجم لود پهنای باند پلیرها کم شود.
                        </p>
                        <p className="text-gray-500 leading-relaxed font-semibold">
                          🖼️ **کشف متادیتای تعبیه شده**: در صورت عدم آپلود تصویر بالا، سیستم به صورت هوشمند کاور آرت تعبیه‌شده لای فایل MP3 را استخراج کرده و کمپرس می کند.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM UPLOAD QUEUE */}
                  {uploadQueue.length > 0 && (
                    <div className="lg:col-span-3 bg-white/5 border border-white/5 p-6 rounded-3xl space-y-4">
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        <ListMusic size={16} className="text-neon-blue" />
                        <span>صف آپلودها</span>
                        <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">{uploadQueue.length} فایل</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {uploadQueue.map(item => (
                          <div key={item.id} className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden">
                            {item.status === 'uploading' && (
                              <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 via-neon-purple/5 to-transparent animate-pulse pointer-events-none" />
                            )}
                            <div className="flex items-center gap-3 relative z-10">
                              <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/10 flex items-center justify-center">
                                {item.coverUrl ? (
                                  <img src={item.coverUrl} className="w-full h-full object-cover" />
                                ) : (
                                  <Disc size={20} className="text-gray-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-white truncate max-w-full">{item.title}</p>
                                <p className="text-[10px] text-gray-500 font-semibold truncate">
                                  {item.status === 'pending' && <span className="text-gray-400">در صف انتظار...</span>}
                                  {item.status === 'uploading' && <span className="text-neon-blue">در حال آپلود ({item.progress}%)</span>}
                                  {item.status === 'success' && <span className="text-green-400">آپلود و ثبت کامل شد</span>}
                                  {item.status === 'error' && <span className="text-red-400" title={item.errorMsg}>خطا: {item.errorMsg}</span>}
                                </p>
                              </div>
                            </div>
                            
                            {item.status === 'uploading' && (
                              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden shrink-0 relative z-10">
                                <div 
                                  className="h-full bg-neon-blue transition-all duration-300 ease-out" 
                                  style={{ width: `${item.progress}%` }} 
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Tab: Manage Tracks */}
              {activeTab === "tracks" && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Filter header tool */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/5 border border-white/5 p-4 rounded-2xl">
                    <div className="relative w-full sm:w-80">
                      <Search className="absolute right-3 top-3.5 text-gray-500" size={16} />
                      <input 
                        type="text"
                        value={trackSearch}
                        onChange={(e) => setTrackSearch(e.target.value)}
                        placeholder="جستجو در نام موزیک یا نام آرتیست..."
                        className="w-full h-11 pr-10 rounded-xl bg-black/40 border border-white/5 text-xs text-white focus:outline-none focus:border-neon-blue/40 font-semibold"
                      />
                    </div>
                    
                    <span className="text-xs text-gray-500 font-bold">
                      نمایش {filteredTracks.length} از {tracks.length} آهنگ ذخیره شده
                    </span>
                  </div>

                  {/* Split Screen Editor View Modal overlay */}
                  <AnimatePresence>
                    {editingTrack && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                      >
                        <motion.div 
                          initial={{ scale: 0.95 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0.95 }}
                          className="w-full max-w-2xl bg-dark-bg border border-white/10 p-6 md:p-8 rounded-3xl space-y-6 text-right max-h-[90vh] overflow-y-auto"
                          dir="rtl"
                        >
                          <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                              <Edit2 size={18} className="text-neon-blue" />
                              <span>ویرایش مشخصات کامل آهنگ</span>
                            </h3>
                            <button 
                              onClick={() => setEditingTrack(null)}
                              className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 flex items-center justify-center"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Inputs form */}
                            <div className="space-y-4">
                              <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400">عنوان آهنگ</label>
                                <input 
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold"
                                />
                              </div>

                              {/* Action selection checklists artists edit */}
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 block">ویرایش آرتیست‌های تخصیص یافته</label>
                                <div className="space-y-2">
                                  <input 
                                    type="text"
                                    value={editArtistSelectorQuery}
                                    onChange={(e) => setEditArtistSelectorQuery(e.target.value)}
                                    placeholder="جستجوی خواننده جهت افزودن به لیست..."
                                    className="w-full h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-xs"
                                  />
                                </div>
                                <div className="max-h-24 overflow-y-auto custom-scrollbar border border-white/5 p-2 rounded-xl space-y-1 bg-black/20">
                                  {artists
                                    .filter(a => a.name.toLowerCase().includes(editArtistSelectorQuery.toLowerCase()))
                                    .map((a: any) => {
                                      const isChecked = editSelectedArtistIds.includes(a.id);
                                      return (
                                        <button
                                          type="button"
                                          key={a.id}
                                          onClick={() => {
                                            if (isChecked) setEditSelectedArtistIds(prev => prev.filter(x => x !== a.id));
                                            else setEditSelectedArtistIds(prev => [...prev, a.id]);
                                          }}
                                          className={cn(
                                            "w-full h-7 px-2 flex items-center justify-between text-xs rounded-md text-right",
                                            isChecked ? "bg-neon-purple/20 text-neon-purple font-bold" : "text-gray-400 hover:bg-white/5"
                                          )}
                                        >
                                          <span>{a.name}</span>
                                          {isChecked && <Check size={10} />}
                                        </button>
                                      );
                                    })}
                                </div>
                              </div>

                              {/* Action playlist edit */}
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 block">ویرایش اختصاص سبک‌ها</label>
                                <div className="space-y-2">
                                  <input 
                                    type="text"
                                    value={editPlaylistSelectorQuery}
                                    onChange={(e) => setEditPlaylistSelectorQuery(e.target.value)}
                                    placeholder="جستجوی سبک جهت افزودن یا تغییر..."
                                    className="w-full h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-xs"
                                  />
                                </div>
                                <div className="max-h-24 overflow-y-auto custom-scrollbar border border-white/5 p-2 rounded-xl space-y-1 bg-black/20">
                                  {playlists
                                    .filter(p => p.name.toLowerCase().includes(editPlaylistSelectorQuery.toLowerCase()))
                                    .map((p: any) => {
                                      const isChecked = editSelectedPlaylistIds.includes(p.id);
                                      return (
                                        <button
                                          type="button"
                                          key={p.id}
                                          onClick={() => {
                                            if (isChecked) setEditSelectedPlaylistIds(prev => prev.filter(x => x !== p.id));
                                            else setEditSelectedPlaylistIds(prev => [...prev, p.id]);
                                          }}
                                          className={cn(
                                            "w-full h-7 px-2 flex items-center justify-between text-xs rounded-md text-right",
                                            isChecked ? "bg-neon-blue/20 text-neon-blue font-bold" : "text-gray-400 hover:bg-white/5"
                                          )}
                                        >
                                          <span>{p.name}</span>
                                          {isChecked && <Check size={10} />}
                                        </button>
                                      );
                                    })}
                                </div>
                              </div>
                            </div>

                            {/* Cover Edit Column */}
                            <div className="space-y-4 flex flex-col justify-center items-center">
                              <span className="text-xs font-bold text-gray-400 block text-right w-full">ویرایش تصویر کاور آهنگ</span>
                              <div className="h-44 w-44 rounded-2xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center relative">
                                {editCoverUrl ? (
                                  <img 
                                    src={editCoverUrl} 
                                    alt="Cover Thumbnail" 
                                    className="h-full w-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <Disc size={36} className="text-gray-500 opacity-40 animate-spin" />
                                )}
                                {editCoverLoading && (
                                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                    <div className="h-6 w-6 rounded-full border-t-2 border-neon-blue animate-spin" />
                                  </div>
                                )}
                              </div>
                              <label className="h-9 px-4 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all border border-white/10 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 text-white">
                                <input 
                                  type="file"
                                  accept="image/*"
                                  onChange={handleEditCoverChange}
                                  className="hidden"
                                />
                                <Image size={14} />
                                <span>آپلود طرح کاور آرت جدید</span>
                              </label>
                            </div>

                          </div>

                          <div className="flex border-t border-white/5 pt-4 gap-4 justify-end">
                            <button
                              onClick={() => setEditingTrack(null)}
                              className="px-5 h-10 border border-white/10 rounded-xl text-xs text-gray-300 hover:bg-white/5"
                            >
                              انصراف
                            </button>
                            <button
                              onClick={handleSaveTrackEdit}
                              disabled={isSavingEdit || editCoverLoading}
                              className="px-6 h-10 bg-neon-blue text-xs font-black text-black rounded-xl hover:opacity-90 transition-all"
                            >
                              {isSavingEdit ? "درحال ذخیره..." : "اعمال تغییرات"}
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* List items block rendering */}
                  {filteredTracks.length === 0 ? (
                    <div className="py-20 text-center border border-dashed border-white/5 bg-white/5 rounded-3xl text-gray-500 font-bold">
                      هیچ آهنگی یافت نشد. به تب آپلود مراجعه کنید.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredTracks.map((t: any) => {
                        const isThisAuditionPlaying = isPlayingAudition && activeAuditionUrl?.includes(t.url);
                        return (
                          <div 
                            key={t.id} 
                            className="bg-white/5 hover:bg-white/[0.08] transition-all border border-white/5 p-4 rounded-2xl flex gap-4 items-center"
                          >
                            {/* Track Artwork with direct Audition overlay play button */}
                            <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-black/40 border border-white/10 group flex-shrink-0">
                              {t.coverUrl ? (
                                <img 
                                  src={t.coverUrl} 
                                  alt="Cover" 
                                  className="h-full w-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="h-full w-full bg-neon-pink/10 flex items-center justify-center text-neon-pink">
                                  <Disc size={28} />
                                </div>
                              )}
                              <button
                                onClick={() => handleToggleAudition(t.url)}
                                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white"
                              >
                                {isThisAuditionPlaying ? <Pause size={18} /> : <Play size={18} />}
                              </button>
                            </div>

                            {/* Details text */}
                            <div className="flex-1 min-w-0 text-right">
                              <h4 className="font-bold text-white text-sm truncate">{t.title}</h4>
                              <p className="text-xs text-neon-purple font-semibold max-w-[200px] truncate mt-0.5">
                                {t.artists && t.artists.length > 0 
                                  ? t.artists.map((a: any) => a.name).join(" & ") 
                                  : "تک‌آهنگ نامشخص"}
                              </p>
                              
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {t.playlists && t.playlists.map((p: any) => (
                                  <span key={p.id} className="text-[9px] bg-neon-blue/10 text-neon-blue border border-neon-blue/20 px-2 h-4 flex items-center rounded">
                                    {p.name}
                                  </span>
                                ))}
                                {t.duration ? (
                                  <span className="text-[9px] bg-white/5 text-gray-500 px-2 h-4 flex items-center rounded font-mono">
                                    {Math.floor(t.duration / 60)}:{(t.duration % 60).toString().padStart(2, "0")}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleStartEditTrack(t)}
                                className="h-8 w-8 rounded-lg bg-white/5 hover:bg-neon-blue hover:text-black transition-all flex items-center justify-center border border-white/5 text-gray-400"
                                title="ویرایش متادیتا"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteTrack(t.id)}
                                className="h-8 w-8 rounded-lg bg-white/5 hover:bg-neon-red hover:text-white transition-all flex items-center justify-center border border-white/5 text-gray-400"
                                title="حذف دائمی"
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
              )}

              {/* Tab: Artists Manager */}
              {activeTab === "artists" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
                  
                  {/* Left component: Add new artist */}
                  <form onSubmit={handleAddNewArtist} className="bg-white/5 border border-white/5 p-6 rounded-3xl h-fit space-y-4">
                    <h3 className="text-md font-black text-white flex items-center gap-2 border-b border-white/5 pb-3">
                      <User className="text-neon-purple" size={16} />
                      <span>افزودن آرتیست جدید</span>
                    </h3>
                    
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block">نام خواننده</label>
                      <input 
                        type="text"
                        value={newArtistName}
                        onChange={(e) => setNewArtistName(e.target.value)}
                        placeholder="مثال: رضا صادقی"
                        className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-neon-purple/40 text-xs font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block">بیوگرافی یا توضیحات کوتاه</label>
                      <textarea 
                        value={newArtistBio}
                        onChange={(e) => setNewArtistBio(e.target.value)}
                        placeholder="عضو گروه..."
                        className="w-full h-24 p-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-neon-purple/40 text-xs text-right font-medium resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!newArtistName.trim()}
                      className="w-full h-11 bg-neon-purple hover:bg-neon-purple/80 text-xs font-black rounded-xl text-white transition-all disabled:opacity-40"
                    >
                      افزودن آرتیست به لیست
                    </button>
                  </form>

                  {/* Right components: Artists grid list */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="flex justify-between items-center bg-white/5 border border-white/5 p-4 rounded-xl">
                      <div className="relative w-72">
                        <Search className="absolute right-3 top-3  text-gray-500" size={14} />
                        <input 
                          type="text"
                          value={artistSearch}
                          onChange={(e) => setArtistSearch(e.target.value)}
                          placeholder="جستجوی خواننده..."
                          className="w-full h-10 pr-9 border border-white/5 rounded-lg bg-black/40 text-xs text-white placeholder-gray-600 focus:outline-none"
                        />
                      </div>
                      <span className="text-xs text-gray-500 font-mono font-bold">{filteredArtists.length} آرتیست ثبت شده</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar p-1">
                      {filteredArtists.map((a: any) => (
                        <div key={a.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4 justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Artist circular interactive avatar icon */}
                            <div className="relative h-12 w-12 rounded-full overflow-hidden bg-black/45 border border-white/10 shrink-0 group">
                              {a.avatarUrl ? (
                                <img 
                                  src={a.avatarUrl} 
                                  alt={a.name} 
                                  className="h-full w-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="h-full w-full bg-neon-purple/10 flex items-center justify-center text-neon-purple">
                                  <User size={20} />
                                </div>
                              )}
                              
                              {/* Integrated file avatar installer which compresses profile avatar size to 256 size */}
                              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white cursor-pointer rounded-full">
                                <input 
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleArtistAvatarUpload(a.id, e)}
                                  className="hidden"
                                />
                                <Camera size={14} />
                              </label>
                            </div>

                            <div className="text-right min-w-0">
                              <span className="text-sm font-black text-white block truncate">{a.name}</span>
                              <span className="text-[10px] text-gray-500 font-bold block mt-0.5">
                                {a._count?.tracks || 0} قطعه موسیقی
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteArtist(a.id)}
                            className="h-8 w-8 rounded-lg bg-white/5 border border-white/5 hover:bg-neon-red hover:text-white transition-all text-gray-500 flex items-center justify-center"
                            title="حذف هنرمند"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* Tab: Playlists / Genres */}
              {activeTab === "playlists" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
                  
                  {/* Create Playlist */}
                  <form onSubmit={handleAddNewPlaylist} className="bg-white/5 border border-white/5 p-6 rounded-3xl h-fit space-y-4">
                    <h3 className="text-md font-black text-white flex items-center gap-2 border-b border-white/5 pb-3">
                      <ListMusic className="text-neon-pink" size={16} />
                      <span>افزودن سبک (پلی‌لیست) جدید</span>
                    </h3>

                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block">نام سبک/پلی‌لیست</label>
                      <input 
                        type="text"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        placeholder="مثال: شاد عروسی"
                        className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-neon-pink/40 text-xs font-bold"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!newPlaylistName.trim()}
                      className="w-full h-11 bg-neon-pink hover:bg-neon-pink/80 text-xs font-black rounded-xl text-white transition-all disabled:opacity-40"
                    >
                      ساخت پلی‌لیست سبک
                    </button>
                  </form>

                  {/* Playlists grid */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="flex justify-between items-center bg-white/5 border border-white/5 p-4 rounded-xl">
                      <div className="relative w-72">
                        <Search className="absolute right-3 top-3 text-gray-500" size={14} />
                        <input 
                          type="text"
                          value={playlistSearch}
                          onChange={(e) => setPlaylistSearch(e.target.value)}
                          placeholder="جستجوی سبک موسیقی..."
                          className="w-full h-10 pr-9 border border-white/5 rounded-lg bg-black/40 text-xs text-white placeholder-gray-600 focus:outline-none"
                        />
                      </div>
                      <span className="text-xs text-gray-500 font-mono font-bold">{filteredPlaylists.length} سبک ثبت شده</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar p-1">
                      {filteredPlaylists.map((p: any) => (
                        <div key={p.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4 justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Playlist cover image interactive block */}
                            <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-black/45 border border-white/10 shrink-0 group">
                              {p.bannerUrl ? (
                                <img 
                                  src={p.bannerUrl} 
                                  alt={p.name} 
                                  className="h-full w-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="h-full w-full bg-neon-pink/10 flex items-center justify-center text-neon-pink text-xs">
                                  <ListMusic size={20} />
                                </div>
                              )}
                              
                              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white cursor-pointer rounded-xl">
                                <input 
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handlePlaylistBannerUpload(p.id, e)}
                                  className="hidden"
                                />
                                <Camera size={14} />
                              </label>
                            </div>

                            <div className="text-right min-w-0">
                              <span className="text-sm font-black text-white block truncate">{p.name}</span>
                              <span className="text-[10px] text-gray-500 font-bold block mt-0.5">
                                {p._count?.tracks || 0} قطعه فعال در بانک
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeletePlaylist(p.id)}
                            className="h-8 w-8 rounded-lg bg-white/5 border border-white/5 hover:bg-neon-red hover:text-white transition-all text-gray-500 flex items-center justify-center"
                            title="حذف سبک"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
