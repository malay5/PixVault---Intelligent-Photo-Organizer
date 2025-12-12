"use client";

import Image from "next/image";
import Link from "next/link";

const DUMMY_PEOPLE = [
    { id: 1, name: "Malay Damani", src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=3000&auto=format&fit=crop" },
    { id: 2, name: "Kiara advani", src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=3000&auto=format&fit=crop" },
    { id: 3, name: "Tejal", src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=3000&auto=format&fit=crop" },
    { id: 4, name: "Rajvi", src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=3000&auto=format&fit=crop" },
    { id: 5, name: "Kunjan", src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=3000&auto=format&fit=crop" },
    { id: 6, name: "Scarlet Witch", src: "https://images.unsplash.com/photo-1554151228-14d9def656ec?q=80&w=3000&auto=format&fit=crop" },
];

export function PeopleGrid() {
    return (
        <div>
            <h1 className="text-2xl font-normal text-gray-800 mb-6">People & Pets</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {DUMMY_PEOPLE.map((person) => (
                    <Link href={`/people/${person.id}`} key={person.id} className="group">
                        <div className="aspect-square relative rounded-2xl overflow-hidden mb-2">
                            <Image
                                src={person.src}
                                alt={person.name}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>
                        <p className="text-sm font-medium text-gray-700 group-hover:text-black text-center">
                            {person.name}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
