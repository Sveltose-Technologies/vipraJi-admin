const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Pattern 1: fontSize: 'something', (with optional leading comma)
      content = content.replace(/,\s*fontSize:\s*['"][^'"]+['"]/g, '');
      content = content.replace(/fontSize:\s*['"][^'"]+['"],?\s*/g, '');
      
      fs.writeFileSync(fullPath, content);
      console.log('Processed', fullPath);
    }
  }
}

processDir(path.join(__dirname, '../src/pages'));
processDir(path.join(__dirname, '../src/components'));
console.log('Done');
