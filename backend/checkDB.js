// backend/checkDB.js
const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'school.db');
console.log('📁 Chemin BD:', dbPath);
console.log('📁 La BD existe ?', fs.existsSync(dbPath));

const db = new sqlite3.Database(dbPath);

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
        console.log('❌ Erreur:', err.message);
    } else {
        console.log('📋 Tables trouvées:', rows.length);
        rows.forEach(row => console.log('   -', row.name));
    }
    db.close();
});