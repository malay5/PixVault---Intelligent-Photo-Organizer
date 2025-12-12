"use client";

import { useAuth } from "@/utils/AuthContext";
import { Cloud, CheckCircle2, Moon, HelpCircle, LogOut } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

export function ProfileMenu() {
    const { logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Mock Usage Data
    const usedSpace = 2.1; // GB
    const totalSpace = 15; // GB
    const percentUsed = (usedSpace / totalSpace) * 100;

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="h-9 w-9 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium shadow-sm active:scale-95 transition-transform"
                title="Google Account"
            >
                JD
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-[340px] bg-white rounded-[28px] shadow-2xl border border-gray-100 overflow-hidden z-50 origin-top-right p-2"
                        style={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 25px -1px rgba(0, 0, 0, 0.15)" }}
                    >
                        {/* Compact Header: Horizontal Layout */}
                        <div className="flex items-center gap-4 px-4 py-2 mb-2">
                            <div className="h-10 w-10 bg-purple-600 rounded-full flex items-center justify-center text-white text-base font-bold shrink-0">
                                JD
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-gray-900 font-medium text-sm truncate">John Doe</span>
                                <span className="text-gray-500 text-xs truncate">john.doe@example.com</span>
                                <Link
                                    href="/settings"
                                    className="text-blue-600 text-xs mt-0.5 font-medium hover:text-blue-700 w-fit"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Manage your Google Account
                                </Link>
                            </div>
                        </div>

                        <div className="bg-[#f8f9fa] rounded-[20px] px-4 py-3 mb-1">
                            {/* Storage Section - No inner border/box */}
                            <div className="flex items-start gap-3 mb-3">
                                <div className="mt-0.5 text-blue-600">
                                    <Cloud size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-sm font-medium text-gray-800">Account storage</span>
                                        <span className="text-xs text-gray-500">{usedSpace} GB used</span>
                                    </div>
                                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden w-full mb-2">
                                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${percentUsed}%` }} />
                                    </div>
                                    <div className="flex space-x-2">
                                        <button className="text-xs font-medium text-blue-600 border border-gray-300 rounded px-2 py-1 hover:bg-blue-50">
                                            Get more storage
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Backup Status - Integrated */}
                            <div className="flex items-start gap-3 mt-3 pt-3 border-t border-gray-200/60">
                                <div className="text-green-600">
                                    <CheckCircle2 size={20} />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-800">Backup is on</div>
                                    <div className="text-xs text-gray-500">Your photos are safe</div>
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="flex flex-col mt-2">
                            {/* Dark Mode - Just a row now */}
                            <button className="flex items-center gap-4 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left" onClick={() => alert("Dark mode toggle")}>
                                <Moon size={20} className="text-gray-500" />
                                <span>Dark theme: Off</span>
                            </button>

                            <button className="flex items-center gap-4 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left">
                                <HelpCircle size={20} className="text-gray-500" />
                                <span>Help & Feedback</span>
                            </button>

                            <div className="border-t border-gray-100 my-1"></div>

                            <button onClick={logout} className="flex items-center gap-4 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left">
                                <LogOut size={20} className="text-gray-500" />
                                <span>Sign out</span>
                            </button>
                        </div>

                        <div className="py-2 text-center">
                            <span className="text-[10px] text-gray-400">Privacy • Terms • Policy</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
