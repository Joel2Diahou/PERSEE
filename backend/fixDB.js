// backend/fixDB.js
const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'school.db');

// Supprimer l'ancienne base
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('🗑️ Ancienne base supprimée');
}

const db = new sqlite3.Database(dbPath);
const sql = fs.readFileSync(path.join(__dirname, 'database', 'database.sql'), 'utf8');

console.log('🚀 Création de la base...');
db.exec(sql, (err) => {
    if (err) {
        console.log('❌ Erreur:', err.message);
    } else {
        console.log('✅ Base créée avec succès');
        
        // Vérifier
        db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
            console.log('📋 Tables créées:', rows.map(r => r.name).join(', '));
            db.close();
        });
    }
});