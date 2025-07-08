import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { design, rating } = req.body;

    // Google Sheets integration
    try {
      // Load credentials and spreadsheet info from environment variables
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;
      const sheetName = process.env.GOOGLE_SHEET_NAME || 'Sheet1';

      // Authenticate with Google Sheets API
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      const sheets = google.sheets({ version: 'v4', auth });

      // Append the new rating
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:C`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[new Date().toISOString(), design, rating]],
        },
      });

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(200).json({ success: true, message: 'Rating saved to Google Sheets!' });
    } catch (error) {
      console.error('Google Sheets error:', error);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(500).json({ success: false, error: error.message });
    }
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

// Instructions:
// 1. Create a Google Cloud service account with access to Google Sheets API.
// 2. Share your Google Sheet with the service account email.
// 3. Add the service account JSON as the environment variable GOOGLE_SERVICE_ACCOUNT_KEY (stringified JSON).
// 4. Add your spreadsheet ID as GOOGLE_SHEET_ID and sheet name as GOOGLE_SHEET_NAME (optional, defaults to Sheet1).
