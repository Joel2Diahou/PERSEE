// backend/addColumns.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'school.db');
const db = new sqlite3.Database(dbPath);

const columns = [
  { name: 'type_depot', sql: "ALTER TABLE annonces_livres ADD COLUMN type_depot TEXT DEFAULT '📚 Livre'" },
  { name: 'serie', sql: "ALTER TABLE annonces_livres ADD COLUMN serie TEXT" },
  { name: 'description', sql: "ALTER TABLE annonces_livres ADD COLUMN description TEXT" },
  { name: 'etat_activite', sql: "ALTER TABLE annonces_livres ADD COLUMN etat_activite TEXT" }
];

let count = 0;

columns.forEach(col => {
  db.run(col.sql, (err) => {
    if (err) {
      if (!err.message.includes('duplicate column name')) {
        console.log(`⚠️ Erreur ajout ${col.name}:`, err.message);
      } else {
        console.log(`ℹ️ Colonne ${col.name} existe déjà`);
        count++;
      }
    } else {
      console.log(`✅ Colonne ${col.name} ajoutée`);
      count++;
    }
    
    // Vérifier si toutes les colonnes ont été traitées
    if (count === columns.length) {
      console.log('\n✅ Vérification terminée');
      db.close();
    }
  });
});