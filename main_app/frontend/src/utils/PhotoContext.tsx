"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/utils/AuthContext";

export interface Photo {
    _id: string; // MongoDB ID
    id?: number; // Legacy/Mock ID support if needed, but prefer _id
    src?: string; // Legacy
    file_path: string; // Backend path
    original_name: string;
    upload_date?: string;
    status: 'active' | 'trash' | 'archive';
    metadata?: {
        width?: number;
        height?: number;
        size?: number;
        camera_model?: string;
        software?: string;
    };
    faces?: any[];
    is_ai?: boolean;
    is_favorite?: boolean;
}

interface PhotoContextType {
    photos: Photo[];
    refreshPhotos: (status?: string) => Promise<void>;
    movePhotos: (ids: string[], destination: 'active' | 'trash' | 'archive' | 'delete_permanent') => Promise<void>;
    toggleFavorite: (id: string) => Promise<void>;
    loading: boolean;
}

const PhotoContext = createContext<PhotoContextType | undefined>(undefined);

export function PhotoProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch photos based on current view/filter? 
    // Actually, might be better to fetch ALL or fetch by page.
    // For now, let's assume we fetch based on the "current need" or just fetch all?
    // If we want to separate Trash/Archive pages, they should probably request their own data 
    // OR we store everything here. Storing everything is easier for "undo" but less scalable.
    // Let's implement a fetch that defaults to 'active' but can be overridden.

    // Actually, simpler: The Context *exposes* the API actions, but maybe the *Pages* trigger the fetch?
    // Or, we keep a "global active feed" here. 
    // Let's keep it simple: This context manages the "Main Feed" (active) primarily, 
    // but the `movePhotos` action is global.

    const refreshPhotos = useCallback(async (status: string = 'active') => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/photos?status=${status}`, {
                headers: { 'x-auth-token': token || '' }
            });
            const data = await res.json();
            // Map backend data to frontend structure if needed
            // Backend returns _id. Frontend grid used `id`. Let's normalize.
            const mapped = data.map((p: any) => ({
                ...p,
                id: p._id, // Use _id as key
                src: `http://localhost:5000/${p.file_path.replace(/\\/g, '/')}` // Fix path for display
            }));
            setPhotos(mapped);
        } catch (err) {
            console.error("Failed to fetch photos", err);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Initial fetch of ALL photos so we can filter locally
    useEffect(() => {
        if (isAuthenticated) {
            refreshPhotos('all');
        }
    }, [isAuthenticated, refreshPhotos]);

    const movePhotos = async (ids: string[], destination: 'active' | 'trash' | 'archive' | 'delete_permanent') => {
        // Optimistic Update: Update status instead of removing
        setPhotos(prev => {
            if (destination === 'delete_permanent') {
                return prev.filter(p => !ids.includes(p._id));
            }
            return prev.map(p =>
                ids.includes(p._id) ? { ...p, status: destination } : p
            );
        });

        try {
            const token = localStorage.getItem("token");
            await fetch('http://localhost:5000/api/photos/status', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token || ''
                },
                body: JSON.stringify({ photoIds: ids, status: destination })
            });
            console.log(`Moved ${ids.length} photos to ${destination}`);
        } catch (err) {
            console.error("Failed to move photos", err);
            // Revert: Refresh to get true state
            refreshPhotos('all');
        }
    };

    const toggleFavorite = async (id: string) => {
        // Optimistic Update
        setPhotos(prev => prev.map(p =>
            p._id === id ? { ...p, is_favorite: !p.is_favorite } : p
        ));

        try {
            const token = localStorage.getItem("token");
            await fetch(`http://localhost:5000/api/photos/${id}/favorite`, {
                method: 'PUT',
                headers: { 'x-auth-token': token || '' }
            });
        } catch (err) {
            console.error("Failed to toggle favorite", err);
            // Revert
            setPhotos(prev => prev.map(p =>
                p._id === id ? { ...p, is_favorite: !p.is_favorite } : p
            ));
        }
    };

    return (
        <PhotoContext.Provider value={{ photos, refreshPhotos, movePhotos, toggleFavorite, loading }}>
            {children}
        </PhotoContext.Provider>
    );
}

export function usePhoto() {
    const context = useContext(PhotoContext);
    if (context === undefined) {
        throw new Error("usePhoto must be used within a PhotoProvider");
    }
    return context;
}
