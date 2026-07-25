-- ============ TABLE DES ÉLÈVES ============
CREATE TABLE IF NOT EXISTS eleves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    matricule TEXT UNIQUE NOT NULL,
    classe TEXT NOT NULL,
    etablissement TEXT NOT NULL,
    ville TEXT NOT NULL,
    quartier TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============ TABLE DES UTILISATEURS ============
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    profession TEXT,
    telephone TEXT,
    role TEXT DEFAULT 'parent',
    est_volontaire INTEGER DEFAULT 0,
    matieres_preferees TEXT,
    bio TEXT,
    status TEXT DEFAULT 'horsligne',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============ TABLE DES ÉCOLES ============
CREATE TABLE IF NOT EXISTS ecoles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    ville TEXT NOT NULL,
    quartier TEXT,
    filieres TEXT,
    contact TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============ TABLE DES DOMAINES ============
CREATE TABLE IF NOT EXISTS domaines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    icon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============ TABLE DES FILIÈRES ============
CREATE TABLE IF NOT EXISTS filieres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domaine_id INTEGER NOT NULL,
    nom TEXT NOT NULL,
    description TEXT,
    recherche_ia TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (domaine_id) REFERENCES domaines(id)
);

-- ============ TABLE DES MÉTIERS ============
CREATE TABLE IF NOT EXISTS metiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filiere_id INTEGER NOT NULL,
    nom TEXT NOT NULL,
    salaire TEXT,
    demande TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (filiere_id) REFERENCES filieres(id)
);

-- ============ TABLE DES QUIZ ============
CREATE TABLE IF NOT EXISTS quiz (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matiere TEXT NOT NULL,
    niveau TEXT NOT NULL,
    question TEXT NOT NULL,
    type_question TEXT NOT NULL,
    options TEXT,
    reponse_correcte TEXT NOT NULL,
    difficulte TEXT,
    serie TEXT,
    annales INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============ TABLE DES RÉPONSES QUIZ ============
CREATE TABLE IF NOT EXISTS reponses_quiz (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    eleve_id INTEGER,
    quiz_id INTEGER NOT NULL,
    reponse_donnee TEXT NOT NULL,
    est_correcte INTEGER NOT NULL,
    temps_secondes INTEGER,
    date_reponse DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============ TABLE DES LECONS ============
CREATE TABLE IF NOT EXISTS lecons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titre TEXT NOT NULL,
    contenu TEXT NOT NULL,
    matiere TEXT NOT NULL,
    niveau TEXT NOT NULL,
    serie TEXT,
    resume_ia TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============ TABLE DES EXAMENS ============
CREATE TABLE IF NOT EXISTS examens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titre TEXT NOT NULL,
    matiere TEXT NOT NULL,
    niveau TEXT NOT NULL,
    serie TEXT,
    contenu TEXT,
    date_publication DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============ TABLE DES SUJETS PROPOSÉS ============
CREATE TABLE IF NOT EXISTS sujets_proposes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titre TEXT NOT NULL,
    matiere TEXT NOT NULL,
    niveau TEXT NOT NULL,
    description TEXT,
    eleve_id INTEGER,
    eleve_nom TEXT,
    fichier_path TEXT,
    photo_path TEXT,
    analyse_ia TEXT,
    statut TEXT DEFAULT 'en_attente',
    date_validation DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============ TABLE DES ANNONCES LIVRES ============
CREATE TABLE IF NOT EXISTS annonces_livres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    eleve_id INTEGER,
    titre_livre TEXT NOT NULL,
    auteur TEXT,
    matiere TEXT,
    niveau TEXT,
    serie TEXT,
    etat TEXT,
    type_echange TEXT,
    ville TEXT NOT NULL,
    quartier TEXT,
    etablissement TEXT,
    statut TEXT DEFAULT 'disponible',
    type_depot TEXT DEFAULT '📚 Livre',
    description TEXT,
    etat_activite TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============ TABLE DES DEMANDES D'ÉCHANGE ============
CREATE TABLE IF NOT EXISTS demandes_echange (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    annonce_id INTEGER NOT NULL,
    demandeur_id INTEGER NOT NULL,
    message TEXT,
    statut TEXT DEFAULT 'en_attente',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (annonce_id) REFERENCES annonces_livres(id),
    FOREIGN KEY (demandeur_id) REFERENCES users(id)
);

-- ============ TABLE DES DISPONIBILITÉS TUTEUR ============
CREATE TABLE IF NOT EXISTS disponibilites_tuteur (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tuteur_id INTEGER NOT NULL,
    jour TEXT NOT NULL,
    heure_debut TEXT NOT NULL,
    heure_fin TEXT NOT NULL,
    actif INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tuteur_id) REFERENCES users(id)
);

-- ============ TABLE DES SESSIONS TUTORAT ============
CREATE TABLE IF NOT EXISTS sessions_tutorat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eleve_id INTEGER NOT NULL,
    tuteur_id INTEGER NOT NULL,
    matiere TEXT NOT NULL,
    message_demande TEXT,
    statut TEXT DEFAULT 'en_attente',
    date_session DATETIME,
    duree_minutes INTEGER,
    evaluation_eleve INTEGER,
    commentaire TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============ TABLE DES NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tuteur_id INTEGER NOT NULL,
    eleve_id INTEGER NOT NULL,
    matiere TEXT,
    niveau TEXT,
    date_souhaitee TEXT,
    heure_souhaitee TEXT,
    message TEXT,
    type TEXT DEFAULT 'demande_tutorat',
    statut TEXT DEFAULT 'en_attente',
    lue INTEGER DEFAULT 0,
    date_reponse TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tuteur_id) REFERENCES users(id),
    FOREIGN KEY (eleve_id) REFERENCES users(id)
);

-- ============ TABLE DES PUSH SUBSCRIPTIONS ============
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL,
    keys_auth TEXT NOT NULL,
    keys_p256dh TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============ TABLE DES STATISTIQUES EMPLOI ============
CREATE TABLE IF NOT EXISTS emploi_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metier TEXT NOT NULL,
    secteur TEXT,
    salaire_min INTEGER,
    salaire_max INTEGER,
    demande TEXT,
    source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============ TABLE PARENT ÉLÈVES ============
CREATE TABLE IF NOT EXISTS parent_eleves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER NOT NULL,
    eleve_id INTEGER NOT NULL,
    lien TEXT DEFAULT 'parent',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES users(id),
    FOREIGN KEY (eleve_id) REFERENCES eleves(id),
    UNIQUE(parent_id, eleve_id)
);

-- ============ TABLE DES MATIÈRES PAR SÉRIE ============
CREATE TABLE IF NOT EXISTS matieres_serie (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serie TEXT NOT NULL,
    matiere TEXT NOT NULL,
    niveau TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);