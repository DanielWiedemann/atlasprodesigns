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
      let found = false;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][1] === design && rows[i][3] === visitor) {
          // Update this row
          const rowNum = i + 1; // 1-based index, +1 for header
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}!A${rowNum}:D${rowNum}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [[new Date().toISOString(), design, rating, visitor]],
            },
          });
          found = true;
          break;
        }
      }
      if (!found) {
        // Append new row
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${sheetName}!A:D`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[new Date().toISOString(), design, rating, visitor]],
          },
        });
      }

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(200).json({ success: true, message: found ? 'Rating updated!' : 'Rating added!' });
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
