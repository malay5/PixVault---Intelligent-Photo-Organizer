"use client";

import { useRef, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/utils/AuthContext";
import { useAlbum } from "@/utils/AlbumContext";
import { useSelection } from "@/utils/SelectionContext";
import { PhotoGrid } from "@/components/PhotoGrid";
import { SaveToAlbumModal } from "@/components/SaveToAlbumModal"; // Import Modal
import { UploadCloud, Search, ShieldCheck, User, Mail, X, Camera, ChevronRight, RefreshCw, Filter, Download, FolderPlus, Sparkles } from "lucide-react"; // Add FolderPlus
import { motion, AnimatePresence } from "framer-motion";
import { Photo } from "@/utils/PhotoContext";

// Auth & Refs
export default function SharedAlbumPage() {
    const params = useParams();
    const token = params.token as string;
    const { getShareInfo, guestUpload } = useAlbum();

    const [albumData, setAlbumData] = useState<any>(null);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Upload State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [guestName, setGuestName] = useState("");
    const [guestEmail, setGuestEmail] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // Save to Library State
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

    // Find Me State
    const [isFindMeModalOpen, setIsFindMeModalOpen] = useState(false);
    const [selfies, setSelfies] = useState<File[]>([]);
    const [finding, setFinding] = useState(false);
    const [foundIds, setFoundIds] = useState<string[] | null>(null);

    // Filter & Lightbox State
    const [selectedUploaders, setSelectedUploaders] = useState<string[]>([]);
    const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Context & Refs
    const { isAuthenticated, user } = useAuth();
    const { selectionCount, selectedIds, clearSelection } = useSelection();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cameraActive, setCameraActive] = useState(false);

    // Batch Download Helper
    const handleBatchDownload = async () => {
        const selectedPhotos = photos.filter(p => selectedIds.has(p._id));
        for (const photo of selectedPhotos) {
            await handleDownload(photo);
            await new Promise(r => setTimeout(r, 500));
        }
        clearSelection();
    };

    const handleSaveToLibrary = async (targetAlbumId: string | null, newAlbumName: string | null) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch('http://localhost:5000/api/photos/copy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token || ''
                },
                body: JSON.stringify({
                    photoIds: Array.from(selectedIds),
                    targetAlbumId,
                    newAlbumName
                })
            });
            if (res.ok) {
                alert("Photos saved to your library!");
                clearSelection();
            } else {
                alert("Failed to save photos.");
            }
        } catch (err) {
            console.error(err);
            alert("Error saving photos.");
        }
    };

    // Initial Load
    useEffect(() => {
        const load = async () => {
            const data = await getShareInfo(token);
            if (data) {
                setAlbumData(data.album);
                setPhotos(data.photos);
            } else {
                setError("Album not found or link expired.");
            }
            setLoading(false);
        };
        load();
    }, [token, getShareInfo]);

    // Cleanup camera
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setCameraActive(false);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
            }
        } catch (err) {
            console.error("Camera error", err);
            alert("Could not access camera. Please allow permissions.");
        }
    };

    const captureSelfie = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
                        setSelfies(prev => [...prev, file]);
                    }
                }, 'image/jpeg');
            }
        }
    };

    const handleUploadClick = () => {
        if (!isAuthenticated) {
            // For now, allow guests to see the modal but maybe require login inside?
            // The requirement was "Sign in to Upload".
            // Let's redirect to login.
            alert("Please sign in to join the party!");
            window.location.href = `/login?redirect=/share/${token}`;
            return;
        }
        if (user) {
            setGuestName(user.name);
            setGuestEmail(user.email);
        }
        setIsUploadModalOpen(true);
    };

    const handleFindMeClick = () => {
        if (!isAuthenticated) {
            alert("Please sign in to find your photos.");
            window.location.href = `/login?redirect=/share/${token}`;
            return;
        }
        if (foundIds) {
            setFoundIds(null);
        } else {
            setIsFindMeModalOpen(true);
            setTimeout(startCamera, 500);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !guestName || !guestEmail) return;
        setUploading(true);
        const success = await guestUpload(token, selectedFile, guestName, guestEmail);
        if (success) {
            alert("Photo uploaded!");
            setIsUploadModalOpen(false);
            setSelectedFile(null);
            window.location.reload();
        } else {
            alert("Upload failed.");
        }
        setUploading(false);
    };

    const handleFindMe = async () => {
        if (selfies.length < 1) return;
        setFinding(true);
        stopCamera();

        const fd = new FormData();
        selfies.forEach(file => fd.append('selfies', file));

        try {
            const res = await fetch(`http://localhost:5000/api/albums/share/${token}/find-me`, {
                method: 'POST',
                body: fd
            });
            const data = await res.json();
            setFoundIds(data.found_ids);
            setIsFindMeModalOpen(false);
        } catch (err) {
            console.error(err);
            alert("Error finding faces");
        } finally {
            setFinding(false);
            setSelfies([]);
            stopCamera();
        }
    };

    // --- Filter Logic ---
    const getUploaderName = (p: any) => {
        if (p.guest_uploaded_by) return p.guest_uploaded_by;
        if (p.user_id && p.user_id.name) return p.user_id.name;
        return "Host";
    };

    const uploaders = photos.length > 0 ? Array.from(new Set(photos.map(p => getUploaderName(p)))) : [];

    let filteredPhotos = foundIds ? photos.filter(p => foundIds.includes(p.id || p._id)) : photos;

    if (selectedUploaders.length > 0) {
        filteredPhotos = filteredPhotos.filter(p => selectedUploaders.includes(getUploaderName(p)));
    }

    const toggleUploaderFilter = (name: string) => {
        setSelectedUploaders(prev =>
            prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
        );
    };

    // --- Lightbox Logic ---
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!lightboxPhoto) return;

            if (e.key === 'Escape') {
                setLightboxPhoto(null);
            } else if (e.key === 'ArrowRight') {
                const currentIndex = filteredPhotos.findIndex(p => (p.id || p._id) === (lightboxPhoto.id || lightboxPhoto._id));
                if (currentIndex < filteredPhotos.length - 1) {
                    setLightboxPhoto(filteredPhotos[currentIndex + 1]);
                }
            } else if (e.key === 'ArrowLeft') {
                const currentIndex = filteredPhotos.findIndex(p => (p.id || p._id) === (lightboxPhoto.id || lightboxPhoto._id));
                if (currentIndex > 0) {
                    setLightboxPhoto(filteredPhotos[currentIndex - 1]);
                }
            } else if (e.key === 'i' || e.key === 'I') {
                setShowInfo(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxPhoto, filteredPhotos]);

    // Download Helper
    const handleDownload = async (photo: Photo) => {
        try {
            const response = await fetch(photo.src || `http://localhost:5000/${photo.file_path.replace(/\\/g, '/')}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pixelvault-${photo.original_name || 'photo'}.jpg`; // Try to preserve extension
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Download failed", err);
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse">Loading shared album...</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

    const displayPhotos = filteredPhotos;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] text-gray-900 dark:text-gray-100 flex flex-col md:flex-row">
            {/* Mobile Toggle */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white dark:bg-[#18181b] p-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 shadow-sm">
                <span className="font-bold text-lg truncate pr-4">{albumData?.title}</span>
                <button onClick={() => setIsMenuOpen(true)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"><ChevronRight /></button>
            </div>

            {/* Sidebar */}
            <div className={`
                fixed inset-0 z-40 bg-white dark:bg-[#18181b] p-6 md:p-10 border-r border-gray-100 dark:border-gray-800 
                flex flex-col transition-transform duration-300 md:translate-x-0 md:static md:w-[400px] md:shadow-none
                ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex justify-end md:hidden mb-4">
                    <button onClick={() => setIsMenuOpen(false)}><X /></button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {/* Cover */}
                    <div className="aspect-video w-full rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-8 flex items-center justify-center text-white shadow-lg overflow-hidden relative">
                        {albumData?.cover_src && <img src={albumData.cover_src} className="absolute inset-0 w-full h-full object-cover" alt="Cover" />}
                        <div className="absolute inset-0 bg-black/40" />
                        <h1 className="relative z-10 text-3xl font-bold text-center px-4 drop-shadow-md">{albumData?.title || "Shared Album"}</h1>
                    </div>

                    <div className="space-y-6">
                        {/* Host Info */}
                        <div>
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-1">Hosted By</p>
                            <p className="flex items-center gap-2 font-medium">
                                <ShieldCheck size={18} className="text-blue-500" />
                                {albumData?.user_id?.name || albumData?.owner_name || "Unknown Host"}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {albumData?.created_at ? new Date(albumData.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "Unknown Date"}
                            </p>
                        </div>

                        {/* Uploader Filter */}
                        {uploaders.length > 1 && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Filter size={14} /> Filter by Uploader
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {uploaders.map(name => (
                                        <button
                                            key={name}
                                            onClick={() => toggleUploaderFilter(name)}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${selectedUploaders.includes(name)
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                                                }`}
                                        >
                                            {name}
                                        </button>
                                    ))}
                                    {selectedUploaders.length > 0 && (
                                        <button onClick={() => setSelectedUploaders([])} className="text-xs text-blue-500 underline self-center ml-1">Clear</button>
                                    )}
                                </div>
                            </div>
                        )}

                        {albumData?.description && (
                            <div>
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-1">About</p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{albumData.description}</p>
                            </div>
                        )}

                        <div className="pt-6 space-y-3">
                            {/* Actions */}
                            {!(albumData?.is_read_only) && (albumData?.party_mode || albumData?.allow_guest_uploads) && (
                                <button onClick={handleUploadClick} className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                                    <UploadCloud size={20} />
                                    {isAuthenticated ? "Upload Images" : "Sign in to Upload"}
                                </button>
                            )}

                            <button onClick={handleFindMeClick} className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                                {foundIds ? <RefreshCw size={20} /> : <Search size={20} />}
                                {foundIds ? "Show All Photos" : (isAuthenticated ? "Find me in this album" : "Sign in to Find Yourself")}
                            </button>

                            {/* Share Read-Only Button */}
                            <button
                                onClick={() => {
                                    if (albumData?.read_only_token) {
                                        const url = `${window.location.origin}/share/${albumData.read_only_token}`;
                                        navigator.clipboard.writeText(url);
                                        alert("Read-Only Link copied to clipboard!");
                                    } else {
                                        console.log(albumData)
                                        alert("Read-only link not available.");
                                    }
                                }}
                                className="w-full py-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2"
                            >
                                <ShieldCheck size={20} />
                                Share Access
                            </button>
                        </div>
                    </div>
                </div>
                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 text-center text-sm text-gray-400">
                    <p>Powered by PixelVault</p>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto h-screen p-4 md:p-8 pt-20 md:pt-8 bg-gray-50 dark:bg-[#09090b] relative">
                {/* Floating Selection Bar */}
                <AnimatePresence>
                    {selectionCount > 0 && (
                        <motion.div
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                            className="absolute top-4 left-4 right-4 md:left-8 md:right-8 z-30 flex justify-center"
                        >
                            <div className="bg-white dark:bg-gray-800 rounded-full shadow-2xl px-6 py-3 flex items-center gap-6 border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3 border-r border-gray-200 dark:border-gray-700 pr-6">
                                    <button onClick={clearSelection} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                                        <X size={20} />
                                    </button>
                                    <span className="font-bold text-lg">{selectionCount} Selected</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleBatchDownload}
                                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors px-2"
                                    >
                                        <Download size={20} />
                                        Download
                                    </button>
                                    {isAuthenticated && (
                                        <button
                                            onClick={() => setIsSaveModalOpen(true)}
                                            className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold hover:text-green-700 dark:hover:text-green-300 transition-colors px-2 border-l border-gray-200 dark:border-gray-700"
                                        >
                                            <FolderPlus size={20} />
                                            Save to Library
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {foundIds && (
                    <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-center justify-between">
                        <span className="text-blue-600 dark:text-blue-400 font-medium">Found {displayPhotos.length} photos matching your selfies!</span>
                        <button onClick={() => setFoundIds(null)} className="text-sm underline text-blue-500">Clear Filter</button>
                    </div>
                )}
                <PhotoGrid photos={displayPhotos} onPhotoClick={setLightboxPhoto} />
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {lightboxPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => setLightboxPhoto(null)}
                    >
                        {/* Top Controls */}
                        <div className="absolute top-4 right-4 flex items-center gap-4 z-20" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => handleDownload(lightboxPhoto)}
                                className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                                title="Download"
                            >
                                <UploadCloud size={20} className="transform rotate-180" />
                            </button>
                            <button
                                onClick={() => setShowInfo(!showInfo)}
                                className={`p-2 rounded-full transition-colors ${showInfo ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                title="Info (i)"
                            >
                                <span className="font-serif font-bold italic w-5 h-5 flex items-center justify-center">i</span>
                            </button>
                            <button onClick={() => setLightboxPhoto(null)} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Nav Buttons */}
                        <div className="absolute inset-y-0 left-0 w-20 flex items-center justify-center z-10 opacity-0 hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <button
                                className="p-3 bg-black/50 text-white rounded-full hover:bg-black/80"
                                onClick={() => {
                                    const currentIndex = filteredPhotos.findIndex(p => (p.id || p._id) === (lightboxPhoto.id || lightboxPhoto._id));
                                    if (currentIndex > 0) setLightboxPhoto(filteredPhotos[currentIndex - 1]);
                                }}
                            >
                                <ChevronRight className="transform rotate-180" size={32} />
                            </button>
                        </div>
                        <div className="absolute inset-y-0 right-0 w-20 flex items-center justify-center z-10 opacity-0 hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <button
                                className="p-3 bg-black/50 text-white rounded-full hover:bg-black/80"
                                onClick={() => {
                                    const currentIndex = filteredPhotos.findIndex(p => (p.id || p._id) === (lightboxPhoto.id || lightboxPhoto._id));
                                    if (currentIndex < filteredPhotos.length - 1) setLightboxPhoto(filteredPhotos[currentIndex + 1]);
                                }}
                            >
                                <ChevronRight size={32} />
                            </button>
                        </div>

                        <img
                            src={lightboxPhoto.src || `http://localhost:5000/${lightboxPhoto.file_path.replace(/\\/g, '/')}`}
                            className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl transition-transform duration-200"
                            alt="Full View"
                            onClick={(e) => e.stopPropagation()}
                        />

                        {/* Info Overlay */}
                        <AnimatePresence>
                            {showInfo && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md p-4 rounded-xl text-white min-w-[300px]"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <h3 className="font-bold text-lg mb-1">{lightboxPhoto.original_name || "Untitled Photo"}</h3>
                                    <div className="text-sm text-gray-300 space-y-1">
                                        <p className="flex items-center gap-2"><User size={14} /> Uploaded by <span className="text-white font-medium">{getUploaderName(lightboxPhoto)}</span></p>
                                        {(lightboxPhoto.guest_email || lightboxPhoto.user_id?.email) && (
                                            <p className="flex items-center gap-2"><Mail size={14} /> {lightboxPhoto.guest_email || lightboxPhoto.user_id?.email}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-2">{new Date(lightboxPhoto.upload_date || Date.now()).toLocaleString()}</p>

                                        {/* Camera Info */}
                                        {lightboxPhoto.metadata?.camera_model &&
                                            lightboxPhoto.metadata.camera_model !== 'Unknown Camera' && (
                                                <p className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                                    <Camera size={12} /> {lightboxPhoto.metadata.camera_model}
                                                </p>
                                            )}

                                        {/* AI Info */}
                                        {lightboxPhoto.is_ai && (
                                            <div className="mt-2 flex items-center gap-2 px-2 py-1 bg-purple-500/20 text-purple-200 text-xs rounded-full w-fit border border-purple-500/30">
                                                <Sparkles size={12} /> AI Generated
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="absolute bottom-6 left-0 right-0 text-center text-white/50 text-xs pointer-events-none">
                            Use Arrow Keys to Navigate • Press 'i' for Info • Esc to Close
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Upload Modal (Simplified) */}
            <AnimatePresence>
                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden"
                        >
                            <button onClick={() => setIsUploadModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold mb-1">Add to Album</h2>
                                <p className="text-gray-500">Share your photos with the host.</p>
                            </div>
                            <form onSubmit={handleUpload} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium">Your Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                        <input required value={guestName} onChange={e => setGuestName(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700/50 focus:ring-2 focus:ring-blue-500 outline-none" readOnly={!!user} />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <label className="block w-full cursor-pointer hover:opacity-90 transition-opacity">
                                        <div className="w-full h-32 border-2 border-dashed border-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex flex-col items-center justify-center text-blue-600 transition-colors hover:bg-blue-100 hover:dark:bg-blue-900/30">
                                            {selectedFile ? <span className="font-medium truncate max-w-[200px]">{selectedFile.name}</span> : <><UploadCloud size={32} className="mb-2" /><span className="font-medium">Selected Photo</span></>}
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files && setSelectedFile(e.target.files[0])} />
                                    </label>
                                </div>
                                <button type="submit" disabled={!selectedFile || uploading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-4 shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">{uploading ? "Uploading..." : "Upload Photo"}</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Find Me Camera Modal */}
            <AnimatePresence>
                {isFindMeModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full p-8 text-center relative overflow-hidden"
                        >
                            <button onClick={() => { setIsFindMeModalOpen(false); stopCamera(); setSelfies([]); }} className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-900 z-10">
                                <X size={20} />
                            </button>

                            <div className="mb-6">
                                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Find me in photos</h2>
                                <p className="text-gray-500">Take 3 selfies to let AI find you in this album.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-blue-500 shadow-2xl bg-black">
                                    <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transform scale-x-[-1] ${cameraActive ? 'opacity-100' : 'opacity-0'}`} />
                                    <canvas ref={canvasRef} className="hidden" />
                                    {!cameraActive && <div className="absolute inset-0 flex items-center justify-center text-white"><Camera size={48} className="opacity-50" /></div>}
                                </div>

                                <div className="flex justify-center gap-3">
                                    {[0, 1, 2].map((i) => (
                                        <div key={i} className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center overflow-hidden transition-all ${selfies[i] ? 'border-green-500 scale-100' : 'border-dashed border-gray-300 dark:border-gray-700 scale-90'}`}>
                                            {selfies[i] ? <img src={URL.createObjectURL(selfies[i])} className="w-full h-full object-cover" alt="selfie" /> : <span className="text-gray-300 text-xs">{i + 1}</span>}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-4">
                                    {selfies.length < 3 ? (
                                        <button onClick={captureSelfie} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                                            <Camera size={20} /> Capture {selfies.length + 1}/3
                                        </button>
                                    ) : (
                                        <button onClick={handleFindMe} disabled={finding} className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
                                            {finding ? <RefreshCw className="animate-spin" /> : <Search size={20} />} {finding ? "Scanning..." : "Start Search"}
                                        </button>
                                    )}
                                </div>
                                <button onClick={() => { setSelfies([]); startCamera(); }} className="text-sm text-gray-400 hover:text-gray-600 underline">Retake All</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <SaveToAlbumModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onSave={handleSaveToLibrary}
                selectedCount={selectionCount}
            />
        </div>
    );
}


