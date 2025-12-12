"use client";

import { ClientLayout } from "@/components/ClientLayout";
import { PhotoGrid } from "@/components/PhotoGrid";
import { Trash2 } from "lucide-react";

export default function TrashPage() {
    return (
        <ClientLayout>
            <div className="max-w-[1600px] mx-auto">
                <div className="px-6 py-6 flex items-center gap-4 border-b border-gray-100 mb-4 bg-white/50 backdrop-blur-sm sticky top-20 z-10">
                    <div className="p-3 bg-red-50 rounded-full text-red-600">
                        <Trash2 size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-medium text-gray-800">Trash</h1>
                        <p className="text-sm text-gray-500">Items will be permanently deleted after 60 days</p>
                    </div>
                </div>

                <PhotoGrid filter="trash" />
            </div>
        </ClientLayout>
    );
}
