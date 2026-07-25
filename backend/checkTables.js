// checkTables.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'school.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
        console.log('❌ Erreur:', err.message);
    } else {
        console.log('📋 Liste des tables:');
        rows.forEach(row => {
            console.log(`   - ${row.name}`);
        });
        
        // Vérifier spécifiquement parent_eleves
        const hasParentTable = rows.some(r => r.name === 'parent_eleves');
        if (hasParentTable) {
            console.log('\n✅ Table parent_eleves trouvée !');
        } else {
            console.log('\n❌ Table parent_eleves non trouvée !');
        }
    }
    db.close();
});