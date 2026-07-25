// backend/controllers/tutorController.js
// Contrôleur pour le module TUTEUREXPRESS (tutorat entre élèves)

// Devenir tuteur (mettre à jour son profil)
const devenirTuteur = (req, res) => {
    const db = req.app.get('db');
    const userId = req.user.id;
    const { matieres, bio_tuteur, disponibilites } = req.body;

    if (!matieres || matieres.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Veuillez indiquer au moins une matière"
        });
    }

    // Mettre à jour l'utilisateur
    const sql = `UPDATE users SET 
                 role = 'tuteur', 
                 est_volontaire = 1,
                 matieres_preferees = ?,
                 bio = COALESCE(?, bio)
                 WHERE id = ?`;

    db.run(sql, [JSON.stringify(matieres), bio_tuteur || null, userId], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({
            success: true,
            message: "Félicitations ! Vous êtes maintenant tuteur volontaire 🎉"
        });
    });
};

// Récupérer tous les tuteurs disponibles
const getTuteurs = (req, res) => {
    const db = req.app.get('db');
    const { matiere, niveau, ville, limit } = req.query;

    let sql = `SELECT id, nom, prenom, email, niveau, etablissement, ville, quartier, 
               matieres_preferees, bio, role, est_volontaire
               FROM users 
               WHERE role IN ('tuteur', 'admin') AND est_volontaire = 1`;
    let params = [];

    if (matiere) {
        sql += ` AND matieres_preferees LIKE ?`;
        params.push(`%${matiere}%`);
    }
    if (ville) {
        sql += ` AND ville = ?`;
        params.push(ville);
    }
    if (niveau) {
        sql += ` AND niveau = ?`;
        params.push(niveau);
    }

    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit || 20);

    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        
        // Parser les matieres_preferees pour chaque tuteur
        rows.forEach(row => {
            if (row.matieres_preferees) {
                try {
                    row.matieres_preferees = JSON.parse(row.matieres_preferees);
                } catch(e) {
                    row.matieres_preferees = [row.matieres_preferees];
                }
            }
        });
        
        res.json({ success: true, tuteurs: rows, total: rows.length });
    });
};

// Récupérer un tuteur par ID
const getTuteurById = (req, res) => {
    const db = req.app.get('db');
    const { id } = req.params;

    db.get(`SELECT id, nom, prenom, email, niveau, etablissement, ville, quartier, 
            matieres_preferees, bio, role, est_volontaire, created_at
            FROM users WHERE id = ? AND role IN ('tuteur', 'admin')`, [id], (err, row) => {
        if (err || !row) {
            return res.status(404).json({ success: false, message: "Tuteur non trouvé" });
        }
        
        if (row.matieres_preferees) {
            try {
                row.matieres_preferees = JSON.parse(row.matieres_preferees);
            } catch(e) {
                row.matieres_preferees = [row.matieres_preferees];
            }
        }
        
        res.json({ success: true, tuteur: row });
    });
};

// Demander une session de tutorat
const demanderSession = (req, res) => {
    const db = req.app.get('db');
    const eleveId = req.user.id;
    const { tuteur_id, matiere, message, date_session } = req.body;

    if (!tuteur_id || !matiere) {
        return res.status(400).json({
            success: false,
            message: "Tuteur et matière requis"
        });
    }

    // Vérifier que le tuteur existe
    db.get(`SELECT id FROM users WHERE id = ? AND role IN ('tuteur', 'admin')`, [tuteur_id], (err, tuteur) => {
        if (err || !tuteur) {
            return res.status(404).json({ success: false, message: "Tuteur non trouvé" });
        }

        const sql = `INSERT INTO sessions_tutorat 
                     (eleve_id, tuteur_id, matiere, message_demande, date_session, statut) 
                     VALUES (?, ?, ?, ?, ?, 'en_attente')`;

        db.run(sql, [eleveId, tuteur_id, matiere, message || null, date_session || null], function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({
                success: true,
                message: "Demande de tutorat envoyée ! Le tuteur vous répondra bientôt.",
                session_id: this.lastID
            });
        });
    });
};

// Mes sessions (élève)
const getMySessions = (req, res) => {
    const db = req.app.get('db');
    const userId = req.user.id;

    db.all(`SELECT s.*, 
            u.nom as tuteur_nom, u.prenom as tuteur_prenom, u.email as tuteur_email,
            u2.nom as eleve_nom, u2.prenom as eleve_prenom
            FROM sessions_tutorat s
            LEFT JOIN users u ON s.tuteur_id = u.id
            LEFT JOIN users u2 ON s.eleve_id = u2.id
            WHERE s.eleve_id = ? OR s.tuteur_id = ?
            ORDER BY s.created_at DESC`, [userId, userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, sessions: rows });
    });
};

// Sessions reçues (tuteur)
const getReceivedSessions = (req, res) => {
    const db = req.app.get('db');
    const userId = req.user.id;

    db.all(`SELECT s.*, u.nom, u.prenom, u.email, u.niveau as eleve_niveau
            FROM sessions_tutorat s
            JOIN users u ON s.eleve_id = u.id
            WHERE s.tuteur_id = ? AND s.statut = 'en_attente'
            ORDER BY s.created_at DESC`, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, demandes: rows });
    });
};

// Répondre à une demande de tutorat (accepter/refuser)
const repondreSession = (req, res) => {
    const db = req.app.get('db');
    const userId = req.user.id;
    const { id } = req.params;
    const { statut, date_session } = req.body;

    if (!['acceptee', 'refusee'].includes(statut)) {
        return res.status(400).json({ success: false, message: "Statut invalide" });
    }

    // Vérifier que la session concerne ce tuteur
    db.get(`SELECT * FROM sessions_tutorat WHERE id = ? AND tuteur_id = ?`, [id, userId], (err, session) => {
        if (err || !session) {
            return res.status(404).json({ success: false, message: "Session non trouvée" });
        }

        let sql = `UPDATE sessions_tutorat SET statut = ?`;
        let params = [statut];

        if (statut === 'acceptee' && date_session) {
            sql += `, date_session = ?`;
            params.push(date_session);
        }

        sql += ` WHERE id = ?`;
        params.push(id);

        db.run(sql, params, function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({
                success: true,
                message: statut === 'acceptee' ? "Session acceptée !" : "Session refusée"
            });
        });
    });
};

// Terminer une session et noter le tuteur
const terminerSession = (req, res) => {
    const db = req.app.get('db');
    const userId = req.user.id;
    const { id } = req.params;
    const { evaluation_eleve, commentaire } = req.body;

    if (!evaluation_eleve || evaluation_eleve < 1 || evaluation_eleve > 5) {
        return res.status(400).json({
            success: false,
            message: "Note invalide (1 à 5 étoiles)"
        });
    }

    // Vérifier que l'élève est bien celui de la session
    db.get(`SELECT * FROM sessions_tutorat WHERE id = ? AND eleve_id = ? AND statut = 'acceptee'`, [id, userId], (err, session) => {
        if (err || !session) {
            return res.status(404).json({ success: false, message: "Session non trouvée ou non acceptée" });
        }

        db.run(`UPDATE sessions_tutorat SET statut = 'terminee', evaluation_eleve = ?, commentaire = ? WHERE id = ?`,
            [evaluation_eleve, commentaire || null, id], function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({
                success: true,
                message: "Merci ! Votre évaluation a été enregistrée."
            });
        });
    });
};

// Statistiques d'un tuteur
const getTuteurStats = (req, res) => {
    const db = req.app.get('db');
    const { id } = req.params;

    db.get(`SELECT 
            COUNT(*) as total_sessions,
            AVG(evaluation_eleve) as note_moyenne,
            SUM(CASE WHEN statut = 'terminee' THEN 1 ELSE 0 END) as sessions_terminees
            FROM sessions_tutorat 
            WHERE tuteur_id = ? AND statut = 'terminee'`, [id], (err, stats) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({
            success: true,
            stats: {
                total_sessions: stats.total_sessions || 0,
                note_moyenne: stats.note_moyenne ? Math.round(stats.note_moyenne * 10) / 10 : 0,
                sessions_terminees: stats.sessions_terminees || 0
            }
        });
    });
};

module.exports = {
    devenirTuteur,
    getTuteurs,
    getTuteurById,
    demanderSession,
    getMySessions,
    getReceivedSessions,
    repondreSession,
    terminerSession,
    getTuteurStats
};