// backend/routes/orientationRoutes.js
const express = require('express');
const router = express.Router();
const { chatOrientation, getSchoolRecommendations } = require('../controllers/orientationController');
const { verifyAuth } = require('../middleware/authMiddleware'); // ← Utiliser verifyAuth (accepte token ET matricule)

// Toutes les routes d'orientation sont protégées (token JWT pour users OU matricule pour élèves)
router.post('/chat', verifyAuth, chatOrientation);
router.post('/recommend-schools', verifyAuth, getSchoolRecommendations);

module.exports = router;