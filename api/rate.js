export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { design, rating } = req.body;

    // For now, just log the data (you'll see this in Vercel's function logs)
    console.log('Received rating:', { design, rating });

    // Allow CORS for your frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ success: true, message: 'Rating received!' });
  } else if (req.method === 'OPTIONS') {
    // Handle CORS preflight
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
  } else {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
