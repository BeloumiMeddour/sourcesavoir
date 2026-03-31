const fs = require('fs');
const path = require('path');

const files = [
    'cours.js', 'professeurs.js', 'salles.js', 'affectations.js',
    'admin.js', 'accueil.js', 'gerer-semestres.js', 'planner.js'
];

files.forEach(file => {
    const filePath = path.join('./public/js', file);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Convertir top-level DOM selectors: `const xxx = document.xxx` -> `let xxx;`
    content = content.replace(/^const\s+(\w+)\s*=\s*document\.(getElementById|querySelector|querySelectorAll)\([^)]*\);?$/gm, 'let $1;');
    
    // Si initDOMElements() existe, assigner les sélecteurs dedans
    if (content.includes('function initDOMElements()')) {
        content = content.replace(
            /function initDOMElements\(\)\s*\{/,
            `function initDOMElements() {
    // Réinitialiser les références DOM`
        );
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Converted: ${file}`);
});
