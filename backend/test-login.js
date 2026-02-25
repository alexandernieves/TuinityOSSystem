const http = require('http');
const req = http.request('http://localhost:3001/auth/login', { 
  method: 'POST', 
  headers: { 
    'Content-Type': 'application/json', 
    'x-tenant-slug': 'evolution' 
  } 
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(body));
});
req.write(JSON.stringify({ email: 'admin@evolution.com', password: 'admin123', tenantSlug: 'evolution' }));
req.end();
