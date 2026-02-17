
const XLSX = require('xlsx');
const path = require('path');

// 1. Define Data
const data = [
    { Description: 'Johnnie Walker Black Label 1L', Quantity: 120, FOB: 22.00 },
    { Description: "Buchanan's 12 Years 750ml", Quantity: 60, FOB: 18.00 },
    { Description: "Chanel No. 5 100ml", Quantity: 24, FOB: 75.00 }
];

// 2. Create Workbook
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, "Invoice");

// 3. Write File to Frontend root for easy access
const outputPath = path.resolve(__dirname, '../../frontend/test_import.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`✅ Test Excel created at: ${outputPath}`);
