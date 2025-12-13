import React, { useState } from "react";
import { X, Trash2, FolderOutput, AlertTriangle } from "lucide-react";
import { useAlbum } from "@/utils/AlbumContext"; // Assuming useAlbum gives list of albums for 'Move' target
import { motion } from "framer-motion";

interface DeleteAlbumModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDelete: (strategy: 'delete_photos' | 'move_photos' | 'orphan_photos', targetAlbumId?: string) => Promise<void>;
    albumName: string;
}

export function DeleteAlbumModal({ isOpen, onClose, onDelete, albumName }: DeleteAlbumModalProps) {
    const { albums } = useAlbum();
    const [strategy, setStrategy] = useState<'orphan_photos' | 'delete_photos' | 'move_photos'>('orphan_photos');
    const [targetAlbumId, setTargetAlbumId] = useState<string>("");
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        await onDelete(strategy, targetAlbumId);
        setIsDeleting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-red-100 dark:border-red-900/30"
            >
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-red-50 dark:bg-red-900/10">
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                        <Trash2 size={24} />
                        <h2 className="text-xl font-bold">Delete Album</h2>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        You are about to delete <strong>"{albumName}"</strong>. <br />
                        What would you like to do with the photos inside?
                    </p>

                    <div className="space-y-3">
                        <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${strategy === 'orphan_photos' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                            <input type="radio" name="strategy" className="mt-1" checked={strategy === 'orphan_photos'} onChange={() => setStrategy('orphan_photos')} />
                            <div>
                                <span className="font-semibold block text-gray-900 dark:text-white">Keep photos</span>
                                <span className="text-sm text-gray-500">Photos will remain in your library ("All Photos") but won't belong to this album anymore.</span>
                            </div>
                        </label>

                        <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${strategy === 'delete_photos' ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-red-200'}`}>
                            <input type="radio" name="strategy" className="mt-1" checked={strategy === 'delete_photos'} onChange={() => setStrategy('delete_photos')} />
                            <div>
                                <span className="font-semibold block text-red-600 dark:text-red-400">Delete photos too</span>
                                <span className="text-sm text-gray-500">Photos exclusive to this album will be permanently deleted. Photos in other albums are safe.</span>
                            </div>
                        </label>

                        <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${strategy === 'move_photos' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-purple-200'}`}>
                            <input type="radio" name="strategy" className="mt-1" checked={strategy === 'move_photos'} onChange={() => setStrategy('move_photos')} />
                            <div className="w-full">
                                <span className="font-semibold block text-purple-600 dark:text-purple-400">Move photos to another album</span>
                                <span className="text-sm text-gray-500 mb-2 block">Select destination:</span>
                                {strategy === 'move_photos' && (
                                    <select
                                        className="w-full mt-2 p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600"
                                        value={targetAlbumId}
                                        onChange={(e) => setTargetAlbumId(e.target.value)}
                                    >
                                        <option value="">Select Album...</option>
                                        {albums.filter(a => a.name !== albumName && !a.is_shared).map(a => (
                                            <option key={a._id} value={a._id}>{a.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </label>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
                    <button onClick={onClose} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting || (strategy === 'move_photos' && !targetAlbumId)}
                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                        {isDeleting ? "Deleting..." : "Confirm Delete"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
