// backend/routes/bookRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
    createAnnonce,
    getAnnonces,
    getMyAnnonces,
    getAnnonceById,
    updateAnnonce,
    deleteAnnonce,
    createDemande,
    getMyDemandes,
    getReceivedDemandes,
    repondreDemande,
    marquerEchange
} = require('../controllers/bookController');

// Routes pour les annonces
router.post('/annonces', verifyToken, createAnnonce);
router.get('/annonces', verifyToken, getAnnonces);
router.get('/annonces/me', verifyToken, getMyAnnonces);
router.get('/annonces/:id', verifyToken, getAnnonceById);
router.put('/annonces/:id', verifyToken, updateAnnonce);
router.delete('/annonces/:id', verifyToken, deleteAnnonce);

// Routes pour les demandes d'échange
router.post('/demandes', verifyToken, createDemande);
router.get('/demandes/mes-demandes', verifyToken, getMyDemandes);
router.get('/demandes/reçues', verifyToken, getReceivedDemandes);
router.put('/demandes/:id', verifyToken, repondreDemande);

// Route pour marquer un échange complété
router.put('/annonces/:id/echange', verifyToken, marquerEchange);

module.exports = router;