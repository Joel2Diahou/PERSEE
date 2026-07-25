// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
    registerEleve,
    loginEleve,
    registerUser,
    loginUser
} = require('../controllers/authController');

// Routes pour les élèves (sans email)
router.post('/register-eleve', registerEleve);
router.post('/login-eleve', loginEleve);

// Routes pour les autres (email + mot de passe)
router.post('/register-user', registerUser);
router.post('/login-user', loginUser);

module.exports = router;