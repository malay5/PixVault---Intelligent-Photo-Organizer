async function verifyFavorite() {
    try {
        // Login
        const authRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'testverify@example.com', password: 'password123' })
        });
        const { token } = await authRes.json();

        // Get Photos
        const listRes = await fetch('http://localhost:5000/api/photos', {
            headers: { 'x-auth-token': token }
        });
        const photos = await listRes.json();
        if (photos.length === 0) {
            console.log('No photos to favorite');
            return;
        }

        const photoId = photos[0]._id;
        console.log('Toggling favorite for:', photoId);

        // Toggle Favorite
        const toggleRes = await fetch(`http://localhost:5000/api/photos/${photoId}/favorite`, {
            method: 'PUT',
            headers: { 'x-auth-token': token }
        });
        const updatedPhoto = await toggleRes.json();
        console.log('New Favorite Status:', updatedPhoto.is_favorite);

        if (updatedPhoto.is_favorite === true) {
            console.log('VERIFICATION SUCCESS: Photo is now valid favorite.');
        } else {
            console.log('VERIFICATION FAIL: Photo did not update.');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

verifyFavorite();
