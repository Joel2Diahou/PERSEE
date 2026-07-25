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

// Gestion des requêtes OPTIONS
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

// ============ BASE DE DONNÉES (better-sqlite3) ============
const dbPath = path.join(__dirname, 'database', 'school.db');

// Créer le dossier database s'il n'existe pas
if (!fs.existsSync(path.join(__dirname, 'database'))) {
  fs.mkdirSync(path.join(__dirname, 'database'), { recursive: true });
}

const db = new Database(dbPath);
console.log('✅ Connecté à SQLite (better-sqlite3)');

app.set('db', db);

// ============ CRÉATION DES TABLES ============
db.exec(`
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

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    telephone TEXT,
    role TEXT DEFAULT 'parent',
    est_volontaire INTEGER DEFAULT 0,
    matieres_preferees TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('✅ Tables créées/vérifiées');

// ============ INSERTION DES DONNÉES DE TEST ============
const adminPassword = bcrypt.hashSync('admin123', 10);
const parentPassword = bcrypt.hashSync('parent123', 10);
const tuteurPassword = bcrypt.hashSync('tuteur123', 10);

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (nom, prenom, email, password, telephone, role, est_volontaire, matieres_preferees)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

insertUser.run('Admin', 'School', 'admin@school.ci', adminPassword, '0101010101', 'admin', 0, null);
insertUser.run('Kouadio', 'Marie', 'parent@test.ci', parentPassword, '0707070707', 'parent', 0, null);
insertUser.run('Traoré', 'Fatou', 'tuteur@test.ci', tuteurPassword, '0707070708', 'tuteur', 1, '["Mathématiques","Physique-Chimie"]');

const insertEleve = db.prepare(`
  INSERT OR IGNORE INTO eleves (nom, prenom, matricule, classe, etablissement, ville, quartier)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertEleve.run('Konan', 'Jean', 'SCH001', '3eme', 'Collège Moderne', 'Abidjan', 'Cocody');
insertEleve.run('Bamba', 'Amina', 'SCH002', 'Terminale', 'Lycée Moderne', 'Abidjan', 'Plateau');

console.log('✅ Comptes de test créés');

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
    const result = stmt.run(nom, prenom, matricule, classe, etablissement, ville, quartier);
    res.json({ success: true, message: 'Élève inscrit avec succès', id: result.lastInsertRowid });
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
    const result = stmt.run(nom, prenom, email, hashedPassword, telephone, userRole);
    res.json({ success: true, message: 'Compte créé avec succès', id: result.lastInsertRowid });
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

// 🔹 ROUTE DEVENIR TUTEUR
app.post('/api/tutor/devenir', verifyToken, (req, res) => {
  const userId = req.user.id;
  const { matieres } = req.body;

  if (!matieres || matieres.length === 0) {
    return res.status(400).json({ success: false, message: 'Sélectionne au moins une matière' });
  }

  try {
    const stmt = db.prepare(`
      UPDATE users 
      SET role = 'tuteur', 
          est_volontaire = 1, 
          matieres_preferees = ?
      WHERE id = ?
    `);
    stmt.run(JSON.stringify(matieres), userId);
    res.json({ success: true, message: 'Vous êtes maintenant tuteur ! 🎉' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 🔹 ROUTE POUR RÉCUPÉRER LES TUTEURS
app.get('/api/tutor/search', verifyToken, (req, res) => {
  const { matiere } = req.query;

  let sql = `
    SELECT id, nom, prenom, email, matieres_preferees as matieres, role
    FROM users 
    WHERE role = 'tuteur' OR est_volontaire = 1
  `;
  const params = [];

  if (matiere) {
    sql += ` AND matieres_preferees LIKE ?`;
    params.push(`%${matiere}%`);
  }

  try {
    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);
    res.json(rows || []);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 🔹 ROUTE SANTÉ
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 🔹 ROUTE ROOT
app.get('/', (req, res) => {
  res.json({ 
    project: 'PERSEE', 
    version: '1.0.0',
    status: '🚀 En ligne',
    endpoints: {
      auth: '/api/auth',
      tutor: '/api/tutor',
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
  console.log(`   👨‍🎓 Élèves: SCH001, SCH002`);
  console.log(`✅ Prêt !\n`);
});