// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Middleware pour vérifier le token JWT (users)
const verifyToken = (req, res, next) => {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false, 
            message: 'Accès non autorisé. Token manquant.' 
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Vérifier le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Ajouter les infos de l'utilisateur à la requête
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };
        
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token invalide ou expiré.' 
        });
    }
};

// Middleware pour vérifier soit le token JWT (users) soit le matricule (élèves)
const verifyAuth = (req, res, next) => {
    // Vérifier d'abord si c'est un user avec token
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    
    // Vérifier si c'est un élève avec matricule
    const matricule = req.headers['x-matricule'];
    
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role
            };
            return next();
        } catch (error) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token invalide ou expiré.' 
            });
        }
    }
    
    if (matricule) {
        // Élève connecté avec matricule
        req.matricule = matricule;
        return next();
    }
    
    return res.status(401).json({ 
        success: false, 
        message: 'Accès non autorisé. Veuillez vous connecter.' 
    });
};

// Middleware pour vérifier si l'utilisateur est admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ 
            success: false, 
            message: 'Accès refusé. Droits administrateur requis.' 
        });
    }
};

// Middleware pour vérifier si l'utilisateur est tuteur ou admin
const isTutorOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'tuteur' || req.user.role === 'admin')) {
        next();
    } else {
        return res.status(403).json({ 
            success: false, 
            message: 'Accès refusé. Statut tuteur requis.' 
        });
    }
};

module.exports = {
    verifyToken,
    verifyAuth,
    isAdmin,
    isTutorOrAdmin
};