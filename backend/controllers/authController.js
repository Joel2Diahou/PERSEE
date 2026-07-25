// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Générer un token JWT
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            role: user.role 
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '7d' }
    );
};

// ============ ANCIENNES FONCTIONS (pour compatibilité) ============

// INSCRIPTION (création de compte riche)
const register = (req, res) => {
    const db = req.app.get('db');
    const userModel = new User(db);
    
    const {
        nom,
        prenom,
        email,
        password,
        niveau,
        etablissement,
        ville,
        quartier,
        matieres_preferees,
        bio,
        photo,
        role,
        est_volontaire
    } = req.body;

    if (!nom || !prenom || !email || !password || !niveau || !etablissement || !ville || !quartier) {
        return res.status(400).json({
            success: false,
            message: 'Veuillez remplir tous les champs obligatoires'
        });
    }

    const niveauxValides = ['6eme', '5eme', '4eme', '3eme', 'Seconde', '1ere', 'Terminale'];
    if (!niveauxValides.includes(niveau)) {
        return res.status(400).json({
            success: false,
            message: 'Niveau invalide'
        });
    }

    userModel.create({
        nom,
        prenom,
        email,
        password,
        niveau,
        etablissement,
        ville,
        quartier,
        matieres_preferees: matieres_preferees || [],
        bio: bio || '',
        photo: photo || null,
        role: role || 'eleve',
        est_volontaire: est_volontaire || 0
    }, (err, result) => {
        if (err) {
            console.error('Erreur inscription:', err);
            if (err.message && err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({
                    success: false,
                    message: 'Cet email est déjà utilisé'
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'inscription',
                error: err.message
            });
        }

        userModel.findByEmail(email, (err, user) => {
            if (err || !user) {
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la récupération du compte'
                });
            }

            const token = generateToken(user);
            const { password: pwd, ...userWithoutPassword } = user;
            
            res.status(201).json({
                success: true,
                message: 'Inscription réussie ! Bienvenue sur SCHOOL+ CI 🎉',
                token,
                user: userWithoutPassword
            });
        });
    });
};

// CONNEXION (ancienne)
const login = (req, res) => {
    const db = req.app.get('db');
    const userModel = new User(db);
    
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email et mot de passe requis'
        });
    }

    userModel.findByEmail(email, (err, user) => {
        if (err || !user) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        const isPasswordValid = userModel.comparePassword(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        const token = generateToken(user);
        const { password: pwd, ...userWithoutPassword } = user;
        
        res.json({
            success: true,
            message: 'Connexion réussie !',
            token,
            user: userWithoutPassword
        });
    });
};

// Récupérer mon profil (utilisateur connecté)
const getMe = (req, res) => {
    const db = req.app.get('db');
    const userModel = new User(db);
    
    const userId = req.user.id;
    
    userModel.findById(userId, (err, user) => {
        if (err || !user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }
        
        res.json({
            success: true,
            user
        });
    });
};

// ============ NOUVELLES FONCTIONS (élèves sans email) ============

// INSCRIPTION ÉLÈVE (sans email, avec matricule)
const registerEleve = (req, res) => {
    const db = req.app.get('db');
    const { nom, prenom, matricule, classe, etablissement, ville, quartier } = req.body;

    if (!nom || !prenom || !matricule || !classe || !etablissement || !ville || !quartier) {
        return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
    }

    const sql = `INSERT INTO eleves (nom, prenom, matricule, classe, etablissement, ville, quartier) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [nom, prenom, matricule, classe, etablissement, ville, quartier], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(409).json({ success: false, message: 'Ce matricule existe déjà' });
            }
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, message: 'Élève inscrit avec succès' });
    });
};

// CONNEXION ÉLÈVE (nom + prénom + matricule)
const loginEleve = (req, res) => {
    const db = req.app.get('db');
    const { nom, prenom, matricule } = req.body;

    if (!nom || !prenom || !matricule) {
        return res.status(400).json({ success: false, message: 'Nom, prénom et matricule requis' });
    }

    const sql = `SELECT * FROM eleves WHERE nom = ? AND prenom = ? AND matricule = ?`;

    db.get(sql, [nom, prenom, matricule], (err, eleve) => {
        if (err || !eleve) {
            return res.status(401).json({ success: false, message: 'Matricule incorrect' });
        }

        res.json({
            success: true,
            message: 'Connexion réussie',
            matricule: eleve.matricule,
            eleve: {
                id: eleve.id,
                nom: eleve.nom,
                prenom: eleve.prenom,
                classe: eleve.classe,
                etablissement: eleve.etablissement,
                ville: eleve.ville,
                quartier: eleve.quartier
            }
        });
    });
};

// INSCRIPTION USER (parent/tuteur/admin)
const registerUser = (req, res) => {
    const db = req.app.get('db');
    const { nom, prenom, email, password, profession, telephone, role } = req.body;

    if (!nom || !prenom || !email || !password || !telephone) {
        return res.status(400).json({ success: false, message: 'Champs obligatoires manquants' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const sql = `INSERT INTO users (nom, prenom, email, password, profession, telephone, role) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [nom, prenom, email, hashedPassword, profession || null, telephone, role || 'parent'], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(409).json({ success: false, message: 'Cet email existe déjà' });
            }
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, message: 'Compte créé avec succès' });
    });
};

// CONNEXION USER (email + mot de passe)
const loginUser = (req, res) => {
    const db = req.app.get('db');
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }

    const sql = `SELECT * FROM users WHERE email = ?`;

    db.get(sql, [email], (err, user) => {
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
};

module.exports = {
    register,
    login,
    getMe,
    registerEleve,
    loginEleve,
    registerUser,
    loginUser
};