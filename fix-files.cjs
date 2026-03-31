const fs = require('fs');
const path = require('path');

const jsDir = './public/js';
const files = ['professeurs.js', 'salles.js', 'affectations.js'];

files.forEach(file => {
    const filePath = path.join(jsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Change `const` to `let` for DOM elements at top level
    content = content.replace(/^const\s+(form\w+|msg\w+|tbody|btn\w+|form\w+|search\w+|modale|select\w+|chart\w+|grid|label\w+|filtre\w+|panel|table\w+)\s*=/gm, 'let $1 =');
    
    // Remove old event listeners at module level
    content = content.replace(/^(btn\w+|form\w+|search\w+|modale)\.addEventListener\([^;]*?\n[^;]*?\n[^;]*?\);/gm, '');
    
    // Add DOMContentLoaded wrapper at the end if not already there
    if (!content.includes("document.addEventListener('DOMContentLoaded'")) {
        content = content.replace(
            /^(chargerProfesseurs|chargerSalles|chargerAffectations)\(\);$/m,
            "document.addEventListener('DOMContentLoaded', function() {\n    initDOMElements();\n    $1();\n});"
        );
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
});
