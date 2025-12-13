"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAlbum, Album } from "@/utils/AlbumContext";
import { Photo } from "@/utils/PhotoContext";
import { PhotoGrid } from "@/components/PhotoGrid";
import { DeleteAlbumModal } from "@/components/DeleteAlbumModal";
import { ArrowLeft, Share2, MoreVertical, Users, UploadCloud, Settings, Copy, Check, Edit2, Image as ImageIcon, Trash2 } from "lucide-react";


import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

export default function AlbumDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [album, setAlbum] = useState<Album | null>(null);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleDeleteAlbum = async (strategy: 'delete_photos' | 'move_photos' | 'orphan_photos', targetAlbumId?: string) => {
        try {
            const token = localStorage.getItem("token");
            let url = `http://localhost:5000/api/albums/${id}`;
            const params = new URLSearchParams();

            if (strategy === 'delete_photos') params.append('delete_photos', 'true');
            if (strategy === 'move_photos' && targetAlbumId) params.append('move_to_album_id', targetAlbumId);

            if (params.toString()) url += `?${params.toString()}`;

            const res = await fetch(url, {
                method: 'DELETE',
                headers: { 'x-auth-token': token || '' }
            });

            if (res.ok) {
                router.push('/albums');
            } else {
                alert("Failed to delete album");
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Share State
    const [partyMode, setPartyMode] = useState(false);
    const [allowGuestUploads, setAllowGuestUploads] = useState(false);
    const { enableSharing } = useAlbum();
    const [copied, setCopied] = useState(false);

    // Edit State
    const [editName, setEditName] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [editCoverFile, setEditCoverFile] = useState<File | null>(null);

    const fetchDetails = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/albums/${id}`, {
                headers: { 'x-auth-token': token || '' }
            });
            if (res.ok) {
                const data = await res.json();
                setAlbum(data.album);
                setPhotos(data.photos.map((p: any) => ({
                    ...p,
                    id: p._id,
                    src: `http://localhost:5000/${p.file_path.replace(/\\/g, '/')}`
                })));

                // Init local state
                setPartyMode(data.album.party_mode || false);
                setAllowGuestUploads(data.album.allow_guest_uploads || false);

                // Init edit state
                setEditName(data.album.name);
                setEditDesc(data.album.description || "");
            } else {
                router.push('/albums');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id, router]);

    const handleSaveShareSettings = async () => {
        if (!album) return;
        const updated = await enableSharing(album._id, { party_mode: partyMode, allow_guest_uploads: allowGuestUploads });
        if (updated) setAlbum(updated);
    };

    const handleUpdateAlbum = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            let coverPhotoId = album?.cover_photo_id;

            // Upload cover if changed
            if (editCoverFile) {
                const fd = new FormData();
                fd.append('image', editCoverFile);
                fd.append('album_id', id); // Logic: Cover is part of album photos usually? Or separate? 
                // User said "add a image... or use first". Let's just upload it as a picture and use it.

                const upRes = await fetch('http://localhost:5000/api/upload', {
                    method: 'POST',
                    headers: { 'x-auth-token': token || '' },
                    body: fd
                });
                if (upRes.ok) {
                    const upData = await upRes.json();
                    coverPhotoId = upData.picture._id;
                }
            }

            const res = await fetch(`http://localhost:5000/api/albums/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token || ''
                },
                body: JSON.stringify({
                    name: editName,
                    description: editDesc,
                    cover_photo_id: coverPhotoId
                })
            });

            if (res.ok) {
                const updated = await res.json();
                setAlbum(prev => ({ ...prev!, name: updated.name, description: updated.description, cover_photo_id: updated.cover_photo_id }));
                setIsEditModalOpen(false);
                setEditCoverFile(null);
                fetchDetails(); // Refresh photos if new cover uploaded
            }
        } catch (err) {
            console.error("Update failed", err);
        }
    };

    const copyLink = () => {
        if (!album?.token) return;
        const link = `${window.location.origin}/share/${album.token}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return <div className="p-10 text-center animate-pulse">Loading album...</div>;
    if (!album) return null;

    return (
        <div className="max-w-[1600px] mx-auto min-h-screen pb-20">
            {/* Header */}
            <div className="sticky top-0 bg-[#fafafa]/90 dark:bg-[#09090b]/90 backdrop-blur-md z-10 px-2 transition-colors">
                <div className="py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                {album.name}
                                {album.party_mode && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-medium">Party Mode</span>}
                            </h1>
                            <p className="text-gray-500 text-sm">{photos.length} photos • {album.description || "No description"}</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {album.name !== "My Images" && (
                            <button
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="p-2 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 rounded-lg text-gray-500 transition-colors"
                                title="Delete Album"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500"
                            title="Edit Album"
                        >
                            <Edit2 size={20} />
                        </button>
                        <button
                            onClick={() => setIsShareModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                        >
                            <Share2 size={16} className={album.is_shared ? "text-blue-500" : ""} />
                            {album.is_shared ? "Shared" : "Share"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="mt-6 px-2">
                {photos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50">
                        <Users size={48} className="mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Empty Album</h3>
                        <p className="max-w-xs text-center mt-2">Add photos to start building this album or enable Party Mode to let guests contribute.</p>
                        <label className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 font-medium text-sm flex items-center gap-2 cursor-pointer transition-colors">
                            <UploadCloud size={16} />
                            Add Photos
                            <input
                                type="file"
                                className="hidden"
                                multiple
                                accept="image/*"
                                onChange={async (e) => {
                                    if (!e.target.files?.length) return;
                                    const files = Array.from(e.target.files);

                                    for (const file of files) {
                                        const fd = new FormData();
                                        fd.append('image', file);
                                        fd.append('album_id', id);

                                        try {
                                            const token = localStorage.getItem('token');
                                            await fetch('http://localhost:5000/api/upload', {
                                                method: 'POST',
                                                headers: { 'x-auth-token': token || '' },
                                                body: fd
                                            });
                                        } catch (err) {
                                            console.error("Upload failed", err);
                                        }
                                    }
                                    fetchDetails();
                                }}
                            />
                        </label>
                    </div>
                ) : (
                    <PhotoGrid photos={photos} />
                )}
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800"
                        >
                            <h2 className="text-xl font-bold mb-4">Edit Album Details</h2>
                            <form onSubmit={handleUpdateAlbum} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Album Name</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                    <textarea
                                        value={editDesc}
                                        onChange={(e) => setEditDesc(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Photo (Optional)</label>
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                                            {editCoverFile ? (
                                                <img src={URL.createObjectURL(editCoverFile)} className="w-full h-full object-cover" alt="Cover Preview" />
                                            ) : (
                                                <ImageIcon size={24} className="text-gray-400" />
                                            )}
                                        </div>
                                        <label className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm font-medium rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                            Choose New
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setEditCoverFile(e.target.files[0])} />
                                        </label>
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Share Modal */}
            <AnimatePresence>
                {isShareModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Share2 size={20} className="text-blue-600" />
                                    Share Album
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">Manage access and collaboration</p>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Party Mode Toggle */}
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                        <Users size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-medium">Party Mode</h3>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={partyMode} onChange={(e) => setPartyMode(e.target.checked)} />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-500">Allow guests to view and upload photos in real-time.</p>
                                    </div>
                                </div>

                                {/* Guest Upload Toggle */}
                                <div className={clsx("flex items-start gap-4 transition-opacity", !partyMode && "opacity-50 pointer-events-none")}>
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <UploadCloud size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-medium">Guest Uploads</h3>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={allowGuestUploads} onChange={(e) => setAllowGuestUploads(e.target.checked)} />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-500">Guests can add photos to this album (uses your storage).</p>
                                    </div>
                                </div>

                                {/* Link Section */}
                                {album.token && (
                                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Public Link</label>
                                        <div className="flex gap-2">
                                            <input
                                                readOnly
                                                value={`${window.location.origin}/share/${album.token}`}
                                                className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 focus:outline-none"
                                            />
                                            <button
                                                onClick={copyLink}
                                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                            >
                                                {copied ? <Check size={18} /> : <Copy size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                                <button onClick={() => setIsShareModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 font-medium text-sm hover:underline">Cancel</button>
                                <button
                                    onClick={() => {
                                        handleSaveShareSettings();
                                        if (album.token) setIsShareModalOpen(false);
                                    }}
                                    className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium text-sm hover:opacity-90 transition-opacity"
                                >
                                    {album.token ? "Update Settings" : "Generate Link"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <DeleteAlbumModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onDelete={handleDeleteAlbum}
                albumName={album.name}
            />
        </div>
    );
}
