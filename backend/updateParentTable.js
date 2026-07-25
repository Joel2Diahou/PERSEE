// backend/updateParentTable.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'school.db');
const db = new sqlite3.Database(dbPath);

const sql = `
-- Table pour lier les parents aux enfants
CREATE TABLE IF NOT EXISTS parent_eleves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER NOT NULL,
    eleve_id INTEGER NOT NULL,
    lien TEXT DEFAULT 'parent',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES users(id),
    FOREIGN KEY (eleve_id) REFERENCES eleves(id),
    UNIQUE(parent_id, eleve_id)
);
`;

console.log('🚀 Création de la table parent_eleves...');

db.exec(sql, (err) => {
    if (err) {
        console.error('❌ Erreur:', err.message);
    } else {
        console.log('✅ Table parent_eleves créée avec succès !');
        
        // Vérifier que la table existe
        db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='parent_eleves'", (err, rows) => {
            if (err) {
                console.log('❌ Erreur vérification:', err.message);
            } else if (rows.length > 0) {
                console.log('✅ Vérification: Table parent_eleves existe !');
            } else {
                console.log('⚠️ Vérification: Table parent_eleves non trouvée');
            }
            db.close();
        });
    }
});