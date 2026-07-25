// backend/updateTables2.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'school.db');
const db = new sqlite3.Database(dbPath);

const sql = `
-- 1. Table des domaines
CREATE TABLE IF NOT EXISTS domaines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL UNIQUE,
    icon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table des filières (améliorée)
CREATE TABLE IF NOT EXISTS filieres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domaine_id INTEGER,
    nom TEXT NOT NULL,
    description TEXT,
    recherche_ia TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (domaine_id) REFERENCES domaines(id)
);

-- 3. Table des métiers (débouchés)
CREATE TABLE IF NOT EXISTS metiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filiere_id INTEGER NOT NULL,
    nom TEXT NOT NULL,
    salaire TEXT,
    demande TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (filiere_id) REFERENCES filieres(id)
);

-- 4. Table des écoles (recréée proprement)
-- Sauvegarder les données existantes
CREATE TABLE IF NOT EXISTS ecoles_backup AS SELECT * FROM ecoles;

-- Supprimer l'ancienne table
DROP TABLE IF EXISTS ecoles;

-- Recréer la table avec toutes les colonnes
CREATE TABLE ecoles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    ville TEXT NOT NULL,
    quartier TEXT,
    latitude TEXT,
    longitude TEXT,
    site_web TEXT,
    contact TEXT,
    description TEXT,
    image TEXT DEFAULT '🏫',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Restaurer les données (seulement les colonnes qui existaient)
INSERT INTO ecoles (id, nom, ville, quartier, contact)
SELECT id, nom, ville, quartier, contact FROM ecoles_backup;

-- Supprimer la table de backup
DROP TABLE IF EXISTS ecoles_backup;

-- 5. Table de liaison écoles-filières
CREATE TABLE IF NOT EXISTS ecoles_filieres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ecole_id INTEGER NOT NULL,
    filiere_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ecole_id) REFERENCES ecoles(id),
    FOREIGN KEY (filiere_id) REFERENCES filieres(id),
    UNIQUE(ecole_id, filiere_id)
);

-- 6. Insertion des domaines par défaut
INSERT OR IGNORE INTO domaines (nom, icon) VALUES
('Sciences et Technologies', '🔬'),
('Sante et Medecine', '🏥'),
('Droit et Justice', '⚖️'),
('Commerce et Gestion', '💰'),
('Arts et Lettres', '🎨'),
('Construction et BTP', '🏗️'),
('Informatique et Digital', '💻');

-- 7. Insertion des filières par défaut
INSERT OR IGNORE INTO filieres (domaine_id, nom, description) VALUES
((SELECT id FROM domaines WHERE nom = 'Informatique et Digital'), 'IDA (Ingenierie de Donnees et Analyse)', 'Formation en analyse de donnees, big data et intelligence artificielle'),
((SELECT id FROM domaines WHERE nom = 'Informatique et Digital'), 'GL (Genie Logiciel)', 'Developpement de logiciels, conception et programmation'),
((SELECT id FROM domaines WHERE nom = 'Sante et Medecine'), 'Medecine Generale', 'Formation pour devenir medecin generaliste'),
((SELECT id FROM domaines WHERE nom = 'Sante et Medecine'), 'Pharmacie', 'Formation en pharmacie et sciences pharmaceutiques'),
((SELECT id FROM domaines WHERE nom = 'Droit et Justice'), 'Droit des Affaires', 'Formation en droit commercial et des societes'),
((SELECT id FROM domaines WHERE nom = 'Commerce et Gestion'), 'Gestion des Entreprises', 'Formation en management, finance et marketing'),
((SELECT id FROM domaines WHERE nom = 'Sciences et Technologies'), 'Genie Civil', 'Formation en construction et infrastructures'),
((SELECT id FROM domaines WHERE nom = 'Arts et Lettres'), 'Journalisme', 'Formation en communication et medias');

-- 8. Insertion des métiers par défaut
INSERT OR IGNORE INTO metiers (filiere_id, nom, salaire, demande) VALUES
((SELECT id FROM filieres WHERE nom = 'IDA (Ingenierie de Donnees et Analyse)'), 'Data Scientist', '450 000 - 1 200 000 FCFA', 'Tres recherche'),
((SELECT id FROM filieres WHERE nom = 'IDA (Ingenierie de Donnees et Analyse)'), 'Data Analyst', '350 000 - 800 000 FCFA', 'Tres recherche'),
((SELECT id FROM filieres WHERE nom = 'GL (Genie Logiciel)'), 'Developpeur Full Stack', '350 000 - 800 000 FCFA', 'Tres recherche'),
((SELECT id FROM filieres WHERE nom = 'GL (Genie Logiciel)'), 'Architecte Logiciel', '500 000 - 1 200 000 FCFA', 'Metier d avenir'),
((SELECT id FROM filieres WHERE nom = 'Medecine Generale'), 'Medecin Generaliste', '600 000 - 1 500 000 FCFA', 'Tres recherche'),
((SELECT id FROM filieres WHERE nom = 'Pharmacie'), 'Pharmacien', '400 000 - 800 000 FCFA', 'Moyennement recherche'),
((SELECT id FROM filieres WHERE nom = 'Droit des Affaires'), 'Avocat', '500 000 - 1 500 000 FCFA', 'Moyennement recherche'),
((SELECT id FROM filieres WHERE nom = 'Gestion des Entreprises'), 'Chef d Entreprise', '1 000 000 - 5 000 000 FCFA', 'Metier d avenir'),
((SELECT id FROM filieres WHERE nom = 'Genie Civil'), 'Ingenieur BTP', '400 000 - 850 000 FCFA', 'Tres recherche'),
((SELECT id FROM filieres WHERE nom = 'Journalisme'), 'Journaliste', '250 000 - 500 000 FCFA', 'Moyennement recherche');

-- 9. Insertion des écoles par défaut
INSERT OR IGNORE INTO ecoles (nom, ville, quartier, site_web, contact, description) VALUES
('INPHB Yamoussoukro', 'Yamoussoukro', 'Cite Administrative', 'https://www.inphb.ci', '27 22 44 56 00', 'Institut National Polytechnique - Reference pour les filieres scientifiques et techniques'),
('ETIC Abidjan', 'Abidjan', 'Cocody', 'https://www.etic.ci', '27 22 44 55 66', 'Ecole des Technologies de l Information et de la Communication'),
('UFR Medecine Abidjan', 'Abidjan', 'Cocody', 'https://www.ufr-medecine.ci', '27 22 44 55 77', 'Unite de Formation et de Recherche en Medecine'),
('Universite Felix Houphouet-Boigny', 'Abidjan', 'Cocody', 'https://www.univ-fhb.ci', '27 22 44 55 88', 'Plus grande universite de Cote d Ivoire'),
('ESG Abidjan', 'Abidjan', 'Plateau', 'https://www.esg.ci', '27 22 44 55 99', 'Ecole Superieure de Gestion'),
('CESTI Abidjan', 'Abidjan', 'Cocody', 'https://www.cesti.ci', '27 22 44 56 00', 'Centre d Etudes des Sciences et Techniques de l Information');

-- 10. Liaison écoles-filières
INSERT OR IGNORE INTO ecoles_filieres (ecole_id, filiere_id) VALUES
((SELECT id FROM ecoles WHERE nom = 'INPHB Yamoussoukro'), (SELECT id FROM filieres WHERE nom = 'IDA (Ingenierie de Donnees et Analyse)')),
((SELECT id FROM ecoles WHERE nom = 'INPHB Yamoussoukro'), (SELECT id FROM filieres WHERE nom = 'Genie Civil')),
((SELECT id FROM ecoles WHERE nom = 'ETIC Abidjan'), (SELECT id FROM filieres WHERE nom = 'IDA (Ingenierie de Donnees et Analyse)')),
((SELECT id FROM ecoles WHERE nom = 'ETIC Abidjan'), (SELECT id FROM filieres WHERE nom = 'GL (Genie Logiciel)')),
((SELECT id FROM ecoles WHERE nom = 'UFR Medecine Abidjan'), (SELECT id FROM filieres WHERE nom = 'Medecine Generale')),
((SELECT id FROM ecoles WHERE nom = 'UFR Medecine Abidjan'), (SELECT id FROM filieres WHERE nom = 'Pharmacie')),
((SELECT id FROM ecoles WHERE nom = 'Universite Felix Houphouet-Boigny'), (SELECT id FROM filieres WHERE nom = 'Droit des Affaires')),
((SELECT id FROM ecoles WHERE nom = 'Universite Felix Houphouet-Boigny'), (SELECT id FROM filieres WHERE nom = 'Gestion des Entreprises')),
((SELECT id FROM ecoles WHERE nom = 'ESG Abidjan'), (SELECT id FROM filieres WHERE nom = 'Gestion des Entreprises')),
((SELECT id FROM ecoles WHERE nom = 'CESTI Abidjan'), (SELECT id FROM filieres WHERE nom = 'Journalisme'));
`;

console.log('🚀 Création des nouvelles tables...');

db.exec(sql, (err) => {
    if (err) {
        console.error('❌ Erreur:', err.message);
    } else {
        console.log('✅ Tables créées avec succès !');
        console.log('   - domaines');
        console.log('   - filieres');
        console.log('   - metiers');
        console.log('   - ecoles (recréée avec toutes les colonnes)');
        console.log('   - ecoles_filieres');
        console.log('📚 Données par défaut insérées');
    }
    db.close();
});