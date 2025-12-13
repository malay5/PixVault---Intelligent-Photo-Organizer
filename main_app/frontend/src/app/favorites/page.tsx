import { PhotoGrid } from "@/components/PhotoGrid";

export default function FavoritesPage() {
    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-normal text-gray-800 dark:text-gray-200 mb-6 px-4">Favorites</h1>
            <PhotoGrid filter="favorites" />
        </div>
    );
}
