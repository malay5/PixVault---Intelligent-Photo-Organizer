"use client";

import Image from "next/image";
import Link from "next/link";

const DUMMY_ALBUMS = [
    { id: 1, name: "Family", count: 2537, src: "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=3000&auto=format&fit=crop" },
    { id: 2, name: "Trip to Goa", count: 142, src: "https://images.unsplash.com/photo-1520483602335-3b2d13493e62?q=80&w=3000&auto=format&fit=crop" },
    { id: 3, name: "Graduation", count: 50, src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=3000&auto=format&fit=crop" },
];

export function AlbumGrid() {
    return (
        <div>
            <h1 className="text-2xl font-normal text-gray-800 mb-6">Albums</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {DUMMY_ALBUMS.map((album) => (
                    <Link href={`/albums/${album.id}`} key={album.id} className="group block">
                        <div className="aspect-square relative rounded-xl overflow-hidden shadow-sm mb-3">
                            <Image
                                src={album.src}
                                alt={album.name}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900 leading-tight">{album.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">{album.count} items</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
