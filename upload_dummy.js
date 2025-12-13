const { Blob } = require('buffer');

async function upload() {
    try {
        // 1. Authenticate to get token
        const authRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'testverify@example.com', password: 'password123' })
        });
        const authData = await authRes.json();
        const token = authData.token;

        if (!token) {
            console.error('Login failed:', authData);
            return;
        }
        console.log('Logged in, got token.');

        // 2. Create Dummy CSS "Image" (just text, but valid file for upload)
        const fileContent = "fake image content";
        const file = new Blob([fileContent], { type: 'image/jpeg' });

        const formData = new FormData();
        formData.append('image', file, 'test_upload.jpg');

        // 3. Upload
        const upRes = await fetch('http://localhost:5000/api/upload', {
            method: 'POST',
            headers: { 'x-auth-token': token }, // Multer reads body, auth middleware needs header
            body: formData
        });

        if (!upRes.ok) {
            const text = await upRes.text();
            console.error('Upload failed:', upRes.status, text);
            return;
        }

        const upData = await upRes.json();
        console.log('Upload success:', upData);

    } catch (err) {
        console.error('Error:', err);
    }
}

upload();
