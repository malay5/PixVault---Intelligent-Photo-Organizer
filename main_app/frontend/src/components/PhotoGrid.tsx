"use client";

import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Heart } from "lucide-react";
import { useMemo, useState } from "react";
import { useSelection } from "@/utils/SelectionContext";
import { usePhoto, Photo } from "@/utils/PhotoContext";
import { clsx } from "clsx";

// Helper to group by date
function groupPhotosByDate(photos: Photo[]) {
    const groups: { date: string; photos: Photo[] }[] = [];
    photos.forEach(photo => {
        const dateObj = photo.upload_date ? new Date(photo.upload_date) : new Date();
        const dateStr = dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

        let group = groups.find(g => g.date === dateStr);
        if (!group) {
            group = { date: dateStr, photos: [] };
            groups.push(group);
        }
        group.photos.push(photo);
    });
    return groups;
}

function computeLayout(photos: Photo[], targetRowHeight: number, containerWidth: number) {
    const layout = [];
    let currentRow: Photo[] = [];
    let currentRowWidth = 0;

    for (const photo of photos) {
        // Default aspect ratio if missing
        const width = photo.metadata?.width || 800;
        const height = photo.metadata?.height || 600;
        const aspectRatio = width / height;
        const scaledWidth = targetRowHeight * aspectRatio;

        if (currentRowWidth + scaledWidth > containerWidth * 1.05 && currentRow.length > 0) {
            layout.push({ photos: currentRow, rowHeight: targetRowHeight * (containerWidth / currentRowWidth) });
            currentRow = [];
            currentRowWidth = 0;
        }

        currentRow.push(photo);
        currentRowWidth += scaledWidth;
    }

    if (currentRow.length > 0) {
        layout.push({ photos: currentRow, rowHeight: targetRowHeight });
    }

    return layout;
}

interface PhotoGridProps {
    filter?: 'active' | 'trash' | 'archive';
}

export function PhotoGrid({ filter = 'active' }: PhotoGridProps) {
    const { isSelected, toggleSelection, selectRange, selectedIds } = useSelection();
    const { photos, loading } = usePhoto();
    const [lastClickedId, setLastClickedId] = useState<string | null>(null);

    const containerWidth = 960; // Should be dynamic using ResizeObserver in real app
    const targetRowHeight = 220;

    const filteredPhotos = useMemo(() => {
        return photos.filter(p => (p.status || 'active') === filter);
    }, [photos, filter]);

    const groups = useMemo(() => groupPhotosByDate(filteredPhotos), [filteredPhotos]);

    const handlePhotoClick = (e: React.MouseEvent, photoId: string) => {
        if (e.shiftKey && lastClickedId !== null) {
            e.preventDefault();
            const startIdx = filteredPhotos.findIndex(p => p._id === lastClickedId);
            const endIdx = filteredPhotos.findIndex(p => p._id === photoId);

            if (startIdx !== -1 && endIdx !== -1) {
                const min = Math.min(startIdx, endIdx);
                const max = Math.max(startIdx, endIdx);
                const rangeIds = filteredPhotos.slice(min, max + 1).map(p => p._id);
                selectRange(rangeIds);
            }
        } else if (e.metaKey || e.ctrlKey || selectedIds.size > 0) {
            e.preventDefault();
            toggleSelection(photoId);
            setLastClickedId(photoId);
        } else {
            setLastClickedId(photoId);
        }
    };

    if (loading) {
        return <div className="p-10 text-center text-gray-500 animate-pulse">Loading your vault...</div>;
    }

    if (filteredPhotos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                <div className="text-xl font-medium mb-2">No photos here</div>
                <div className="text-sm">
                    {filter === 'active' ? "Upload photos to fill your timeline" : `No items in ${filter}`}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-8 pb-32">
            {groups.map((group) => {
                const rows = computeLayout(group.photos, targetRowHeight, containerWidth);

                return (
                    <div key={group.date}>
                        <h2 className="sticky top-16 z-10 py-4 bg-[#fafafa]/95 backdrop-blur-sm text-sm font-semibold text-gray-600 uppercase tracking-widest border-b border-transparent transition-all">
                            {group.date}
                        </h2>

                        <div className="flex flex-col gap-1">
                            {rows.map((row, rowIndex) => (
                                <div key={rowIndex} className="flex gap-1" style={{ height: row.rowHeight }}>
                                    {row.photos.map((photo) => {
                                        const selected = isSelected(photo._id);
                                        const width = photo.metadata?.width || 800;
                                        const height = photo.metadata?.height || 600;

                                        return (
                                            <Link
                                                key={photo._id}
                                                href={selected ? "#" : `/photos/${photo._id}`}
                                                onClick={(e) => {
                                                    if (selected || selectedIds.size > 0 || e.shiftKey || e.ctrlKey || e.metaKey) {
                                                        e.preventDefault();
                                                        handlePhotoClick(e, photo._id);
                                                    }
                                                }}
                                                className={clsx(
                                                    "relative group overflow-hidden block transition-transform duration-200",
                                                    selected ? "scale-95 ring-4 ring-blue-500 rounded-lg z-0" : ""
                                                )}
                                                style={{
                                                    width: (row.rowHeight * (width / height)),
                                                    flexGrow: (width / height)
                                                }}
                                            >
                                                <div className="relative w-full h-full">
                                                    <Image
                                                        src={photo.src || "/placeholder.jpg"}
                                                        alt={`Photo ${photo.original_name}`}
                                                        fill
                                                        className={clsx(
                                                            "object-cover transition-all duration-300",
                                                            selected ? "brightness-75" : "group-hover:brightness-90"
                                                        )}
                                                    />
                                                    <div className={clsx(
                                                        "absolute inset-0 transition-colors",
                                                        selected ? "bg-blue-500/20" : "bg-black/0 group-hover:bg-black/10"
                                                    )} />
                                                    <button
                                                        className={clsx(
                                                            "absolute top-2 left-2 p-1 transition-all duration-200 hover:scale-110",
                                                            selected ? "opacity-100 text-blue-500" : "opacity-0 group-hover:opacity-100 text-white"
                                                        )}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            toggleSelection(photo._id);
                                                            setLastClickedId(photo._id);
                                                        }}
                                                    >
                                                        {selected ? (
                                                            <div className="bg-white rounded-full">
                                                                <CheckCircle2 size={24} className="text-blue-600 fill-white" />
                                                            </div>
                                                        ) : (
                                                            <CheckCircle2 size={24} className="drop-shadow-md text-gray-200 hover:text-white" />
                                                        )}
                                                    </button>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
