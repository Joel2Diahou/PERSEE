// backend/routes/prepaRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
    getQuiz,
    getQuestionById,
    submitAnswer,
    getProgression,
    getMatieres
} = require('../controllers/prepaController');

// Toutes les routes sont protégées (nécessitent connexion)
router.get('/quiz', verifyToken, getQuiz);
router.get('/quiz/:id', verifyToken, getQuestionById);
router.get('/matieres', verifyToken, getMatieres);
router.get('/progression', verifyToken, getProgression);
router.post('/submit', verifyToken, submitAnswer);

module.exports = router;