const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('window.confirm')) {
    console.log('Processing:', file);
    
    // Add import
    if (!content.includes('useConfirmModal')) {
      content = content.replace(/(import .* from 'react';?)/, `$1\nimport { useConfirmModal } from '../contexts/ConfirmModalContext';`);
    }
    
    // Inject hook at top of component
    const compRegex = /const (\w+) = \([^)]*\) => {/;
    if (compRegex.test(content) && !content.includes('const { showConfirm }')) {
      content = content.replace(compRegex, (match) => {
        return match + `\n  const { showConfirm } = useConfirmModal();`;
      });
    }

    // Replace onClick inline (Pattern A)
    // onClick={() => { if(window.confirm('Are you sure?')) deleteCatMutation.mutate(cat._id || cat.id); }}
    content = content.replace(/onClick=\{\(\) => \{\s*if\s*\(\s*window\.confirm\('([^']+)'\)\s*\)\s*([^;]+;?)\s*\}\}/g, 
      "onClick={() => showConfirm('$1', () => { $2 })}");

    // Replace if statements (Pattern B)
    // if (window.confirm('Are you sure you want to delete this samagri package?')) {
    //   deleteMutation.mutate(id);
    // }
    content = content.replace(/if\s*\(\s*window\.confirm\('([^']+)'\)\s*\)\s*\{([\s\S]*?)\}/g, 
      "showConfirm('$1', () => {$2});");
      
    fs.writeFileSync(filePath, content);
  }
}
console.log('Done.');
