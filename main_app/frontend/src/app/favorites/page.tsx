"use client";

import Image from "next/image";
import { Heart } from "lucide-react";

// Reuse dummy data for now
const DUMMY_FAVORITES = [
    { id: 2, src: "https://images.unsplash.com/photo-1542038784424-48ed2d405328?q=80&w=2670&auto=format&fit=crop" },
    { id: 4, src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2670&auto=format&fit=crop" },
];

export default function FavoritesPage() {
    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-normal text-gray-800 mb-6">Favorites</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {DUMMY_FAVORITES.map((photo) => (
                    <div
                        key={photo.id}
                        className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer"
                    >
                        <Image
                            src={photo.src}
                            alt="Favorite"
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                            <button className="p-1.5 bg-white/90 rounded-full text-red-500 hover:bg-white">
                                <Heart size={16} fill="currentColor" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
