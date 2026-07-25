// backend/cleanDatabase.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'school.db');
const db = new sqlite3.Database(dbPath);

console.log('🚀 Nettoyage de la base de données...\n');

// 1. Supprimer tous les utilisateurs sauf admin
db.run("DELETE FROM users WHERE role != 'admin'", function(err) {
  if (err) {
    console.log('❌ Erreur suppression utilisateurs:', err.message);
  } else {
    console.log('✅ ' + this.changes + ' utilisateurs supprimés (hors admin)');
  }
});

// 2. Supprimer tous les élèves
db.run("DELETE FROM eleves", function(err) {
  if (err) {
    console.log('❌ Erreur suppression élèves:', err.message);
  } else {
    console.log('✅ ' + this.changes + ' élèves supprimés');
  }
});

// 3. Supprimer les demandes d'échange
db.run("DELETE FROM demandes_echange", function(err) {
  if (err) {
    console.log('❌ Erreur suppression demandes:', err.message);
  } else {
    console.log('✅ ' + this.changes + ' demandes supprimées');
  }
});

// 4. Créer un compte parent
setTimeout(() => {
  const parentNom = 'Kouadio';
  const parentPrenom = 'Jean';
  const parentEmail = 'parent@test.com';
  const parentPassword = bcrypt.hashSync('parent123', 10);
  const parentTelephone = '07070707';

  db.run(
    "INSERT INTO users (nom, prenom, email, password, telephone, role) VALUES (?, ?, ?, ?, ?, ?)",
    [parentNom, parentPrenom, parentEmail, parentPassword, parentTelephone, 'parent'],
    function(err) {
      if (err) {
        console.log('❌ Erreur création parent:', err.message);
      } else {
        console.log('✅ Parent créé avec ID:', this.lastID);
        console.log('   📧 Email: parent@test.com');
        console.log('   🔑 Mot de passe: parent123');
      }
    }
  );

  // 5. Créer un compte tuteur
  const tuteurNom = 'Traoré';
  const tuteurPrenom = 'Fatou';
  const tuteurEmail = 'tuteur@test.com';
  const tuteurPassword = bcrypt.hashSync('tuteur123', 10);
  const tuteurTelephone = '07070708';
  const matieres = 'Mathématiques,Physique-Chimie';

  db.run(
    "INSERT INTO users (nom, prenom, email, password, telephone, role, matieres_preferees, est_volontaire) VALUES (?, ?, ?, ?, ?, ?, ?, 1)",
    [tuteurNom, tuteurPrenom, tuteurEmail, tuteurPassword, tuteurTelephone, 'tuteur', matieres],
    function(err) {
      if (err) {
        console.log('❌ Erreur création tuteur:', err.message);
      } else {
        console.log('✅ Tuteur créé avec ID:', this.lastID);
        console.log('   📧 Email: tuteur@test.com');
        console.log('   🔑 Mot de passe: tuteur123');
      }
    }
  );

  // 6. Vérifier les utilisateurs
  setTimeout(() => {
    db.all("SELECT id, nom, prenom, email, role FROM users", (err, rows) => {
      if (err) {
        console.log('❌ Erreur vérification:', err.message);
      } else {
        console.log('\n📋 Utilisateurs dans la base:');
        rows.forEach(r => {
          console.log(`   ${r.id}: ${r.prenom} ${r.nom} (${r.role}) - ${r.email}`);
        });
        console.log(`📊 Total: ${rows.length}`);
      }
      db.close();
    });
  }, 500);
}, 500);