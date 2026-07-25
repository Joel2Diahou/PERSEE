// backend/routes/tutorRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
    devenirTuteur,
    getTuteurs,
    getTuteurById,
    demanderSession,
    getMySessions,
    getReceivedSessions,
    repondreSession,
    terminerSession,
    getTuteurStats
} = require('../controllers/tutorController');

// Routes pour les tuteurs
router.post('/devenir-tuteur', verifyToken, devenirTuteur);
router.get('/tuteurs', verifyToken, getTuteurs);
router.get('/tuteurs/:id', verifyToken, getTuteurById);
router.get('/tuteurs/:id/stats', verifyToken, getTuteurStats);

// Routes pour les sessions
router.post('/demandes', verifyToken, demanderSession);
router.get('/mes-sessions', verifyToken, getMySessions);
router.get('/demandes-recues', verifyToken, getReceivedSessions);
router.put('/sessions/:id', verifyToken, repondreSession);
router.put('/sessions/:id/terminer', verifyToken, terminerSession);

module.exports = router;