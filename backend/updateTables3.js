// backend/updateTables3.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'school.db');
const db = new sqlite3.Database(dbPath);

const sql = `
-- Table des statistiques de l'emploi
CREATE TABLE IF NOT EXISTS emploi_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metier TEXT NOT NULL,
    secteur TEXT NOT NULL,
    salaire_min INTEGER,
    salaire_max INTEGER,
    demande TEXT,
    source TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des secteurs porteurs
CREATE TABLE IF NOT EXISTS emploi_secteurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    description TEXT,
    tendance TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

console.log('🚀 Création des tables emploi...');

db.exec(sql, (err) => {
    if (err) {
        console.error('❌ Erreur:', err.message);
    } else {
        console.log('✅ Tables créées avec succès !');
        console.log('   - emploi_stats');
        console.log('   - emploi_secteurs');
    }
    db.close();
});