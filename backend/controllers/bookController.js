// backend/controllers/bookController.js
// Contrôleur pour le module BOOKMATCH (échange de livres)

// Créer une annonce
const createAnnonce = (req, res) => {
    const db = req.app.get('db');
    const userId = req.user.id;
    const {
        titre_livre,
        auteur,
        matiere,
        niveau,
        etat,
        type_echange,
        ville,
        quartier,
        etablissement
    } = req.body;

    if (!titre_livre || !ville || !quartier) {
        return res.status(400).json({
            success: false,
            message: "Titre, ville et quartier sont requis"
        });
    }

    const sql = `INSERT INTO annonces_livres 
                 (user_id, titre_livre, auteur, matiere, niveau, etat, type_echange, ville, quartier, etablissement) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [userId, titre_livre, auteur || null, matiere || null, niveau || null, 
                  etat || 'bon', type_echange || 'don', ville, quartier, etablissement || null],
        function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({
                success: true,
                message: "Annonce créée avec succès !",
                annonce_id: this.lastID
            });
        });
};

// Récupérer toutes les annonces (avec filtres)
const getAnnonces = (req, res) => {
    const db = req.app.get('db');
    const { ville, quartier, matiere, niveau, statut, limit } = req.query;

    let sql = `SELECT a.*, u.nom, u.prenom, u.email, u.etablissement as user_etablissement
               FROM annonces_livres a
               JOIN users u ON a.user_id = u.id
               WHERE a.statut = 'disponible'`;
    let params = [];

    if (ville) {
        sql += ` AND a.ville = ?`;
        params.push(ville);
    }
    if (quartier) {
        sql += ` AND a.quartier = ?`;
        params.push(quartier);
    }
    if (matiere) {
        sql += ` AND a.matiere = ?`;
        params.push(matiere);
    }
    if (niveau) {
        sql += ` AND a.niveau = ?`;
        params.push(niveau);
    }

    sql += ` ORDER BY a.created_at DESC LIMIT ?`;
    params.push(limit || 20);

    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, annonces: rows, total: rows.length });
    });
};

// Récupérer mes annonces
const getMyAnnonces = (req, res) => {
    const db = req.app.get('db');
    const userId = req.user.id;

    db.all(`SELECT * FROM annonces_livres WHERE user_id = ? ORDER BY created_at DESC`, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, annonces: rows });
    });
};

// Récupérer une annonce par ID
const getAnnonceById = (req, res) => {
    const db = req.app.get('db');
    const { id } = req.params;

    db.get(`SELECT a.*, u.nom, u.prenom, u.email, u.etablissement, u.ville, u.quartier
            FROM annonces_livres a
            JOIN users u ON a.user_id = u.id
            WHERE a.id = ?`, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        if (!row) {
            return res.status(404).json({ success: false, message: "Annonce non trouvée" });
        }
        res.json({ success: true, annonce: row });
    });
};

// Modifier une annonce
const updateAnnonce = (req, res) => {
    const db = req.app.get('db');
    const userId = req.user.id;
    const { id } = req.params;
    const { titre_livre, auteur, matiere, niveau, etat, type_echange, ville, quartier, etablissement } = req.body;

    db.get(`SELECT user_id FROM annonces_livres WHERE id = ?`, [id], (err, annonce) => {
        if (err || !annonce) {
            return res.status(404).json({ success: false, message: "Annonce non trouvée" });
        }
        if (annonce.user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Non autorisé" });
        }

        const sql = `UPDATE annonces_livres SET 
                     titre_livre = COALESCE(?, titre_livre),
                     auteur = COALESCE(?, auteur),
                     matiere = COALESCE(?, matiere),
                     niveau = COALESCE(?, niveau),
                     etat = COALESCE(?, etat),
                     type_echange = COALESCE(?, type_echange),
                     ville = COALESCE(?, ville),
                     quartier = COALESCE(?, quartier),
                     etablissement = COALESCE(?, etablissement)
                     WHERE id = ?`;

        db.run(sql, [titre_livre, auteur, matiere, niveau, etat, type_echange, ville, quartier, etablissement, id],
            function(err) {
                if (err) {
                    return res.status(500).json({ success: false, message: err.message });
                }
                res.json({ success: true, message: "Annonce modifiée avec succès" });
            });
    });
};

// Supprimer une annonce
const deleteAnnonce = (req, res) => {
    const db = req.app.get('db');
    const userId = req.user.id;
    const { id } = req.params;

    db.get(`SELECT user_id FROM annonces_livres WHERE id = ?`, [id], (err, annonce) => {
        if (err || !annonce) {
            return res.status(404).json({ success: false, message: "Annonce non trouvée" });
        }
        if (annonce.user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Non autorisé" });
        }

        db.run(`DELETE FROM annonces_livres WHERE id = ?`, [id], function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, message: "Annonce supprimée avec succès" });
        });
    });
};

// Demander un échange
const createDemande = (req, res) => {
    const db = req.app.get('db');
    const userId = req.user.id;
    const { annonce_id, message } = req.body;

    if (!annonce_id) {
        return res.status(400).json({ success: false, message: "Annonce ID requis" });
    }

    // Vérifier que l'annonce existe et est disponible
    db.get(`SELECT user_id, statut FROM annonces_livres WHERE id = ?`, [annonce_id], (err, annonce) => {
        if (err || !annonce) {
            return res.status(404).json({ success: false, message: "Annonce non trouvée" });
        }
        if (annonce.user_id === userId) {
            return res.status(400).json({ success: false, message: "Vous ne pouvez pas demander votre propre livre" });
        }
        if (annonce.statut !== 'disponible') {
            return res.status(400).json({ success: false, message: "Ce livre n'est plus disponible" });
        }

        const sql = `INSERT INTO demandes_echange (annonce_id, demandeur_id, message) VALUES (?, ?, ?)`;
        db.run(sql, [annonce_id, userId, message || null], function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({
                success: true,
                message: "Demande envoyée avec succès !",
                demande_id: this.lastID
            });
        });
    });
};

// Mes demandes envoyées
const getMyDemandes = (req, res) => {
    const db = req.app.get('db');
    const userId = req.user.id;

    db.all(`SELECT d.*, a.titre_livre, a.user_id as proprietaire_id, u.nom, u.prenom, u.email
            FROM demandes_echange d
            JOIN annonces_livres a ON d.annonce_id = a.id
            JOIN users u ON a.user_id = u.id
            WHERE d.demandeur_id = ?
            ORDER BY d.created_at DESC`, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, demandes: rows });
    });
};

// Demandes reçues (pour mes annonces)
const getReceivedDemandes = (req, res) => {
    const db = req.app.get('db');
    const userId = req.user.id;

    db.all(`SELECT d.*, a.titre_livre, u.nom, u.prenom, u.email
            FROM demandes_echange d
            JOIN annonces_livres a ON d.annonce_id = a.id
            JOIN users u ON d.demandeur_id = u.id
            WHERE a.user_id = ? AND d.statut = 'en_attente'
            ORDER BY d.created_at DESC`, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, demandes: rows });
    });
};

// Répondre à une demande (accepter/refuser)
const repondreDemande = (req, res) => {
    const db = req.app.get('db');
    const userId = req.user.id;
    const { id } = req.params;
    const { statut } = req.body;

    if (!['accepte', 'refuse'].includes(statut)) {
        return res.status(400).json({ success: false, message: "Statut invalide" });
    }

    // Vérifier que la demande concerne une annonce de l'utilisateur
    db.get(`SELECT d.*, a.user_id as proprietaire_id, a.id as annonce_id
            FROM demandes_echange d
            JOIN annonces_livres a ON d.annonce_id = a.id
            WHERE d.id = ?`, [id], (err, demande) => {
        if (err || !demande) {
            return res.status(404).json({ success: false, message: "Demande non trouvée" });
        }
        if (demande.proprietaire_id !== userId) {
            return res.status(403).json({ success: false, message: "Non autorisé" });
        }

        db.run(`UPDATE demandes_echange SET statut = ? WHERE id = ?`, [statut, id], function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }

            // Si accepté, marquer l'annonce comme non disponible
            if (statut === 'accepte') {
                db.run(`UPDATE annonces_livres SET statut = 'en_attente' WHERE id = ?`, [demande.annonce_id]);
            }

            res.json({ success: true, message: `Demande ${statut === 'accepte' ? 'acceptée' : 'refusée'} avec succès` });
        });
    });
};

// Marquer un livre comme échangé
const marquerEchange = (req, res) => {
    const db = req.app.get('db');
    const userId = req.user.id;
    const { id } = req.params;

    db.get(`SELECT user_id FROM annonces_livres WHERE id = ?`, [id], (err, annonce) => {
        if (err || !annonce) {
            return res.status(404).json({ success: false, message: "Annonce non trouvée" });
        }
        if (annonce.user_id !== userId) {
            return res.status(403).json({ success: false, message: "Non autorisé" });
        }

        db.run(`UPDATE annonces_livres SET statut = 'echange_donne' WHERE id = ?`, [id], function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, message: "Livre marqué comme échangé" });
        });
    });
};

module.exports = {
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
};