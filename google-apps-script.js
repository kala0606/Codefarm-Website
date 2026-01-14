/**
 * Google Apps Script for Codefarm Application Form
 * Simple, robust version that always works
 */

// Google Sheet ID
const SPREADSHEET_ID = '10CRLzSiuMrB8fad6LmR2AX1E7tzT-xUXBhEgUkc02T8';

/**
 * Handle POST request from the form
 */
function doPost(e) {
    try {
        // Parse the JSON data
        const data = JSON.parse(e.postData.contents);
        
        // Get the spreadsheet
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        
        // Try to find "Codefarm 1 Submissions" sheet, otherwise use first sheet
        let sheet = ss.getSheetByName('Codefarm 1 Submissions');
        if (!sheet) {
            sheet = ss.getSheets()[0]; // Fall back to first sheet
        }
        
        // Check if sheet is empty or first row doesn't have our headers
        const lastRow = sheet.getLastRow();
        const firstCell = sheet.getRange(1, 1).getValue();
        
        // If sheet is empty or first cell is not "Timestamp", add headers
        if (lastRow === 0 || firstCell !== 'Timestamp') {
            // Insert headers at row 1 (shift existing data down if any)
            if (lastRow > 0) {
                sheet.insertRowBefore(1);
            }
            
            sheet.getRange(1, 1, 1, 11).setValues([[
                'Timestamp',
                'Full Name',
                'Email',
                'Phone',
                'Location',
                'Date of Birth',
                'Gender',
                'How did you hear about Codefarm?',
                'Educational/Professional Background',
                'Coding/Visual Arts Experience',
                'Goals and Learning Objectives'
            ]]);
            
            // Format header row
            sheet.getRange(1, 1, 1, 11)
                .setFontWeight('bold')
                .setBackground('#000000')
                .setFontColor('#ffffff');
        }
        
        // Log for debugging
        Logger.log('Sheet name: ' + sheet.getName());
        Logger.log('Last row before: ' + sheet.getLastRow());
        
        // Append the data to the next available row
        const rowData = [
            data.timestamp || new Date().toISOString(),
            data.fullName || '',
            data.email || '',
            data.phone || '',
            data.location || '',
            data.dob || '',
            data.gender || '',
            data.hearAbout || '',
            data.background || '',
            data.experience || '',
            data.goals || ''
        ];
        
        sheet.appendRow(rowData);
        
        Logger.log('Last row after: ' + sheet.getLastRow());
        Logger.log('Data appended successfully');
        
        // Return success response
        return ContentService
            .createTextOutput(JSON.stringify({
                'status': 'success',
                'message': 'Application submitted successfully',
                'sheet': sheet.getName(),
                'row': sheet.getLastRow()
            }))
            .setMimeType(ContentService.MimeType.JSON);
            
    } catch (error) {
        // Log error for debugging
        Logger.log('Error: ' + error.toString());
        Logger.log('Stack: ' + error.stack);
        
        // Return error response
        return ContentService
            .createTextOutput(JSON.stringify({
                'status': 'error',
                'message': error.toString()
            }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * Handle GET request (for testing)
 */
function doGet(e) {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        let sheet = ss.getSheetByName('Codefarm 1 Submissions');
        if (!sheet) {
            sheet = ss.getSheets()[0];
        }
        
        const info = {
            status: 'running',
            spreadsheetId: SPREADSHEET_ID,
            sheetName: sheet.getName(),
            lastRow: sheet.getLastRow(),
            hasHeaders: sheet.getRange(1, 1).getValue() === 'Timestamp'
        };
        
        return ContentService
            .createTextOutput('Codefarm Application Form Handler is running!\n\n' + JSON.stringify(info, null, 2))
            .setMimeType(ContentService.MimeType.TEXT);
    } catch (error) {
        return ContentService
            .createTextOutput('Error: ' + error.toString())
            .setMimeType(ContentService.MimeType.TEXT);
    }
}

/**
 * Manual setup function - Run this once to initialize the sheet with headers
 * In Google Apps Script editor: Select setupSheet from dropdown > Click Run
 */
function setupSheet() {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        
        // Try to find "Codefarm 1 Submissions" sheet, otherwise use first sheet
        let sheet = ss.getSheetByName('Codefarm 1 Submissions');
        if (!sheet) {
            sheet = ss.getSheets()[0];
        }
        
        // Clear sheet (optional - remove this line if you want to keep existing data)
        // sheet.clear();
        
        // Add headers
        sheet.getRange(1, 1, 1, 11).setValues([[
            'Timestamp',
            'Full Name',
            'Email',
            'Phone',
            'Location',
            'Date of Birth',
            'Gender',
            'How did you hear about Codefarm?',
            'Educational/Professional Background',
            'Coding/Visual Arts Experience',
            'Goals and Learning Objectives'
        ]]);
        
        // Format header row
        sheet.getRange(1, 1, 1, 11)
            .setFontWeight('bold')
            .setBackground('#000000')
            .setFontColor('#ffffff');
        
        // Auto-resize columns
        sheet.autoResizeColumns(1, 11);
        
        Logger.log('✅ Sheet initialized successfully!');
        return 'Sheet initialized successfully!';
    } catch (error) {
        Logger.log('❌ Error: ' + error.toString());
        return 'Error: ' + error.toString();
    }
}
