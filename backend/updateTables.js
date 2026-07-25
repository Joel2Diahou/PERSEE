// backend/updateTables.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'school.db');
const db = new sqlite3.Database(dbPath);

const sql = `
-- 1. Table des leçons (gérées par admin)
CREATE TABLE IF NOT EXISTS lecons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titre TEXT NOT NULL,
    contenu TEXT NOT NULL,
    matiere TEXT NOT NULL,
    niveau TEXT NOT NULL,
    serie TEXT,
    resume_ia TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table des exercices (gérées par admin)
CREATE TABLE IF NOT EXISTS exercices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matiere TEXT NOT NULL,
    niveau TEXT NOT NULL,
    serie TEXT,
    enonce TEXT NOT NULL,
    solution TEXT,
    difficulte TEXT DEFAULT 'moyen',
    type_question TEXT DEFAULT 'qcm',
    options TEXT,
    reponse_correcte TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table des matières par série (gérées par admin)
CREATE TABLE IF NOT EXISTS matieres_serie (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serie TEXT NOT NULL,
    matiere TEXT NOT NULL,
    niveau TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Insertion des matières par défaut pour chaque série
INSERT OR IGNORE INTO matieres_serie (serie, matiere, niveau) VALUES
('C', 'Mathématiques', 'Terminale'),
('C', 'Physique-Chimie', 'Terminale'),
('C', 'Anglais', 'Terminale'),
('C', 'Philosophie', 'Terminale'),
('C', 'Histoire-Géo', 'Terminale'),
('D', 'SVT', 'Terminale'),
('D', 'Physique-Chimie', 'Terminale'),
('D', 'Anglais', 'Terminale'),
('D', 'Philosophie', 'Terminale'),
('D', 'Histoire-Géo', 'Terminale'),
('A', 'Littérature', 'Terminale'),
('A', 'Philosophie', 'Terminale'),
('A', 'Anglais', 'Terminale'),
('A', 'Histoire-Géo', 'Terminale'),
('A', 'Espagnol', 'Terminale'),
('G', 'Comptabilité', 'Terminale'),
('G', 'Gestion', 'Terminale'),
('G', 'Anglais', 'Terminale'),
('G', 'Philosophie', 'Terminale'),
('G', 'Histoire-Géo', 'Terminale'),
('G', 'Maths', 'Terminale'),
('F', 'Maths', 'Terminale'),
('F', 'Sciences Tech', 'Terminale'),
('F', 'Anglais', 'Terminale'),
('F', 'Philosophie', 'Terminale'),
('F', 'Histoire-Géo', 'Terminale'),
('3eme', 'Mathématiques', '3ème'),
('3eme', 'Français', '3ème'),
('3eme', 'Anglais', '3ème'),
('3eme', 'SVT', '3ème'),
('3eme', 'Physique-Chimie', '3ème'),
('3eme', 'Histoire-Géo', '3ème');
`;

db.exec(sql, (err) => {
    if (err) {
        console.error('❌ Erreur:', err.message);
    } else {
        console.log('✅ Tables créées avec succès !');
        console.log('   - lecons');
        console.log('   - exercices');
        console.log('   - matieres_serie');
        console.log('📚 Matières par série insérées');
    }
    db.close();
});