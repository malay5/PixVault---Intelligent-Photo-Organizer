"use client";

import Image from "next/image";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    Info,
    Star,
    Trash2,
    Share2,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Calendar,
    Camera,
    Image as ImageIcon,
    Sparkles,
    ScanFace, // Creative Icon
    Eye
} from "lucide-react";
import { useEffect, useCallback, useState } from "react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { usePhoto, Photo } from "@/utils/PhotoContext"; // Import Context

export default function ImageViewerPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params.id as string; // MongoDB ID is string
    // const [showInfo, setShowInfo] = useState(false);

    const showInfo = searchParams.get("info") === "true";
    const [showFaceScan, setShowFaceScan] = useState(true); // Creative Toggle State

    // Use global state to find photo + navigation
    // TODO: Ideally we also fetch individual photo if not in state (e.g. direct link)
    const { photos, loading: contextLoading, toggleFavorite, movePhotos } = usePhoto(); // Get actions

    const [photo, setPhoto] = useState<Photo | null>(null);
    const [loading, setLoading] = useState(true);

    // Initial Load Logic
    useEffect(() => {
        if (!id) return;

        // 1. Try finding in Context
        const found = photos.find(p => p._id === id);
        if (found) {
            setPhoto(found);
            setLoading(false);
        } else {
            // 2. If not in context (e.g. reload), fetch from API
            // For now, if photos are empty, we might wait?
            // Let's rely on Context for now, or fetch if context is loaded but photo not found.
            if (!contextLoading && photos.length > 0 && !found) {
                // Item truly not found in loaded list
                setLoading(false);
            } else if (!contextLoading && photos.length === 0) {
                // Context empty, maybe fetch? 
                // We will skip complex single-fetch for this iteration and assume context fills up.
                // Actually, let's just wait for context.
            }
        }
    }, [id, photos, contextLoading]);


    const idx = photos.findIndex((p) => p._id === id);

    // 4. Helper to toggle info in the URL without changing the photo
    const toggleInfo = useCallback(() => {
        const newParams = new URLSearchParams(searchParams.toString());
        if (showInfo) {
            newParams.delete("info");
        } else {
            newParams.set("info", "true");
        }
        router.replace(`/photos/${id}?${newParams.toString()}`, { scroll: false });
    }, [id, router, searchParams, showInfo]);

    // 5. Helper to generate next/prev links PRESERVING the info state
    const navigateToPhoto = useCallback((newId: string) => {
        const query = showInfo ? "?info=true" : "";
        router.replace(`/photos/${newId}${query}`);
    }, [router, showInfo]);

    const handleNext = useCallback(() => {
        if (idx !== -1 && idx < photos.length - 1) {
            navigateToPhoto(photos[idx + 1]._id);
        }
    }, [idx, photos, navigateToPhoto]);

    const handlePrev = useCallback(() => {
        if (idx > 0) {
            navigateToPhoto(photos[idx - 1]._id);
        }
    }, [idx, photos, navigateToPhoto]);

    const handleDelete = async () => {
        if (!photo) return;
        if (confirm("Move this photo to trash?")) {
            await movePhotos([photo._id], 'trash');
            router.back();
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft") handlePrev();
            if (e.key === "Escape") router.back();
            if (e.key === "i") toggleInfo();
            if (e.key === "Delete" || e.key === "Backspace") handleDelete();
            if (e.key === "f") setShowFaceScan(prev => !prev); // Shortcut for Face Scan
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleNext, handlePrev, router, handleDelete, toggleInfo, setShowFaceScan]); // Added handleDelete dep

    if (loading && !photo) return <div className="text-white flex items-center justify-center h-screen animate-pulse">Loading photo...</div>;
    if (!photo) return <div className="text-white flex items-center justify-center h-screen">Photo not found</div>;

    const dateObj = photo.upload_date ? new Date(photo.upload_date) : new Date();
    const dateStr = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

    // Use full URL for src
    const imgSrc = photo.src || (photo.file_path ? `http://localhost:5000/${photo.file_path.replace(/\\/g, '/')}` : "/placeholder.jpg");

    return (
        <div className="fixed inset-0 bg-black z-50 flex h-screen text-white overflow-hidden">

            {/* Main Content (Image + Topbar) */}
            <div className={clsx("flex-1 flex flex-col relative transition-all duration-300 ease-in-out", showInfo ? "mr-[360px]" : "mr-0")}>

                {/* Top Bar */}
                <div className="h-16 flex items-center justify-between px-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full z-20">
                    <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/90 hover:text-white">
                        <ArrowLeft />
                    </button>
                    <div className="flex gap-2">
                        {/* Vision Mode Toggle Removed - Now in Info Drawer */}

                        <button
                            onClick={() => toggleFavorite(photo._id)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors group"
                        >
                            <Star className={clsx("group-hover:text-yellow-400 transition-colors", photo.is_favorite && "text-yellow-400 fill-current")} />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors group"
                        >
                            <Trash2 className="group-hover:text-red-500 transition-colors" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <Share2 />
                        </button>
                        <button
                            onClick={toggleInfo}
                            className={clsx("p-2 rounded-full transition-colors", showInfo ? "bg-blue-600/80 text-white" : "hover:bg-white/10")}
                        >
                            <Info />
                        </button>
                    </div>
                </div>

                {/* Main Image Area */}
                <div className="flex-1 relative flex items-center justify-center bg-black p-4 select-none">
                    <motion.div
                        key={photo._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="relative flex items-center justify-center w-full h-full"
                    >
                        {/* 
                            Robust Centering Container:
                            - 'relative inline-block': Shrinks to fit the image dimensions exactly.
                            - The parent 'flex items-center justify-center' ensures this shrink-wrapped block is centered.
                            - 'width: fit-content': Explicitly tells it to size based on content.
                        */}
                        <div className="relative inline-block" style={{ width: 'fit-content', height: 'fit-content' }}>
                            <Image
                                src={imgSrc}
                                alt={photo.original_name}
                                width={photo.metadata?.width || 1200}
                                height={photo.metadata?.height || 800}
                                // Use 'style' for constraints instead of class to avoid conflicts.
                                // objectFit: scale-down behaving like contain but respects original size limits if needed
                                style={{ width: 'auto', height: 'auto', maxHeight: '90vh', maxWidth: '100vw', objectFit: 'contain', display: 'block' }}
                                priority
                                unoptimized
                                onLoadingComplete={(img) => {
                                    // Dynamic fallback: If metadata is 0, update local state with real dimensions
                                    if (!photo.metadata?.width || !photo.metadata?.height) {
                                        const newMeta = { ...photo.metadata, width: img.naturalWidth, height: img.naturalHeight };
                                        setPhoto({ ...photo, metadata: newMeta });
                                    }
                                }}
                            />

                            {/* Face Overlays - Only show if toggle is ON and metadata exists */}
                            {showFaceScan && photo.faces && photo.faces.map((face: any, i: number) => {
                                const metaW = photo.metadata?.width;
                                const metaH = photo.metadata?.height;

                                if (!metaW || !metaH) return null;

                                const { x, y, w, h } = face.box;
                                const left = (x / metaW) * 100;
                                const top = (y / metaH) * 100;
                                const width = (w / metaW) * 100;
                                const height = (h / metaH) * 100;

                                return (
                                    <div
                                        key={face.face_id || i}
                                        className="absolute border-2 border-green-500 z-10 hover:bg-green-500/20 transition-colors cursor-pointer group/face"
                                        style={{
                                            left: `${left}%`,
                                            top: `${top}%`,
                                            width: `${width}%`,
                                            height: `${height}%`
                                        }}
                                    >
                                        <div className="opacity-0 group-hover/face:opacity-100 transition-opacity absolute -top-6 left-0 bg-green-500 text-black text-[10px] font-bold px-1 rounded-sm whitespace-nowrap pointer-events-none">
                                            Face {i + 1}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>

                {/* Navigation Arrows */}
                {idx > 0 && (
                    <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/20 hover:bg-black/50 backdrop-blur-sm rounded-full transition-all text-white/70 hover:text-white group z-10">
                        <ChevronLeft size={32} className="group-active:-translate-x-1 transition-transform" />
                    </button>
                )}
                {idx !== -1 && idx < photos.length - 1 && (
                    <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/20 hover:bg-black/50 backdrop-blur-sm rounded-full transition-all text-white/70 hover:text-white group z-10">
                        <ChevronRight size={32} className="group-active:translate-x-1 transition-transform" />
                    </button>
                )}
            </div>

            {/* Info Drawer */}
            <AnimatePresence>
                {showInfo && (
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="absolute right-0 top-0 h-full w-[360px] bg-white text-gray-900 shadow-2xl z-30 flex flex-col border-l border-gray-200"
                    >
                        <div className="p-4 flex items-center justify-between border-b border-gray-100">
                            <h2 className="text-lg font-medium">Info</h2>
                            <button onClick={toggleInfo} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                <ArrowLeft size={20} className="rotate-180" />
                            </button>
                        </div>

                        <div className="p-6 space-y-8 overflow-y-auto flex-1">
                            {/* Details Section */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Details</h3>

                                <div className="flex gap-4">
                                    <Calendar className="text-gray-400 mt-1" size={20} />
                                    <div>
                                        <div className="font-medium text-gray-900">{dateStr}</div>
                                        <div className="text-sm text-gray-500">{timeStr}</div>
                                    </div>
                                </div>

                                {photo.metadata?.camera_model && photo.metadata.camera_model !== 'Unknown Camera' && (
                                    <div className="flex gap-4">
                                        <Camera className="text-gray-400 mt-1" size={20} />
                                        <div>
                                            <div className="font-medium text-gray-900">{photo.metadata.camera_model}</div>
                                            {/* We don't have ISO/Aperture in DB yet, so hiding placeholders to be clean */}
                                        </div>
                                    </div>
                                )}

                                {photo.is_ai && (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex gap-4">
                                            <Sparkles className="text-purple-500 mt-1" size={20} />
                                            <div>
                                                <div className="font-medium text-purple-600">AI Generated</div>
                                                <div className="text-sm text-gray-500">Classified by PixelVault AI</div>
                                            </div>
                                        </div>
                                        {/* Report Action */}
                                        <button
                                            onClick={async () => {
                                                if (!confirm("Report this image as falsely classified (Real Photo)?")) return;
                                                const token = localStorage.getItem("token");
                                                try {
                                                    await fetch(`http://localhost:5000/api/photos/${photo._id}/report`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
                                                        body: JSON.stringify({ reason: 'False Positive: User reported as Real' })
                                                    });
                                                    alert("Report submitted. Thank you for helping improve our AI.");
                                                } catch (e) {
                                                    alert("Failed to report.");
                                                }
                                            }}
                                            className="ml-9 text-xs text-red-400 hover:text-red-500 hover:underline text-left"
                                        >
                                            Report False Positive
                                        </button>
                                    </div>
                                )}

                                {/* Neural Vision Section */}
                                {photo.faces && photo.faces.length > 0 && (
                                    <div className="border-t border-gray-100 pt-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                                <ScanFace size={14} /> Neural Vision
                                            </h3>
                                            <button
                                                onClick={() => setShowFaceScan(!showFaceScan)}
                                                className={clsx(
                                                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                                                    showFaceScan ? "bg-green-500" : "bg-gray-200"
                                                )}
                                            >
                                                <span
                                                    className={clsx(
                                                        "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                                                        showFaceScan ? "translate-x-5" : "translate-x-1"
                                                    )}
                                                />
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {photo.faces.map((face: any, i: number) => (
                                                <div key={face.face_id || i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer"
                                                    onMouseEnter={() => setShowFaceScan(true)} // Auto-show on hover list
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                                        <ScanFace size={14} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {face.person_id ? "Identified Person" : `Face ${i + 1}`}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {face.person_id ? "Confidence: High" : "Unknown / Unlabeled"}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <ImageIcon className="text-gray-400 mt-1" size={20} />
                                    <div>
                                        <div className="font-medium text-gray-900 truncate max-w-[200px]">{photo.original_name}</div>
                                        <div className="text-sm text-gray-500">
                                            {/* Show dimension only if valid */}
                                            {photo.metadata?.width ? `${photo.metadata.width} x ${photo.metadata.height} • ` : ""}
                                            {photo.metadata?.size ? (photo.metadata.size / 1024 / 1024).toFixed(2) + " MB" : ""}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
