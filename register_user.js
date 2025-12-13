async function register() {
    try {
        const res = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Verify',
                email: 'testverify@example.com',
                password: 'password123'
            })
        });

        if (!res.ok) {
            const text = await res.text();
            console.log('Failed:', res.status, text);
            return;
        }

        const data = await res.json();
        console.log('User registered:', data);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

register();
