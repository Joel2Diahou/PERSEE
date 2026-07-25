// backend/initDB.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Supprimer l'ancienne base si elle existe
const dbPath = path.join(__dirname, 'database', 'school.db');

// Lire le schéma SQL
const sqlSchema = fs.readFileSync(path.join(__dirname, 'database', 'database.sql'), 'utf8');

// Connexion à la base (crée le fichier s'il n'existe pas)
const db = new sqlite3.Database(dbPath);

console.log('🚀 Création de la base de données...\n');

// Exécuter le schéma
db.exec(sqlSchema, (err) => {
    if (err) {
        console.error('❌ Erreur création tables:', err.message);
        db.close();
        return;
    }
    
    console.log('✅ Tables créées avec succès !\n');

    // ============ COMPTES DE TEST ============
    
    // 1. ADMIN
    const adminPassword = bcrypt.hashSync('admin123', 10);
    db.run(`
        INSERT OR IGNORE INTO users (nom, prenom, email, password, telephone, role) 
        VALUES ('Admin', 'School', 'admin@school.ci', ?, '0101010101', 'admin')
    `, [adminPassword], function(err) {
        if (err) console.error('❌ Erreur admin:', err.message);
        else console.log('✅ Admin créé: admin@school.ci / admin123');
    });

    // 2. PARENT
    const parentPassword = bcrypt.hashSync('parent123', 10);
    db.run(`
        INSERT OR IGNORE INTO users (nom, prenom, email, password, telephone, role) 
        VALUES ('Kouadio', 'Marie', 'parent@test.ci', ?, '0707070707', 'parent')
    `, [parentPassword], function(err) {
        if (err) console.error('❌ Erreur parent:', err.message);
        else console.log('✅ Parent créé: parent@test.ci / parent123');
    });

    // 3. TUTEUR
    const tuteurPassword = bcrypt.hashSync('tuteur123', 10);
    db.run(`
        INSERT OR IGNORE INTO users (nom, prenom, email, password, telephone, role, est_volontaire, matieres_preferees) 
        VALUES ('Traoré', 'Fatou', 'tuteur@test.ci', ?, '0707070708', 'tuteur', 1, '["Mathématiques","Physique-Chimie"]')
    `, [tuteurPassword], function(err) {
        if (err) console.error('❌ Erreur tuteur:', err.message);
        else console.log('✅ Tuteur créé: tuteur@test.ci / tuteur123');
    });

    // 4. ÉLÈVE
    db.run(`
        INSERT OR IGNORE INTO eleves (nom, prenom, matricule, classe, etablissement, ville, quartier) 
        VALUES ('Konan', 'Jean', 'SCH001', '3eme', 'Collège Moderne', 'Abidjan', 'Cocody')
    `, function(err) {
        if (err) console.error('❌ Erreur élève:', err.message);
        else console.log('✅ Élève créé: SCH001 (Konan Jean)');
    });

    // 5. Deuxième élève
    db.run(`
        INSERT OR IGNORE INTO eleves (nom, prenom, matricule, classe, etablissement, ville, quartier) 
        VALUES ('Bamba', 'Amina', 'SCH002', 'Terminale', 'Lycée Moderne', 'Abidjan', 'Plateau')
    `, function(err) {
        if (err) console.error('❌ Erreur élève:', err.message);
        else console.log('✅ Élève créé: SCH002 (Bamba Amina)');
    });

    // 6. Troisième élève
    db.run(`
        INSERT OR IGNORE INTO eleves (nom, prenom, matricule, classe, etablissement, ville, quartier) 
        VALUES ('Diomandé', 'Koffi', 'SCH003', 'Seconde', 'Collège de Bouaké', 'Bouaké', 'Centre')
    `, function(err) {
        if (err) console.error('❌ Erreur élève:', err.message);
        else console.log('✅ Élève créé: SCH003 (Diomandé Koffi)');
    });

    // 7. Lier parent à enfant
    db.get(`SELECT id FROM users WHERE email = 'parent@test.ci'`, (err, parent) => {
        if (err || !parent) return;
        db.get(`SELECT id FROM eleves WHERE matricule = 'SCH001'`, (err, eleve) => {
            if (err || !eleve) return;
            db.run(`
                INSERT OR IGNORE INTO parent_eleves (parent_id, eleve_id) 
                VALUES (?, ?)
            `, [parent.id, eleve.id], function(err) {
                if (!err) console.log('✅ Parent lié à l\'élève SCH001');
            });
        });
    });

    // ============ QUESTIONS DE TEST ============
    setTimeout(() => {
        const questions = [
            // Maths 3ème
            ['Mathématiques', '3eme', 'Quelle est la racine carrée de 144 ?', 'qcm', '["10","11","12","13"]', '12', 'debutant', null],
            ['Mathématiques', '3eme', 'Si x = 3, que vaut 2x² + 5 ?', 'qcm', '["17","23","18","21"]', '23', 'intermediaire', null],
            ['Mathématiques', '3eme', 'Le théorème de Pythagore s\'applique dans quel type de triangle ?', 'qcm', '["Quelconque","Isocèle","Rectangle","Équilatéral"]', 'Rectangle', 'debutant', null],
            
            // Français 3ème
            ['Français', '3eme', 'Quel est le pluriel de "cheval" ?', 'qcm', '["chevaux","chevaus","chevals","chevalx"]', 'chevaux', 'debutant', null],
            ['Français', '3eme', 'Le verbe "manger" à l\'imparfait (je) :', 'qcm', '["je mange","je mangeais","je mangerai","j\'ai mangé"]', 'je mangeais', 'debutant', null],
            
            // Anglais 3ème
            ['Anglais', '3eme', 'Comment dit-on "Bonjour" en anglais ?', 'qcm', '["Goodbye","Hello","Thanks","Please"]', 'Hello', 'debutant', null],
            ['Anglais', '3eme', 'Comment dit-on "Merci" en anglais ?', 'qcm', '["Please","Sorry","Thank you","Hello"]', 'Thank you', 'debutant', null],
            
            // SVT 3ème
            ['SVT', '3eme', 'Quel est l\'organe qui pompe le sang ?', 'qcm', '["Cerveau","Poumon","Coeur","Foie"]', 'Coeur', 'debutant', null],
            ['SVT', '3eme', 'La photosynthèse se déroule dans :', 'qcm', '["Racines","Tiges","Feuilles","Fleurs"]', 'Feuilles', 'debutant', null],
            
            // Maths Terminale C
            ['Mathématiques', 'terminale', 'La dérivée de ln(x) est :', 'qcm', '["1/x","x","e^x","ln(x)"]', '1/x', 'difficile', 'C'],
            ['Mathématiques', 'terminale', 'La limite de sin(x)/x quand x tend vers 0 est :', 'qcm', '["0","1","∞","-1"]', '1', 'difficile', 'C'],
            
            // SVT Terminale D
            ['SVT', 'terminale', 'La mitose permet :', 'qcm', '["Division cellulaire","Fécondation","Mutation","Transcription"]', 'Division cellulaire', 'intermediaire', 'D'],
            ['SVT', 'terminale', 'L\'ADN est composé de :', 'qcm', '["Acides aminés","Nucléotides","Glucides","Lipides"]', 'Nucléotides', 'intermediaire', 'D'],
        ];

        let inserted = 0;
        const stmt = db.prepare(`
            INSERT INTO quiz (matiere, niveau, question, type_question, options, reponse_correcte, difficulte, serie)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        questions.forEach(q => {
            stmt.run(q, function(err) {
                if (!err) inserted++;
            });
        });

        stmt.finalize(() => {
            console.log(`\n✅ ${inserted} questions ajoutées !`);
            console.log('\n========================================');
            console.log('📋 COMPTES DE TEST');
            console.log('========================================');
            console.log('👑 Admin:  admin@school.ci     / admin123');
            console.log('👨‍👩‍👧‍👦 Parent: parent@test.ci     / parent123');
            console.log('👨‍🏫 Tuteur: tuteur@test.ci     / tuteur123');
            console.log('👨‍🎓 Élèves: SCH001, SCH002, SCH003');
            console.log('========================================\n');
            
            db.close();
            console.log('✅ Base de données prête !');
        });
    }, 500);
});