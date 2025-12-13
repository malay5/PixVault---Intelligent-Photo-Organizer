"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
    isAuthenticated: boolean;
    login: (token: string, redirectPath?: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    login: () => { },
    logout: () => { },
    isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check for token on mount
        const token = localStorage.getItem("token");
        if (token) {
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    const login = (token: string, redirectPath?: string) => {
        localStorage.setItem("token", token);
        setIsAuthenticated(true);
        router.push(redirectPath || "/");
    };

    const logout = () => {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        router.push("/");
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
