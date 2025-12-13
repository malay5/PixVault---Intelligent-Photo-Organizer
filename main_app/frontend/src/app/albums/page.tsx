"use client";

import { useAlbum } from "@/utils/AlbumContext";
import { Plus, Folder } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AlbumsPage() {
    const { albums, createAlbum, loading } = useAlbum();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newAlbumName, setNewAlbumName] = useState("");
    const [newAlbumDesc, setNewAlbumDesc] = useState("");

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAlbumName.trim()) return;
        await createAlbum(newAlbumName, newAlbumDesc);
        setIsModalOpen(false);
        setNewAlbumName("");
        setNewAlbumDesc("");
    };

    if (loading) return <div className="p-10 text-center animate-pulse">Loading albums...</div>;

    return (
        <div className="max-w-[1600px] mx-auto min-h-screen pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-[#fafafa]/90 dark:bg-[#09090b]/90 backdrop-blur-md z-10 py-4 px-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Albums</h1>
                    <p className="text-gray-500 text-sm mt-1">Organize and share your memories</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                    <Plus size={18} />
                    <span>Create Album</span>
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 px-2">
                {/* Create New Card (Visual Shortcut) */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                >
                    <div className="p-4 rounded-full bg-gray-50 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-800 transition-colors">
                        <Plus size={32} />
                    </div>
                    <span className="mt-3 font-medium">New Album</span>
                </button>

                {albums.map((album) => (
                    <Link
                        key={album._id}
                        href={`/albums/${album._id}`}
                        className="group relative aspect-square"
                    >
                        <div className="w-full h-full rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 shadow-sm group-hover:shadow-xl transition-all duration-300 relative border border-gray-100 dark:border-gray-800">
                            {/* Cover Photo */}
                            {album.cover_src ? (
                                <img
                                    src={album.cover_src}
                                    alt={album.name}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                                    <Folder size={64} />
                                </div>
                            )}

                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                            <div className="absolute bottom-0 left-0 p-4 w-full">
                                <h3 className="font-semibold text-white text-lg truncate">{album.name}</h3>
                                <p className="text-white/70 text-sm truncate">{album.description || "No description"}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800"
                        >
                            <h2 className="text-xl font-bold mb-4">Create New Album</h2>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Album Name</label>
                                    <input
                                        type="text"
                                        value={newAlbumName}
                                        onChange={(e) => setNewAlbumName(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g., Summer Trip 2024"
                                        autoFocus
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
                                    <textarea
                                        value={newAlbumDesc}
                                        onChange={(e) => setNewAlbumDesc(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Add a few details..."
                                        rows={3}
                                    />
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                    >
                                        Create Album
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
