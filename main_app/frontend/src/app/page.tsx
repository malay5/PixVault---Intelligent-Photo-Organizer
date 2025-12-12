"use client";

import { PhotoGrid } from "@/components/PhotoGrid";
import { LandingPage } from "@/components/LandingPage";
import { useAuth } from "@/utils/AuthContext";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null; // Or a nice spinner

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PhotoGrid />
    </div>
  );
}
