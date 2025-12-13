"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/utils/AuthContext";
import { useAlbum } from "@/utils/AlbumContext"; // Reuse types if possible
import Link from "next/link";
import { Users, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SharedAlbum {
    _id: string;
    name: string;
    cover_src?: string;
    owner_name: string;
    token: string;
    read_only_token?: string;
    accessed_by?: string[];
}

export default function SharedAlbumsPage() {
    const { isAuthenticated, user } = useAuth();
    const [albums, setAlbums] = useState<SharedAlbum[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
            fetchSharedAlbums();
        }
    }, [isAuthenticated]);

    const fetchSharedAlbums = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch('http://localhost:5000/api/albums/shared', {
                headers: { 'x-auth-token': token || '' }
            });
            if (res.ok) {
                const data = await res.json();
                setAlbums(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (albumId: string) => {
        if (!confirm("Remove this album from your 'Shared with me' list? You can access it again via the original link.")) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/albums/${albumId}/access`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token || '' }
            });
            if (res.ok) {
                setAlbums(prev => prev.filter(a => a._id !== albumId));
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-white dark:bg-[#09090b]">
            <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
    );

    return (
        <div className="min-h-screen bg-white dark:bg-[#09090b] text-gray-900 dark:text-white p-8 pl-80">
            <header className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    Shared with Me
                </h1>
                <p className="text-gray-500">Albums you've accessed from other users.</p>
            </header>

            {albums.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 opacity-50">
                    <Users size={64} className="mb-4" />
                    <p className="text-xl font-medium">No shared albums yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                        {albums.map(album => (
                            <motion.div
                                key={album._id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="group relative bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-gray-800"
                            >
                                <Link href={`/share/${album.token}`} className="block aspect-square relative overflow-hidden bg-gray-200 dark:bg-gray-800">
                                    {album.cover_src ? (
                                        <img src={album.cover_src} alt={album.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Users size={32} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                                </Link>

                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.preventDefault(); handleRemove(album._id); }}
                                        className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full backdrop-blur-sm transition-colors shadow-lg"
                                        title="Remove from list"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="p-4 relative">
                                    <h3 className="font-bold text-lg truncate mb-1">{album.name}</h3>
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                                        Host: {album.owner_name}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
