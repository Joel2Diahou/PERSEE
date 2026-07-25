// frontend/fix-api-v2.js
const fs = require('fs');
const path = require('path');

console.log('🔧 Correction des imports API...\n');

// ===== FONCTION POUR CORRIGER UN FICHIER =====
function fixImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Déterminer le chemin correct vers services/api
    const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, 'src/services/api'));
    let importPath = relativePath.replace(/\\/g, '/');

    // Si le chemin commence par 'src/services/api', on le corrige
    if (importPath.startsWith('src/')) {
      importPath = importPath.replace('src/', './');
    }
    if (!importPath.startsWith('.')) {
      importPath = './' + importPath;
    }
    // Enlever l'extension .js
    importPath = importPath.replace(/\.js$/, '');
    // Enlever le /api final
    importPath = importPath.replace(/\/api$/, '');

    // Chercher l'import de api
    const apiImportRegex = /import\s+api\s+from\s+['"](.*?)['"]/;
    const match = content.match(apiImportRegex);

    if (match) {
      const currentPath = match[1];
      // Vérifier si le chemin est correct
      if (currentPath.includes('services/api') && !currentPath.startsWith('../')) {
        // Corriger le chemin
        const newImport = `import api from '${importPath}';`;
        content = content.replace(apiImportRegex, newImport);
        modified = true;
        console.log(`  ✅ Chemin corrigé: ${filePath} -> ${importPath}`);
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Erreur sur ${filePath}:`, error.message);
    return false;
  }
}

// ===== FONCTION POUR SCANNER UN DOSSIER =====
function scanFolder(folder) {
  const fullPath = path.join(__dirname, folder);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️ Dossier non trouvé: ${folder}`);
    return;
  }

  const files = fs.readdirSync(fullPath);
  
  files.forEach(file => {
    const filePath = path.join(fullPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanFolder(path.join(folder, file));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fixImports(filePath);
    }
  });
}

// ===== LANCER LE SCAN =====
const foldersToFix = [
  'src/pages',
  'src/components',
  'src'
];

foldersToFix.forEach(folder => {
  if (fs.existsSync(path.join(__dirname, folder))) {
    scanFolder(folder);
  }
});

console.log('\n✅ Correction terminée !');
console.log('📝 Maintenant, exécute: npm run build');