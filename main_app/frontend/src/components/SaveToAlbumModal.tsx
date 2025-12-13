import React, { useState, useEffect } from "react";
import { X, Plus, Folder } from "lucide-react";
import { useAlbum } from "@/utils/AlbumContext";
import { motion, AnimatePresence } from "framer-motion";

interface SaveToAlbumModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (targetAlbumId: string | null, newAlbumName: string | null) => Promise<void>;
    selectedCount: number;
}

export function SaveToAlbumModal({ isOpen, onClose, onSave, selectedCount }: SaveToAlbumModalProps) {
    const { albums } = useAlbum();
    const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newAlbumName, setNewAlbumName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(isCreatingNew ? null : selectedAlbumId, isCreatingNew ? newAlbumName : null);
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Save {selectedCount} Photos
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {!isCreatingNew ? (
                        <div className="space-y-3">
                            <button
                                onClick={() => setIsCreatingNew(true)}
                                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-gray-500 hover:text-blue-600"
                            >
                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                                    <Plus size={20} />
                                </div>
                                <span className="font-semibold">Create New Album</span>
                            </button>

                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider ml-1">Your Albums</h3>
                                {albums.filter(a => !a.is_shared).map(album => (
                                    <button
                                        key={album._id}
                                        onClick={() => setSelectedAlbumId(album._id)}
                                        className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${selectedAlbumId === album._id
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                                                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                                            }`}
                                    >
                                        <div className={`p-2 rounded-lg ${selectedAlbumId === album._id ? "bg-white/20" : "bg-blue-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400"}`}>
                                            <Folder size={20} />
                                        </div>
                                        <span className="font-medium truncate">{album.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <button onClick={() => setIsCreatingNew(false)} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-2">
                                ← Back to list
                            </button>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">New Album Name</label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Summer Vacation"
                                    value={newAlbumName}
                                    onChange={e => setNewAlbumName(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
                    <button onClick={onClose} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || (!isCreatingNew && !selectedAlbumId) || (isCreatingNew && !newAlbumName)}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                        {isSaving ? "Saving..." : "Save to Library"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
