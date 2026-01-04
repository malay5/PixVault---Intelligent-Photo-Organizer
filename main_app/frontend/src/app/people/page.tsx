"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ScanFace, User } from "lucide-react";
import clsx from "clsx";

export default function PeoplePage() {
    const router = useRouter();
    const [people, setPeople] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPeople = async () => {
            const token = localStorage.getItem("token");
            try {
                const res = await fetch("http://localhost:5000/api/people", {
                    headers: { "x-auth-token": token || "" }
                });
                if (res.ok) {
                    const data = await res.json();
                    setPeople(data);
                }
            } catch (error) {
                console.error("Failed to fetch people", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPeople();
    }, []);

    if (loading) return <div className="p-10 text-white">Loading People...</div>;

    return (
        <div className="p-8 h-full overflow-y-auto">
            <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <ScanFace className="text-blue-400" size={32} />
                People & Faces
            </h1>

            {people.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                    <p className="text-xl">No faces identified yet.</p>
                    <p className="text-sm mt-2">Upload photos with faces to see them here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
                    {people.map((person) => {
                        // Construct Avatar URL
                        // If it starts with /thumbnails, it's relative to ML service (localhost:8000)
                        // If it starts with /uploads, it's relative to Backend (localhost:5000)
                        let avatarSrc = person.thumbnail_url;
                        if (avatarSrc) {
                            if (avatarSrc.startsWith('/thumbnails')) {
                                avatarSrc = `http://localhost:8000${avatarSrc}`;
                            } else if (avatarSrc.startsWith('/uploads')) {
                                avatarSrc = `http://localhost:5000${avatarSrc}`;
                            }
                        }

                        return (
                            <div
                                key={person.person_id}
                                onClick={() => router.push(`/people/${person.person_id}`)}
                                className="group cursor-pointer flex flex-col items-center"
                            >
                                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-transparent group-hover:border-blue-500 transition-all bg-gray-800 shadow-lg">
                                    {avatarSrc ? (
                                        <Image
                                            src={avatarSrc}
                                            alt={person.name}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                            unoptimized // Since serving from localhost:8000
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                                            <User size={40} />
                                        </div>
                                    )}
                                </div>

                                <div className="mt-3 text-center">
                                    <h3 className={clsx("font-medium text-lg leading-tight group-hover:text-blue-400 transition-colors", person.name === "Unknown" ? "text-gray-400 italic" : "text-white")}>
                                        {person.name}
                                    </h3>
                                    <span className="text-xs text-gray-500 font-medium">
                                        {person.face_count} photos
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
