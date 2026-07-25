// backend/controllers/orientationController.js
const { orientationChat, recommendSchools } = require('../services/groqService');

// Chat d'orientation (supporte à la fois token JWT et matricule élève)
const chatOrientation = async (req, res) => {
    const { message, niveau, historique } = req.body;
    
    // Vérifier l'authentification (token JWT pour users, ou matricule pour élèves)
    const userId = req.user?.id;
    const matricule = req.headers['x-matricule'];
    
    if (!userId && !matricule) {
        return res.status(401).json({ 
            success: false, 
            message: 'Non autorisé. Veuillez vous connecter.' 
        });
    }

    if (!message) {
        return res.status(400).json({
            success: false,
            message: "Le message est requis"
        });
    }

    if (!niveau) {
        return res.status(400).json({
            success: false,
            message: "Le niveau est requis (6eme, 5eme, 4eme, 3eme, Seconde, 1ere, Terminale)"
        });
    }

    const result = await orientationChat(message, niveau, historique || []);

    if (result.success) {
        res.json({
            success: true,
            response: result.response,
            usage: result.usage
        });
    } else {
        console.error('Erreur orientationChat:', result.error);
        res.status(500).json({
            success: false,
            message: "Erreur avec l'IA",
            error: result.error
        });
    }
};

// Recommandation d'écoles
const getSchoolRecommendations = async (req, res) => {
    const { profil, niveau, ville } = req.body;
    
    // Vérifier l'authentification
    const userId = req.user?.id;
    const matricule = req.headers['x-matricule'];
    
    if (!userId && !matricule) {
        return res.status(401).json({ 
            success: false, 
            message: 'Non autorisé. Veuillez vous connecter.' 
        });
    }

    if (!profil || !niveau) {
        return res.status(400).json({
            success: false,
            message: "Profil et niveau requis"
        });
    }

    const result = await recommendSchools(profil, niveau, ville || "Abidjan");

    if (result.success) {
        res.json({
            success: true,
            recommendations: result.recommendations
        });
    } else {
        res.status(500).json({
            success: false,
            message: "Erreur de recommandation",
            error: result.error
        });
    }
};

module.exports = {
    chatOrientation,
    getSchoolRecommendations
};