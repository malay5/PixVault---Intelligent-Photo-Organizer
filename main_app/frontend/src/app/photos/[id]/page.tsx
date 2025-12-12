"use client";

import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
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
    Image as ImageIcon
} from "lucide-react";
import { useEffect, useCallback, useState } from "react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

// Mock Data Source (Shared with Grid in a real app)
const PHOTOS = [
    { id: 1, src: "https://images.unsplash.com/photo-1517404215738-15263e9f9178?q=80&w=2670", date: "Nov 9, 2024", time: "12:10 AM", location: "Mumbai, India", device: "Pixel 7 Pro", aperture: "f/1.85", shutter: "1/120", iso: "ISO 50" },
    { id: 2, src: "https://images.unsplash.com/photo-1542038784424-48ed2d405328?q=80&w=2670", date: "Oct 12, 2023", time: "4:30 PM", location: "New York, USA", device: "iPhone 13", aperture: "f/1.6", shutter: "1/500", iso: "ISO 32" },
    { id: 3, src: "https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?q=80&w=2672", date: "Sep 5, 2023", time: "9:15 AM", location: "Kyoto, Japan", device: "Canon R5", aperture: "f/2.8", shutter: "1/200", iso: "ISO 100" },
    { id: 4, src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2670", date: "Aug 20, 2023", time: "6:45 PM", location: "Yosemite, USA", device: "Sony A7III", aperture: "f/4", shutter: "1/60", iso: "ISO 400" },
    { id: 5, src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2621", date: "Jul 4, 2023", time: "2:00 PM", location: "Vancouver, Canada", device: "Pixel 6", aperture: "f/1.9", shutter: "1/1000", iso: "ISO 55" },
    { id: 6, src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2670", date: "Jun 15, 2023", time: "11:00 AM", location: "London, UK", device: "iPhone 14 Pro", aperture: "f/1.7", shutter: "1/250", iso: "ISO 80" },
];

export default function ImageViewerPage() {
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);
    const [showInfo, setShowInfo] = useState(false);

    const idx = PHOTOS.findIndex((p) => p.id === id);
    const photo = PHOTOS[idx];

    const handleNext = useCallback(() => {
        if (idx < PHOTOS.length - 1) router.replace(`/photos/${PHOTOS[idx + 1].id}`);
    }, [idx, router]);

    const handlePrev = useCallback(() => {
        if (idx > 0) router.replace(`/photos/${PHOTOS[idx - 1].id}`);
    }, [idx, router]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft") handlePrev();
            if (e.key === "Escape") router.back();
            if (e.key === "i") setShowInfo(prev => !prev);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleNext, handlePrev, router]);

    if (!photo) return <div className="text-white flex items-center justify-center h-screen">Photo not found</div>;

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
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors group">
                            <Star className="group-hover:text-yellow-400 transition-colors" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors group">
                            <Trash2 className="group-hover:text-red-500 transition-colors" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <Share2 />
                        </button>
                        <button
                            onClick={() => setShowInfo(!showInfo)}
                            className={clsx("p-2 rounded-full transition-colors", showInfo ? "bg-blue-600/80 text-white" : "hover:bg-white/10")}
                        >
                            <Info />
                        </button>
                    </div>
                </div>

                {/* Main Image Area */}
                <div className="flex-1 relative flex items-center justify-center">
                    <div className="relative w-full h-full max-h-[90vh] p-4 flex items-center justify-center">
                        <motion.div
                            key={photo.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full h-full"
                        >
                            <Image
                                src={photo.src}
                                alt="Full view"
                                fill
                                className="object-contain"
                                priority
                            />
                        </motion.div>
                    </div>

                    {/* Navigation Arrows */}
                    {idx > 0 && (
                        <button onClick={handlePrev} className="absolute left-4 p-3 bg-black/20 hover:bg-black/50 backdrop-blur-sm rounded-full transition-all text-white/70 hover:text-white group">
                            <ChevronLeft size={32} className="group-active:-translate-x-1 transition-transform" />
                        </button>
                    )}
                    {idx < PHOTOS.length - 1 && (
                        <button onClick={handleNext} className="absolute right-4 p-3 bg-black/20 hover:bg-black/50 backdrop-blur-sm rounded-full transition-all text-white/70 hover:text-white group">
                            <ChevronRight size={32} className="group-active:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>
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
                            <button onClick={() => setShowInfo(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                <ArrowLeft size={20} className="rotate-180" /> {/* Or X icon */}
                            </button>
                        </div>

                        <div className="p-6 space-y-8 overflow-y-auto flex-1">
                            {/* Details Section */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Details</h3>

                                <div className="flex gap-4">
                                    <Calendar className="text-gray-400 mt-1" size={20} />
                                    <div>
                                        <div className="font-medium text-gray-900">{photo.date}</div>
                                        <div className="text-sm text-gray-500">{photo.time}</div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Camera className="text-gray-400 mt-1" size={20} />
                                    <div>
                                        <div className="font-medium text-gray-900">{photo.device || "Unknown Camera"}</div>
                                        <div className="text-sm text-gray-500">
                                            {photo.aperture} • {photo.shutter} • {photo.iso}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <ImageIcon className="text-gray-400 mt-1" size={20} />
                                    <div>
                                        <div className="font-medium text-gray-900">IMG_{photo.id}.jpg</div>
                                        <div className="text-sm text-gray-500">12.2MP • 3024 x 4032 • 4.2 MB</div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <MapPin className="text-gray-400 mt-1" size={20} />
                                    <div>
                                        <div className="font-medium text-gray-900">{photo.location || "Add location"}</div>
                                        <div className="text-sm text-gray-500 cursor-pointer text-blue-600 hover:underline">View on map</div>
                                    </div>
                                </div>
                            </div>

                            {/* People Section */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">People</h3>
                                <div className="flex gap-2">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                        <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100" alt="Person" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
                                        +
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                            <input
                                type="text"
                                placeholder="Add a description..."
                                className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder-gray-500"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
