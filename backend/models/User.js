// backend/models/User.js
const bcrypt = require('bcryptjs');

class User {
    constructor(db) {
        this.db = db;
    }

    // Créer un nouvel utilisateur (inscription riche)
    create(userData, callback) {
        const {
            nom, prenom, email, password,
            niveau, etablissement, ville, quartier,
            matieres_preferees, bio, photo, role, est_volontaire
        } = userData;

        // Hash du mot de passe
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Conversion matieres_preferees en JSON si c'est un objet/tableau
        const matieresJSON = matieres_preferees ? JSON.stringify(matieres_preferees) : null;

        const sql = `
            INSERT INTO users (
                nom, prenom, email, password, niveau,
                etablissement, ville, quartier, matieres_preferees,
                bio, photo, role, est_volontaire
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        this.db.run(sql, [
            nom, prenom, email, hashedPassword, niveau,
            etablissement, ville, quartier, matieresJSON,
            bio || null, photo || null, role || 'eleve', est_volontaire || 0
        ], function(err) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, { id: this.lastID, email });
            }
        });
    }

    // Trouver un utilisateur par email
    findByEmail(email, callback) {
        const sql = `SELECT * FROM users WHERE email = ?`;
        this.db.get(sql, [email], (err, row) => {
            callback(err, row);
        });
    }

    // Trouver un utilisateur par ID
    findById(id, callback) {
        const sql = `SELECT id, nom, prenom, email, niveau, etablissement, ville, quartier, matieres_preferees, bio, photo, role, est_volontaire, created_at FROM users WHERE id = ?`;
        this.db.get(sql, [id], (err, row) => {
            callback(err, row);
        });
    }

    // Vérifier le mot de passe
    comparePassword(plainPassword, hashedPassword) {
        return bcrypt.compareSync(plainPassword, hashedPassword);
    }
}

module.exports = User;