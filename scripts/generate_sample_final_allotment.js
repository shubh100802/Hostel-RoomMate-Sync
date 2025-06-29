const ExcelJS = require('exceljs');
const path = require('path');

async function generateFinalAllotment() {
  const inputPath = path.join(__dirname, '../frontend/sample_students_template.xlsx');
  const outputPath = path.join(__dirname, '../frontend/sample_final_allotment.xlsx');

  // Read the sample students template
  const inWb = new ExcelJS.Workbook();
  await inWb.xlsx.readFile(inputPath);
  const inWs = inWb.worksheets[0];

  // Prepare output workbook
  const outWb = new ExcelJS.Workbook();
  const outWs = outWb.addWorksheet('Final Allotment');
  outWs.columns = [
    { header: 'Reg No', key: 'regno', width: 15 },
    { header: 'Name', key: 'name', width: 22 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Bed Type', key: 'bedType', width: 22 },
    { header: 'Room No', key: 'roomNo', width: 10 }
  ];

  // Generate room numbers
  let roomCounter = 1;
  let roomPrefix = 'A';
  let switchToB = 11; // after 10, switch to B
  let switchToC = 20; // after 19, switch to C

  inWs.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const name = row.getCell(1).value || '';
    const email = row.getCell(2).value || '';
    const regno = row.getCell(3).value || '';
    const bedType = row.getCell(4).value || '';
    let roomNo = '';
    if (roomCounter < switchToB) {
      roomNo = `A${String(roomCounter).padStart(3, '0')}`;
    } else if (roomCounter < switchToC) {
      roomNo = `B${String(roomCounter-10+100).padStart(3, '0')}`;
    } else {
      roomNo = `C${String(roomCounter-19+200).padStart(3, '0')}`;
    }
    outWs.addRow({ regno, name, email, bedType, roomNo });
    roomCounter++;
  });

  await outWb.xlsx.writeFile(outputPath);
  console.log('Sample final allotment Excel generated at:', outputPath);
}

generateFinalAllotment(); 