const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'pixelvault_secret'; // Hardcoded fallback

async function run() {
    try {
        console.log('1. AUTHENTICATING...');
        // Mock a user token (faster than registering)
        // We need a valid user ID. Let's try to register/login or just use a fake one if DB allows (it won't, foreign key).
        // Best to register.
        const email = `report_tester_${Date.now()}@test.com`;
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            name: 'Report Tester',
            email: email,
            password: 'password123'
        });
        const token = regRes.data.token;
        console.log('   Authenticated as:', email);

        console.log('2. UPLOADING PHOTO...');
        const form = new FormData();
        // Use a dummy file
        const dummyPath = path.join(__dirname, 'test_report_image.txt');
        fs.writeFileSync(dummyPath, 'fake image content');
        form.append('image', fs.createReadStream(dummyPath), 'test_report_image.jpg'); // Pretend it's jpg

        const upRes = await axios.post(`${API_URL}/upload`, form, {
            headers: {
                ...form.getHeaders(),
                'x-auth-token': token
            }
        });
        const photoId = upRes.data._id;
        console.log('   Uploaded Photo ID:', photoId);

        console.log('3. REPORTING FALSE POSITIVE...');
        const reportRes = await axios.post(`${API_URL}/photos/${photoId}/report`, {
            reason: 'False Positive: User reported as Real'
        }, {
            headers: { 'x-auth-token': token }
        });
        console.log('   Report Response:', reportRes.data);

        console.log('4. VERIFYING REPORT IN DB...');
        // We need to fetch the photo details to check reports.
        // Assuming we can fetch it (active status).
        // Or check dashboard stats?
        // Let's check dashboard stats first as it's easier public endpoint?
        const statsRes = await axios.get(`${API_URL}/dashboard/stats`);
        console.log('   Dashboard Stats:', statsRes.data);

        if (statsRes.data.reported_issues > 0) {
            console.log('SUCCESS: Report count increased in dashboard.');
        } else {
            console.error('FAILURE: Dashboard did not reflect report.');
            // Try fetching photo directly if endpoint exists
            // const photoRes = await axios.get(`${API_URL}/photos/${photoId}`, { headers: { 'x-auth-token': token } }); 
            // This endpoint might fetch ALL.
        }

    } catch (err) {
        console.error('ERROR:', err.response ? err.response.data : err.message);
    }
}

run();
