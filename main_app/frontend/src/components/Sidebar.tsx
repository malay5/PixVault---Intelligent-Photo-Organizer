"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
    Image as ImageIcon,
    Users,
    FolderOpen,
    Settings,
    Menu,
    ChevronLeft,
    Heart,
    Archive,
    Clock,
    Trash2
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const navItems = [
    { name: "Photos", href: "/", icon: ImageIcon },
    { name: "People & Pets", href: "/people", icon: Users },
    { name: "Albums", href: "/albums", icon: FolderOpen },
    { name: "Favorites", href: "/favorites", icon: Heart },
    { name: "Archive", href: "/archive", icon: Archive },
    { name: "Trash", href: "/trash", icon: Trash2 },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Auto-expand on hover if collapsed
    const isExpanded = !isCollapsed || isHovered;

    return (
        <div
            className={clsx(
                "flex flex-col h-screen bg-white dark:bg-[#18181b] dark:border-r dark:border-gray-800 transition-all duration-300 ease-in-out z-20 sticky top-0 py-2",
                isExpanded ? "w-64" : "w-20" // Slightly wider collapsed
            )}
            onMouseEnter={() => matchMedia("(min-width: 768px)").matches && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header / Logo Area */}
            <div className="flex items-center justify-between px-6 h-16 mb-2">
                {isExpanded ? (
                    <span className="text-xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
                        PixelVault
                    </span>
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600" />
                )}
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto">
                <ul className="space-y-0.5 pr-3"> {/* Padding right for the rounded effect */}
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={clsx(
                                        "flex items-center gap-4 px-6 py-3 rounded-r-full transition-all duration-200 group relative",
                                        isActive
                                            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-gray-200"
                                    )}
                                >
                                    <item.icon
                                        size={22}
                                        className={clsx(
                                            "transition-colors duration-200",
                                            isActive ? "text-blue-600 fill-blue-600/10 dark:text-blue-400 dark:fill-blue-400/10" : "text-gray-500 dark:text-gray-500",
                                            // Conditional hover colors logic (Only apply when NOT active)
                                            !isActive && item.name === "Favorites" && "group-hover:text-red-500",
                                            !isActive && item.name === "Albums" && "group-hover:text-yellow-500",
                                            !isActive && item.name === "People & Pets" && "group-hover:text-purple-500",
                                            !isActive && item.name === "Photos" && "group-hover:text-blue-500"
                                        )}
                                    />
                                    {isExpanded && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className={clsx("whitespace-nowrap font-medium text-[15px]", isActive ? "text-blue-700 dark:text-blue-300" : "")}
                                        >
                                            {item.name}
                                        </motion.span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 mt-auto">
                <Link
                    href="/settings"
                    className={clsx(
                        "flex items-center gap-4 px-6 py-3 rounded-r-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    )}
                >
                    <Settings size={22} />
                    {isExpanded && <span className="font-medium text-[15px]">Settings</span>}
                </Link>

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="mt-2 ml-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
                >
                    {isExpanded ? <ChevronLeft size={20} /> : <Menu size={20} />}
                </button>
            </div>
        </div>
    );
}
