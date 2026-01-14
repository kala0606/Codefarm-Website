# Google Sheets Setup Guide for Codefarm Application Form

This guide will help you set up Google Sheets integration to receive application form submissions.

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Codefarm 2026 Applications" (or any name you prefer)
4. **Copy the Spreadsheet ID** from the URL:
   - The URL will look like: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit`
   - Copy the part between `/d/` and `/edit`

## Step 2: Set Up Google Apps Script

1. Go to [Google Apps Script](https://script.google.com)
2. Click **"New Project"**
3. Delete the default code (`function myFunction() {}`)
4. Open the file `google-apps-script.js` from this project
5. Copy the entire contents and paste it into the Google Apps Script editor
6. **Replace `YOUR_SPREADSHEET_ID`** with the Spreadsheet ID you copied in Step 1
7. Click **"Save"** (or press Cmd/Ctrl + S)
8. Give your project a name like "Codefarm Form Handler"

## Step 3: Deploy as Web App

1. In Google Apps Script, click **"Deploy"** > **"New deployment"**
2. Click the gear icon ⚙️ next to "Select type" and choose **"Web app"**
3. Configure the deployment:
   - **Description**: "Codefarm Application Form Handler"
   - **Execute as**: **"Me"** (your email)
   - **Who has access**: **"Anyone"** (this allows the form to submit data)
4. Click **"Deploy"**
5. **Authorize the script**:
   - Click "Authorize access"
   - Choose your Google account
   - Click "Advanced" > "Go to [Project Name] (unsafe)"
   - Click "Allow"
6. **Copy the Web App URL** - it will look like:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

## Step 4: Update Your Website

1. Open `index.html` in your project
2. Find this line near the bottom:
   ```javascript
   window.GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```
3. Replace `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` with the Web App URL you copied in Step 3
4. Save the file

## Step 5: Test the Form

1. Open your website
2. Navigate to the "Apply" section
3. Fill out the form with test data
4. Submit the form
5. Check your Google Sheet - you should see the data appear in a new row

## Troubleshooting

### Form submissions not appearing in Sheet

1. **Check the Spreadsheet ID**: Make sure it's correct in `google-apps-script.js`
2. **Check permissions**: The Web App must be set to "Anyone" access
3. **Check browser console**: Open Developer Tools (F12) and look for errors
4. **Test the script**: In Google Apps Script, run the `doGet` function to test if it's working

### "Script not authorized" error

1. Go back to Google Apps Script
2. Click "Deploy" > "Manage deployments"
3. Click the edit icon (pencil) on your deployment
4. Under "Version", select "New version"
5. Click "Deploy"
6. Re-authorize if prompted

### Data format issues

- The script automatically creates a header row with column names
- If you need to change column order, edit the `sheet.appendRow([...])` section in the script

## Security Notes

- The Web App URL is public, but only allows POST requests
- Each submission includes a timestamp
- Consider adding rate limiting if you expect high volume
- Regularly backup your Google Sheet data

## Next Steps

- Set up email notifications when new applications are received
- Add data validation in the Google Sheet
- Create a dashboard to view application statistics
- Set up automated responses to applicants

For more advanced features, you can modify the `google-apps-script.js` file to:
- Send confirmation emails to applicants
- Add data validation
- Create multiple sheets for different application rounds
- Generate PDFs of applications
