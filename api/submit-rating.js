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
  
    const { design, rating, visitor } = req.body;
  
    // Validate input
    if (!design || !rating || !visitor) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    // Forward the data to your Google Apps Script endpoint
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbwYIgOt9La2S_KOmrEGEFsq2WtlgGVV4rxPCb_YhG0eju_s-zygdJwtW74X-cXOI9IA/exec';
  
    // Use URLSearchParams to send as x-www-form-urlencoded
    const params = new URLSearchParams({ design, rating, visitor });
  
    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });
  
      const text = await response.text();
      res.status(200).json({ result: 'success', response: text });
    } catch (err) {
      res.status(500).json({ error: err.toString() });
    }
  }