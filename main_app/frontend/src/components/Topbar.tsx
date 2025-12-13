"use client";

import { Search, Bell, UploadCloud, X, Share2, Plus, Trash2, MoreVertical, Archive, FolderPlus, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/utils/AuthContext";
import { usePathname } from "next/navigation";
import { ProfileMenu } from "./ProfileMenu";
import { useSelection } from "@/utils/SelectionContext";
import { usePhoto } from "@/utils/PhotoContext";
import { motion, AnimatePresence } from "framer-motion";

export function Topbar() {
    const { isAuthenticated } = useAuth();
    const { selectionCount, clearSelection, selectedIds } = useSelection();
    const { movePhotos, refreshPhotos, photos } = usePhoto();
    const [isUploading, setIsUploading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    if (!isAuthenticated) return null;

    // Determine if we are in "Selection Mode"
    const isSelectionMode = selectionCount > 0;

    const pathname = usePathname();
    const isTrash = pathname === '/trash';
    const isAlbumDetail = pathname.startsWith('/albums/') && pathname.split('/').length > 2;

    const handleAction = async (action: 'trash' | 'archive' | 'recover' | 'delete_permanently') => {
        if (selectedIds.size === 0) return;

        const selectedIdsArray = Array.from(selectedIds);

        if (action === 'delete_permanently') {
            const confirmed = window.confirm("Are you sure you want to permanently delete these photos? This cannot be undone.");
            if (!confirmed) return;
            // Call permanent delete API
            // For MVP, allow calling movePhotos with 'delete' status or a specific api?
            // PhotoContext movePhotos usually just sets status.
            // We need a real DELETE.
            // Let's assume we add deletePhotos to context or use a direct fetch for now.
            // Ideally update PhotoContext.
            await movePhotos(selectedIdsArray, 'delete_permanent'); // Need to implement this in Context
        } else if (action === 'recover') {
            await movePhotos(selectedIdsArray, 'active');
        } else {
            // ... existing trash logic
            if (action === 'trash') {
                const hasFavorites = selectedIdsArray.some(id => {
                    const p = photos.find(photo => photo._id === id);
                    return p?.is_favorite;
                });

                if (hasFavorites) {
                    const confirmed = window.confirm("Some of these photos are favorites. Are you sure you want to move them to trash?");
                    if (!confirmed) return;
                }
            }
            await movePhotos(selectedIdsArray, action);
        }
        clearSelection();
    };

    // Hide global upload on Trash/Archive/Album List
    const showUpload = !['/trash', '/archive', '/albums'].includes(pathname);
    // Album Detail handles its own upload typically, OR we hijack this button.
    // User said: "When in the particular album, the upload button, should only upload to the current album."
    // So we should KEEP it, but change its behavior.

    // Determine target album
    // If Global -> "My Images" (Default)
    // If Album Detail -> Current Album ID
    let uploadTargetAlbumId = '';
    if (isAlbumDetail) {
        uploadTargetAlbumId = pathname.split('/')[2];
    }
    // Else if Global, we need "My Images" ID. 
    // We can fetch/create it on upload time or have it in context. 
    // For now, let's just send 'my-images' string and handle it in backend? 
    // Or just 'null' for global stream if we haven't implemented "My Images" fully yet.
    // User said "All the images... should be going to a my images album".
    // I will use a magic string 'default-my-images' and backend will handle it.

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
                            {isTrash ? (
                                <>
                                    <button
                                        onClick={() => handleAction('recover')}
                                        className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full text-green-600 dark:text-green-400"
                                        title="Recover"
                                    >
                                        <RefreshCcw size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleAction('delete_permanently')}
                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full text-red-600 dark:text-red-400"
                                        title="Delete Permanently"
                                    >
                                        <X size={20} />
                                    </button>
                                </>
                            ) : (
                                <>
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
                                </>
                            )}
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
                            {/* ... Search ... */}
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
                            {showUpload && (
                                <label className={`flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400 rounded-full font-medium hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-100 dark:hover:border-gray-600 transition-all cursor-pointer shadow-sm hover:shadow-md ${isUploading ? 'opacity-70 cursor-wait' : ''}`}>
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
                                                console.log("Started Uploading")
                                                setIsUploading(true);

                                                for (let i = 0; i < e.target.files.length; i++) {
                                                    const fd = new FormData();
                                                    fd.append('image', e.target.files[i]);

                                                    // Context Aware Album ID
                                                    if (uploadTargetAlbumId) {
                                                        fd.append('album_id', uploadTargetAlbumId);
                                                    } else {
                                                        // Global -> My Images
                                                        fd.append('use_default_album', 'true');
                                                    }

                                                    try {
                                                        const token = localStorage.getItem('token');
                                                        const res = await fetch('http://localhost:5000/api/upload', {
                                                            method: 'POST',
                                                            headers: { 'x-auth-token': token || '' },
                                                            body: fd
                                                        });

                                                        if (!res.ok) {
                                                            // Error handling
                                                            alert('Upload failed');
                                                            continue;
                                                        }
                                                    } catch (err) {
                                                        console.error('Upload network error', err);
                                                    }
                                                }
                                                setIsUploading(false);
                                                await refreshPhotos();
                                                if (isAlbumDetail) window.location.reload();
                                            }
                                        }}
                                    />
                                </label>
                            )}
                            <button
                                onClick={() => {
                                    // Ideally open modal, for now navigate
                                    window.location.href = '/albums';
                                    setIsAddMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
                                    <FolderPlus size={18} />
                                </div>
                                <div className="text-left">
                                    <span className="block font-medium">New Album</span>
                                    <span className="block text-xs text-gray-400">Create a collection</span>
                                </div>
                            </button>

                            <ProfileMenu />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
