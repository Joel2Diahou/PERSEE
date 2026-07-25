// backend/checkUsers.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'school.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT id, nom, prenom, email, role FROM users", (err, rows) => {
  if (err) {
    console.log('❌ Erreur:', err.message);
  } else {
    console.log('📋 Utilisateurs dans la base:');
    rows.forEach(r => {
      console.log(`   ${r.id}: ${r.prenom} ${r.nom} (${r.role}) - ${r.email}`);
    });
    console.log(`📊 Total: ${rows.length}`);
  }
  db.close();
});