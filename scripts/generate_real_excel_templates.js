const ExcelJS = require('exceljs');
const path = require('path');

const students = [
  ["Aman Singh", "student1@vitbhopal.ac.in", "22BCS1001", "4 Bed AC Bunk"],
  ["Ravi Kumar", "student2@vitbhopal.ac.in", "22BCS1002", "Four Bed AC Bunk"],
  ["Priya Sharma", "student3@vitbhopal.ac.in", "22BCS1003", "2 Bed A/C"],
  ["Suresh Mehta", "student4@vitbhopal.ac.in", "22BCS1004", "Double Bedded NON A/C"],
  ["Anjali Verma", "student5@vitbhopal.ac.in", "22BCS1005", "Three Bedded A/C"],
  ["Vikas Patel", "student6@vitbhopal.ac.in", "22BCS1006", "3 Bed NON A/C"],
  ["Neha Gupta", "student7@vitbhopal.ac.in", "22BCS1007", "Single Bedded NON A/C"],
  ["Rahul Jain", "student8@vitbhopal.ac.in", "22BCS1008", "Five Bed Non A/C"],
  ["Simran Kaur", "student9@vitbhopal.ac.in", "22BCS1009", "6 Bed A/C"],
  ["Deepak Yadav", "student10@vitbhopal.ac.in", "22BCS1010", "Six Bed Non A/C"],
  ["Meena Joshi", "student11@vitbhopal.ac.in", "22BCS1011", "8 Bed Non A/C"],
  ["Karan Malhotra", "student12@vitbhopal.ac.in", "22BCS1012", "Four Bed Non A/C Bunker Bed"],
  ["Pooja Sinha", "student13@vitbhopal.ac.in", "22BCS1013", "Four Bed Non A/C Flat Bed"],
  ["Arjun Desai", "student14@vitbhopal.ac.in", "22BCS1014", "Three Bed A/C"],
  ["Sneha Reddy", "student15@vitbhopal.ac.in", "22BCS1015", "Double Bed A/C"],
  ["Manoj Pillai", "student16@vitbhopal.ac.in", "22BCS1016", "2 Bed Non A/C"],
  ["Ritika Shah", "student17@vitbhopal.ac.in", "22BCS1017", "Single Bed Non A/C"],
  ["Gaurav Singh", "student18@vitbhopal.ac.in", "22BCS1018", "Five Bedded Non A/C"],
  ["Divya Nair", "student19@vitbhopal.ac.in", "22BCS1019", "Four Bed AC Bunk"],
  ["Nikhil Rao", "student20@vitbhopal.ac.in", "22BCS1020", "Four Bed Non A/C Bunker Bed"],
  ["Aarti Mishra", "student21@vitbhopal.ac.in", "22BCS1021", "Four Bed Non A/C Flat Bed"],
  ["Sanjay Kumar", "student22@vitbhopal.ac.in", "22BCS1022", "Three Bed Non A/C"],
  ["Kavita Yadav", "student23@vitbhopal.ac.in", "22BCS1023", "3 Bed AC"],
  ["Rohit Sahu", "student24@vitbhopal.ac.in", "22BCS1024", "2 Bed A/C"],
  ["Shalini Pandey", "student25@vitbhopal.ac.in", "22BCS1025", "Double Bed Non A/C"]
];

async function generateTemplates() {
  // 1. sample_students_template.xlsx
  const studentWb = new ExcelJS.Workbook();
  const studentWs = studentWb.addWorksheet('Students');
  studentWs.columns = [
    { header: 'Name', key: 'name', width: 22 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Reg No', key: 'regno', width: 15 },
    { header: 'Bed Type', key: 'bedType', width: 22 }
  ];
  students.forEach(s => studentWs.addRow({ name: s[0], email: s[1], regno: s[2], bedType: s[3] }));
  await studentWb.xlsx.writeFile(path.join(__dirname, '../frontend/sample_students_template.xlsx'));

  // 2. sample_final_allotment.xlsx
  const allotWb = new ExcelJS.Workbook();
  const allotWs = allotWb.addWorksheet('Final Allotment');
  allotWs.columns = [
    { header: 'Reg No', key: 'regno', width: 15 },
    { header: 'Name', key: 'name', width: 22 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Bed Type', key: 'bedType', width: 22 },
    { header: 'Room No', key: 'roomNo', width: 10 }
  ];
  let roomCounter = 1;
  let switchToB = 11;
  let switchToC = 20;
  students.forEach((s, idx) => {
    let roomNo = '';
    if (roomCounter < switchToB) {
      roomNo = `A${String(roomCounter).padStart(3, '0')}`;
    } else if (roomCounter < switchToC) {
      roomNo = `B${String(roomCounter-10+100).padStart(3, '0')}`;
    } else {
      roomNo = `C${String(roomCounter-19+200).padStart(3, '0')}`;
    }
    allotWs.addRow({ regno: s[2], name: s[0], email: s[1], bedType: s[3], roomNo });
    roomCounter++;
  });
  await allotWb.xlsx.writeFile(path.join(__dirname, '../frontend/sample_final_allotment.xlsx'));
  console.log('Both Excel templates generated in frontend/');
}

generateTemplates(); 