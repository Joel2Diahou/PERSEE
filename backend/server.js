// backend/server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
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

// ✅ Gestion des requêtes OPTIONS (préflight)
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

// ... le reste du code

// ============ BASE DE DONNÉES ============
const dbPath = path.join(__dirname, 'database', 'school.db');

// Créer le dossier database s'il n'existe pas
if (!fs.existsSync(path.join(__dirname, 'database'))) {
  fs.mkdirSync(path.join(__dirname, 'database'), { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erreur BD:', err.message);
    process.exit(1);
  }
  console.log('✅ Connecté à SQLite');
});

app.set('db', db);

// ============ CRÉATION DES TABLES ============
db.serialize(() => {
  // Table élèves
  db.run(`
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
    )
  `);

  // Table users (parent, tuteur, admin)
  db.run(`
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
    )
  `);

  console.log('✅ Tables créées/vérifiées');
});

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

// ============ INSERTION DES DONNÉES DE TEST ============
db.serialize(() => {
  // Admin
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`
    INSERT OR IGNORE INTO users (nom, prenom, email, password, telephone, role)
    VALUES ('Admin', 'School', 'admin@school.ci', ?, '0101010101', 'admin')
  `, [adminPassword]);

  // Parent
  const parentPassword = bcrypt.hashSync('parent123', 10);
  db.run(`
    INSERT OR IGNORE INTO users (nom, prenom, email, password, telephone, role)
    VALUES ('Kouadio', 'Marie', 'parent@test.ci', ?, '0707070707', 'parent')
  `, [parentPassword]);

  // Tuteur
  const tuteurPassword = bcrypt.hashSync('tuteur123', 10);
  db.run(`
    INSERT OR IGNORE INTO users (nom, prenom, email, password, telephone, role, est_volontaire, matieres_preferees)
    VALUES ('Traoré', 'Fatou', 'tuteur@test.ci', ?, '0707070708', 'tuteur', 1, '["Mathématiques","Physique-Chimie"]')
  `, [tuteurPassword]);

  // Élèves
  db.run(`
    INSERT OR IGNORE INTO eleves (nom, prenom, matricule, classe, etablissement, ville, quartier)
    VALUES ('Konan', 'Jean', 'SCH001', '3eme', 'Collège Moderne', 'Abidjan', 'Cocody')
  `);
  db.run(`
    INSERT OR IGNORE INTO eleves (nom, prenom, matricule, classe, etablissement, ville, quartier)
    VALUES ('Bamba', 'Amina', 'SCH002', 'Terminale', 'Lycée Moderne', 'Abidjan', 'Plateau')
  `);

  console.log('✅ Comptes de test créés');
});

// ============ ROUTES AUTH ============

// 🔹 INSCRIPTION ÉLÈVE
app.post('/api/auth/register-eleve', (req, res) => {
  const { nom, prenom, matricule, classe, etablissement, ville, quartier } = req.body;
  
  if (!nom || !prenom || !matricule || !classe || !etablissement || !ville || !quartier) {
    return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
  }

  db.run(`
    INSERT INTO eleves (nom, prenom, matricule, classe, etablissement, ville, quartier)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [nom, prenom, matricule, classe, etablissement, ville, quartier], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ success: false, message: 'Ce matricule existe déjà' });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({ success: true, message: 'Élève inscrit avec succès' });
  });
});

// 🔹 CONNEXION ÉLÈVE
app.post('/api/auth/login-eleve', (req, res) => {
  const { nom, prenom, matricule } = req.body;

  if (!nom || !prenom || !matricule) {
    return res.status(400).json({ success: false, message: 'Nom, prénom et matricule requis' });
  }

  db.get(`
    SELECT * FROM eleves WHERE nom = ? AND prenom = ? AND matricule = ?
  `, [nom, prenom, matricule], (err, eleve) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
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
  });
});

// 🔹 INSCRIPTION USER (Parent / Tuteur)
app.post('/api/auth/register-user', (req, res) => {
  const { nom, prenom, email, password, telephone, role } = req.body;

  if (!nom || !prenom || !email || !password || !telephone) {
    return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userRole = role || 'parent';

  db.run(`
    INSERT INTO users (nom, prenom, email, password, telephone, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [nom, prenom, email, hashedPassword, telephone, userRole], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ success: false, message: 'Cet email existe déjà' });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({ success: true, message: 'Compte créé avec succès' });
  });
});

// 🔹 CONNEXION USER (Parent / Tuteur)
app.post('/api/auth/login-user', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
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
  });
});

// 🔹 ROUTE DEVENIR TUTEUR
app.post('/api/tutor/devenir', verifyToken, (req, res) => {
  const userId = req.user.id;
  const { matieres } = req.body;

  if (!matieres || matieres.length === 0) {
    return res.status(400).json({ success: false, message: 'Sélectionne au moins une matière' });
  }

  db.run(`
    UPDATE users 
    SET role = 'tuteur', 
        est_volontaire = 1, 
        matieres_preferees = ?
    WHERE id = ?
  `, [JSON.stringify(matieres), userId], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({ success: true, message: 'Vous êtes maintenant tuteur ! 🎉' });
  });
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

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json(rows || []);
  });
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

// ============ GESTION DES ERREURS ============
process.on('uncaughtException', (err) => {
  console.error('❌ Erreur non capturée:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Promesse non gérée:', err);
});