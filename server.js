const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const app = express();
const PORT = 3000;

const DESIGNS_DIR = path.join(__dirname, 'designs');
const RATINGS_FILE = path.join(__dirname, 'ratings.json');

app.use(express.json());
app.use('/designs', express.static(DESIGNS_DIR));
app.use(express.static(__dirname));

// Simple cookie parser
function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  }
  return list;
}

// Generate a UUID
function generateVisitorId() {
  return crypto.randomUUID();
}

function migrateRatingsFormat(ratings) {
  for (const design in ratings) {
    if (Array.isArray(ratings[design])) {
      ratings[design] = {};
    }
  }
  return ratings;
}

// Middleware to ensure visitor_id cookie
app.use((req, res, next) => {
  const cookies = parseCookies(req);
  if (!cookies.visitor_id) {
    const visitorId = generateVisitorId();
    res.setHeader('Set-Cookie', `visitor_id=${visitorId}; Path=/; HttpOnly; SameSite=Lax`);
    req.visitor_id = visitorId;
  } else {
    req.visitor_id = cookies.visitor_id;
  }
  next();
});

// List images in /designs
app.get('/api/designs', (req, res) => {
  fs.readdir(DESIGNS_DIR, (err, files) => {
    if (err) return res.status(500).json([]);
    const images = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
    res.json(images);
  });
});

// Submit a rating
app.post('/api/rate', (req, res) => {
  const { design, rating } = req.body;
  if (!design || !rating || rating < 1 || rating > 5) return res.status(400).send('Invalid');
  let ratings = {};
  if (fs.existsSync(RATINGS_FILE)) {
    ratings = JSON.parse(fs.readFileSync(RATINGS_FILE, 'utf8'));
    ratings = migrateRatingsFormat(ratings);
  }
  if (!ratings[design]) ratings[design] = {};
  // Use visitor_id from cookie
  const visitorId = req.visitor_id;
  ratings[design][visitorId] = rating;
  fs.writeFileSync(RATINGS_FILE, JSON.stringify(ratings, null, 2));
  res.sendStatus(200);
});

// Reset all ratings
app.post('/api/reset-ratings', (req, res) => {
  if (fs.existsSync(RATINGS_FILE)) {
    fs.unlinkSync(RATINGS_FILE);
  }
  res.sendStatus(200);
});

// Rates page (viewable by you)
app.get('/rates', (req, res) => {
  let ratings = {};
  if (fs.existsSync(RATINGS_FILE)) {
    ratings = JSON.parse(fs.readFileSync(RATINGS_FILE, 'utf8'));
    ratings = migrateRatingsFormat(ratings);
  }
  fs.readdir(DESIGNS_DIR, (err, files) => {
    if (err) files = [];
    const images = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
    let html = `<!DOCTYPE html><html><head><title>Design Ratings</title><style>body{font-family:sans-serif;background:#f4f6fb;padding:40px;}table{border-collapse:collapse;width:100%;max-width:700px;margin:auto;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.07);}th,td{padding:16px;text-align:center;}th{background:#222;color:#fff;}tr:nth-child(even){background:#f9f9f9;}img{max-width:80px;max-height:80px;border-radius:8px;}button{margin:20px auto;display:block;padding:10px 24px;font-size:1.1rem;background:#e53935;color:#fff;border:none;border-radius:8px;cursor:pointer;transition:background 0.2s;}button:hover{background:#b71c1c;}</style></head><body><h1 style='text-align:center;'>Design Ratings</h1><button onclick=\"if(confirm('Reset all ratings?')){fetch('/api/reset-ratings',{method:'POST'}).then(()=>location.reload());}\">Reset All Ratings</button><table><tr><th>Design</th><th>Image</th><th>Average Rating</th><th>Votes</th></tr>`;
    images.forEach(img => {
      const ratesObj = ratings[img] || {};
      const rates = Object.values(ratesObj);
      const avg = rates.length ? (rates.reduce((a,b)=>a+b,0)/rates.length).toFixed(2) : '-';
      html += `<tr><td>${img}</td><td><img src='/designs/${img}'></td><td>${avg}</td><td>${rates.length}</td></tr>`;
    });
    html += '</table></body></html>';
    res.send(html);
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
}); 