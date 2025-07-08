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

      // Get the sheetId for the given sheetName
      const metaRes = await sheets.spreadsheets.get({ spreadsheetId });
      const sheet = metaRes.data.sheets.find(s => s.properties.title === sheetName);
      const sheetId = sheet ? sheet.properties.sheetId : 0;

      // 1. Read all rows
      const getRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:D`,
      });
      const rows = getRes.data.values || [];
      // Header: [timestamp, design, rating, visitor]
      let deleteIndices = [];
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][1]) === String(design) && String(rows[i][3]) === String(visitor)) {
          deleteIndices.push(i);
        }
      }
      // 2. Delete all previous rows for this visitor/design (from bottom to top)
      if (deleteIndices.length > 0) {
        deleteIndices.sort((a, b) => b - a); // Descending order
        const deleteRequests = deleteIndices.map(idx => ({
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: idx,
              endIndex: idx + 1,
            },
          },
        }));
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: deleteRequests,
          },
        });
      }
      // 3. Append the new row
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:D`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[new Date().toISOString(), design, rating, visitor]],
        },
      });

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
