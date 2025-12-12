"use client";

import { useRouter } from 'next/navigation';

export async function loginUser(email, password) {
    const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Login failed');
    }

    const data = await res.json();
    return data;
}

export function useAuth() {
    // Simple hook for now
    const logout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    return { logout };
}
