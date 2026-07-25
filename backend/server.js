// backend/server.js
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============ CORS ============
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Matricule']
}));

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Matricule');
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ BASE DE DONNÉES ============
const dbPath = path.join(__dirname, 'database', 'school.db');

if (!fs.existsSync(path.join(__dirname, 'database'))) {
  fs.mkdirSync(path.join(__dirname, 'database'), { recursive: true });
}

const db = new Database(dbPath);
console.log('✅ Connecté à SQLite (better-sqlite3)');
app.set('db', db);

// ============ CRÉATION DES TABLES ============
db.exec(`
  -- Table des élèves
  CREATE TABLE IF NOT EXISTS eleves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    matricule TEXT UNIQUE NOT NULL,
    classe TEXT NOT NULL,
    etablissement TEXT NOT NULL,
    ville TEXT NOT NULL,
    quartier TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Table des utilisateurs (parent, tuteur, admin)
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    telephone TEXT,
    profession TEXT,
    role TEXT DEFAULT 'parent',
    est_volontaire INTEGER DEFAULT 0,
    matieres_preferees TEXT,
    status TEXT DEFAULT 'horsligne',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Table des disponibilités des tuteurs
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

  -- Table des rendez-vous
  CREATE TABLE IF NOT EXISTS rendez_vous (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eleve_id INTEGER NOT NULL,
    tuteur_id INTEGER NOT NULL,
    matiere TEXT,
    niveau TEXT,
    date_rendezvous DATE NOT NULL,
    heure_debut TEXT NOT NULL,
    heure_fin TEXT NOT NULL,
    statut TEXT DEFAULT 'en_attente',
    message_eleve TEXT,
    date_demande DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_confirmation DATETIME,
    FOREIGN KEY (eleve_id) REFERENCES eleves(id),
    FOREIGN KEY (tuteur_id) REFERENCES users(id)
  );

  -- Table des notifications
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tuteur_id INTEGER NOT NULL,
    eleve_id INTEGER NOT NULL,
    matiere TEXT,
    niveau TEXT,
    date_souhaitee TEXT,
    heure_souhaitee TEXT,
    message TEXT,
    type TEXT DEFAULT 'demande_tutorat',
    statut TEXT DEFAULT 'en_attente',
    lue INTEGER DEFAULT 0,
    date_reponse TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tuteur_id) REFERENCES users(id),
    FOREIGN KEY (eleve_id) REFERENCES eleves(id)
  );

  -- Table des annonces BOOKMATCH
  CREATE TABLE IF NOT EXISTS annonces_livres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    eleve_id INTEGER,
    titre_livre TEXT NOT NULL,
    auteur TEXT,
    matiere TEXT,
    niveau TEXT,
    etat TEXT,
    type_echange TEXT,
    ville TEXT NOT NULL,
    quartier TEXT,
    etablissement TEXT,
    statut TEXT DEFAULT 'disponible',
    type_depot TEXT DEFAULT '📚 Livre',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Table des demandes d'échange de livres
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

  -- Table des quiz
  CREATE TABLE IF NOT EXISTS quiz (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matiere TEXT NOT NULL,
    niveau TEXT NOT NULL,
    question TEXT NOT NULL,
    type_question TEXT NOT NULL,
    options TEXT,
    reponse_correcte TEXT NOT NULL,
    difficulte TEXT,
    serie TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Table des réponses aux quiz
  CREATE TABLE IF NOT EXISTS reponses_quiz (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    eleve_id INTEGER,
    quiz_id INTEGER NOT NULL,
    reponse_donnee TEXT NOT NULL,
    est_correcte INTEGER NOT NULL,
    temps_secondes INTEGER,
    date_reponse DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Table des leçons
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

  -- Table des examens
  CREATE TABLE IF NOT EXISTS examens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titre TEXT NOT NULL,
    matiere TEXT NOT NULL,
    niveau TEXT NOT NULL,
    serie TEXT,
    contenu TEXT,
    date_publication DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Table des sujets proposés
  CREATE TABLE IF NOT EXISTS sujets_proposes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titre TEXT NOT NULL,
    matiere TEXT NOT NULL,
    niveau TEXT NOT NULL,
    description TEXT,
    eleve_id INTEGER,
    eleve_nom TEXT,
    fichier_path TEXT,
    photo_path TEXT,
    analyse_ia TEXT,
    statut TEXT DEFAULT 'en_attente',
    date_validation DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Table des domaines (orientation)
  CREATE TABLE IF NOT EXISTS domaines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    icon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Table des filières (orientation)
  CREATE TABLE IF NOT EXISTS filieres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domaine_id INTEGER NOT NULL,
    nom TEXT NOT NULL,
    description TEXT,
    recherche_ia TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (domaine_id) REFERENCES domaines(id)
  );

  -- Table des métiers (orientation)
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

  -- Table des écoles
  CREATE TABLE IF NOT EXISTS ecoles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    ville TEXT NOT NULL,
    quartier TEXT,
    filieres TEXT,
    contact TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Table parent_eleves (liaison parent-enfant)
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

  -- Table des statistiques emploi
  CREATE TABLE IF NOT EXISTS emploi_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metier TEXT NOT NULL,
    secteur TEXT,
    salaire_min INTEGER,
    salaire_max INTEGER,
    demande TEXT,
    source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('✅ Tables créées/vérifiées');

// ============ INSERTION DES DONNÉES DE TEST ============
const adminPassword = bcrypt.hashSync('admin123', 10);
const parentPassword = bcrypt.hashSync('parent123', 10);
const tuteurPassword = bcrypt.hashSync('tuteur123', 10);

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (nom, prenom, email, password, telephone, role, est_volontaire, matieres_preferees, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertUser.run('Admin', 'School', 'admin@school.ci', adminPassword, '0101010101', 'admin', 0, null, 'enligne');
insertUser.run('Kouadio', 'Marie', 'parent@test.ci', parentPassword, '0707070707', 'parent', 0, null, 'enligne');
insertUser.run('Traoré', 'Fatou', 'tuteur@test.ci', tuteurPassword, '0707070708', 'tuteur', 1, '["Mathématiques","Physique-Chimie"]', 'enligne');

const insertEleve = db.prepare(`
  INSERT OR IGNORE INTO eleves (nom, prenom, matricule, classe, etablissement, ville, quartier)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertEleve.run('Konan', 'Jean', 'SCH001', '3eme', 'Collège Moderne', 'Abidjan', 'Cocody');
insertEleve.run('Bamba', 'Amina', 'SCH002', 'Terminale', 'Lycée Moderne', 'Abidjan', 'Plateau');
insertEleve.run('Diomandé', 'Koffi', 'SCH003', 'Seconde', 'Collège de Bouaké', 'Bouaké', 'Centre');

// Lier parent à enfant
const parent = db.prepare('SELECT id FROM users WHERE email = ?').get('parent@test.ci');
if (parent) {
  const enfant = db.prepare('SELECT id FROM eleves WHERE matricule = ?').get('SCH001');
  if (enfant) {
    db.prepare(`
      INSERT OR IGNORE INTO parent_eleves (parent_id, eleve_id) VALUES (?, ?)
    `).run(parent.id, enfant.id);
  }
}

// Insertion de questions quiz
const quizData = [
  ['Mathématiques', '3eme', 'Quelle est la racine carrée de 144 ?', 'qcm', '["10","11","12","13"]', '12', 'debutant', null],
  ['Mathématiques', '3eme', 'Si x = 3, que vaut 2x² + 5 ?', 'qcm', '["17","23","18","21"]', '23', 'intermediaire', null],
  ['Mathématiques', '3eme', 'Le théorème de Pythagore s\'applique dans quel type de triangle ?', 'qcm', '["Quelconque","Isocèle","Rectangle","Équilatéral"]', 'Rectangle', 'debutant', null],
  ['Français', '3eme', 'Quel est le pluriel de "cheval" ?', 'qcm', '["chevaux","chevaus","chevals","chevalx"]', 'chevaux', 'debutant', null],
  ['Français', '3eme', 'Le verbe "manger" à l\'imparfait (je) :', 'qcm', '["je mange","je mangeais","je mangerai","j\'ai mangé"]', 'je mangeais', 'debutant', null],
  ['Anglais', '3eme', 'Comment dit-on "Bonjour" en anglais ?', 'qcm', '["Goodbye","Hello","Thanks","Please"]', 'Hello', 'debutant', null],
  ['Anglais', '3eme', 'Comment dit-on "Merci" en anglais ?', 'qcm', '["Please","Sorry","Thank you","Hello"]', 'Thank you', 'debutant', null],
  ['SVT', '3eme', 'Quel est l\'organe qui pompe le sang ?', 'qcm', '["Cerveau","Poumon","Coeur","Foie"]', 'Coeur', 'debutant', null],
  ['SVT', '3eme', 'La photosynthèse se déroule dans :', 'qcm', '["Racines","Tiges","Feuilles","Fleurs"]', 'Feuilles', 'debutant', null],
  ['Mathématiques', 'terminale', 'La dérivée de ln(x) est :', 'qcm', '["1/x","x","e^x","ln(x)"]', '1/x', 'difficile', 'C'],
  ['Mathématiques', 'terminale', 'La limite de sin(x)/x quand x tend vers 0 est :', 'qcm', '["0","1","∞","-1"]', '1', 'difficile', 'C'],
  ['SVT', 'terminale', 'La mitose permet :', 'qcm', '["Division cellulaire","Fécondation","Mutation","Transcription"]', 'Division cellulaire', 'intermediaire', 'D'],
  ['SVT', 'terminale', 'L\'ADN est composé de :', 'qcm', '["Acides aminés","Nucléotides","Glucides","Lipides"]', 'Nucléotides', 'intermediaire', 'D'],
];

const insertQuiz = db.prepare(`
  INSERT OR IGNORE INTO quiz (matiere, niveau, question, type_question, options, reponse_correcte, difficulte, serie)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

quizData.forEach(q => {
  try {
    insertQuiz.run(q[0], q[1], q[2], q[3], q[4], q[5], q[6], q[7]);
  } catch (e) {}
});

console.log('✅ Comptes de test et données créés');

// ============ MIDDLEWARE AUTH ============
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token manquant' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token invalide' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Accès refusé. Admin requis.' });
  }
};

// ============ ROUTES AUTH ============

// 🔹 INSCRIPTION ÉLÈVE
app.post('/api/auth/register-eleve', (req, res) => {
  const { nom, prenom, matricule, classe, etablissement, ville, quartier } = req.body;
  
  if (!nom || !prenom || !matricule || !classe || !etablissement || !ville || !quartier) {
    return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO eleves (nom, prenom, matricule, classe, etablissement, ville, quartier)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(nom, prenom, matricule, classe, etablissement, ville, quartier);
    res.json({ success: true, message: 'Élève inscrit avec succès' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: 'Ce matricule existe déjà' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 🔹 CONNEXION ÉLÈVE
app.post('/api/auth/login-eleve', (req, res) => {
  const { nom, prenom, matricule } = req.body;

  if (!nom || !prenom || !matricule) {
    return res.status(400).json({ success: false, message: 'Nom, prénom et matricule requis' });
  }

  try {
    const stmt = db.prepare(`
      SELECT * FROM eleves WHERE nom = ? AND prenom = ? AND matricule = ?
    `);
    const eleve = stmt.get(nom, prenom, matricule);

    if (!eleve) {
      return res.status(401).json({ success: false, message: 'Matricule incorrect' });
    }

    const token = jwt.sign(
      { id: eleve.id, matricule: eleve.matricule, role: 'eleve', nom: eleve.nom, prenom: eleve.prenom },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      eleve: {
        id: eleve.id,
        nom: eleve.nom,
        prenom: eleve.prenom,
        matricule: eleve.matricule,
        classe: eleve.classe,
        etablissement: eleve.etablissement,
        ville: eleve.ville,
        quartier: eleve.quartier
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 🔹 INSCRIPTION USER (Parent / Tuteur)
app.post('/api/auth/register-user', (req, res) => {
  const { nom, prenom, email, password, telephone, role } = req.body;

  if (!nom || !prenom || !email || !password || !telephone) {
    return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const userRole = role || 'parent';

    const stmt = db.prepare(`
      INSERT INTO users (nom, prenom, email, password, telephone, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(nom, prenom, email, hashedPassword, telephone, userRole);
    res.json({ success: true, message: 'Compte créé avec succès' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: 'Cet email existe déjà' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 🔹 CONNEXION USER (Parent / Tuteur)
app.post('/api/auth/login-user', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
  }

  try {
    const stmt = db.prepare(`SELECT * FROM users WHERE email = ?`);
    const user = stmt.get(email);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============ ROUTES ADMIN ============

// Récupérer les stats
app.get('/api/admin/stats/:type', verifyToken, isAdmin, (req, res) => {
  const { type } = req.params;
  const tables = {
    eleves: 'eleves',
    users: 'users',
    quiz: 'quiz',
    ecoles: 'ecoles',
    lecons: 'lecons',
    annonces: 'annonces_livres',
    tuteurs: 'users WHERE role = "tuteur" OR est_volontaire = 1',
    sessions: 'rendez_vous',
    domaines: 'domaines',
    filieres: 'filieres',
    metiers: 'metiers'
  };

  const table = tables[type];
  if (!table) {
    return res.status(404).json({ success: false, message: 'Type non trouvé' });
  }

  try {
    const stmt = db.prepare(`SELECT COUNT(*) as count FROM ${table}`);
    const result = stmt.get();
    res.json({ count: result.count || 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Récupérer tous les utilisateurs
app.get('/api/admin/users', verifyToken, isAdmin, (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT id, nom, prenom, email, telephone, role, created_at
      FROM users ORDER BY created_at DESC
    `);
    res.json(stmt.all() || []);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Récupérer tous les élèves
app.get('/api/admin/eleves', verifyToken, isAdmin, (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT id, nom, prenom, matricule, classe, etablissement, ville, quartier, created_at
      FROM eleves ORDER BY created_at DESC
    `);
    res.json(stmt.all() || []);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Récupérer les tuteurs
app.get('/api/admin/tuteurs', verifyToken, isAdmin, (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT id, nom, prenom, email, matieres_preferees, est_volontaire, role, created_at
      FROM users WHERE role = 'tuteur' OR est_volontaire = 1
      ORDER BY created_at DESC
    `);
    res.json(stmt.all() || []);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Valider un tuteur
app.put('/api/admin/tuteurs/:id', verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { valider } = req.body;

  try {
    if (valider) {
      db.prepare(`
        UPDATE users SET role = 'tuteur', est_volontaire = 1, status = 'enligne' WHERE id = ?
      `).run(id);
      res.json({ success: true, message: '✅ Tuteur validé' });
    } else {
      db.prepare(`
        UPDATE users SET role = 'parent', est_volontaire = 0 WHERE id = ?
      `).run(id);
      res.json({ success: true, message: '❌ Tuteur refusé' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============ ROUTES TUTEUR ============

// Devenir tuteur
app.post('/api/tutor/devenir', verifyToken, (req, res) => {
  const userId = req.user.id;
  const { matieres, classes, profession } = req.body;

  if (!matieres || matieres.length === 0) {
    return res.status(400).json({ success: false, message: 'Sélectionne au moins une matière' });
  }

  try {
    const stmt = db.prepare(`
      UPDATE users 
      SET role = 'tuteur', 
          est_volontaire = 1, 
          matieres_preferees = ?,
          profession = ?,
          status = 'enligne'
      WHERE id = ?
    `);
    stmt.run(JSON.stringify(matieres), profession || null, userId);
    res.json({ success: true, message: 'Félicitations ! Vous êtes maintenant tuteur ! 🎉' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Rechercher des tuteurs
app.get('/api/tutor/search', verifyToken, (req, res) => {
  const { matiere } = req.query;

  try {
    let sql = `
      SELECT id, nom, prenom, email, matieres_preferees as matieres, role, status
      FROM users 
      WHERE (role = 'tuteur' OR est_volontaire = 1) AND status = 'enligne'
    `;
    const params = [];

    if (matiere) {
      sql += ` AND matieres_preferees LIKE ?`;
      params.push(`%${matiere}%`);
    }

    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);
    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Récupérer les disponibilités d'un tuteur
app.get('/api/tutor/disponibilites/:tuteurId', verifyToken, (req, res) => {
  const { tuteurId } = req.params;

  try {
    const stmt = db.prepare(`
      SELECT * FROM disponibilites_tuteur WHERE tuteur_id = ? AND actif = 1
      ORDER BY 
        CASE jour 
          WHEN 'lundi' THEN 1 WHEN 'mardi' THEN 2 WHEN 'mercredi' THEN 3
          WHEN 'jeudi' THEN 4 WHEN 'vendredi' THEN 5 WHEN 'samedi' THEN 6
          WHEN 'dimanche' THEN 7
        END, heure_debut
    `);
    res.json(stmt.all(tuteurId) || []);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Ajouter une disponibilité
app.post('/api/tutor/disponibilites', verifyToken, (req, res) => {
  const userId = req.user.id;
  const { jour, heure_debut, heure_fin } = req.body;

  if (!jour || !heure_debut || !heure_fin) {
    return res.status(400).json({ success: false, message: 'Jour, heure début et heure fin requis' });
  }

  if (heure_debut >= heure_fin) {
    return res.status(400).json({ success: false, message: 'L\'heure de début doit être avant l\'heure de fin' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO disponibilites_tuteur (tuteur_id, jour, heure_debut, heure_fin)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(userId, jour, heure_debut, heure_fin);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Supprimer une disponibilité
app.delete('/api/tutor/disponibilites/:id', verifyToken, (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const stmt = db.prepare(`
      UPDATE disponibilites_tuteur SET actif = 0 WHERE id = ? AND tuteur_id = ?
    `);
    stmt.run(id, userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Créer un rendez-vous
app.post('/api/tutor/rendez-vous', verifyToken, (req, res) => {
  const userId = req.user.id;
  const { tuteur_id, date_rendezvous, heure_debut, heure_fin, matiere, niveau, message } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO rendez_vous (eleve_id, tuteur_id, date_rendezvous, heure_debut, heure_fin, matiere, niveau, message_eleve, statut)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'en_attente')
    `);
    const result = stmt.run(userId, tuteur_id, date_rendezvous, heure_debut, heure_fin, matiere, niveau, message || null);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Récupérer les rendez-vous d'un tuteur
app.get('/api/tutor/mes-rendez-vous', verifyToken, (req, res) => {
  const userId = req.user.id;

  try {
    const stmt = db.prepare(`
      SELECT r.*, e.nom as eleve_nom, e.prenom as eleve_prenom
      FROM rendez_vous r
      JOIN eleves e ON r.eleve_id = e.id
      WHERE r.tuteur_id = ?
      ORDER BY r.date_rendezvous DESC
    `);
    res.json(stmt.all(userId) || []);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Confirmer un rendez-vous
app.put('/api/tutor/rendez-vous/:id/confirmer', verifyToken, (req, res) => {
  const { id } = req.params;
  const { statut } = req.body;

  try {
    db.prepare(`
      UPDATE rendez_vous SET statut = ?, date_confirmation = CURRENT_TIMESTAMP WHERE id = ?
    `).run(statut, id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============ ROUTES PARENT ============

// Récupérer les enfants d'un parent
app.get('/api/parent/enfants', verifyToken, (req, res) => {
  const userId = req.user.id;

  try {
    const stmt = db.prepare(`
      SELECT e.* FROM eleves e
      JOIN parent_eleves pe ON e.id = pe.eleve_id
      WHERE pe.parent_id = ?
    `);
    res.json({ success: true, enfants: stmt.all(userId) || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Lier un enfant à un parent
app.post('/api/parent/lier', verifyToken, (req, res) => {
  const userId = req.user.id;
  const { matricule } = req.body;

  if (!matricule) {
    return res.status(400).json({ success: false, message: 'Matricule requis' });
  }

  try {
    const eleve = db.prepare('SELECT id FROM eleves WHERE matricule = ?').get(matricule);
    if (!eleve) {
      return res.status(404).json({ success: false, message: 'Élève non trouvé' });
    }

    const existing = db.prepare('SELECT id FROM parent_eleves WHERE parent_id = ? AND eleve_id = ?').get(userId, eleve.id);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Cet enfant est déjà lié' });
    }

    db.prepare('INSERT INTO parent_eleves (parent_id, eleve_id) VALUES (?, ?)').run(userId, eleve.id);
    res.json({ success: true, message: 'Enfant lié avec succès' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Récupérer les statistiques d'un enfant
app.get('/api/parent/stats/:eleveId', verifyToken, (req, res) => {
  const { eleveId } = req.params;

  try {
    // Récupérer les réponses aux quiz
    const reponses = db.prepare(`
      SELECT r.*, q.matiere FROM reponses_quiz r
      JOIN quiz q ON r.quiz_id = q.id
      WHERE r.eleve_id = ?
    `).all(eleveId) || [];

    // Calculer les moyennes par matière
    const moyennes = {};
    reponses.forEach(r => {
      if (!moyennes[r.matiere]) {
        moyennes[r.matiere] = { total: 0, count: 0 };
      }
      moyennes[r.matiere].total += r.est_correcte || 0;
      moyennes[r.matiere].count += 1;
    });

    const moyennesFinales = {};
    for (const [matiere, data] of Object.entries(moyennes)) {
      moyennesFinales[matiere] = data.count > 0 ? (data.total / data.count) * 20 : 0;
    }

    res.json({
      success: true,
      stats: {
        moyennes: moyennesFinales,
        total_quiz: reponses.length,
        moyenne_generale: Object.values(moyennesFinales).length > 0 
          ? (Object.values(moyennesFinales).reduce((a, b) => a + b, 0) / Object.values(moyennesFinales).length).toFixed(1)
          : 'N/A'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============ ROUTES BOOKMATCH ============

// Créer une annonce
app.post('/api/book/annonces', verifyToken, (req, res) => {
  const userId = req.user.id;
  const { titre_livre, auteur, matiere, niveau, type_echange, ville, quartier, etablissement, description } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO annonces_livres (user_id, titre_livre, auteur, matiere, niveau, type_echange, ville, quartier, etablissement, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(userId, titre_livre, auteur || null, matiere || null, niveau || null, type_echange || 'don', ville, quartier || null, etablissement || null, description || null);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Récupérer les annonces
app.get('/api/book/annonces', verifyToken, (req, res) => {
  const { ville, matiere, niveau } = req.query;

  try {
    let sql = `
      SELECT a.*, u.nom, u.prenom FROM annonces_livres a
      JOIN users u ON a.user_id = u.id
      WHERE a.statut = 'disponible'
    `;
    const params = [];

    if (ville) {
      sql += ` AND a.ville = ?`;
      params.push(ville);
    }
    if (matiere) {
      sql += ` AND a.matiere = ?`;
      params.push(matiere);
    }
    if (niveau) {
      sql += ` AND a.niveau = ?`;
      params.push(niveau);
    }

    sql += ` ORDER BY a.created_at DESC`;
    const stmt = db.prepare(sql);
    res.json(stmt.all(...params) || []);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Supprimer une annonce
app.delete('/api/book/annonces/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const stmt = db.prepare(`DELETE FROM annonces_livres WHERE id = ? AND user_id = ?`);
    stmt.run(id, userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Demander un livre
app.post('/api/book/demander', verifyToken, (req, res) => {
  const userId = req.user.id;
  const { annonceId } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO demandes_echange (annonce_id, demandeur_id) VALUES (?, ?)
    `);
    stmt.run(annonceId, userId);
    res.json({ success: true, message: 'Demande envoyée' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============ ROUTES PRÉPAFLASH ============

// Récupérer les quiz
app.get('/api/prepa/quiz', verifyToken, (req, res) => {
  const { niveau, matiere, limit = 10 } = req.query;

  try {
    let sql = `SELECT * FROM quiz WHERE 1=1`;
    const params = [];

    if (niveau) {
      sql += ` AND niveau = ?`;
      params.push(niveau);
    }
    if (matiere) {
      sql += ` AND matiere = ?`;
      params.push(matiere);
    }

    sql += ` ORDER BY RANDOM() LIMIT ?`;
    params.push(parseInt(limit));

    const stmt = db.prepare(sql);
    res.json({ success: true, quiz: stmt.all(...params) || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Sauvegarder une réponse de quiz
app.post('/api/prepa/save-result', verifyToken, (req, res) => {
  const userId = req.user.id;
  const { quiz_id, reponse_donnee, est_correcte, temps_secondes } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO reponses_quiz (user_id, quiz_id, reponse_donnee, est_correcte, temps_secondes)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(userId, quiz_id, reponse_donnee, est_correcte ? 1 : 0, temps_secondes || null);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============ ROUTES ORIENTATION ============

// Chat orientation (simulé pour l'instant)
app.post('/api/orientation/chat', verifyToken, (req, res) => {
  const { message } = req.body;

  const responses = {
    'filiere': '🎓 Les principales filières en Côte d\'Ivoire sont : Scientifique (C, D), Littéraire (A), Technique (F, G).',
    'maths': '📐 Les maths sont importantes pour les séries C, D et F. Tu as des aptitudes ?',
    'science': '🔬 Les sciences sont enseignées en séries C, D et F. La SVT est en série D.',
    'defaut': '🤔 Intéressant ! Parle-moi de tes centres d\'intérêt : matières préférées, métiers qui t\'attirent...'
  };

  let response = responses.defaut;
  const msg = message.toLowerCase();
  if (msg.includes('filiere') || msg.includes('série') || msg.includes('orientation')) {
    response = responses.filiere;
  } else if (msg.includes('math')) {
    response = responses.maths;
  } else if (msg.includes('science') || msg.includes('svt')) {
    response = responses.science;
  }

  setTimeout(() => {
    res.json({ success: true, response });
  }, 300);
});

// ============ ROUTES ADMIN - GESTION DES DOMAINES, FILIÈRES, MÉTIERS ============

// Domaines
app.get('/api/admin/domaines', verifyToken, isAdmin, (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM domaines ORDER BY nom').all() || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/domaines', verifyToken, isAdmin, (req, res) => {
  const { nom, icon } = req.body;
  if (!nom) return res.status(400).json({ error: 'Nom requis' });
  try {
    const result = db.prepare('INSERT INTO domaines (nom, icon) VALUES (?, ?)').run(nom, icon || '📁');
    res.json({ id: result.lastInsertRowid, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/domaines/:id', verifyToken, isAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM domaines WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Filières
app.get('/api/admin/filieres', verifyToken, isAdmin, (req, res) => {
  try {
    res.json(db.prepare(`
      SELECT f.*, d.nom as domaine_nom FROM filieres f
      LEFT JOIN domaines d ON f.domaine_id = d.id
      ORDER BY f.nom
    `).all() || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/filieres', verifyToken, isAdmin, (req, res) => {
  const { domaine_id, nom, description } = req.body;
  if (!domaine_id || !nom) return res.status(400).json({ error: 'Domaine et nom requis' });
  try {
    const result = db.prepare('INSERT INTO filieres (domaine_id, nom, description) VALUES (?, ?, ?)').run(domaine_id, nom, description || null);
    res.json({ id: result.lastInsertRowid, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/filieres/:id', verifyToken, isAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM filieres WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Métiers
app.get('/api/admin/metiers', verifyToken, isAdmin, (req, res) => {
  const { filiere_id } = req.query;
  try {
    let sql = `SELECT m.*, f.nom as filiere_nom FROM metiers m LEFT JOIN filieres f ON m.filiere_id = f.id`;
    const params = [];
    if (filiere_id) {
      sql += ` WHERE m.filiere_id = ?`;
      params.push(filiere_id);
    }
    sql += ` ORDER BY m.nom`;
    res.json(db.prepare(sql).all(...params) || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/metiers', verifyToken, isAdmin, (req, res) => {
  const { filiere_id, nom, salaire, demande, description } = req.body;
  if (!filiere_id || !nom) return res.status(400).json({ error: 'Filière et nom requis' });
  try {
    const result = db.prepare('INSERT INTO metiers (filiere_id, nom, salaire, demande, description) VALUES (?, ?, ?, ?, ?)')
      .run(filiere_id, nom, salaire || null, demande || 'Moyennement recherché', description || null);
    res.json({ id: result.lastInsertRowid, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/metiers/:id', verifyToken, isAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM metiers WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/filieres/:id/metiers', verifyToken, isAdmin, (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM metiers WHERE filiere_id = ? ORDER BY nom').all(req.params.id) || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ ROUTE SANTÉ ============
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ============ ROUTE ROOT ============
app.get('/', (req, res) => {
  res.json({
    project: 'PERSEE',
    version: '1.0.0',
    status: '🚀 En ligne',
    endpoints: {
      auth: '/api/auth',
      tutor: '/api/tutor',
      parent: '/api/parent',
      book: '/api/book',
      prepa: '/api/prepa',
      admin: '/api/admin',
      health: '/api/health'
    }
  });
});

// ============ DÉMARRAGE ============
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 PERSEE Backend démarré sur http://0.0.0.0:${PORT}`);
  console.log(`📱 Accessible sur :`);
  console.log(`   → http://localhost:${PORT}`);
  console.log(`📋 Comptes de test :`);
  console.log(`   👑 Admin: admin@school.ci / admin123`);
  console.log(`   👨‍👩‍👧‍👦 Parent: parent@test.ci / parent123`);
  console.log(`   👨‍🏫 Tuteur: tuteur@test.ci / tuteur123`);
  console.log(`   👨‍🎓 Élèves: SCH001, SCH002, SCH003`);
  console.log(`✅ Prêt !\n`);
});