// backend/server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Groq = require('groq-sdk');
const multer = require('multer');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});


// Liste des origines autorisées
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://192.168.43.232:3000',
  'http://192.168.43.232:5000',
  'https://joyful-praline-56c366.netlify.app',
  'https://*.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permettre les requêtes sans origine (apps mobiles, postman, etc.)
    if (!origin) return callback(null, true);
    
    // Vérifier si l'origine est autorisée
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        // Pour les wildcards comme *.netlify.app
        const pattern = allowed.replace('*', '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('❌ CORS bloqué pour:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Matricule',
    'Accept',
    'Origin',
    'X-Requested-With'
  ],
  exposedHeaders: ['Content-Length', 'X-Requested-With']
}));

// Gérer les requêtes OPTIONS (préflight)
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dbPath = path.join(__dirname, 'database', 'school.db');

function initDatabase(callback) {
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('❌ Erreur BD:', err.message);
            process.exit(1);
        }
        console.log('✅ Connecté à SQLite');

        const createTables = `
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
            

            CREATE TABLE IF NOT EXISTS domaines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nom TEXT NOT NULL,
                icon TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS filieres (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                domaine_id INTEGER NOT NULL,
                nom TEXT NOT NULL,
                description TEXT,
                recherche_ia TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (domaine_id) REFERENCES domaines(id)
            );

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

            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nom TEXT NOT NULL,
                prenom TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                profession TEXT,
                telephone TEXT,
                role TEXT DEFAULT 'parent',
                est_volontaire INTEGER DEFAULT 0,
                matieres_preferees TEXT,
                bio TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS ecoles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nom TEXT NOT NULL,
                ville TEXT NOT NULL,
                quartier TEXT,
                filieres TEXT,
                contact TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
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
                annales INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
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
                etablissement TEXT NOT NULL,
                statut TEXT DEFAULT 'disponible',
                type_depot TEXT DEFAULT '📚 Livre',
                serie TEXT,
                description TEXT,
                etat_activite TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS sessions_tutorat (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                eleve_id INTEGER NOT NULL,
                tuteur_id INTEGER NOT NULL,
                matiere TEXT NOT NULL,
                message_demande TEXT,
                statut TEXT DEFAULT 'en_attente',
                date_session DATETIME,
                duree_minutes INTEGER,
                evaluation_eleve INTEGER,
                commentaire TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

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
                FOREIGN KEY (eleve_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                endpoint TEXT NOT NULL,
                keys_auth TEXT NOT NULL,
                keys_p256dh TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

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

            CREATE TABLE IF NOT EXISTS matieres_serie (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                serie TEXT NOT NULL,
                matiere TEXT NOT NULL,
                niveau TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS examens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titre TEXT NOT NULL,
                matiere TEXT NOT NULL,
                niveau TEXT NOT NULL,
                serie TEXT,
                contenu TEXT,
                date_publication DATETIME DEFAULT CURRENT_TIMESTAMP
            );

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
        `;

        db.exec(createTables, (err) => {
            if (err) console.error('❌ Erreur création tables:', err);
            else console.log('✅ Tables vérifiées');
            callback(null, db);
        });
    });
}
// ============ CONFIGURATION MULTER POUR LES UPLOADS ============

// Configuration du stockage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// Filtrer les types de fichiers
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (file.fieldname === 'fichier') {
        if (allowedTypes.includes(file.type) || file.originalname.match(/\.(pdf|doc|docx)$/)) {
            cb(null, true);
        } else {
            cb(new Error('Type de fichier non autorisé. Utilisez PDF, DOC ou DOCX.'), false);
        }
    } else if (file.fieldname === 'photo') {
        if (allowedImageTypes.includes(file.type) || file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
            cb(null, true);
        } else {
            cb(new Error('Type d\'image non autorisé. Utilisez JPG, PNG, GIF ou WEBP.'), false);
        }
    } else {
        cb(null, true);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Middleware pour servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// ============ MIDDLEWARES ============
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

const verifyAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const matricule = req.headers['x-matricule'];
    
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            return next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Token invalide' });
        }
    }
    if (matricule) {
        req.matricule = matricule;
        return next();
    }
    return res.status(401).json({ success: false, message: 'Authentification requise' });
};

// ============ SERVEUR HTTP POUR SOCKET.IO ============
const http = require('http');
const { Server } = require('socket.io');
const webpush = require('web-push');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ============ NOTIFICATIONS PUSH ============
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:schoolplus@ci.ci',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ============ FONCTION UNIQUE D'ENVOI DE NOTIFICATION PUSH ============
function sendPushNotification(userId, title, body, url = '/dashboard', data = {}) {
  const db = app.get('db');
  
  db.all(`SELECT * FROM push_subscriptions WHERE user_id = ?`, [userId], (err, subscriptions) => {
    if (err || !subscriptions || subscriptions.length === 0) {
      console.log(`📨 Aucun abonnement push pour l'utilisateur ${userId}`);
      return;
    }

    const payload = JSON.stringify({
      title: title,
      body: body,
      url: url,
      data: data
    });

    subscriptions.forEach(sub => {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.keys_auth,
          p256dh: sub.keys_p256dh
        }
      };

      webpush.sendNotification(subscription, payload)
        .then(() => {
          console.log(`✅ Notification push envoyée à l'utilisateur ${userId}`);
        })
        .catch(err => {
          console.error(`❌ Erreur envoi push à ${userId}:`, err.message);
          if (err.statusCode === 410) {
            db.run(`DELETE FROM push_subscriptions WHERE endpoint = ?`, [sub.endpoint]);
          }
        });
    });
  });
}

// ============ SOCKET.IO ============
io.on('connection', (socket) => {
  console.log('🟢 Nouvelle connexion Socket:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`📌 ${socket.id} a rejoint la salle ${roomId}`);
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`📌 ${socket.id} a quitté la salle ${roomId}`);
  });

  socket.on('draw', (data) => {
    socket.to(data.roomId).emit('draw', data);
  });

  socket.on('clear-board', (roomId) => {
    socket.to(roomId).emit('clear-board');
  });

  socket.on('chat-message', (data) => {
    socket.to(data.roomId).emit('chat-message', {
      userId: data.userId,
      message: data.message,
      date: new Date().toISOString()
    });
    
    // Envoyer une notification push au destinataire
    const db = app.get('db');
    db.get(`SELECT prenom, nom FROM users WHERE id = ?`, [data.userId], (err, user) => {
      if (!err && user) {
        sendPushNotification(
          data.destinataireId,
          `💬 Message de ${user.prenom} ${user.nom}`,
          data.message.substring(0, 60) + '...',
          '/messagerie'
        );
      }
    });
  });

  socket.on('start-recording', (roomId) => {
    socket.to(roomId).emit('start-recording');
  });

  socket.on('stop-recording', (roomId) => {
    socket.to(roomId).emit('stop-recording');
  });

  socket.on('disconnect', () => {
    console.log('🔴 Déconnexion:', socket.id);
  });
});

// ============ ROUTES AUTH ============
const registerEleve = (req, res) => {
    const db = req.app.get('db');
    const { nom, prenom, matricule, classe, etablissement, ville, quartier } = req.body;
    if (!nom || !prenom || !matricule || !classe || !etablissement || !ville || !quartier) {
        return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
    }
    db.run(`INSERT INTO eleves (nom, prenom, matricule, classe, etablissement, ville, quartier) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nom, prenom, matricule, classe, etablissement, ville, quartier], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) return res.status(409).json({ success: false, message: 'Matricule existe déjà' });
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, message: 'Élève inscrit' });
        });
};

const loginEleve = (req, res) => {
    const db = req.app.get('db');
    const { nom, prenom, matricule } = req.body;
    db.get(`SELECT * FROM eleves WHERE nom = ? AND prenom = ? AND matricule = ?`, [nom, prenom, matricule], (err, eleve) => {
        if (err || !eleve) return res.status(401).json({ success: false, message: 'Matricule incorrect' });
        res.json({ success: true, message: 'Connexion réussie', matricule: eleve.matricule, eleve });
    });
};

const registerUser = (req, res) => {
    const db = req.app.get('db');
    const { nom, prenom, email, password, profession, telephone, role } = req.body;
    
    if (!nom || !prenom || !email || !password || !telephone) {
        return res.status(400).json({ success: false, message: 'Champs obligatoires manquants' });
    }
    
    const userRole = role || 'parent';
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    db.run(`INSERT INTO users (nom, prenom, email, password, profession, telephone, role) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nom, prenom, email, hashedPassword, profession || null, telephone, userRole],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) return res.status(409).json({ success: false, message: 'Email existe déjà' });
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, message: 'Compte créé avec succès', role: userRole });
        });
};

const loginUser = (req, res) => {
    const db = req.app.get('db');
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err || !user) return res.status(401).json({ success: false, message: 'Email incorrect' });
        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) return res.status(401).json({ success: false, message: 'Mot de passe incorrect' });
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, message: 'Connexion réussie', token, user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role } });
    });
};

// ============ ROUTES NOTIFICATIONS PUSH ============
app.post('/api/notification/subscribe', verifyAuth, (req, res) => {
  const db = req.app.get('db');
  const userId = req.user?.id;
  const { subscription } = req.body;

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ success: false, message: 'Abonnement invalide' });
  }

  db.run(`
    INSERT OR REPLACE INTO push_subscriptions (user_id, endpoint, keys_auth, keys_p256dh)
    VALUES (?, ?, ?, ?)
  `, [
    userId,
    subscription.endpoint,
    subscription.keys?.auth || '',
    subscription.keys?.p256dh || ''
  ], (err) => {
    if (err) {
      console.error('Erreur sauvegarde abonnement:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({ success: true, message: 'Abonnement enregistré' });
  });
});

app.delete('/api/notification/unsubscribe', verifyAuth, (req, res) => {
  const db = req.app.get('db');
  const userId = req.user?.id;
  const { endpoint } = req.body;

  db.run(`
    DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?
  `, [userId, endpoint], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Abonnement supprimé' });
  });
});

app.post('/api/notification/test', verifyAuth, (req, res) => {
  const userId = req.user?.id;
  const { title, body } = req.body;
  
  sendPushNotification(
    userId, 
    title || '🔔 Test notification', 
    body || 'Ceci est une notification de test', 
    '/dashboard'
  );
  
  res.json({ success: true, message: 'Notification envoyée' });
});
// ============ ROUTES AUTH - VERSION CORRIGÉE ============

// ===== LOGIN ÉLÈVE (avec token) =====
app.post('/api/auth/login-eleve', (req, res) => {
    const db = req.app.get('db');
    const { nom, prenom, matricule } = req.body;
    
    if (!nom || !prenom || !matricule) {
        return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
    }
    
    db.get(`SELECT * FROM eleves WHERE nom = ? AND prenom = ? AND matricule = ?`, 
        [nom, prenom, matricule], 
        (err, eleve) => {
            if (err) {
                console.error('❌ Erreur login:', err);
                return res.status(500).json({ success: false, message: 'Erreur serveur' });
            }
            if (!eleve) {
                return res.status(401).json({ success: false, message: 'Matricule incorrect' });
            }
            
            // ✅ Générer un token JWT
            const token = jwt.sign(
                { 
                    id: eleve.id, 
                    matricule: eleve.matricule,
                    role: 'eleve',
                    nom: eleve.nom,
                    prenom: eleve.prenom
                }, 
                process.env.JWT_SECRET, 
                { expiresIn: '7d' }
            );
            
            res.json({ 
                success: true, 
                message: 'Connexion réussie',
                token: token,
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
        }
    );
});

// ===== LOGIN PARENT =====
app.post('/api/auth/login-parent', (req, res) => {
    const db = req.app.get('db');
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }
    
    db.get(`SELECT * FROM users WHERE email = ? AND role = 'parent'`, [email], (err, user) => {
        if (err || !user) {
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

// ===== LOGIN TUTEUR =====
app.post('/api/auth/login-tuteur', (req, res) => {
    const db = req.app.get('db');
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }
    
    db.get(`SELECT * FROM users WHERE email = ? AND (role = 'tuteur' OR est_volontaire = 1)`, [email], (err, user) => {
        if (err || !user) {
            return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
        }
        
        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role || 'tuteur' },
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
                role: user.role || 'tuteur'
            }
        });
    });
});

// ===== REGISTER PARENT =====
app.post('/api/auth/register-parent', (req, res) => {
    const db = req.app.get('db');
    const { nom, prenom, email, password, telephone } = req.body;
    
    if (!nom || !prenom || !email || !password || !telephone) {
        return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    db.run(
        `INSERT INTO users (nom, prenom, email, password, telephone, role) VALUES (?, ?, ?, ?, ?, 'parent')`,
        [nom, prenom, email, hashedPassword, telephone],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(409).json({ success: false, message: 'Cet email existe déjà' });
                }
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, message: 'Compte parent créé avec succès' });
        }
    );
});

// ===== REGISTER TUTEUR =====
app.post('/api/auth/register-tuteur', (req, res) => {
    const db = req.app.get('db');
    const { nom, prenom, email, password, telephone, matieres } = req.body;
    
    if (!nom || !prenom || !email || !password || !telephone) {
        return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    db.run(
        `INSERT INTO users (nom, prenom, email, password, telephone, role, est_volontaire, matieres_preferees) 
         VALUES (?, ?, ?, ?, ?, 'tuteur', 1, ?)`,
        [nom, prenom, email, hashedPassword, telephone, JSON.stringify(matieres || [])],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(409).json({ success: false, message: 'Cet email existe déjà' });
                }
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, message: 'Compte tuteur créé avec succès' });
        }
    );
});
// ============ ROUTES ORIENTATION ============
const { orientationChat, recommendSchools } = require('./services/groqService');

const chatOrientation = async (req, res) => {
    const { message, niveau, historique } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message requis' });
    const result = await orientationChat(message, niveau, historique || []);
    if (result.success) {
        res.json({ success: true, response: result.response });
    } else {
        res.status(500).json({ success: false, message: 'Erreur avec l\'IA', error: result.error });
    }
};
// ============ ROUTES ADMIN - DOMAINES ============
app.get('/api/admin/domaines', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.all("SELECT * FROM domaines ORDER BY nom", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/admin/domaines', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  const { nom, icon } = req.body;
  if (!nom) return res.status(400).json({ error: 'Nom requis' });
  db.run("INSERT INTO domaines (nom, icon) VALUES (?, ?)", [nom, icon || '📁'], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, success: true });
  });
});

app.delete('/api/admin/domaines/:id', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.run("DELETE FROM domaines WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// ============ ROUTES ADMIN - FILIÈRES ============
app.get('/api/admin/filieres', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.all(`
    SELECT f.*, d.nom as domaine_nom 
    FROM filieres f
    LEFT JOIN domaines d ON f.domaine_id = d.id
    ORDER BY f.nom
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/admin/filieres', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  const { domaine_id, nom, description } = req.body;
  if (!domaine_id || !nom) return res.status(400).json({ error: 'Domaine et nom requis' });
  db.run("INSERT INTO filieres (domaine_id, nom, description) VALUES (?, ?, ?)",
    [domaine_id, nom, description || null], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, success: true });
    });
});

app.delete('/api/admin/filieres/:id', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.run("DELETE FROM filieres WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// Approfondir une filière avec l'IA
app.post('/api/admin/filieres/:id/approfondir', verifyToken, isAdmin, async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  
  db.get("SELECT * FROM filieres WHERE id = ?", [id], async (err, filiere) => {
    if (err || !filiere) return res.status(404).json({ error: 'Filière non trouvée' });
    
    try {
      const prompt = `Approfondis la filière "${filiere.nom}" en Côte d'Ivoire.
Donne:
1. Les débouchés professionnels
2. Les écoles où l'étudier
3. Les compétences requises
4. Les perspectives d'avenir

Réponds en français, de façon structurée et concise.`;
      
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "Tu es un conseiller d'orientation ivoirien expert." },
          { role: "user", content: prompt }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.5,
        max_tokens: 800
      });
      
      const analyse = completion.choices[0].message.content;
      
      db.run("UPDATE filieres SET recherche_ia = ? WHERE id = ?", [analyse, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, analyse });
      });
    } catch (error) {
      console.error('Erreur approfondir:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ============ ROUTES ADMIN - MÉTIERS ============
app.get('/api/admin/metiers', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  const { filiere_id } = req.query;
  let sql = `SELECT m.*, f.nom as filiere_nom FROM metiers m LEFT JOIN filieres f ON m.filiere_id = f.id`;
  let params = [];
  if (filiere_id) {
    sql += ` WHERE m.filiere_id = ?`;
    params.push(filiere_id);
  }
  sql += ` ORDER BY m.nom`;
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/admin/metiers', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  const { filiere_id, nom, salaire, demande, description } = req.body;
  if (!filiere_id || !nom) return res.status(400).json({ error: 'Filière et nom requis' });
  db.run("INSERT INTO metiers (filiere_id, nom, salaire, demande, description) VALUES (?, ?, ?, ?, ?)",
    [filiere_id, nom, salaire || null, demande || 'Moyennement recherché', description || null],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, success: true });
    });
});

app.delete('/api/admin/metiers/:id', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.run("DELETE FROM metiers WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

app.get('/api/admin/filieres/:id/metiers', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.all("SELECT * FROM metiers WHERE filiere_id = ? ORDER BY nom", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});
// ============ ROUTES ADMIN ============
app.get('/api/admin/stats/eleves', verifyToken, isAdmin, (req, res) => {
    const db = req.app.get('db');
    db.get("SELECT COUNT(*) as count FROM eleves", (err, row) => { res.json({ count: row?.count || 0 }); });
});

app.get('/api/admin/stats/users', verifyToken, isAdmin, (req, res) => {
    const db = req.app.get('db');
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => { res.json({ count: row?.count || 0 }); });
});

app.get('/api/admin/stats/quiz', verifyToken, isAdmin, (req, res) => {
    const db = req.app.get('db');
    db.get("SELECT COUNT(*) as count FROM quiz", (err, row) => { res.json({ count: row?.count || 0 }); });
});

app.get('/api/admin/ecoles', verifyToken, isAdmin, (req, res) => {
    const db = req.app.get('db');
    db.all("SELECT * FROM ecoles ORDER BY ville, nom", (err, rows) => { res.json(rows || []); });
});

app.post('/api/admin/ecoles', verifyToken, isAdmin, (req, res) => {
    const db = req.app.get('db');
    const { nom, ville, quartier, filieres, contact } = req.body;
    db.run("INSERT INTO ecoles (nom, ville, quartier, filieres, contact) VALUES (?, ?, ?, ?, ?)",
        [nom, ville, quartier, filieres, contact], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        });
});

app.delete('/api/admin/ecoles/:id', verifyToken, isAdmin, (req, res) => {
    const db = req.app.get('db');
    db.run("DELETE FROM ecoles WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

app.get('/api/admin/users', verifyToken, isAdmin, (req, res) => {
    const db = req.app.get('db');
    db.all("SELECT id, nom, prenom, email, role, telephone, est_volontaire, matieres_preferees, created_at FROM users", (err, rows) => {
        res.json(rows || []);
    });
});

app.delete('/api/admin/users/:id', verifyToken, isAdmin, (req, res) => {
    const db = req.app.get('db');
    db.run("DELETE FROM users WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

app.get('/api/admin/eleves', verifyToken, isAdmin, (req, res) => {
    const db = req.app.get('db');
    db.all("SELECT * FROM eleves ORDER BY created_at DESC", (err, rows) => { res.json(rows || []); });
});

app.delete('/api/admin/eleves/:id', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.run("DELETE FROM eleves WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

app.put('/api/admin/tuteurs/:id', verifyToken, isAdmin, (req, res) => {
    const db = req.app.get('db');
    const { valider } = req.body;
    db.run("UPDATE users SET role = ?, est_volontaire = ? WHERE id = ?",
        [valider ? 'tuteur' : 'parent', valider ? 1 : 0, req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ updated: this.changes });
        });
});

app.post('/api/admin/create', verifyToken, isAdmin, async (req, res) => {
    const db = req.app.get('db');
    const { nom, prenom, email, password, telephone } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.run("INSERT INTO users (nom, prenom, email, password, telephone, role) VALUES (?, ?, ?, ?, ?, 'admin')",
        [nom, prenom, email, hashedPassword, telephone], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        });
});
// ============ ROUTES ADMIN - STATS ============
app.get('/api/admin/stats/ecoles', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.get("SELECT COUNT(*) as count FROM ecoles", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: row?.count || 0 });
  });
});

app.get('/api/admin/stats/lecons', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.get("SELECT COUNT(*) as count FROM lecons", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: row?.count || 0 });
  });
});

app.get('/api/admin/stats/annonces', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.get("SELECT COUNT(*) as count FROM annonces_livres", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: row?.count || 0 });
  });
});

app.get('/api/admin/stats/tuteurs', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.get("SELECT COUNT(*) as count FROM users WHERE role = 'tuteur' OR est_volontaire = 1", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: row?.count || 0 });
  });
});

app.get('/api/admin/stats/sessions', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.get("SELECT COUNT(*) as count FROM sessions_tutorat", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: row?.count || 0 });
  });
});

app.get('/api/admin/stats/domaines', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.get("SELECT COUNT(*) as count FROM domaines", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: row?.count || 0 });
  });
});

app.get('/api/admin/stats/filieres', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.get("SELECT COUNT(*) as count FROM filieres", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: row?.count || 0 });
  });
});

app.get('/api/admin/stats/metiers', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.get("SELECT COUNT(*) as count FROM metiers", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: row?.count || 0 });
  });
});
// ============ ROUTES ADMIN - DOMAINES ============
app.get('/api/admin/domaines', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.all("SELECT * FROM domaines ORDER BY nom", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/admin/domaines', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  const { nom, icon } = req.body;
  if (!nom) return res.status(400).json({ error: 'Nom requis' });
  db.run("INSERT INTO domaines (nom, icon) VALUES (?, ?)", [nom, icon || '📁'], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, success: true });
  });
});

app.delete('/api/admin/domaines/:id', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.run("DELETE FROM domaines WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// ============ ROUTES ADMIN - FILIÈRES ============
app.get('/api/admin/filieres', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.all(`
    SELECT f.*, d.nom as domaine_nom 
    FROM filieres f
    LEFT JOIN domaines d ON f.domaine_id = d.id
    ORDER BY f.nom
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/admin/filieres', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  const { domaine_id, nom, description } = req.body;
  if (!domaine_id || !nom) return res.status(400).json({ error: 'Domaine et nom requis' });
  db.run("INSERT INTO filieres (domaine_id, nom, description) VALUES (?, ?, ?)",
    [domaine_id, nom, description || null], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, success: true });
    });
});

app.delete('/api/admin/filieres/:id', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.run("DELETE FROM filieres WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

app.post('/api/admin/filieres/:id/approfondir', verifyToken, isAdmin, async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  
  db.get("SELECT * FROM filieres WHERE id = ?", [id], async (err, filiere) => {
    if (err || !filiere) return res.status(404).json({ error: 'Filière non trouvée' });
    
    try {
      const prompt = `Approfondis la filière "${filiere.nom}" en Côte d'Ivoire.
Donne:
1. Les débouchés professionnels
2. Les écoles où l'étudier
3. Les compétences requises
4. Les perspectives d'avenir

Réponds en français, de façon structurée et concise.`;
      
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "Tu es un conseiller d'orientation ivoirien expert." },
          { role: "user", content: prompt }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.5,
        max_tokens: 800
      });
      
      const analyse = completion.choices[0].message.content;
      
      db.run("UPDATE filieres SET recherche_ia = ? WHERE id = ?", [analyse, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, analyse });
      });
    } catch (error) {
      console.error('Erreur approfondir:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// ============ ROUTES ADMIN - MÉTIERS ============
app.get('/api/admin/metiers', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  const { filiere_id } = req.query;
  let sql = `SELECT m.*, f.nom as filiere_nom FROM metiers m LEFT JOIN filieres f ON m.filiere_id = f.id`;
  let params = [];
  if (filiere_id) {
    sql += ` WHERE m.filiere_id = ?`;
    params.push(filiere_id);
  }
  sql += ` ORDER BY m.nom`;
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/admin/metiers', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  const { filiere_id, nom, salaire, demande, description } = req.body;
  if (!filiere_id || !nom) return res.status(400).json({ error: 'Filière et nom requis' });
  db.run("INSERT INTO metiers (filiere_id, nom, salaire, demande, description) VALUES (?, ?, ?, ?, ?)",
    [filiere_id, nom, salaire || null, demande || 'Moyennement recherché', description || null],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, success: true });
    });
});

app.delete('/api/admin/metiers/:id', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.run("DELETE FROM metiers WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

app.get('/api/admin/filieres/:id/metiers', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.all("SELECT * FROM metiers WHERE filiere_id = ? ORDER BY nom", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});
// ============ ROUTES EMPLOI STATS ============
app.get('/api/emploi-stats', verifyAuth, (req, res) => {
  const db = req.app.get('db');
  db.all("SELECT * FROM emploi_stats ORDER BY demande DESC, metier", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.get('/api/emploi-stats/secteurs', verifyAuth, (req, res) => {
  const db = req.app.get('db');
  db.all(`
    SELECT secteur, 
           COUNT(*) as total,
           AVG(salaire_min) as salaire_moyen_min,
           AVG(salaire_max) as salaire_moyen_max
    FROM emploi_stats 
    GROUP BY secteur 
    ORDER BY total DESC
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/ia/update-emploi-stats', verifyToken, isAdmin, async (req, res) => {
  const db = req.app.get('db');
  
  try {
    const prompt = `Donne-moi une liste des 12 métiers les plus recherchés en Côte d'Ivoire en 2025-2026.
Pour chaque métier, donne :
- metier (nom du métier)
- secteur (IT, Santé, BTP, Finance, Éducation, Agro-industrie, Commerce, Transport, Énergie, Télécoms)
- salaire_min (en FCFA, nombre entier)
- salaire_max (en FCFA, nombre entier)
- demande (parmi : "Très recherché", "Moyennement recherché", "Métier d'avenir", "Peu recherché")
- source (le nom de l'organisme ou "IA")

Réponds UNIQUEMENT avec un JSON valide.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Tu es un expert du marché de l'emploi en Côte d'Ivoire." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 2000
    });
    
    const content = completion.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    let metiers = [];
    
    if (jsonMatch) {
      metiers = JSON.parse(jsonMatch[0]);
    } else {
      metiers = JSON.parse(content);
    }
    
    if (!Array.isArray(metiers) || metiers.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun métier généré' });
    }
    
    db.run("DELETE FROM emploi_stats", function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      let inserted = 0;
      const stmt = db.prepare(`
        INSERT INTO emploi_stats (metier, secteur, salaire_min, salaire_max, demande, source)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      metiers.forEach(m => {
        stmt.run([
          m.metier,
          m.secteur || 'Autre',
          m.salaire_min || 300000,
          m.salaire_max || 600000,
          m.demande || 'Moyennement recherché',
          m.source || 'IA Groq'
        ], (err) => {
          if (!err) inserted++;
        });
      });
      
      stmt.finalize((err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ 
          success: true, 
          message: `${inserted} métiers ajoutés avec succès`,
          total: inserted
        });
      });
    });
    
  } catch (error) {
    console.error('Erreur update emploi:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// ============ ROUTE UPLOAD EDUC IA ============
app.post('/api/educIA/upload', verifyAuth, upload.array('files', 5), async (req, res) => {
  try {
    const files = req.files || [];
    
    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun fichier uploadé' });
    }

    const fileInfos = [];
    let analysis = '';

    for (const file of files) {
      const fileInfo = {
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path
      };
      fileInfos.push(fileInfo);

      // Si c'est une image, analyser avec l'IA
      if (file.mimetype.startsWith('image/')) {
        // Lire le fichier en base64
        const imageBuffer = fs.readFileSync(file.path);
        const base64Image = imageBuffer.toString('base64');
        
        // Utiliser Groq pour analyser l'image (si supporté)
        // Pour l'instant, on simule l'analyse
        analysis += `\n📷 Image: ${file.originalname} (${(file.size / 1024).toFixed(1)} KB)`;
      } else if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
        // Pour les PDF, on peut extraire le texte (simulé)
        analysis += `\n📄 PDF: ${file.originalname}`;
      } else if (file.mimetype.includes('text')) {
        // Pour les fichiers texte, lire le contenu
        const content = fs.readFileSync(file.path, 'utf-8');
        analysis += `\n📝 Texte: ${file.originalname}\n${content.substring(0, 500)}${content.length > 500 ? '...' : ''}`;
      }
    }

    res.json({
      success: true,
      message: `${files.length} fichier(s) uploadé(s) avec succès`,
      files: fileInfos,
      analysis: analysis || 'Fichiers uploadés avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur upload:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// ============ ROUTES EMPLOI STATS ============
app.get('/api/emploi-stats', verifyAuth, (req, res) => {
  const db = req.app.get('db');
  db.all("SELECT * FROM emploi_stats ORDER BY demande DESC, metier", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.get('/api/emploi-stats/secteurs', verifyAuth, (req, res) => {
  const db = req.app.get('db');
  db.all(`
    SELECT secteur, 
           COUNT(*) as total,
           AVG(salaire_min) as salaire_moyen_min,
           AVG(salaire_max) as salaire_moyen_max
    FROM emploi_stats 
    GROUP BY secteur 
    ORDER BY total DESC
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// IA - Mise à jour des statistiques de l'emploi
app.post('/api/ia/update-emploi-stats', verifyToken, isAdmin, async (req, res) => {
  const db = req.app.get('db');
  
  try {
    const prompt = `Donne-moi une liste des 12 métiers les plus recherchés en Côte d'Ivoire en 2025-2026.
Pour chaque métier, donne :
- metier (nom du métier)
- secteur (IT, Santé, BTP, Finance, Éducation, Agro-industrie, Commerce, Transport, Énergie, Télécoms)
- salaire_min (en FCFA, nombre entier)
- salaire_max (en FCFA, nombre entier)
- demande (parmi : "Très recherché", "Moyennement recherché", "Métier d'avenir", "Peu recherché")
- source (le nom de l'organisme ou "IA")

Réponds UNIQUEMENT avec un JSON valide de la forme :
[{"metier":"...", "secteur":"...", "salaire_min":..., "salaire_max":..., "demande":"...", "source":"..."}]`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Tu es un expert du marché de l'emploi en Côte d'Ivoire. Tu donnes des données réalistes." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 2000
    });
    
    const content = completion.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    let metiers = [];
    
    if (jsonMatch) {
      metiers = JSON.parse(jsonMatch[0]);
    } else {
      metiers = JSON.parse(content);
    }
    
    if (!Array.isArray(metiers) || metiers.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun métier généré' });
    }
    
    // Vider l'ancienne table et insérer les nouveaux
    db.run("DELETE FROM emploi_stats", function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      let inserted = 0;
      const stmt = db.prepare(`
        INSERT INTO emploi_stats (metier, secteur, salaire_min, salaire_max, demande, source)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      metiers.forEach(m => {
        stmt.run([
          m.metier,
          m.secteur || 'Autre',
          m.salaire_min || 300000,
          m.salaire_max || 600000,
          m.demande || 'Moyennement recherché',
          m.source || 'IA Groq'
        ], (err) => {
          if (!err) inserted++;
        });
      });
      
      stmt.finalize((err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ 
          success: true, 
          message: `${inserted} métiers ajoutés avec succès`,
          total: inserted
        });
      });
    });
    
  } catch (error) {
    console.error('Erreur update emploi:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// ============ ROUTES PRÉPAFLASH ============
app.get('/api/prepa/quiz', verifyAuth, (req, res) => {
  const db = req.app.get('db');
  const { niveau, matiere, serie, limit } = req.query;
  
  let sql = `SELECT id, question, type_question, options, reponse_correcte FROM quiz WHERE niveau = ? AND matiere = ?`;
  let params = [niveau, matiere];
  
  if (serie) {
    sql += ` AND serie = ?`;
    params.push(serie);
  }
  
  sql += ` ORDER BY RANDOM() LIMIT ?`;
  params.push(limit || 10);
  
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ quiz: rows });
  });
});

app.post('/api/prepa/save-result', verifyAuth, (req, res) => {
  const db = req.app.get('db');
  const userId = req.user?.id;
  const matricule = req.headers['x-matricule'];
  const { matiere, niveau, score, total, answers, mode } = req.body;
  
  const eleveId = matricule ? null : userId;
  const userIdValue = userId || null;
  
  db.run(`INSERT INTO reponses_quiz (user_id, eleve_id, quiz_id, reponse_donnee, est_correcte, temps_secondes, date_reponse)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    [userIdValue, eleveId, null, JSON.stringify(answers), score, mode === 'examen' ? 30 : null],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ saved: true });
    });
});
// ============ ROUTES PRÉPAFLASH - GÉNÉRATION IA ============
app.post('/api/prepa/generer-quiz', verifyAuth, async (req, res) => {
  const db = req.app.get('db');
  const { lecon_id, titre, contenu, matiere, niveau, resume_ia } = req.body;
  
  if (!lecon_id && !contenu) {
    return res.status(400).json({ success: false, message: 'Contenu de la leçon requis' });
  }
  
  try {
    const prompt = `À partir de cette leçon, génère 5 questions à choix multiples (QCM) pour un élève de ${niveau} en Côte d'Ivoire.

Titre de la leçon: ${titre || 'Leçon'}
Contenu: ${contenu}
Résumé IA: ${resume_ia || ''}

Pour chaque question, donne:
- La question
- 4 options (A, B, C, D)
- La réponse correcte (une des options)

Réponds UNIQUEMENT avec un JSON valide comme ceci:
[
  {
    "question": "Question 1?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "reponse_correcte": "Option correcte"
  }
]`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Tu es un professeur ivoirien qui crée des quiz. Tu réponds uniquement en français." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 1500
    });
    
    const content = completion.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    let questions = [];
    
    if (jsonMatch) {
      questions = JSON.parse(jsonMatch[0]);
    } else {
      questions = JSON.parse(content);
    }
    
    const formattedQuestions = questions.map((q, index) => ({
      id: index + 1,
      question: q.question,
      type_question: 'qcm',
      options: JSON.stringify(q.options),
      reponse_correcte: q.reponse_correcte
    }));
    
    res.json({ success: true, questions: formattedQuestions });
    
  } catch (error) {
    console.error('Erreur génération quiz:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Sauvegarder un résultat de quiz
app.post('/api/prepa/save-result', verifyAuth, (req, res) => {
  const db = req.app.get('db');
  const userId = req.user?.id;
  const matricule = req.headers['x-matricule'];
  const { matiere, niveau, score, total, answers, mode, lecon_id } = req.body;
  
  const eleveId = matricule ? null : userId;
  const userIdValue = userId || null;
  
  db.run(`
    INSERT INTO reponses_quiz (user_id, eleve_id, quiz_id, reponse_donnee, est_correcte, temps_secondes, date_reponse)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `, [
    userIdValue, 
    eleveId, 
    null, 
    JSON.stringify(answers), 
    score, 
    mode === 'examen' ? 30 : null
  ], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ saved: true });
  });
});

// Récupérer les stats de l'élève
app.get('/api/prepa/stats', verifyAuth, (req, res) => {
  const db = req.app.get('db');
  const userId = req.user?.id;
  const matricule = req.headers['x-matricule'];
  
  let condition = '';
  let params = [];
  
  if (userId) {
    condition = 'user_id = ?';
    params = [userId];
  } else if (matricule) {
    db.get("SELECT id FROM eleves WHERE matricule = ?", [matricule], (err, eleve) => {
      if (err || !eleve) {
        return res.json({ 
          totalQuiz: 0, 
          moyenne: 0, 
          meilleurScore: 0, 
          pireScore: 0, 
          parMatiere: [], 
          historique: [], 
          badges: [] 
        });
      }
      chargerStats(eleve.id);
    });
    return;
  } else {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  
  function chargerStats(eleveId) {
    db.all(`
      SELECT r.*, q.matiere, q.niveau
      FROM reponses_quiz r
      LEFT JOIN quiz q ON r.quiz_id = q.id
      WHERE r.eleve_id = ? OR r.user_id = ?
      ORDER BY r.date_reponse DESC
    `, [eleveId, eleveId], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (!rows || rows.length === 0) {
        return res.json({
          totalQuiz: 0,
          moyenne: 0,
          meilleurScore: 0,
          pireScore: 0,
          parMatiere: [],
          historique: [],
          badges: ['🎓 Débutant']
        });
      }
      
      // Calcul des stats
      const totalQuiz = rows.length;
      const scores = rows.filter(r => r.est_correcte !== null).map(r => r.est_correcte);
      const totalCorrect = scores.filter(s => s === 1).length;
      const moyenne = totalQuiz > 0 ? Math.round((totalCorrect / totalQuiz) * 100) : 0;
      const meilleurScore = scores.length > 0 ? Math.max(...scores) * 10 : 0;
      const pireScore = scores.length > 0 ? Math.min(...scores) * 10 : 0;
      
      // Stats par matière
      const matieresMap = {};
      rows.forEach(r => {
        if (r.matiere) {
          if (!matieresMap[r.matiere]) {
            matieresMap[r.matiere] = { total: 0, correct: 0 };
          }
          matieresMap[r.matiere].total++;
          if (r.est_correcte === 1) matieresMap[r.matiere].correct++;
        }
      });
      
      const parMatiere = Object.entries(matieresMap).map(([matiere, data]) => ({
        matiere,
        score: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        total: data.total
      }));
      
      // Badges
      const badges = ['🎓 Débutant'];
      if (totalQuiz >= 5) badges.push('📚 Apprenant');
      if (totalQuiz >= 15) badges.push('⭐ Érudit');
      if (moyenne >= 70) badges.push('🏆 Excellent');
      
      res.json({
        totalQuiz,
        moyenne,
        meilleurScore,
        pireScore,
        parMatiere,
        historique: rows.slice(0, 20).map(r => ({
          date: r.date_reponse,
          matiere: r.matiere || 'Général',
          score: r.est_correcte || 0,
          total: 10
        })),
        badges
      });
    });
  }
  
  // Si on a déjà un eleveId, appeler chargerStats
  if (params.length > 0 && condition.includes('user_id')) {
    chargerStats(null);
  }
});
// ============ ROUTES TUTEUREXPRESS ============

// Vérifier le statut de tuteur
app.get('/api/tutor/status', verifyAuth, (req, res) => {
  const db = req.app.get('db');
  const userId = req.user?.id;
  const matricule = req.headers['x-matricule'];
  
  let id = userId;
  
  if (!id && matricule) {
    db.get(`SELECT id FROM eleves WHERE matricule = ?`, [matricule], (err, eleve) => {
      if (err || !eleve) {
        return res.json({ isTuteur: false, status: 'horsligne' });
      }
      verifierTuteur(eleve.id);
    });
  } else if (id) {
    verifierTuteur(id);
  } else {
    return res.json({ isTuteur: false, status: 'horsligne' });
  }

  function verifierTuteur(id) {
    db.get('SELECT role, est_volontaire, status FROM users WHERE id = ?', [id], (err, user) => {
      if (err) {
        console.error('❌ Erreur status:', err);
        return res.json({ isTuteur: false, status: 'horsligne' });
      }
      res.json({ 
        isTuteur: user?.role === 'tuteur' || user?.est_volontaire === 1,
        status: user?.status || 'horsligne'
      });
    });
  }
});

// Changer le statut (en ligne/hors ligne)
app.post('/api/tutor/status', verifyAuth, (req, res) => {
  const db = req.app.get('db');
  const userId = req.user?.id;
  const { status } = req.body;
  
  db.run('UPDATE users SET status = ? WHERE id = ?', [status, userId], (err) => {
    if (err) {
      console.error('❌ Erreur status:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, status });
  });
});

// Devenir tuteur (CORRIGÉ - plus besoin d'admin)
app.post('/api/tutor/devenir', verifyAuth, (req, res) => {
  const db = req.app.get('db');
  const userId = req.user?.id;
  const { matieres, classes, profession } = req.body;

  console.log('📥 Devenir tuteur - userId:', userId);
  console.log('📥 Matières:', matieres);
  console.log('📥 Classes:', classes);
  console.log('📥 Profession:', profession);

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
  }

  if (!matieres || matieres.length === 0) {
    return res.status(400).json({ success: false, message: 'Veuillez sélectionner au moins une matière' });
  }

  db.run(`
    UPDATE users 
    SET role = 'tuteur', 
        est_volontaire = 1, 
        matieres_preferees = ?,
        profession = ?
    WHERE id = ?
  `, [JSON.stringify(matieres), profession || null, userId], function(err) {
    if (err) {
      console.error('❌ Erreur devenir tuteur:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
    console.log('✅ Utilisateur devenu tuteur, ID:', userId);
    res.json({ 
      success: true, 
      message: 'Félicitations ! Vous êtes maintenant tuteur volontaire 🎉' 
    });
  });
});

// Rechercher des tuteurs
app.get('/api/tutor/search', verifyAuth, (req, res) => {
  const db = req.app.get('db');
  const { matiere, niveau } = req.query;
  
  let sql = `SELECT id, prenom, nom, matieres_preferees as matieres, role, status, est_volontaire 
             FROM users WHERE (role = 'tuteur' OR est_volontaire = 1) AND status = 'enligne'`;
  let params = [];
  
  if (matiere) {
    sql += ` AND matieres_preferees LIKE ?`;
    params.push(`%${matiere}%`);
  }
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('❌ Erreur recherche tuteurs:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Demande premium (optionnel)
app.post('/api/tutor/premium/request', verifyAuth, (req, res) => {
  const { matiere, niveau } = req.body;
  res.json({ success: true, message: 'Demande envoyée aux répétiteurs' });
});
// ============ ROUTES DISPONIBILITÉS TUTEUR ============
app.get('/api/tutor/disponibilites/:tuteurId', verifyAuth, (req, res) => {
    const db = req.app.get('db');
    const { tuteurId } = req.params;
    
    db.all(`SELECT * FROM disponibilites_tuteur WHERE tuteur_id = ? AND actif = 1 ORDER BY 
            CASE jour 
                WHEN 'lundi' THEN 1
                WHEN 'mardi' THEN 2
                WHEN 'mercredi' THEN 3
                WHEN 'jeudi' THEN 4
                WHEN 'vendredi' THEN 5
                WHEN 'samedi' THEN 6
                WHEN 'dimanche' THEN 7
            END, heure_debut`,
        [tuteurId], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows || []);
        });
});

app.post('/api/tutor/disponibilites', verifyToken, (req, res) => {
    const db = req.app.get('db');
    const userId = req.user?.id;
    const { jour, heure_debut, heure_fin } = req.body;
    
    if (!jour || !heure_debut || !heure_fin) {
        return res.status(400).json({ success: false, message: 'Jour, heure début et heure fin requis' });
    }
    
    db.run(`INSERT INTO disponibilites_tuteur (tuteur_id, jour, heure_debut, heure_fin) VALUES (?, ?, ?, ?)`,
        [userId, jour, heure_debut, heure_fin],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        });
});

app.delete('/api/tutor/disponibilites/:id', verifyToken, (req, res) => {
    const db = req.app.get('db');
    const userId = req.user?.id;
    const { id } = req.params;
    
    db.run(`UPDATE disponibilites_tuteur SET actif = 0 WHERE id = ? AND tuteur_id = ?`,
        [id, userId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, deleted: this.changes });
        });
});

// ============ ROUTES RENDEZ-VOUS ============
app.post('/api/tutor/rendez-vous', verifyAuth, (req, res) => {
    const db = req.app.get('db');
    const userId = req.user?.id;
    const { disponibilite_id, date_rendezvous, message_eleve } = req.body;
    
    if (!disponibilite_id || !date_rendezvous) {
        return res.status(400).json({ success: false, message: 'Disponibilité et date requises' });
    }
    
    db.get(`SELECT tuteur_id, heure_debut, heure_fin FROM disponibilites_tuteur WHERE id = ? AND actif = 1`,
        [disponibilite_id], (err, dispo) => {
            if (err || !dispo) {
                return res.status(404).json({ success: false, message: 'Disponibilité non trouvée' });
            }
            
            db.run(`INSERT INTO rendez_vous (eleve_id, tuteur_id, disponibilite_id, date_rendezvous, heure_debut, heure_fin, message_eleve, statut)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'en_attente')`,
                [userId, dispo.tuteur_id, disponibilite_id, date_rendezvous, dispo.heure_debut, dispo.heure_fin, message_eleve || null],
                function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ success: true, id: this.lastID });
                });
        });
});

app.get('/api/tutor/mes-rendez-vous', verifyAuth, (req, res) => {
    const db = req.app.get('db');
    const userId = req.user?.id;
    
    db.all(`
        SELECT r.*, u.nom, u.prenom, u.email, u.telephone,
               d.jour, d.heure_debut, d.heure_fin
        FROM rendez_vous r
        JOIN users u ON r.tuteur_id = u.id
        JOIN disponibilites_tuteur d ON r.disponibilite_id = d.id
        WHERE r.eleve_id = ? OR r.tuteur_id = ?
        ORDER BY r.date_rendezvous DESC, r.heure_debut DESC
    `, [userId, userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

app.put('/api/tutor/rendez-vous/:id/confirmer', verifyToken, (req, res) => {
    const db = req.app.get('db');
    const userId = req.user?.id;
    const { id } = req.params;
    const { statut } = req.body;
    
    db.get(`SELECT r.*, u.nom, u.prenom FROM rendez_vous r
            JOIN users u ON r.eleve_id = u.id
            WHERE r.id = ? AND r.tuteur_id = ?`, [id, userId], (err, rdv) => {
        if (err || !rdv) {
            return res.status(404).json({ success: false, message: 'Rendez-vous non trouvé' });
        }
        
        db.run(`UPDATE rendez_vous SET statut = ?, date_confirmation = datetime('now') WHERE id = ? AND tuteur_id = ?`,
            [statut, id, userId], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                
                if (statut === 'accepte') {
                    sendPushNotification(
                        rdv.eleve_id,
                        '✅ Rendez-vous accepté',
                        `${rdv.prenom} ${rdv.nom} a accepté votre demande de tutorat`,
                        '/tutorat'
                    );
                } else {
                    sendPushNotification(
                        rdv.eleve_id,
                        '❌ Rendez-vous refusé',
                        `${rdv.prenom} ${rdv.nom} a refusé votre demande de tutorat`,
                        '/tutorat'
                    );
                }
                
                res.json({ success: true, updated: this.changes });
            });
    });
});

// ============ ROUTES NOTIFICATIONS ============
app.get('/api/tutor/notifications', verifyToken, (req, res) => {
  const db = req.app.get('db');
  const userId = req.user?.id;

  db.all(`
    SELECT n.*, 
           u.nom as eleve_nom, 
           u.prenom as eleve_prenom,
           u.email as eleve_email
    FROM notifications n
    LEFT JOIN users u ON n.eleve_id = u.id
    WHERE n.tuteur_id = ?
    ORDER BY n.created_at DESC
    LIMIT 50
  `, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.put('/api/tutor/notification/:id/lue', verifyToken, (req, res) => {
  const db = req.app.get('db');
  const userId = req.user?.id;
  const { id } = req.params;

  db.run(`
    UPDATE notifications 
    SET lue = 1 
    WHERE id = ? AND tuteur_id = ?
  `, [id, userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.put('/api/tutor/demande/:id/repondre', verifyToken, (req, res) => {
  const db = req.app.get('db');
  const userId = req.user?.id;
  const { id } = req.params;
  const { statut } = req.body;

  if (!['accepte', 'refuse'].includes(statut)) {
    return res.status(400).json({ success: false, message: 'Statut invalide' });
  }

  db.get(`
    SELECT n.*, u.nom, u.prenom, u.email 
    FROM notifications n
    LEFT JOIN users u ON n.eleve_id = u.id
    WHERE n.id = ? AND n.tuteur_id = ?
  `, [id, userId], (err, notif) => {
    if (err || !notif) {
      return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    }

    db.run(`
      UPDATE notifications 
      SET statut = ?, 
          date_reponse = datetime('now')
      WHERE id = ? AND tuteur_id = ?
    `, [statut, id, userId], function(err) {
      if (err) return res.status(500).json({ error: err.message });

      if (statut === 'accepte') {
        db.run(`
          INSERT INTO rendez_vous (
            eleve_id, 
            tuteur_id, 
            matiere, 
            niveau, 
            date_rendezvous, 
            heure_debut,
            message_eleve,
            statut
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'accepte')
        `, [
          notif.eleve_id, 
          userId, 
          notif.matiere, 
          notif.niveau, 
          notif.date_souhaitee || date('now', '+1 day'),
          notif.heure_souhaitee || '14:00',
          'Demande acceptée'
        ], (err) => {
          if (!err) {
            sendPushNotification(
              notif.eleve_id,
              '✅ Demande de tutorat acceptée',
              `${notif.prenom} ${notif.nom} a accepté votre demande en ${notif.matiere}`,
              '/tutorat'
            );
          }
        });
      } else {
        sendPushNotification(
          notif.eleve_id,
          '❌ Demande de tutorat refusée',
          `${notif.prenom} ${notif.nom} a refusé votre demande en ${notif.matiere}`,
          '/tutorat'
        );
      }

      res.json({ success: true, statut: statut });
    });
  });
});

// ============ CRÉER UNE DEMANDE DE TUTORAT (ÉLÈVE) ============
app.post('/api/tutor/creer-demande', verifyAuth, (req, res) => {
  const db = req.app.get('db');
  const eleveId = req.user?.id;
  const { matiere, niveau, date_souhaitee, heure_souhaitee, message } = req.body;

  if (!matiere || !niveau) {
    return res.status(400).json({ success: false, message: 'Matière et niveau requis' });
  }

  const jourSemaine = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const dateObj = new Date(date_souhaitee || Date.now());
  const jour = jourSemaine[dateObj.getDay()];
  const heure = heure_souhaitee || '14:00';

  db.all(`
    SELECT DISTINCT u.id, u.nom, u.prenom, u.email, d.*
    FROM users u
    JOIN disponibilites_tuteur d ON u.id = d.tuteur_id
    WHERE u.est_tuteur = 1 
      AND u.role = 'tuteur'
      AND u.id != ?
      AND d.jour = ?
      AND d.heure_debut <= ?
      AND d.heure_fin >= ?
      AND d.actif = 1
  `, [eleveId, jour, heure, heure], (err, tuteursDisponibles) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }

    if (tuteursDisponibles.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Aucun tuteur disponible pour ce créneau. Veuillez choisir un autre jour ou heure.' 
      });
    }

    const tuteursFiltres = [];

    for (const t of tuteursDisponibles) {
      const matieresTuteur = JSON.parse(t.matieres_preferees || '[]');
      if (matieresTuteur.includes(matiere)) {
        tuteursFiltres.push(t);
      }
    }

    setTimeout(() => {
      if (tuteursFiltres.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Aucun tuteur disponible pour cette matière. Veuillez choisir une autre matière.' 
        });
      }

      let notificationsEnvoyees = 0;
      for (const tuteur of tuteursFiltres) {
        db.run(`
          INSERT INTO notifications (
            tuteur_id, 
            eleve_id, 
            matiere, 
            niveau, 
            date_souhaitee, 
            heure_souhaitee, 
            message, 
            type, 
            statut,
            lue
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'demande_tutorat', 'en_attente', 0)
        `, [
          tuteur.id,
          eleveId,
          matiere,
          niveau,
          date_souhaitee || new Date().toISOString().split('T')[0],
          heure_souhaitee || '14:00',
          message || 'Demande de tutorat',
        ], (err) => {
          if (!err) {
            notificationsEnvoyees++;
            
            sendPushNotification(
              tuteur.id,
              '👨‍🎓 Nouvelle demande de tutorat',
              `Un élève a besoin d'aide en ${matiere} (${niveau})`,
              '/dashboard',
              { matiere, niveau, eleveId }
            );
            
            console.log(`📨 Notification envoyée au tuteur ${tuteur.prenom} ${tuteur.nom}`);
          }
        });
      }

      setTimeout(() => {
        if (notificationsEnvoyees > 0) {
          res.json({
            success: true,
            message: `✅ Demande envoyée à ${notificationsEnvoyees} tuteur(s) disponible(s). Ils vous répondront bientôt.`,
            tuteurs_contactes: notificationsEnvoyees,
            tuteurs: tuteursFiltres.map(t => ({ id: t.id, nom: t.nom, prenom: t.prenom }))
          });
        } else {
          res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi des notifications' });
        }
      }, 500);
    }, 1000);
  });
});

// ============================================
// ROUTES BOOKMATCH - VERSION UNIQUE ET CORRECTE
// ============================================

// Récupérer toutes les annonces
app.get('/api/book/annonces', verifyAuth, (req, res) => {
  const db = req.app.get('db');
  const { search, ville, matiere, niveau, type_depot, quartier } = req.query;
  
  let sql = `SELECT a.*, u.nom, u.prenom FROM annonces_livres a 
             JOIN users u ON a.user_id = u.id 
             WHERE a.statut = 'disponible'`;
  let params = [];
  
  if (search) {
    sql += ` AND a.titre_livre LIKE ?`;
    params.push(`%${search}%`);
  }
  if (ville) {
    sql += ` AND a.ville LIKE ?`;
    params.push(`%${ville}%`);
  }
  if (quartier) {
    sql += ` AND a.quartier LIKE ?`;
    params.push(`%${quartier}%`);
  }
  if (matiere) {
    sql += ` AND a.matiere = ?`;
    params.push(matiere);
  }
  if (niveau) {
    sql += ` AND a.niveau = ?`;
    params.push(niveau);
  }
  if (type_depot) {
    sql += ` AND a.type_depot = ?`;
    params.push(type_depot);
  }
  
  sql += ` ORDER BY a.created_at DESC`;
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('❌ Erreur annonces:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Récupérer mes annonces
app.get('/api/book/mes-annonces', verifyAuth, (req, res) => {
  const db = req.app.get('db');
  const userId = req.user?.id;
  const matricule = req.headers['x-matricule'];
  
  let sql = `SELECT * FROM annonces_livres WHERE 1=1`;
  let params = [];
  
  if (userId) {
    sql += ` AND user_id = ?`;
    params.push(userId);
  } else if (matricule) {
    sql += ` AND eleve_id = ?`;
    params.push(matricule);
  } else {
    return res.status(401).json({ error: 'Utilisateur non identifié' });
  }
  
  sql += ` ORDER BY created_at DESC`;
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('❌ Erreur mes annonces:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Créer une annonce
app.post('/api/book/annonces', verifyAuth, upload.none(), (req, res) => {
  const db = req.app.get('db');
  const userId = req.user?.id;
  const matricule = req.headers['x-matricule'];
  
  const { 
    titre, auteur, type_depot, matiere, niveau, 
    etat, type_echange, ville, quartier, etablissement, 
    description, etat_activite, serie 
  } = req.body;

  // Vérifier les champs obligatoires
  if (!titre || !type_depot || !type_echange || !ville) {
    return res.status(400).json({ 
      error: 'Les champs obligatoires sont : Titre, Type, Type d\'échange et Ville' 
    });
  }

  const cleanValue = (val) => (val === null || val === undefined) ? '' : val;

  db.run(`
    INSERT INTO annonces_livres (
      user_id, eleve_id, titre_livre, auteur, type_depot, 
      matiere, niveau, serie, etat, type_echange, 
      ville, quartier, etablissement, description, etat_activite
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    userId || null,
    matricule || null,
    cleanValue(titre),
    cleanValue(auteur),
    cleanValue(type_depot),
    cleanValue(matiere),
    cleanValue(niveau),
    cleanValue(serie),
    cleanValue(etat) || 'bon',
    cleanValue(type_echange),
    cleanValue(ville),
    cleanValue(quartier) || '',
    cleanValue(etablissement),
    cleanValue(description),
    cleanValue(etat_activite)
  ], function(err) {
    if (err) {
      console.error('❌ Erreur insertion annonce:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('✅ Annonce créée, ID:', this.lastID);
    res.json({ id: this.lastID });
  });
});

// Supprimer une annonce
app.delete('/api/book/annonces/:id', verifyAuth, (req, res) => {
  const db = req.app.get('db');
  const userId = req.user?.id;
  const { id } = req.params;
  
  db.run(`DELETE FROM annonces_livres WHERE id = ? AND user_id = ?`, [id, userId], function(err) {
    if (err) {
      console.error('❌ Erreur suppression:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ deleted: this.changes });
  });
});

// ============================================
// ROUTES DEMANDES D'ÉCHANGE
// ============================================

// Demander un livre
app.post('/api/book/demander', verifyAuth, (req, res) => {
  const db = req.app.get('db');
  const userId = req.user?.id;
  const matricule = req.headers['x-matricule'];
  
  let demandeurId = userId;
  
  if (!demandeurId && matricule) {
    db.get(`SELECT id FROM eleves WHERE matricule = ?`, [matricule], (err, eleve) => {
      if (err) {
        console.error('❌ Erreur recherche élève:', err);
        return res.status(500).json({ error: err.message });
      }
      if (!eleve) {
        return res.status(401).json({ error: 'Utilisateur non trouvé' });
      }
      traiterDemande(eleve.id);
    });
  } else if (demandeurId) {
    traiterDemande(demandeurId);
  } else {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  function traiterDemande(demandeurId) {
    const { annonceId } = req.body;
    console.log('📥 Demande:', { demandeurId, annonceId });

    if (!annonceId) {
      return res.status(400).json({ error: 'ID de l\'annonce requis' });
    }

    db.get(`SELECT id, user_id FROM annonces_livres WHERE id = ?`, [annonceId], (err, annonce) => {
      if (err) {
        console.error('❌ Erreur:', err);
        return res.status(500).json({ error: err.message });
      }
      if (!annonce) {
        return res.status(404).json({ error: 'Annonce non trouvée' });
      }
      if (annonce.user_id === demandeurId) {
        return res.status(400).json({ error: 'Vous ne pouvez pas demander votre propre livre' });
      }

      db.get(`SELECT id FROM demandes_echange WHERE annonce_id = ? AND demandeur_id = ? AND statut = 'en_attente'`,
        [annonceId, demandeurId], (err, existing) => {
          if (err) {
            console.error('❌ Erreur:', err);
            return res.status(500).json({ error: err.message });
          }
          if (existing) {
            return res.status(400).json({ error: 'Demande déjà en attente' });
          }

          db.run(`INSERT INTO demandes_echange (annonce_id, demandeur_id, statut) VALUES (?, ?, 'en_attente')`,
            [annonceId, demandeurId],
            function(err) {
              if (err) {
                console.error('❌ Erreur insertion:', err);
                return res.status(500).json({ error: err.message });
              }
              console.log('✅ Demande créée, ID:', this.lastID);
              res.json({ id: this.lastID, message: 'Demande envoyée avec succès' });
            }
          );
        }
      );
    });
  }
});

// Mes demandes
app.get('/api/book/mes-demandes', verifyAuth, (req, res) => {
  const db = req.app.get('db');
  const userId = req.user?.id;
  const matricule = req.headers['x-matricule'];
  
  let demandeurId = userId;
  
  if (!demandeurId && matricule) {
    db.get(`SELECT id FROM eleves WHERE matricule = ?`, [matricule], (err, eleve) => {
      if (err || !eleve) {
        return res.status(401).json({ error: 'Utilisateur non trouvé' });
      }
      chargerDemandes(eleve.id);
    });
  } else if (demandeurId) {
    chargerDemandes(demandeurId);
  } else {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  function chargerDemandes(demandeurId) {
    db.all(`
      SELECT d.*, 
             a.titre_livre as titre, 
             a.ville, 
             a.quartier,
             u.nom as proprietaire_nom,
             u.prenom as proprietaire_prenom
      FROM demandes_echange d
      JOIN annonces_livres a ON d.annonce_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE d.demandeur_id = ?
      ORDER BY d.created_at DESC
    `, [demandeurId], (err, rows) => {
      if (err) {
        console.error('❌ Erreur:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows || []);
    });
  }
});
// ============ ROUTES IA ============
app.post('/api/ia/lecons', verifyAuth, async (req, res) => {
  const { matiere, niveau, serie } = req.body;
  
  if (!matiere || !niveau) {
    return res.status(400).json({ success: false, message: 'Matière et niveau requis' });
  }

  let langueInstruction = '';
  
  if (matiere === 'Anglais') {
    langueInstruction = 'You must respond ONLY in English.';
  } else if (matiere === 'Allemand') {
    langueInstruction = 'Du musst NUR auf Deutsch antworten.';
  } else if (matiere === 'Espagnol') {
    langueInstruction = 'Debes responder SOLO en español.';
  } else {
    langueInstruction = 'Tu réponds uniquement en français.';
  }

  let prompt = '';
  
  if (niveau === '3ème') {
    prompt = `Donne-moi la liste des 8 principales LEÇONS de ${matiere} pour un élève de 3ème en Côte d'Ivoire (programme BEPC).
    
${langueInstruction}

Réponds UNIQUEMENT avec la liste séparée par des virgules.`;
  } else {
    prompt = `Donne-moi la liste des 8 principales LEÇONS de ${matiere} pour un élève de ${niveau}${serie ? ' ' + serie : ''} en Côte d'Ivoire (programme BAC).
    
${langueInstruction}

Réponds UNIQUEMENT avec la liste séparée par des virgules.`;
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: `Tu es un professeur ivoirien. ${langueInstruction} Tu réponds uniquement avec la liste des leçons.` },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 400
    });
    
    let lecons = completion.choices[0].message.content;
    res.json({ success: true, lecons: lecons });
  } catch (error) {
    console.error('Erreur IA lecons:', error);
    res.json({ success: true, lecons: 'Leçon 1, Leçon 2, Leçon 3, Leçon 4, Leçon 5, Leçon 6, Leçon 7, Leçon 8' });
  }
});

app.post('/api/ia/cours', verifyAuth, async (req, res) => {
  const { matiere, lecon, niveau, serie } = req.body;
  
  if (!matiere || !lecon || !niveau) {
    return res.status(400).json({ success: false, message: 'Matière, leçon et niveau requis' });
  }

  let langueInstruction = '';
  let enTeteCours = '';
  
  if (matiere === 'Anglais') {
    langueInstruction = 'You must respond ONLY in English.';
    enTeteCours = '📚 SUMMARY, 📝 DETAILED EXPLANATION, 🎯 EXAMPLES, ❓ PRACTICE QUESTIONS';
  } else if (matiere === 'Allemand') {
    langueInstruction = 'Du musst NUR auf Deutsch antworten.';
    enTeteCours = '📚 ZUSAMMENFASSUNG, 📝 DETAILLIERTE ERKLÄRUNG, 🎯 BEISPIELE, ❓ FRAGEN ZUM ÜBEN';
  } else if (matiere === 'Espagnol') {
    langueInstruction = 'Debes responder SOLO en español.';
    enTeteCours = '📚 RESUMEN, 📝 EXPLICACIÓN DETALLADA, 🎯 EJEMPLOS, ❓ PREGUNTAS DE PRÁCTICA';
  } else {
    langueInstruction = 'Tu réponds uniquement en français.';
    enTeteCours = '📚 RÉSUMÉ, 📝 EXPLICATION DÉTAILLÉE, 🎯 EXEMPLES, ❓ QUESTIONS POUR S\'ENTRAÎNER';
  }

  const prompt = `Génère un cours sur "${lecon}" en ${matiere} pour un élève de ${niveau}${serie || ''} en Côte d'Ivoire.

${langueInstruction}

Structure le cours ainsi :
${enTeteCours}

Règles :
- Utilise des émojis
- Sois clair et simple
- Pas plus de 400 mots
- Adapte le niveau (BEPC pour 3ème, BAC pour Terminale)

Important : Réponds UNIQUEMENT avec le cours structuré, pas de texte avant ou après.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: `Tu es un professeur passionné. ${langueInstruction} Tu réponds uniquement avec le cours structuré.` },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 800
    });
    
    res.json({ success: true, cours: completion.choices[0].message.content });
  } catch (error) {
    console.error('Erreur IA cours:', error);
    res.status(500).json({ success: false, message: 'Erreur génération du cours' });
  }
});

app.post('/api/ia/cours-personnalise', verifyAuth, async (req, res) => {
  const { question, matiere, niveau, serie } = req.body;
  
  if (!question) {
    return res.status(400).json({ success: false, message: 'Question requise' });
  }

  let langueInstruction = '';
  let structureReponse = '';
  
  if (matiere === 'Anglais') {
    langueInstruction = 'You must respond ONLY in English.';
    structureReponse = '📚 SIMPLE EXPLANATION, 🎯 CONCRETE EXAMPLE, ❓ QUICK TEST';
  } else if (matiere === 'Allemand') {
    langueInstruction = 'Du musst NUR auf Deutsch antworten.';
    structureReponse = '📚 EINFACHE ERKLÄRUNG, 🎯 KONKRETES BEISPIEL, ❓ KURZER TEST';
  } else if (matiere === 'Espagnol') {
    langueInstruction = 'Debes responder SOLO en español.';
    structureReponse = '📚 EXPLICACIÓN SIMPLE, 🎯 EJEMPLO CONCRETO, ❓ PRUEBA RÁPIDA';
  } else {
    langueInstruction = 'Tu réponds uniquement en français.';
    structureReponse = '📚 EXPLICATION SIMPLE, 🎯 EXEMPLE CONCRET, ❓ PETIT TEST';
  }

  const prompt = `Explique "${question}" simplement à un élève de ${niveau}${serie || ''} en Côte d'Ivoire.

${langueInstruction}

Structure la réponse ainsi :
${structureReponse}

Sois clair, utilise des émojis, reste court (max 300 mots).`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: `Tu es un professeur patient. ${langueInstruction} Tu réponds uniquement avec la structure demandée.` },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 600
    });
    
    res.json({ success: true, cours: completion.choices[0].message.content });
  } catch (error) {
    console.error('Erreur IA cours personnalisé:', error);
    res.status(500).json({ success: false, message: 'Erreur génération' });
  }
});

// ============ ROUTES ADMIN - LECONS ============
app.get('/api/admin/lecons', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  const { matiere, niveau, serie } = req.query;
  
  let sql = `SELECT * FROM lecons WHERE 1=1`;
  let params = [];
  
  if (matiere) {
    sql += ` AND matiere = ?`;
    params.push(matiere);
  }
  if (niveau) {
    sql += ` AND niveau = ?`;
    params.push(niveau);
  }
  if (serie) {
    sql += ` AND serie = ?`;
    params.push(serie);
  }
  
  sql += ` ORDER BY created_at DESC`;
  
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/admin/lecons', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  const { titre, contenu, matiere, niveau, serie } = req.body;
  
  if (!titre || !contenu || !matiere || !niveau) {
    return res.status(400).json({ success: false, message: 'Titre, contenu, matière et niveau requis' });
  }
  
  db.run(`INSERT INTO lecons (titre, contenu, matiere, niveau, serie) VALUES (?, ?, ?, ?, ?)`,
    [titre, contenu, matiere, niveau, serie || null],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    });
});

app.put('/api/admin/lecons/:id', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const { titre, contenu, matiere, niveau, serie, resume_ia } = req.body;
  
  db.run(`UPDATE lecons SET 
            titre = COALESCE(?, titre),
            contenu = COALESCE(?, contenu),
            matiere = COALESCE(?, matiere),
            niveau = COALESCE(?, niveau),
            serie = COALESCE(?, serie),
            resume_ia = COALESCE(?, resume_ia),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
    [titre, contenu, matiere, niveau, serie, resume_ia, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
});

app.delete('/api/admin/lecons/:id', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  
  db.run(`DELETE FROM lecons WHERE id = ?`, [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deleted: this.changes });
  });
});

app.post('/api/admin/lecons/:id/resume', verifyToken, isAdmin, async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  
  db.get(`SELECT * FROM lecons WHERE id = ?`, [id], async (err, lecon) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!lecon) return res.status(404).json({ success: false, message: 'Leçon non trouvée' });
    
    try {
      const prompt = `Fais un résumé clair et structuré de cette leçon pour un élève de ${lecon.niveau} en Côte d'Ivoire:
      
Titre: ${lecon.titre}
Contenu: ${lecon.contenu}

Structure le résumé ainsi:
📚 RÉSUMÉ : (2-3 phrases)
📝 POINTS CLÉS : (3-4 points)
🎯 EXEMPLES : (1-2 exemples concrets avec prénoms ivoiriens)
❓ QUESTIONS POUR S'ENTRAÎNER : (2 questions avec réponses à la fin)`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "Tu es un professeur ivoirien qui résume des leçons. Tu réponds uniquement en français." },
          { role: "user", content: prompt }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.5,
        max_tokens: 600
      });
      
      const resume_ia = completion.choices[0].message.content;
      
      db.run(`UPDATE lecons SET resume_ia = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [resume_ia, id],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true, resume_ia: resume_ia });
        });
    } catch (error) {
      console.error('Erreur résumé IA:', error);
      res.status(500).json({ success: false, message: 'Erreur génération résumé' });
    }
  });
});

// ============ ROUTES ADMIN - EXAMENS ============
app.get('/api/admin/examens', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.all("SELECT * FROM examens ORDER BY date_publication DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/admin/examens', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  const { titre, matiere, niveau, serie, contenu } = req.body;
  
  if (!titre || !matiere || !niveau) {
    return res.status(400).json({ success: false, message: 'Titre, matière et niveau requis' });
  }
  
  db.run(`INSERT INTO examens (titre, matiere, niveau, serie, contenu, date_publication) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [titre, matiere, niveau, serie || null, contenu || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    });
});

app.delete('/api/admin/examens/:id', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  db.run("DELETE FROM examens WHERE id = ?", [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deleted: this.changes });
  });
});
// ============ ROUTES ADMIN ============

// Récupérer la liste des administrateurs
app.get('/api/admin/list', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.all("SELECT id, nom, prenom, email, telephone, role, created_at FROM users WHERE role = 'admin'", (err, rows) => {
    if (err) {
      console.error('❌ Erreur admin list:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Récupérer tous les utilisateurs
app.get('/api/admin/users', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.all(`
    SELECT id, nom, prenom, email, role, telephone, est_volontaire, 
           matieres_preferees, created_at 
    FROM users 
    ORDER BY created_at DESC
  `, (err, rows) => {
    if (err) {
      console.error('❌ Erreur users:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Récupérer les élèves
app.get('/api/admin/eleves', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.all("SELECT * FROM eleves ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});
// ============ ROUTE EDUC IA ============
app.post('/api/educIA/chat', verifyAuth, async (req, res) => {
  const { message, historique, contexte, conversationId } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: 'Message requis' });
  }

  try {
    const systemPrompt = `Tu es **EDUC IA**, un assistant pédagogique intelligent pour SCHOOL+ CI en Côte d'Ivoire.

Contexte élève: ${contexte || 'Élève non spécifié'}

RÈGLES IMPORTANTES:
1. Tu réponds UNIQUEMENT en français
2. Tu es bienveillant, encourageant et patient
3. Tu adaptes tes réponses au niveau de l'élève (collège ou lycée)
4. Tu utilises des émojis pour rendre les réponses plus agréables
5. Tu donnes des exemples concrets (avec des prénoms ivoiriens)
6. Tu proposes des exercices ou des questions pour approfondir

Matières que tu connais:
- Mathématiques, Physique-Chimie, SVT, Français, Anglais, Histoire-Géo, Philosophie

Domaines d'aide:
- 📚 Explications de cours et résumés
- 🎯 Orientation scolaire (filières, métiers, écoles)
- 📝 Résolution d'exercices (pas de réponse directe, mais guidage)
- 💼 Métiers et débouchés en Côte d'Ivoire
- 🌍 Culture générale et actualité

Si tu ne sais pas répondre, dis-le honnêtement et propose de chercher ensemble.`;

    const messages = [{ role: "system", content: systemPrompt }];

    if (historique && Array.isArray(historique)) {
      for (const msg of historique) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({ role: "user", content: message });

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 800
    });

    const response = completion.choices[0].message.content;

    res.json({
      success: true,
      response: response,
      usage: completion.usage
    });

  } catch (error) {
    console.error('Erreur EDUC IA:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la communication avec EDUC IA',
      error: error.message
    });
  }
});

// ============ ROUTES PARENT ============

// Récupérer les enfants liés au parent
app.get('/api/parent/enfants', verifyToken, (req, res) => {
  const db = req.app.get('db');
  const parentId = req.user?.id;

  db.all(`
    SELECT e.id, e.nom, e.prenom, e.matricule, e.classe, e.etablissement, e.ville, e.quartier,
           p.lien as lien_parent
    FROM eleves e
    JOIN parent_eleves p ON e.id = p.eleve_id
    WHERE p.parent_id = ?
    ORDER BY e.created_at DESC
  `, [parentId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, enfants: rows || [] });
  });
});

// Récupérer les statistiques d'un enfant
app.get('/api/parent/stats/:eleveId', verifyToken, (req, res) => {
  const db = req.app.get('db');
  const parentId = req.user?.id;
  const { eleveId } = req.params;

  db.get(`
    SELECT * FROM parent_eleves WHERE parent_id = ? AND eleve_id = ?
  `, [parentId, eleveId], (err, lien) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!lien) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé à cet enfant' });
    }

    db.all(`
      SELECT rq.*, q.matiere, q.niveau
      FROM reponses_quiz rq
      JOIN quiz q ON rq.quiz_id = q.id
      WHERE rq.eleve_id = ?
      ORDER BY rq.date_reponse DESC
    `, [eleveId], (err, reponses) => {
      if (err) return res.status(500).json({ success: false, message: err.message });

      db.all(`
        SELECT s.*, u.nom as tuteur_nom, u.prenom as tuteur_prenom
        FROM sessions_tutorat s
        LEFT JOIN users u ON s.tuteur_id = u.id
        WHERE s.eleve_id = ?
        ORDER BY s.date_session DESC
      `, [eleveId], (err, sessions) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        const moyennes = {};
        const quizHistory = [];

        reponses.forEach(r => {
          if (!moyennes[r.matiere]) {
            moyennes[r.matiere] = { total: 0, count: 0 };
          }
          moyennes[r.matiere].total += r.est_correcte || 0;
          moyennes[r.matiere].count += 1;
          
          quizHistory.push({
            matiere: r.matiere,
            score: r.est_correcte || 0,
            total: 10,
            date: r.date_reponse
          });
        });

        const moyennesFinales = {};
        for (const [matiere, data] of Object.entries(moyennes)) {
          moyennesFinales[matiere] = data.count > 0 ? (data.total / data.count) * 2 : 0;
        }

        let orientation = '';
        if (moyennesFinales['Mathématiques'] && moyennesFinales['Mathématiques'] >= 14) {
          orientation = '🎓 Série C (Mathématiques) ou Série D (SVT) recommandée';
        } else if (moyennesFinales['Français'] && moyennesFinales['Français'] >= 14) {
          orientation = '🎓 Série A (Lettres) recommandée';
        } else if (moyennesFinales['SVT'] && moyennesFinales['SVT'] >= 14) {
          orientation = '🎓 Série D (SVT) recommandée';
        } else {
          orientation = '📚 Révise les matières fondamentales. Des séances de tutorat sont recommandées.';
        }

        const tutoratRecommande = Object.values(moyennesFinales).some(m => m < 10);

        res.json({
          success: true,
          stats: {
            moyennes: moyennesFinales,
            sessions: sessions || [],
            quiz_history: quizHistory.slice(0, 50),
            total_quiz: reponses.length,
            moyenne_generale: Object.values(moyennesFinales).length > 0 
              ? (Object.values(moyennesFinales).reduce((a, b) => a + b, 0) / Object.values(moyennesFinales).length).toFixed(1)
              : 'N/A',
            tutorat_recommande: tutoratRecommande,
            orientation: orientation
          }
        });
      });
    });
  });
});

// Lier un enfant à un parent
app.post('/api/parent/lier', verifyToken, (req, res) => {
  const db = req.app.get('db');
  const parentId = req.user?.id;
  const { matricule } = req.body;

  if (!matricule) {
    return res.status(400).json({ success: false, message: 'Matricule requis' });
  }

  db.get(`SELECT * FROM eleves WHERE matricule = ?`, [matricule], (err, eleve) => {
    if (err || !eleve) {
      return res.status(404).json({ success: false, message: 'Élève non trouvé' });
    }

    db.get(`SELECT * FROM parent_eleves WHERE parent_id = ? AND eleve_id = ?`, [parentId, eleve.id], (err, lien) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (lien) {
        return res.status(400).json({ success: false, message: 'Cet enfant est déjà lié à votre compte' });
      }

      db.run(`INSERT INTO parent_eleves (parent_id, eleve_id, lien) VALUES (?, ?, 'parent')`,
        [parentId, eleve.id],
        function(err) {
          if (err) return res.status(500).json({ success: false, message: err.message });
          res.json({ success: true, message: 'Enfant lié avec succès' });
        });
    });
  });
});

// ============ ROUTES ÉLÈVE ============
app.get('/api/eleve/lecons', verifyAuth, (req, res) => {
  const db = req.app.get('db');
  db.all("SELECT id, titre, matiere, niveau, serie, resume_ia, contenu FROM lecons ORDER BY matiere, titre", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.get('/api/eleve/examens', verifyAuth, (req, res) => {
  const db = req.app.get('db');
  db.all("SELECT id, titre, matiere, niveau, serie, contenu, date_publication FROM examens ORDER BY date_publication DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/prepa/generer-quiz', verifyAuth, async (req, res) => {
  const { lecon_id, titre, contenu, matiere, niveau, resume_ia } = req.body;
  
  try {
    const prompt = `À partir de cette leçon, génère 5 questions à choix multiples (QCM) pour un élève de ${niveau} en Côte d'Ivoire.

Titre de la leçon: ${titre}
Contenu: ${contenu}
Résumé IA: ${resume_ia || ''}

Pour chaque question, donne:
- La question
- 4 options (A, B, C, D)
- La réponse correcte (une des options)

Réponds UNIQUEMENT avec un JSON valide comme ceci:
[
  {
    "question": "Question 1?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "reponse_correcte": "Option correcte"
  }
]`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Tu es un professeur ivoirien qui crée des quiz. Tu réponds uniquement en français." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 1500
    });
    
    const content = completion.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    let questions = [];
    if (jsonMatch) {
      questions = JSON.parse(jsonMatch[0]);
    } else {
      questions = JSON.parse(content);
    }
    
    const formattedQuestions = questions.map((q, index) => ({
      id: index + 1,
      question: q.question,
      type_question: 'qcm',
      options: JSON.stringify(q.options),
      reponse_correcte: q.reponse_correcte
    }));
    
    res.json({ success: true, questions: formattedQuestions });
  } catch (error) {
    console.error('Erreur génération quiz:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ ROUTES SUJETS PROPOSÉS ============

// Élève - Proposer un sujet
app.post('/api/prepa/proposer-sujet', verifyAuth, upload.fields([{ name: 'fichier' }, { name: 'photo' }]), async (req, res) => {
  const db = req.app.get('db');
  const userId = req.user?.id;
  const { titre, matiere, niveau, description, eleve_id, eleve_nom } = req.body;

  if (!titre || !matiere || !niveau) {
    return res.status(400).json({ success: false, message: 'Titre, matière et niveau requis' });
  }

  const fichierPath = req.files?.fichier?.[0]?.path || null;
  const photoPath = req.files?.photo?.[0]?.path || null;

  let analyse = '';

  if (fichierPath) {
    try {
      const fileContent = fs.readFileSync(fichierPath, 'utf-8');
      const prompt = `Analyse ce sujet d'examen et structure-le en questions:\n\n${fileContent.substring(0, 3000)}\n\nExtrais les questions, les options et les réponses si disponibles.`;
      
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
        max_tokens: 800
      });
      analyse = completion.choices[0].message.content;
    } catch (error) {
      console.error('Erreur analyse fichier:', error);
      analyse = 'Analyse en cours...';
    }
  }

  db.run(
    `INSERT INTO sujets_proposes (titre, matiere, niveau, description, eleve_id, eleve_nom, fichier_path, photo_path, analyse_ia, statut)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_attente')`,
    [titre, matiere, niveau, description || null, eleve_id || userId, eleve_nom || null, fichierPath, photoPath, analyse],
    function(err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, id: this.lastID, message: 'Sujet proposé avec succès', analyse });
    }
  );
});

// Admin - Récupérer les sujets proposés
app.get('/api/admin/sujets-proposes', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.all("SELECT * FROM sujets_proposes ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// Admin - Analyser un sujet avec l'IA
app.post('/api/admin/sujets-proposes/:id/analyser', verifyToken, isAdmin, async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;

  db.get("SELECT * FROM sujets_proposes WHERE id = ?", [id], async (err, sujet) => {
    if (err || !sujet) return res.status(404).json({ success: false, message: 'Sujet non trouvé' });

    try {
      const prompt = `Analyse ce sujet d'examen proposé par un élève et structure-le en questions:
      
Titre: ${sujet.titre}
Matière: ${sujet.matiere}
Niveau: ${sujet.niveau}
Description: ${sujet.description || 'Aucune'}

Si le sujet contient des questions, extrais-les et propose une correction.
Donne également une évaluation du niveau de difficulté.`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
        max_tokens: 800
      });

      const analyse = completion.choices[0].message.content;

      db.run(
        "UPDATE sujets_proposes SET analyse_ia = ?, statut = 'en_analyse' WHERE id = ?",
        [analyse, id],
        function(err) {
          if (err) return res.status(500).json({ success: false, message: err.message });
          res.json({ success: true, analyse });
        }
      );
    } catch (error) {
      console.error('Erreur analyse:', error);
      res.status(500).json({ success: false, message: 'Erreur analyse' });
    }
  });
});

// Admin - Valider un sujet
app.put('/api/admin/sujets-proposes/:id/valider', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;

  db.run(
    "UPDATE sujets_proposes SET statut = 'valide', date_validation = datetime('now') WHERE id = ?",
    [id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Admin - Rejeter un sujet
app.put('/api/admin/sujets-proposes/:id/rejeter', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;

  db.run(
    "UPDATE sujets_proposes SET statut = 'rejete' WHERE id = ?",
    [id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Admin - Supprimer un sujet
app.delete('/api/admin/sujets-proposes/:id', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;

  db.run("DELETE FROM sujets_proposes WHERE id = ?", [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ============ ROUTES ADMIN - TUTEURS ============
app.get('/api/admin/tuteurs', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.all("SELECT id, nom, prenom, email, matieres_preferees, est_volontaire, role, created_at FROM users WHERE role = 'tuteur' OR est_volontaire = 1", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// ============ ROUTES ADMIN - STATS ============
app.get('/api/admin/stats/lecons', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.get("SELECT COUNT(*) as count FROM lecons", (err, row) => { res.json({ count: row?.count || 0 }); });
});

app.get('/api/admin/stats/annonces', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.get("SELECT COUNT(*) as count FROM annonces_livres", (err, row) => { res.json({ count: row?.count || 0 }); });
});

app.get('/api/admin/stats/tuteurs', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.get("SELECT COUNT(*) as count FROM users WHERE role = 'tuteur' OR est_volontaire = 1", (err, row) => { res.json({ count: row?.count || 0 }); });
});

app.get('/api/admin/stats/sessions', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.get("SELECT COUNT(*) as count FROM sessions_tutorat", (err, row) => { res.json({ count: row?.count || 0 }); });
});

app.get('/api/admin/stats/domaines', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.get("SELECT COUNT(*) as count FROM domaines", (err, row) => { res.json({ count: row?.count || 0 }); });
});

app.get('/api/admin/stats/filieres', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.get("SELECT COUNT(*) as count FROM filieres", (err, row) => { res.json({ count: row?.count || 0 }); });
});

app.get('/api/admin/stats/metiers', verifyToken, isAdmin, (req, res) => {
  const db = req.app.get('db');
  db.get("SELECT COUNT(*) as count FROM metiers", (err, row) => { res.json({ count: row?.count || 0 }); });
});

// ============ ROUTES PRINCIPALES ============
app.get('/api/health', (req, res) => { res.json({ status: 'OK' }); });
app.get('/', (req, res) => { res.json({ project: 'SCHOOL+ CI', version: '2.0.0' }); });

// ============ INITIALISATION ET DÉMARRAGE ============
initDatabase((err, db) => {
    if (err) process.exit(1);
    app.set('db', db);

    app.post('/api/auth/register-eleve', registerEleve);
    app.post('/api/auth/login-eleve', loginEleve);
    app.post('/api/auth/register-user', registerUser);
    app.post('/api/auth/login-user', loginUser);
    app.post('/api/orientation/chat', verifyAuth, chatOrientation);
    app.post('/api/tutor/notification', verifyAuth, (req, res) => {
        const { destinataire_id, message, type } = req.body;
        sendPushNotification(destinataire_id, '🔔 Notification', message, '/dashboard');
        res.json({ success: true });
    });

    server.listen(PORT, '0.0.0.0', () => {
        console.log(`\n🚀 Serveur SCHOOL+ CI démarré sur http://0.0.0.0:${PORT}`);
        console.log(`📱 Accessible sur le réseau à :`);
        console.log(`   → http://192.168.43.232:${PORT}`);
        console.log(`   → http://localhost:${PORT}`);
        console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
        console.log(`🎯 Orientation: http://localhost:${PORT}/api/orientation`);
        console.log(`👑 Admin: routes disponibles`);
        console.log(`🔌 Socket.io prêt pour le chat et le tableau blanc`);
    });
});