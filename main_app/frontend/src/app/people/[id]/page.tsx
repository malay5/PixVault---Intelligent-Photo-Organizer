"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Check, Edit2, User } from "lucide-react";
import { PhotoGrid } from "@/components/PhotoGrid";

export default function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [person, setPerson] = useState<any>(null);
    const [photos, setPhotos] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState("");
    const [loading, setLoading] = useState(true);

    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                // Fetch Person Details
                const personRes = await fetch(`http://localhost:5000/api/people/${id}`, {
                    headers: { "x-auth-token": token }
                });

                if (personRes.ok) {
                    const data = await personRes.json();
                    setPerson(data);
                    setNewName(data.name);
                }

                // Fetch Photos for Person
                const photosRes = await fetch(`http://localhost:5000/api/photos?person_id=${id}`, {
                    headers: { "x-auth-token": token }
                });
                if (photosRes.ok) {
                    const rawPhotos = await photosRes.json();
                    const processedPhotos = rawPhotos.map((p: any) => ({
                        ...p,
                        src: p.file_path
                            ? `http://localhost:5000/${p.file_path.replace(/\\/g, '/')}`
                            : "/placeholder.jpg"
                    }));
                    setPhotos(processedPhotos);
                }

            } catch (error) {
                console.error("Failed to fetch person data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, token]);

    const handleRename = async () => {
        if (!newName.trim()) return;
        try {
            const res = await fetch(`http://localhost:5000/api/people/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-auth-token": token || ""
                },
                body: JSON.stringify({ name: newName })
            });

            if (res.ok) {
                const updated = await res.json();
                setPerson(updated);
                setIsEditing(false);
            }
        } catch (error) {
            alert("Failed to rename");
        }
    };

    if (loading) return <div className="p-10 text-white">Loading...</div>;
    if (!person) return <div className="p-10 text-white">Person not found</div>;

    let avatarSrc = person.thumbnail_url;
    if (avatarSrc) {
        if (avatarSrc.startsWith('/thumbnails')) {
            avatarSrc = `http://localhost:8000${avatarSrc}`;
        } else if (avatarSrc.startsWith('/uploads')) {
            avatarSrc = `http://localhost:5000${avatarSrc}`;
        }
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-8 pb-4 flex items-center gap-6 border-b border-gray-800 bg-gray-900/50">
                <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full text-white">
                    <ArrowLeft />
                </button>

                {/* Large Avatar */}
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 bg-gray-800">
                    {avatarSrc ? (
                        <Image src={avatarSrc} alt={person.name} fill className="object-cover" unoptimized />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <User size={32} />
                        </div>
                    )}
                </div>

                {/* Name & Stats */}
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <input
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="bg-gray-800 text-white text-3xl font-bold px-2 py-1 rounded outline-none border border-blue-500"
                                    autoFocus
                                />
                                <button onClick={handleRename} className="p-2 bg-blue-600 rounded hover:bg-blue-700 text-white">
                                    <Check size={20} />
                                </button>
                            </div>
                        ) : (
                            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                                {person.name}
                                <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-white transition-colors">
                                    <Edit2 size={20} />
                                </button>
                            </h1>
                        )}
                    </div>
                    <p className="text-gray-400 mt-1">{person.face_count} photos</p>
                </div>
            </div>

            {/* Photos Grid */}
            <div className="flex-1 overflow-hidden">
                <PhotoGrid photos={photos} />
            </div>
        </div>
    );
}
