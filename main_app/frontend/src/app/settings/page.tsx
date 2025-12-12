"use client";

import { useAuth } from "@/utils/AuthContext";
import {
    Moon,
    HardDrive,
    Download,
    Trash2,
    LogOut,
    ChevronRight,
    Shield
} from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
    const { logout } = useAuth();
    const [darkMode, setDarkMode] = useState(false);

    // Mock usage data
    const usedSpace = 1.2; // GB
    const totalSpace = 15; // GB
    const usagePercentage = (usedSpace / totalSpace) * 100;

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

            <div className="space-y-6">

                {/* Storage Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <HardDrive size={24} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900">Storage</h2>
                            <p className="text-sm text-gray-500">View and manage your storage</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span className="text-gray-700">{usedSpace} GB used</span>
                            <span className="text-gray-500">{totalSpace} GB total</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                style={{ width: `${usagePercentage}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            High quality storage (Unlimited for Pixel 5 and earlier)
                        </p>
                    </div>

                    <button className="mt-6 w-full py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        Buy storage
                    </button>
                </div>

                {/* Preferences */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setDarkMode(!darkMode)}>
                        <div className="flex items-center gap-3">
                            <Moon size={20} className="text-gray-500" />
                            <span className="font-medium text-gray-700">Dark Mode</span>
                        </div>
                        <div className={`w-11 h-6 rounded-full relative transition-colors ${darkMode ? 'bg-blue-600' : 'bg-gray-200'}`}>
                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${darkMode ? 'translate-x-5' : ''}`} />
                        </div>
                    </div>

                    <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                            <Shield size={20} className="text-gray-500" />
                            <span className="font-medium text-gray-700">Partner Sharing</span>
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                    </div>
                </div>

                {/* Data & Privacy */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <Download size={20} className="text-gray-500 group-hover:text-gray-900" />
                            <span className="font-medium text-gray-700">Export your data</span>
                        </div>
                    </div>

                    <div className="p-4 hover:bg-red-50 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <Trash2 size={20} className="text-red-500" />
                            <span className="font-medium text-red-600">Delete Account</span>
                        </div>
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 p-4 bg-white rounded-xl border border-gray-200 shadow-sm text-red-600 font-medium hover:bg-red-50 transition-colors"
                >
                    <LogOut size={20} />
                    Sign out
                </button>

                <p className="text-center text-xs text-gray-400 pt-4">
                    PixelVault v1.0.0
                </p>
            </div>
        </div>
    );
}
