// backend/addQuestions.js (version corrigée)
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'database', 'school.db'));

// Questions pour la 3ème (BEPC) - sans serie
const questions3eme = [
  // Maths 3ème
  ['Mathématiques', '3eme', 'Quelle est la racine carrée de 144 ?', 'qcm', '["10","11","12","13"]', '12', 'debutant'],
  ['Mathématiques', '3eme', 'Si x = 3, que vaut 2x² + 5 ?', 'qcm', '["17","23","18","21"]', '23', 'intermediaire'],
  ['Mathématiques', '3eme', 'Le théorème de Pythagore s\'applique dans quel type de triangle ?', 'qcm', '["Quelconque","Isocèle","Rectangle","Équilatéral"]', 'Rectangle', 'debutant'],
  
  // Français 3ème
  ['Français', '3eme', 'Quel est le pluriel de "cheval" ?', 'qcm', '["chevaux","chevaus","chevals","chevalx"]', 'chevaux', 'debutant'],
  ['Français', '3eme', 'Le verbe "manger" à l\'imparfait (je) :', 'qcm', '["je mange","je mangeais","je mangerai","j\'ai mangé"]', 'je mangeais', 'debutant'],
  ['Français', '3eme', 'Qu\'est-ce qu\'une métaphore ?', 'qcm', '["Comparaison sans outil","Exagération","Répétition","Opposition"]', 'Comparaison sans outil', 'intermediaire'],
  
  // Anglais 3ème
  ['Anglais', '3eme', 'Comment dit-on "Bonjour" en anglais ?', 'qcm', '["Goodbye","Hello","Thanks","Please"]', 'Hello', 'debutant'],
  ['Anglais', '3eme', 'Comment dit-on "Merci" en anglais ?', 'qcm', '["Please","Sorry","Thank you","Hello"]', 'Thank you', 'debutant'],
  ['Anglais', '3eme', 'Le futur simple de "to go" :', 'qcm', '["go","went","will go","going"]', 'will go', 'intermediaire'],
  
  // SVT 3ème
  ['SVT', '3eme', 'Quel est l\'organe qui pompe le sang ?', 'qcm', '["Cerveau","Poumon","Coeur","Foie"]', 'Coeur', 'debutant'],
  ['SVT', '3eme', 'La photosynthèse se déroule dans :', 'qcm', '["Racines","Tiges","Feuilles","Fleurs"]', 'Feuilles', 'debutant'],
  ['SVT', '3eme', 'Combien de chromosomes possède un humain ?', 'qcm', '["23","46","48","24"]', '46', 'intermediaire'],
  
  // Histoire-Géo 3ème
  ['Histoire-Géographie', '3eme', 'Quelle est la capitale de la Côte d\'Ivoire ?', 'qcm', '["Abidjan","Bouaké","Yamoussoukro","San Pedro"]', 'Yamoussoukro', 'debutant'],
  ['Histoire-Géographie', '3eme', 'Qui a découvert l\'Amérique en 1492 ?', 'qcm', '["Vasco de Gama","Christophe Colomb","Magellan","Marco Polo"]', 'Christophe Colomb', 'debutant'],
  
  // Physique-Chimie 3ème
  ['Physique-Chimie', '3eme', 'Quelle est la formule de l\'eau ?', 'qcm', '["CO2","O2","H2O","NaCl"]', 'H2O', 'debutant'],
  ['Physique-Chimie', '3eme', 'L\'unité de la résistance électrique est :', 'qcm', '["Volt","Ampère","Ohm","Watt"]', 'Ohm', 'intermediaire'],
  
  // Éducation Civique 3ème
  ['Éducation Civique', '3eme', 'Le président de la République est élu pour :', 'qcm', '["3 ans","4 ans","5 ans","6 ans"]', '5 ans', 'debutant'],
  ['Éducation Civique', '3eme', 'La devise de la Côte d\'Ivoire est :', 'qcm', '["Liberté-Égalité-Fraternité","Union-Discipline-Travail","Paix-Travail-Patrie","Justice-Liberté-Égalité"]', 'Union-Discipline-Travail', 'debutant']
];

// Questions pour la Terminale (avec serie)
const questionsTerminale = [
  // Maths Terminale C
  ['Mathématiques', 'terminale', 'La dérivée de ln(x) est :', 'qcm', '["1/x","x","e^x","ln(x)"]', '1/x', 'difficile', 'C'],
  ['Mathématiques', 'terminale', 'La limite de sin(x)/x quand x tend vers 0 est :', 'qcm', '["0","1","∞","-1"]', '1', 'difficile', 'C'],
  ['Mathématiques', 'terminale', 'L\'intégrale de 0 à 1 de x dx est :', 'qcm', '["0","0.5","1","2"]', '0.5', 'intermediaire', 'C'],
  
  // Physique Terminale C
  ['Physique-Chimie', 'terminale', 'La deuxième loi de Newton s\'écrit :', 'qcm', '["F=ma","E=mc²","U=R.I","P=mg"]', 'F=ma', 'difficile', 'C'],
  ['Physique-Chimie', 'terminale', 'La constante de Planck est notée :', 'qcm', '["h","G","c","k"]', 'h', 'difficile', 'C'],
  
  // SVT Terminale D
  ['SVT', 'terminale', 'La mitose permet :', 'qcm', '["Division cellulaire","Fécondation","Mutation","Transcription"]', 'Division cellulaire', 'intermediaire', 'D'],
  ['SVT', 'terminale', 'L\'ADN est composé de :', 'qcm', '["Acides aminés","Nucléotides","Glucides","Lipides"]', 'Nucléotides', 'intermediaire', 'D'],
  
  // Littérature Terminale A
  ['Littérature', 'terminale', 'L\'auteur des "Misérables" est :', 'qcm', '["Victor Hugo","Émile Zola","Gustave Flaubert","Albert Camus"]', 'Victor Hugo', 'debutant', 'A'],
  ['Littérature', 'terminale', 'Le courant littéraire du XIXe siècle qui privilégie les sentiments est :', 'qcm', '["Classicisme","Romantisme","Réalisme","Naturalisme"]', 'Romantisme', 'intermediaire', 'A'],
  
  // Comptabilité Terminale G
  ['Comptabilité', 'terminale', 'Un bilan comptable se compose :', 'qcm', '["Actif/Passif","Débit/Crédit","Produit/Charge","Avoir/Dette"]', 'Actif/Passif', 'intermediaire', 'G'],
  
  // Maths Terminale F
  ['Mathématiques', 'terminale', 'Le théorème de Thalès s\'applique dans :', 'qcm', '["Triangle rectangle","Triangle quelconque","Configuration croisée","Cercle"]', 'Configuration croisée', 'intermediaire', 'F']
];

// Insertion
console.log('📚 Insertion des questions...');

let count = 0;

const insertQuestion = (q, callback) => {
  // Vérifier si la question a 7 ou 8 paramètres
  let sql, params;
  if (q.length === 7) {
    sql = `INSERT INTO quiz (matiere, niveau, question, type_question, options, reponse_correcte, difficulte) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`;
    params = q;
  } else {
    sql = `INSERT INTO quiz (matiere, niveau, question, type_question, options, reponse_correcte, difficulte, serie) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    params = q;
  }
  
  db.run(sql, params, function(err) {
    if (err) {
      console.log('❌ Erreur:', q[2], err.message);
    } else {
      count++;
    }
    callback();
  });
};

let index = 0;
const allQuestions = [...questions3eme, ...questionsTerminale];

function insertNext() {
  if (index < allQuestions.length) {
    insertQuestion(allQuestions[index], () => {
      index++;
      insertNext();
    });
  } else {
    console.log(`\n✅ ${count} questions ajoutées avec succès !`);
    console.log(`   - ${questions3eme.length} questions pour la 3ème`);
    console.log(`   - ${questionsTerminale.length} questions pour la Terminale`);
    db.close();
  }
}

insertNext();