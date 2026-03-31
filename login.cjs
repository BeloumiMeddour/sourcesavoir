const http = require('http');

const data = JSON.stringify({ 
  email: 'admin@lacite.ca', 
  password: 'Admin123!' 
});

const opts = { 
  hostname: 'localhost', 
  port: 5001, 
  path: '/connexion', 
  method: 'POST', 
  headers: { 
    'Content-Type': 'application/json', 
    'Content-Length': data.length 
  } 
};

const req = http.request(opts, (res) => {
  console.log('Status:', res.statusCode);
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => {
    console.log('Response:', body.substring(0, 100));
    if (res.statusCode === 200) {
      console.log('✅ Connexion réussie!');
    }
  });
});

req.on('error', (e) => console.error('❌ Erreur:', e.message));
req.write(data);
req.end();
