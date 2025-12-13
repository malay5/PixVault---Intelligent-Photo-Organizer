"use client";

import { ClientLayout } from "@/components/ClientLayout";
import { PhotoGrid } from "@/components/PhotoGrid";
import { Archive } from "lucide-react";

export default function ArchivePage() {
    return (
        <div className="max-w-[1600px] mx-auto">
            <div className="px-6 py-6 flex items-center gap-4 border-b border-gray-100 mb-4 bg-white/50 backdrop-blur-sm sticky top-20 z-10">
                <div className="p-3 bg-green-50 rounded-full text-green-600">
                    <Archive size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-medium text-gray-800">Archive</h1>
                    <p className="text-sm text-gray-500">Photos you hid from the main view</p>
                </div>
            </div>

            <PhotoGrid filter="archive" />
        </div>
    );
}
