const parser = require('@babel/parser');
const fs = require('fs');

const file = fs.readFileSync('src/pages/student/StudentDashboard.tsx', 'utf-8');

try {
  parser.parse(file, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });
  console.log('No error found in StudentDashboard.tsx');
} catch (e) {
  console.log('Error in StudentDashboard.tsx:', e.message);
  console.log('Line:', e.loc.line, 'Col:', e.loc.column);
}

const file2 = fs.readFileSync('src/pages/teacher/TeacherGroupDetails.tsx', 'utf-8');
try {
  parser.parse(file2, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });
  console.log('No error found in TeacherGroupDetails.tsx');
} catch (e) {
  console.log('Error in TeacherGroupDetails.tsx:', e.message);
  console.log('Line:', e.loc.line, 'Col:', e.loc.column);
}
