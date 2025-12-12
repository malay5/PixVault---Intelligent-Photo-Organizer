"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Image as ImageIcon, Search } from "lucide-react";

export function LandingPage() {
    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100">
            {/* Navigation */}
            <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    PixelVault
                </div>
                <div className="space-x-4">
                    <Link href="/login" className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-black transition-colors">
                        Log in
                    </Link>
                    <Link
                        href="/login" // Ideally signup
                        className="px-5 py-2.5 text-sm font-medium bg-black text-white rounded-full hover:bg-gray-800 transition-all hover:scale-105 active:scale-95"
                    >
                        Sign up
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    <div className="lg:w-1/2 space-y-8">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-6xl md:text-7xl font-bold tracking-tight leading-[1.1]"
                        >
                            Your memories,<br />
                            <span className="text-blue-600">securely</span> organized.
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-xl text-gray-500 max-w-lg leading-relaxed"
                        >
                            The privacy-first home for your photos. Automatic face recognition, smart albums, and zero cloud tracking.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="flex items-center gap-4"
                        >
                            <Link href="/login" className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-200">
                                Get Started <ArrowRight size={18} />
                            </Link>
                            <button className="px-8 py-4 text-gray-600 font-medium hover:bg-gray-50 rounded-full transition-colors">
                                Learn more
                            </button>
                        </motion.div>

                        <div className="pt-8 flex items-center gap-8 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <Shield className="text-green-500" size={18} />
                                <span>Encrypted Locally</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Search className="text-purple-500" size={18} />
                                <span>Smart Search</span>
                            </div>
                        </div>
                    </div>

                    {/* Hero Image/Graphic */}
                    <div className="lg:w-1/2 relative">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            className="relative z-10 grid grid-cols-2 gap-4"
                        >
                            <div className="space-y-4 translate-y-12">
                                <div className="aspect-[3/4] rounded-2xl bg-gray-100 overflow-hidden shadow-xl">
                                    <img src="https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&q=80" className="object-cover w-full h-full" alt="Memory 1" />
                                </div>
                                <div className="aspect-square rounded-2xl bg-gray-100 overflow-hidden shadow-xl">
                                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80" className="object-cover w-full h-full" alt="Memory 2" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="aspect-square rounded-2xl bg-gray-100 overflow-hidden shadow-xl">
                                    <img src="https://images.unsplash.com/photo-1529139574466-a302d27460a0?w=800&q=80" className="object-cover w-full h-full" alt="Memory 3" />
                                </div>
                                <div className="aspect-[3/4] rounded-2xl bg-gray-100 overflow-hidden shadow-xl">
                                    <img src="https://images.unsplash.com/photo-1488161628813-994252600322?w=800&q=80" className="object-cover w-full h-full" alt="Memory 4" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Decorative Elements */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-blue-100/50 to-purple-100/50 blur-3xl rounded-full z-0" />
                    </div>
                </div>
            </main>
        </div>
    );
}
