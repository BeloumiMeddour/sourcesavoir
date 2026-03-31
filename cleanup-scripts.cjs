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
    
    // Supprimer les appels à initDOMElements() 
    content = content.replace(/\ninitDOMElements\(\);?\s*/g, '\n');
    
    // Supprimer les appels à charger* et activerTriTableau
    content = content.replace(/\ncharger\w+\(\);?\s*/g, '\n');
    content = content.replace(/\nactiverTriTableau\([^)]*\);?\s*/g, '\n');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Cleaned: ${file}`);
});
