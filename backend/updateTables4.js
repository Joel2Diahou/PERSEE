// backend/updateTables4.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'school.db');
const db = new sqlite3.Database(dbPath);

const sql = `
-- 1. Table des examens
CREATE TABLE IF NOT EXISTS examens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titre TEXT NOT NULL,
    matiere TEXT NOT NULL,
    niveau TEXT NOT NULL,
    serie TEXT,
    contenu TEXT,
    fichier_original TEXT,
    date_publication DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table des questions d'examen
CREATE TABLE IF NOT EXISTS questions_examen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    examen_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    options TEXT,
    reponse_correcte TEXT,
    FOREIGN KEY (examen_id) REFERENCES examens(id)
);

-- 3. Table des résultats d'examen (élèves)
CREATE TABLE IF NOT EXISTS resultats_examen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    examen_id INTEGER NOT NULL,
    eleve_id INTEGER,
    user_id INTEGER,
    score INTEGER,
    total INTEGER,
    reponses TEXT,
    date_completion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (examen_id) REFERENCES examens(id)
);
`;

console.log('🚀 Création des tables examens...');

db.exec(sql, (err) => {
    if (err) {
        console.error('❌ Erreur:', err.message);
    } else {
        console.log('✅ Tables créées avec succès !');
        console.log('   - examens');
        console.log('   - questions_examen');
        console.log('   - resultats_examen');
    }
    db.close();
});