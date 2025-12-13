"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/utils/AuthContext";
import { Photo } from "./PhotoContext";

export interface Album {
    _id: string;
    name: string;
    description?: string;
    created_at: string;
    is_shared: boolean;
    token?: string;
    party_mode?: boolean;
    allow_guest_uploads?: boolean;
    cover_photo_id?: string;
    cover_src?: string;
}

interface AlbumContextType {
    albums: Album[];
    loading: boolean;
    refreshAlbums: () => Promise<void>;
    createAlbum: (name: string, description?: string) => Promise<Album | null>;
    enableSharing: (id: string, options: { party_mode: boolean; allow_guest_uploads: boolean }) => Promise<Album | null>;
    getShareInfo: (token: string) => Promise<{ album: any; photos: Photo[] } | null>;
    guestUpload: (token: string, file: File, name: string, email: string) => Promise<boolean>;
}

const AlbumContext = createContext<AlbumContextType | undefined>(undefined);

export function AlbumProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(false);

    const refreshAlbums = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch('http://localhost:5000/api/albums', {
                headers: { 'x-auth-token': token || '' }
            });
            const data = await res.json();
            setAlbums(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) refreshAlbums();
    }, [isAuthenticated, refreshAlbums]);

    const createAlbum = async (name: string, description?: string) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch('http://localhost:5000/api/albums', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token || ''
                },
                body: JSON.stringify({ name, description })
            });
            const newAlbum = await res.json();
            setAlbums(prev => [newAlbum, ...prev]);
            return newAlbum;
        } catch (err) {
            console.error(err);
            return null;
        }
    };

    const enableSharing = async (id: string, options: { party_mode: boolean; allow_guest_uploads: boolean }) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/albums/${id}/share`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token || ''
                },
                body: JSON.stringify(options)
            });
            const updated = await res.json();
            setAlbums(prev => prev.map(a => a._id === id ? updated : a));
            return updated;
        } catch (err) {
            console.error(err);
            return null;
        }
    };

    // Public (No Auth Token needed usually, but here we run it client side)
    const getShareInfo = async (token: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/albums/share/${token}`);
            if (!res.ok) return null;
            const data = await res.json();
            return {
                album: {
                    title: data.title,
                    description: data.description,
                    party_mode: data.party_mode,
                    allow_guest_uploads: data.allow_guest_uploads,
                    owner_id: data.owner_id,
                    owner_name: data.owner_name,
                    created_at: data.created_at,
                    cover_src: data.cover_src,
                    user_id: data.user_id,
                    // New fields
                    token: data.token,
                    is_read_only: data.is_read_only,
                    read_only_token: data.read_only_token
                },
                photos: data.photos.map((p: any) => ({
                    ...p,
                    id: p._id,
                    src: `http://localhost:5000/${p.file_path.replace(/\\/g, '/')}`
                }))
            };
        } catch (err) {
            console.error(err);
            return null;
        }
    };

    const guestUpload = async (token: string, file: File, name: string, email: string) => {
        try {
            const fd = new FormData();
            fd.append('image', file);
            fd.append('guest_name', name);
            fd.append('guest_email', email);

            const res = await fetch(`http://localhost:5000/api/albums/share/${token}/upload`, {
                method: 'POST',
                body: fd
            });
            return res.ok;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    return (
        <AlbumContext.Provider value={{ albums, loading, refreshAlbums, createAlbum, enableSharing, getShareInfo, guestUpload }}>
            {children}
        </AlbumContext.Provider>
    );
}

export function useAlbum() {
    const context = useContext(AlbumContext);
    if (context === undefined) {
        throw new Error("useAlbum must be used within an AlbumProvider");
    }
    return context;
}
