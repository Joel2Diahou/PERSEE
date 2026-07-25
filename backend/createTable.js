// backend/createTable.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'school.db');
const db = new sqlite3.Database(dbPath);

const sql = `
CREATE TABLE IF NOT EXISTS demandes_echange (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    annonce_id INTEGER NOT NULL,
    demandeur_id INTEGER NOT NULL,
    message TEXT,
    statut TEXT DEFAULT 'en_attente',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (annonce_id) REFERENCES annonces_livres(id),
    FOREIGN KEY (demandeur_id) REFERENCES users(id)
);
`;

console.log('🚀 Création de la table demandes_echange...');

db.exec(sql, (err) => {
    if (err) {
        console.error('❌ Erreur:', err.message);
    } else {
        console.log('✅ Table demandes_echange créée avec succès !');
    }
    db.close();
});