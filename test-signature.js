const crypto = require('crypto');
const https = require('https');
const http = require('http');

// Configuration (matches your .env)
const SECRET = 'some_shared_hmac_secret';
const URL = 'http://localhost:8000/api/slack';

// Sample body (matches what your Slack route expects)
const bodyObj = {
    user: 'testuser',
    text: 'test message'
};

// Convert to JSON exactly like the server does
const bodyJson = JSON.stringify(bodyObj);

// Generate HMAC-SHA256 signature (exactly like server)
const signature = crypto.createHmac('sha256', SECRET)
    .update(bodyJson)
    .digest('hex');

console.log('Body JSON:', bodyJson);
console.log('Generated Signature:', signature);

// Test the API call
const url = new URL(URL);
const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-syntra-signature': signature,
        'Content-Length': Buffer.byteLength(bodyJson)
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Response:', data);
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
});

req.write(bodyJson);
req.end();
