"use client";

import { Search, Bell, UploadCloud, X, Share2, Plus, Trash2, MoreVertical, Archive } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/utils/AuthContext";
import { ProfileMenu } from "./ProfileMenu";
import { useSelection } from "@/utils/SelectionContext";
import { usePhoto } from "@/utils/PhotoContext";
import { motion, AnimatePresence } from "framer-motion";

export function Topbar() {
    const { isAuthenticated } = useAuth();
    const { selectionCount, clearSelection, selectedIds } = useSelection();
    const { movePhotos, refreshPhotos } = usePhoto();
    const [isUploading, setIsUploading] = useState(false);

    if (!isAuthenticated) return null;

    // Determine if we are in "Selection Mode"
    const isSelectionMode = selectionCount > 0;

    const handleAction = async (action: 'trash' | 'archive') => {
        if (selectedIds.size === 0) return;

        await movePhotos(Array.from(selectedIds), action);
        clearSelection();
        // Optional: Show Toast here
    };

    return (
        <header className={`h-20 flex items-center justify-between px-6 sticky top-0 z-20 w-full transition-colors duration-300 ${isSelectionMode ? "bg-[#e8f0fe] dark:bg-blue-900/30" : "bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-md dark:border-b dark:border-gray-800"}`}>
            <AnimatePresence mode="wait">
                {isSelectionMode ? (
                    /* CONTEXTUAL HEADER (Selection Mode) */
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <button
                                onClick={clearSelection}
                                className="p-2 hover:bg-gray-200/50 dark:hover:bg-white/10 rounded-full text-gray-700 dark:text-gray-200 transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <span className="text-xl font-medium text-gray-800 dark:text-gray-100">
                                {selectionCount} selected
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-gray-200/50 dark:hover:bg-white/10 rounded-full text-gray-700 dark:text-gray-200" title="Share">
                                <Share2 size={20} />
                            </button>
                            <button className="p-2 hover:bg-gray-200/50 dark:hover:bg-white/10 rounded-full text-gray-700 dark:text-gray-200" title="Add to Album">
                                <Plus size={24} />
                            </button>
                            <button
                                onClick={() => handleAction('archive')}
                                className="p-2 hover:bg-gray-200/50 dark:hover:bg-white/10 rounded-full text-gray-700 dark:text-gray-200"
                                title="Archive"
                            >
                                <Archive size={20} />
                            </button>
                            <button
                                onClick={() => handleAction('trash')}
                                className="p-2 hover:bg-gray-200/50 dark:hover:bg-white/10 rounded-full text-gray-700 dark:text-gray-200"
                                title="Move to Trash"
                            >
                                <Trash2 size={20} />
                            </button>
                            <button className="p-2 hover:bg-gray-200/50 dark:hover:bg-white/10 rounded-full text-gray-700 dark:text-gray-200">
                                <MoreVertical size={20} />
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    /* NORMAL HEADER */
                    <motion.div
                        key="normal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex items-center justify-between"
                    >
                        {/* Search Bar - Pill Shape & Shadow */}
                        <div className="flex-1 max-w-3xl">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-12 pr-4 py-3 border-none rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 focus:bg-white dark:focus:bg-gray-900 focus:shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] transition-all duration-200 group-hover:bg-gray-100/80 dark:group-hover:bg-gray-700"
                                    placeholder="Search your photos"
                                />
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-4 ml-4">
                            {/* Upload Button */}
                            <label className={`flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 text-blue-600 rounded-full font-medium hover:bg-blue-50 hover:border-blue-100 transition-all cursor-pointer shadow-sm hover:shadow-md ${isUploading ? 'opacity-70 cursor-wait' : ''}`}>
                                <UploadCloud size={20} />
                                <span className="hidden sm:inline">{isUploading ? 'Uploading...' : 'Upload'}</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    multiple
                                    accept="image/*"
                                    disabled={isUploading}
                                    onChange={async (e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            setIsUploading(true);
                                            // TODO: Support multiple files concurrently or batch
                                            for (let i = 0; i < e.target.files.length; i++) {
                                                const fd = new FormData();
                                                fd.append('file', e.target.files[i]);
                                                try {
                                                    const res = await fetch('http://localhost:5000/api/upload', {
                                                        method: 'POST',
                                                        body: fd
                                                    });

                                                    if (!res.ok) {
                                                        // Check content type to avoid JSON parse error on HTML response
                                                        const contentType = res.headers.get("content-type");
                                                        if (contentType && contentType.indexOf("application/json") !== -1) {
                                                            const errorData = await res.json();
                                                            alert(`Upload failed: ${errorData.message}`);
                                                        } else {
                                                            const text = await res.text();
                                                            console.error("Upload error (non-JSON):", text);
                                                            alert(`Upload failed: Server returned ${res.status} ${res.statusText}`);
                                                        }
                                                        continue;
                                                    }
                                                } catch (err) {
                                                    console.error('Upload network error', err);
                                                    alert("Upload failed: Network error");
                                                }
                                            }
                                            setIsUploading(false);
                                            await refreshPhotos();
                                        }
                                    }}
                                />
                            </label>

                            <ProfileMenu />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
