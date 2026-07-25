// backend/controllers/prepaController.js
// Contrôleur pour le module PRÉPAFLASH (quiz)

// Récupérer les quiz par niveau et matière
const getQuiz = (req, res) => {
    const db = req.app.get('db');
    const { niveau, matiere, difficulte, limit } = req.query;
    
    let sql = `SELECT id, matiere, niveau, question, type_question, options, difficulte FROM quiz WHERE 1=1`;
    let params = [];
    
    if (niveau) {
        sql += ` AND niveau = ?`;
        params.push(niveau);
    }
    if (matiere) {
        sql += ` AND matiere = ?`;
        params.push(matiere);
    }
    if (difficulte) {
        sql += ` AND difficulte = ?`;
        params.push(difficulte);
    }
    
    sql += ` ORDER BY RANDOM() LIMIT ?`;
    params.push(limit || 10);
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, quiz: rows, total: rows.length });
    });
};

// Récupérer une question spécifique
const getQuestionById = (req, res) => {
    const db = req.app.get('db');
    const { id } = req.params;
    
    db.get(`SELECT * FROM quiz WHERE id = ?`, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        if (!row) {
            return res.status(404).json({ success: false, message: 'Question non trouvée' });
        }
        res.json({ success: true, question: row });
    });
};

// Soumettre une réponse et correction automatique
const submitAnswer = (req, res) => {
    const db = req.app.get('db');
    const userId = req.user.id;
    const { quizId, reponseDonnee, tempsSecondes } = req.body;
    
    if (!quizId || !reponseDonnee) {
        return res.status(400).json({ success: false, message: 'Données incomplètes' });
    }
    
    // Récupérer la bonne réponse
    db.get(`SELECT reponse_correcte FROM quiz WHERE id = ?`, [quizId], (err, quiz) => {
        if (err || !quiz) {
            return res.status(500).json({ success: false, message: 'Question non trouvée' });
        }
        
        const estCorrecte = (reponseDonnee.toLowerCase().trim() === quiz.reponse_correcte.toLowerCase().trim()) ? 1 : 0;
        
        // Enregistrer la réponse
        db.run(`INSERT INTO reponses_quiz (user_id, quiz_id, reponse_donnee, est_correcte, temps_secondes)
                VALUES (?, ?, ?, ?, ?)`,
            [userId, quizId, reponseDonnee, estCorrecte, tempsSecondes || null],
            (err) => {
                if (err) {
                    return res.status(500).json({ success: false, message: err.message });
                }
                
                res.json({
                    success: true,
                    est_correcte: estCorrecte === 1,
                    reponse_attendue: quiz.reponse_correcte,
                    message: estCorrecte === 1 ? 'Bonne réponse ! 🎉' : 'Mauvaise réponse. Regarde la bonne réponse ci-dessous. 📚'
                });
            }
        );
    });
};

// Récupérer la progression de l'utilisateur
const getProgression = (req, res) => {
    const db = req.app.get('db');
    const userId = req.user.id;
    
    db.all(`
        SELECT 
            q.matiere,
            COUNT(*) as total_questions,
            SUM(CASE WHEN r.est_correcte = 1 THEN 1 ELSE 0 END) as bonnes_reponses,
            ROUND(100.0 * SUM(CASE WHEN r.est_correcte = 1 THEN 1 ELSE 0 END) / COUNT(*), 1) as pourcentage
        FROM reponses_quiz r
        JOIN quiz q ON r.quiz_id = q.id
        WHERE r.user_id = ?
        GROUP BY q.matiere
    `, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        
        db.get(`
            SELECT COUNT(*) as total, SUM(CASE WHEN est_correcte = 1 THEN 1 ELSE 0 END) as bonnes
            FROM reponses_quiz WHERE user_id = ?
        `, [userId], (err, totalRow) => {
            res.json({
                success: true,
                progression_par_matiere: rows,
                total: totalRow ? {
                    total_questions: totalRow.total,
                    bonnes_reponses: totalRow.bonnes,
                    pourcentage: totalRow.total ? Math.round(100 * totalRow.bonnes / totalRow.total) : 0
                } : { total_questions: 0, bonnes_reponses: 0, pourcentage: 0 }
            });
        });
    });
};

// Récupérer les matières disponibles
const getMatieres = (req, res) => {
    const db = req.app.get('db');
    
    db.all(`SELECT DISTINCT matiere, COUNT(*) as total FROM quiz GROUP BY matiere`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, matieres: rows });
    });
};

module.exports = {
    getQuiz,
    getQuestionById,
    submitAnswer,
    getProgression,
    getMatieres
};