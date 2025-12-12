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
    };
    faces?: any[];
}

interface PhotoContextType {
    photos: Photo[];
    refreshPhotos: (status?: string) => Promise<void>;
    movePhotos: (ids: string[], destination: 'active' | 'trash' | 'archive') => Promise<void>;
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

    // Initial fetch of active photos
    useEffect(() => {
        if (isAuthenticated) {
            refreshPhotos('active');
        }
    }, [isAuthenticated, refreshPhotos]);

    const movePhotos = async (ids: string[], destination: 'active' | 'trash' | 'archive') => {
        // Optimistic Update
        setPhotos(prev => prev.filter(p => !ids.includes(p._id)));

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
            // Success - no need to do anything else as optimistic update removed them from current view
            console.log(`Moved ${ids.length} photos to ${destination}`);
        } catch (err) {
            console.error("Failed to move photos", err);
            // Revert optimistic update? (Complex without extensive state history)
            // For now, just refresh
            refreshPhotos('active');
        }
    };

    return (
        <PhotoContext.Provider value={{ photos, refreshPhotos, movePhotos, loading }}>
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
