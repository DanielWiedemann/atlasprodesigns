import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { design, rating, visitor } = req.body;

    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;
      const sheetName = process.env.GOOGLE_SHEET_NAME || 'Sheet1';

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      const sheets = google.sheets({ version: 'v4', auth });

      // 1. Read all rows
      const getRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:D`,
      });
      const rows = getRes.data.values || [];
      // Header: [timestamp, design, rating, visitor]
      let header = rows[0] || ['timestamp', 'design', 'rating', 'visitor'];
      let data = rows.slice(1);

      let updated = false;
      for (let i = 0; i < data.length; i++) {
        if (String(data[i][1]) === String(design) && String(data[i][3]) === String(visitor)) {
          data[i] = [new Date().toISOString(), design, rating, visitor];
          updated = true;
          break;
        }
      }
      if (!updated) {
        data.push([new Date().toISOString(), design, rating, visitor]);
      }

      // 2. Overwrite all data except header
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A2:D${data.length + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: data,
        },
      });

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(200).json({ success: true, message: updated ? 'Rating updated!' : 'Rating added!' });
    } catch (error) {
      console.error('Google Sheets error:', error);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
  } else {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
