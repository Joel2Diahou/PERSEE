// backend/updateTables5.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'school.db');
const db = new sqlite3.Database(dbPath);

const sql = `
-- 1. Table des disponibilités des tuteurs
CREATE TABLE IF NOT EXISTS disponibilites_tuteur (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tuteur_id INTEGER NOT NULL,
    jour TEXT NOT NULL,
    heure_debut TEXT NOT NULL,
    heure_fin TEXT NOT NULL,
    actif INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tuteur_id) REFERENCES users(id)
);

-- 2. Table des rendez-vous
CREATE TABLE IF NOT EXISTS rendez_vous (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eleve_id INTEGER NOT NULL,
    tuteur_id INTEGER NOT NULL,
    disponibilite_id INTEGER NOT NULL,
    date_rendezvous DATE NOT NULL,
    heure_debut TEXT NOT NULL,
    heure_fin TEXT NOT NULL,
    statut TEXT DEFAULT 'en_attente',
    message_eleve TEXT,
    date_demande DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_confirmation DATETIME,
    FOREIGN KEY (eleve_id) REFERENCES eleves(id),
    FOREIGN KEY (tuteur_id) REFERENCES users(id),
    FOREIGN KEY (disponibilite_id) REFERENCES disponibilites_tuteur(id)
);

-- 3. Table des paiements Wave
CREATE TABLE IF NOT EXISTS paiements_wave (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    montant INTEGER NOT NULL,
    reference TEXT,
    statut TEXT DEFAULT 'en_attente',
    date_paiement DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
`;

console.log('🚀 Création des tables disponibilités...');

db.exec(sql, (err) => {
    if (err) {
        console.error('❌ Erreur:', err.message);
    } else {
        console.log('✅ Tables créées avec succès !');
        console.log('   - disponibilites_tuteur');
        console.log('   - rendez_vous');
        console.log('   - paiements_wave');
    }
    db.close();
});