"use client";

import { useAuth, AuthProvider } from "@/utils/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { usePathname } from "next/navigation";
import { SelectionProvider } from "@/utils/SelectionContext";
import { PhotoProvider } from "@/utils/PhotoContext";
import { ThemeProvider } from "@/components/ThemeProvider";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const pathname = usePathname();

    // If loading, show nothing or a spinner
    if (isLoading) return null;

    // Special case: Landing Page for unauthenticated users
    if (!isAuthenticated && pathname === "/") {
        return <>{children}</>;
    }

    // Auth pages (Login/Signup) shouldn't have layout
    const isAuthPage = pathname === "/login" || pathname === "/signup";

    if (isAuthPage) {
        return <>{children}</>;
    }

    // Default authenticated layout
    // If not authenticated and trying to access protected route, 
    // AuthContext or page logic will likely redirect, but here we just render children 
    // or nothing. For now, we assume authenticated if we reached here or show layout if auth.

    // Determine if we show Sidebar/Topbar
    const showLayout = isAuthenticated;

    if (!showLayout) {
        // Fallback for unauthenticated generic pages if any
        return <>{children}</>;
    }

    return (
        <div className="flex bg-[#fafafa] dark:bg-[#09090b] min-h-screen font-sans antialiased text-gray-900 dark:text-gray-100 transition-colors duration-300">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Topbar />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <PhotoProvider>
                    <SelectionProvider>
                        <AuthenticatedLayout>{children}</AuthenticatedLayout>
                    </SelectionProvider>
                </PhotoProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}
