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
      let header = rows[0] || ['timestamp', 'design', 'rating', 'visitor'];
      let data = rows.slice(1);

      // 2. Build a map of unique visitor/design pairs (latest rating wins)
      const key = (d, v) => `${d}|||${v}`;
      const map = new Map();
      for (const row of data) {
        map.set(key(row[1], row[3]), row);
      }
      // 3. Update or add the current rating
      map.set(key(design, visitor), [new Date().toISOString(), design, rating, visitor]);
      // 4. Build the new data array
      const newData = Array.from(map.values());

      // 5. Clear all data except header
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!A2:D`,
      });

      // 6. Write the new data
      if (newData.length > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A2:D${newData.length + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: newData,
          },
        });
      }

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(200).json({ success: true, message: 'Rating updated!' });
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
