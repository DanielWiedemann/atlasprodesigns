// api/submit-rating.js

export default async function handler(req, res) {
  // Allow CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse body (Vercel auto-parses JSON, but not form data)
  let design, rating, visitor;
  if (req.headers['content-type'] === 'application/json') {
    ({ design, rating, visitor } = req.body);
  } else {
    // For x-www-form-urlencoded
    design = req.body.design;
    rating = req.body.rating;
    visitor = req.body.visitor;
  }

  // Log incoming data
  console.log('Incoming:', { design, rating, visitor });

  if (!design || !rating || !visitor) {
    return res.status(400).json({ error: 'Missing required fields', received: { design, rating, visitor } });
  }

  // Forward the data to your Google Apps Script endpoint
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbwYIgOt9La2S_KOmrEGEFsq2WtlgGVV4rxPCb_YhG0eju_s-zygdJwtW74X-cXOI9IA/exec';
  const params = new URLSearchParams({ design, rating, visitor });

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const text = await response.text();
    console.log('Google Apps Script response:', text);

    res.status(200).json({ result: 'success', response: text });
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.toString() });
  }
}