// src/pages/BookMatch.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './BookMatch.css';

function BookMatch({ user, onBack }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const cameraFrontRef = useRef(null);

  // États principaux
  const [activeTab, setActiveTab] = useState('recherche');
  const [annonces, setAnnonces] = useState([]);
  const [mesAnnonces, setMesAnnonces] = useState([]);
  const [mesDemandes, setMesDemandes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // États pour la recherche intelligente
  const [searchType, setSearchType] = useState('');
  const [searchMatiere, setSearchMatiere] = useState('');
  const [searchNiveau, setSearchNiveau] = useState('');
  const [searchSerie, setSearchSerie] = useState('');
  const [searchVille, setSearchVille] = useState('');
  const [searchQuartier, setSearchQuartier] = useState('');
  const [villesFiltrees, setVillesFiltrees] = useState([]);
  const [showVilles, setShowVilles] = useState(false);

  // États pour le dépôt intelligent
  const [newAnnonce, setNewAnnonce] = useState({
    type_depot: '',
    titre: '',
    auteur: '',
    matiere: '',
    niveau: '',
    serie: '',
    description: '',
    type_echange: '',
    etat: '',
    etat_activite: 'utilisable',
    ville: '',
    quartier: '',
    etablissement: '',
    photo: null,
    photoPreview: null
  });

  // Données
  const eleve = JSON.parse(localStorage.getItem('eleve') || '{}');
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUser = eleve.nom ? eleve : userData;

  const matieres = ['Mathématiques', 'Français', 'Anglais', 'SVT', 'Physique-Chimie', 'Histoire-Géo', 'Philosophie'];
  const niveaux = ['6ème', '5ème', '4ème', '3ème', 'Seconde', '1ère', 'Terminale'];
  const series = ['C', 'D', 'A', 'G', 'F'];
  const typesDepot = ['📚 Livre', '📖 Roman', '🎯 Activité', '📦 Autre'];
  const typesEchange = ['don', 'prêt', 'échange'];
  const etats = ['bon', 'moyen', 'abîmé'];

  // Quartiers par ville
  const quartiersParVille = {
    'Abidjan': ['Cocody', 'Plateau', 'Adjamé', 'Koumassi', 'Treichville', 'Marcory', 'Yopougon', 'Port-Bouët'],
    'Bouaké': ['Centre', 'Airport', 'Kokumbo', 'Niama'],
    'Daloa': ['Centre', 'Zoukougbeu', 'Gballet'],
    'Yamoussoukro': ['Cité Administrative', 'Dioulabougou', 'Nangon'],
    'Korhogo': ['Centre', 'Niofoin', 'Koko'],
    'San-Pédro': ['Centre', 'Bardo', 'Mairie'],
    'Man': ['Centre', 'Gouessesso', 'Kouato'],
  };

  // Détecter si c'est un mobile
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      setIsMobile(true);
    }
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    const matricule = localStorage.getItem('matricule');
    if (token) return { 'Authorization': `Bearer ${token}` };
    if (matricule) return { 'X-Matricule': matricule };
    return {};
  };

  useEffect(() => {
    loadAnnonces();
    loadMesAnnonces();
    loadMesDemandes();
    setVillesFiltrees(['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'Korhogo', 'San-Pédro', 'Man', 'Gagnoa', 'Divo', 'Soubré']);
  }, []);

  useEffect(() => {
    if (searchVille.length > 0) {
      const filtered = ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'Korhogo', 'San-Pédro', 'Man', 'Gagnoa', 'Divo', 'Soubré'].filter(v => 
        v.toLowerCase().startsWith(searchVille.toLowerCase())
      );
      setVillesFiltrees(filtered);
      setShowVilles(true);
    } else {
      setVillesFiltrees([]);
      setShowVilles(false);
    }
  }, [searchVille]);

  const loadAnnonces = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeader();
      const params = {};
      if (searchType) params.type_depot = searchType;
      if (searchMatiere) params.matiere = searchMatiere;
      if (searchNiveau) params.niveau = searchNiveau;
      if (searchSerie) params.serie = searchSerie;
      if (searchVille) params.ville = searchVille;
      if (searchQuartier) params.quartier = searchQuartier;

      const response = await axios.get('http://localhost:5000/api/book/annonces', { 
        headers,
        params
      });
      setAnnonces(response.data || []);
    } catch (error) {
      console.error('Erreur chargement annonces:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMesAnnonces = async () => {
    try {
      const headers = getAuthHeader();
      const response = await axios.get('http://localhost:5000/api/book/mes-annonces', { headers });
      setMesAnnonces(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const loadMesDemandes = async () => {
    try {
      const headers = getAuthHeader();
      const response = await axios.get('http://localhost:5000/api/book/mes-demandes', { headers });
      setMesDemandes(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // ===== FORMULAIRE DE DÉPÔT =====
  const handleAddAnnonce = async (e) => {
    e.preventDefault();
    
    const type = newAnnonce.type_depot;
    
    if (!type || !newAnnonce.titre || !newAnnonce.type_echange || !newAnnonce.ville) {
      alert('⚠️ Champs obligatoires : Type, Titre, Type d\'échange et Ville');
      return;
    }

    try {
      const headers = getAuthHeader();
      const formData = new FormData();
      
      formData.append('titre', newAnnonce.titre || '');
      formData.append('type_depot', type);
      formData.append('type_echange', newAnnonce.type_echange);
      formData.append('ville', newAnnonce.ville);
      formData.append('auteur', newAnnonce.auteur || '');
      formData.append('matiere', newAnnonce.matiere || '');
      formData.append('niveau', newAnnonce.niveau || '');
      formData.append('serie', newAnnonce.serie || '');
      formData.append('description', newAnnonce.description || '');
      formData.append('etat', newAnnonce.etat || 'bon');
      formData.append('etat_activite', newAnnonce.etat_activite || 'utilisable');
      formData.append('quartier', newAnnonce.quartier || '');
      formData.append('etablissement', newAnnonce.etablissement || '');
      
      if (newAnnonce.photo) {
        formData.append('photo', newAnnonce.photo);
      }

      const response = await axios.post('http://localhost:5000/api/book/annonces', formData, { 
        headers: { 
          ...headers, 
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data && response.data.id) {
        alert('✅ Annonce créée avec succès !');
        setShowAddForm(false);
        resetNewAnnonce();
        loadAnnonces();
        loadMesAnnonces();
      } else {
        alert('❌ Erreur lors de la création');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      if (error.response?.data?.error) {
        alert('❌ Erreur: ' + error.response.data.error);
      } else {
        alert('❌ Erreur lors de la création. Vérifie ta connexion.');
      }
    }
  };

  const resetNewAnnonce = () => {
    setNewAnnonce({
      type_depot: '',
      titre: '',
      auteur: '',
      matiere: '',
      niveau: '',
      serie: '',
      description: '',
      type_echange: '',
      etat: '',
      etat_activite: 'utilisable',
      ville: '',
      quartier: '',
      etablissement: '',
      photo: null,
      photoPreview: null
    });
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewAnnonce({
        ...newAnnonce,
        photo: file,
        photoPreview: URL.createObjectURL(file)
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (cameraFrontRef.current) cameraFrontRef.current.value = '';
  };

  const demanderLivre = async (annonceId) => {
    if (window.confirm('Envoyer une demande pour ce livre ?')) {
      try {
        const headers = getAuthHeader();
        await axios.post('http://localhost:5000/api/book/demander', { annonceId }, { headers });
        alert('✅ Demande envoyée ! Le propriétaire vous contactera.');
        loadMesDemandes();
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la demande');
      }
    }
  };

  const supprimerAnnonce = async (annonceId) => {
    if (window.confirm('Supprimer cette annonce ?')) {
      try {
        const headers = getAuthHeader();
        await axios.delete(`http://localhost:5000/api/book/annonces/${annonceId}`, { headers });
        alert('✅ Annonce supprimée');
        loadMesAnnonces();
        loadAnnonces();
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  const getStatusBadge = (statut) => {
    if (statut === 'disponible') return <span className="badge-disponible">🟢 Disponible</span>;
    if (statut === 'en_attente') return <span className="badge-attente">🟡 En attente</span>;
    return <span className="badge-echange">✅ Échangé</span>;
  };

  const getTypeIcon = (type) => {
    if (type === '📚 Livre') return '📚';
    if (type === '📖 Roman') return '📖';
    if (type === '🎯 Activité') return '🎯';
    return '📦';
  };

  // ============ RENDU DU FORMULAIRE DE DÉPÔT ============
  const renderAddForm = () => {
    const type = newAnnonce.type_depot;
    const isLivre = type === '📚 Livre';
    const isRoman = type === '📖 Roman';
    const isActivite = type === '🎯 Activité';
    const isAutre = type === '📦 Autre';

    return (
      <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <h2>📚 Déposer</h2>
          <form onSubmit={handleAddAnnonce}>
            {/* Type de dépôt - OBLIGATOIRE */}
            <div className="form-group">
              <label>Type *</label>
              <select 
                value={type} 
                onChange={(e) => {
                  const val = e.target.value;
                  setNewAnnonce({
                    ...newAnnonce,
                    type_depot: val,
                    auteur: '',
                    matiere: '',
                    niveau: '',
                    serie: '',
                    etat: '',
                    description: '',
                    etat_activite: 'utilisable',
                    photo: null,
                    photoPreview: null
                  });
                }}
                required
              >
                <option value="">Choisis le type</option>
                {typesDepot.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Titre - OBLIGATOIRE */}
            <div className="form-group">
              <label>Titre *</label>
              <input
                type="text"
                placeholder={isActivite ? "Nom de l'activité" : "Titre"}
                value={newAnnonce.titre}
                onChange={(e) => setNewAnnonce({...newAnnonce, titre: e.target.value})}
                required
              />
            </div>

            {/* Auteur - OPTIONNEL */}
            {(isLivre || isRoman) && (
              <div className="form-group">
                <label>Auteur (optionnel)</label>
                <input
                  type="text"
                  placeholder="Auteur"
                  value={newAnnonce.auteur}
                  onChange={(e) => setNewAnnonce({...newAnnonce, auteur: e.target.value})}
                />
              </div>
            )}

            {/* Matière - OPTIONNEL */}
            {isActivite && (
              <div className="form-group">
                <label>Matière (optionnel)</label>
                <select 
                  value={newAnnonce.matiere} 
                  onChange={(e) => setNewAnnonce({...newAnnonce, matiere: e.target.value})}
                >
                  <option value="">Choisis une matière</option>
                  {matieres.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            )}

            {/* Niveau - OPTIONNEL */}
            {isActivite && (
              <div className="form-group">
                <label>Niveau (optionnel)</label>
                <select 
                  value={newAnnonce.niveau} 
                  onChange={(e) => setNewAnnonce({...newAnnonce, niveau: e.target.value})}
                >
                  <option value="">Choisis un niveau</option>
                  {niveaux.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            )}

            {/* Série - OPTIONNEL */}
            {isActivite && newAnnonce.niveau === 'Terminale' && (
              <div className="form-group">
                <label>Série (optionnel)</label>
                <select 
                  value={newAnnonce.serie} 
                  onChange={(e) => setNewAnnonce({...newAnnonce, serie: e.target.value})}
                >
                  <option value="">Toutes séries</option>
                  {series.map(s => <option key={s} value={s}>Série {s}</option>)}
                </select>
              </div>
            )}

            {/* État - OPTIONNEL */}
            {(isLivre || isRoman || isAutre) && (
              <div className="form-group">
                <label>État (optionnel)</label>
                <select 
                  value={newAnnonce.etat} 
                  onChange={(e) => setNewAnnonce({...newAnnonce, etat: e.target.value})}
                >
                  <option value="bon">📗 Bon</option>
                  <option value="moyen">📘 Moyen</option>
                  <option value="abîmé">📕 Abîmé</option>
                </select>
              </div>
            )}

            {/* État de l'activité - OPTIONNEL */}
            {isActivite && (
              <div className="form-group">
                <label>État de l'activité (optionnel)</label>
                <select 
                  value={newAnnonce.etat_activite || 'utilisable'} 
                  onChange={(e) => setNewAnnonce({...newAnnonce, etat_activite: e.target.value})}
                  className="form-select"
                >
                  <option value="utilisable">🟢 Utilisable</option>
                  <option value="passe">🟡 Passé</option>
                </select>
              </div>
            )}

            {/* Type d'échange - OBLIGATOIRE */}
            <div className="form-group">
              <label>Type d'échange *</label>
              <select 
                value={newAnnonce.type_echange} 
                onChange={(e) => setNewAnnonce({...newAnnonce, type_echange: e.target.value})}
                required
              >
                <option value="">Choisis le type d'échange</option>
                <option value="don">🎁 Don</option>
                <option value="prêt">🔄 Prêt</option>
                <option value="échange">🤝 Échange</option>
              </select>
            </div>

            {/* Ville - OBLIGATOIRE */}
            <div className="form-group">
              <label>Ville *</label>
              <input
                type="text"
                placeholder="Ville"
                value={newAnnonce.ville}
                onChange={(e) => setNewAnnonce({...newAnnonce, ville: e.target.value})}
                required
              />
            </div>

            {/* Quartier - OPTIONNEL */}
            <div className="form-group">
              <label>Quartier (optionnel)</label>
              <input
                type="text"
                placeholder="Quartier"
                value={newAnnonce.quartier}
                onChange={(e) => setNewAnnonce({...newAnnonce, quartier: e.target.value})}
              />
            </div>

            {/* Établissement - OPTIONNEL */}
            <div className="form-group">
              <label>Établissement (optionnel)</label>
              <input
                type="text"
                placeholder="Établissement"
                value={newAnnonce.etablissement}
                onChange={(e) => setNewAnnonce({...newAnnonce, etablissement: e.target.value})}
              />
            </div>

            {/* Description - OPTIONNEL */}
            <div className="form-group">
              <label>Description (optionnel)</label>
              <textarea
                placeholder="Décris ce que tu déposes..."
                value={newAnnonce.description}
                onChange={(e) => setNewAnnonce({...newAnnonce, description: e.target.value})}
                rows="3"
              />
            </div>

            {/* ===== SECTION PHOTO CORRIGÉE ===== */}
            <div className="form-group form-group-photo">
              <label>📸 Photo (optionnel)</label>
              <div className="photo-options">
                <button type="button" className="photo-btn" onClick={() => fileInputRef.current?.click()}>
                  📁 Choisir un fichier
                </button>
                {isMobile && (
                  <>
                    <button type="button" className="photo-btn" onClick={() => cameraInputRef.current?.click()}>
                      📷 Caméra arrière
                    </button>
                    <button type="button" className="photo-btn" onClick={() => cameraFrontRef.current?.click()}>
                      🤳 Selfie
                    </button>
                  </>
                )}
                {!isMobile && (
                  <button type="button" className="photo-btn" onClick={() => cameraInputRef.current?.click()}>
                    📷 Appareil photo
                  </button>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoCapture}
                style={{ display: 'none' }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                style={{ display: 'none' }}
              />
              <input
                ref={cameraFrontRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handlePhotoCapture}
                style={{ display: 'none' }}
              />
              
              {newAnnonce.photoPreview && (
                <div className="photo-preview">
                  <img src={newAnnonce.photoPreview} alt="Aperçu" />
                  <button type="button" className="remove-photo" onClick={() => setNewAnnonce({...newAnnonce, photo: null, photoPreview: null})}>
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="modal-buttons">
              <button type="button" className="cancel-btn" onClick={() => setShowAddForm(false)}>Annuler</button>
              <button type="submit" className="submit-btn">📤 Publier</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ============ RENDU DE LA RECHERCHE ============
  const renderRecherche = () => (
    <div className="book-section">
      <div className="filtres-bar">
        <select 
          className="filtre-select" 
          value={searchType}
          onChange={(e) => { setSearchType(e.target.value); loadAnnonces(); }}
        >
          <option value="">📚 Tous les types</option>
          {typesDepot.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {(searchType === '📚 Livre' || searchType === '🎯 Activité' || !searchType) && (
          <select 
            className="filtre-select" 
            value={searchMatiere}
            onChange={(e) => { setSearchMatiere(e.target.value); loadAnnonces(); }}
          >
            <option value="">📖 Toutes matières</option>
            {matieres.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        )}

        <select 
          className="filtre-select" 
          value={searchNiveau}
          onChange={(e) => { setSearchNiveau(e.target.value); loadAnnonces(); }}
        >
          <option value="">🎓 Tous niveaux</option>
          {niveaux.map(n => <option key={n} value={n}>{n}</option>)}
        </select>

        {searchNiveau === 'Terminale' && (
          <select 
            className="filtre-select" 
            value={searchSerie}
            onChange={(e) => { setSearchSerie(e.target.value); loadAnnonces(); }}
          >
            <option value="">🔤 Toutes séries</option>
            {series.map(s => <option key={s} value={s}>Série {s}</option>)}
          </select>
        )}
      </div>

      <div className="filtres-ville">
        <div className="autocomplete-container">
          <input
            type="text"
            className="search-input"
            placeholder="📍 Ville..."
            value={searchVille}
            onChange={(e) => {
              setSearchVille(e.target.value);
              setSearchQuartier('');
            }}
            onFocus={() => setShowVilles(true)}
            onBlur={() => setTimeout(() => setShowVilles(false), 200)}
          />
          {showVilles && villesFiltrees.length > 0 && (
            <div className="autocomplete-list">
              {villesFiltrees.slice(0, 15).map(v => (
                <div key={v} className="autocomplete-item" onMouseDown={() => {
                  setSearchVille(v);
                  setShowVilles(false);
                  loadAnnonces();
                }}>
                  {v}
                </div>
              ))}
            </div>
          )}
        </div>

        {searchVille && quartiersParVille[searchVille] && (
          <select 
            className="filtre-select" 
            value={searchQuartier}
            onChange={(e) => { setSearchQuartier(e.target.value); loadAnnonces(); }}
          >
            <option value="">📌 Tous les quartiers</option>
            {quartiersParVille[searchVille].map(q => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        )}

        <button className="search-btn" onClick={loadAnnonces}>🔍 Rechercher</button>
        <button className="add-btn" onClick={() => setShowAddForm(true)}>➕ Déposer</button>
      </div>

      {loading ? (
        <div className="loading-spinner">Chargement...</div>
      ) : annonces.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📚</span>
          <p>Aucun résultat trouvé</p>
          <button className="add-btn" onClick={() => setShowAddForm(true)}>➕ Déposer une annonce</button>
        </div>
      ) : (
        <div className="annonces-list">
          {annonces.map(annonce => {
            const isNearby = searchQuartier && annonce.quartier === searchQuartier;
            const isActivite = annonce.type_depot === '🎯 Activité';
            
            return (
              <div key={annonce.id} className={`annonce-card ${isNearby ? 'nearby' : ''}`}>
                {isNearby && <div className="nearby-badge">📍 Dans ton quartier</div>}
                <div className="annonce-icon">{getTypeIcon(annonce.type_depot)}</div>
                <div className="annonce-info">
                  <h3>{annonce.titre}</h3>
                  {annonce.auteur && <p className="auteur">✍️ {annonce.auteur}</p>}
                  <p className="type-depot">{annonce.type_depot}</p>
                  <p className="details">📚 {annonce.matiere || 'Toutes matières'} | 🎓 {annonce.niveau || 'Tous niveaux'}</p>
                  <p className="lieu">📍 {annonce.ville} {annonce.quartier ? `- ${annonce.quartier}` : ''}</p>
                  <p className="echange">🔄 {annonce.type_echange === 'don' ? '🎁 Don' : annonce.type_echange === 'prêt' ? '🔄 Prêt' : '🤝 Échange'}</p>
                  <p className="etablissement">🏫 {annonce.etablissement || 'Non précisé'}</p>
                  
                  {isActivite && annonce.etat_activite && (
                    <div className={`activite-status ${annonce.etat_activite === 'passe' ? 'status-passe' : 'status-utilisable'}`}>
                      {annonce.etat_activite === 'passe' ? (
                        <div className="status-message">
                          <span className="status-icon">⚠️</span>
                          <span className="status-text">Cette activité n'est plus au programme officiel. Elle peut servir d'exercice complémentaire.</span>
                        </div>
                      ) : (
                        <div className="status-message">
                          <span className="status-icon">🟢</span>
                          <span className="status-text">Activité actuelle - conforme au programme en vigueur.</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {getStatusBadge(annonce.statut)}
                </div>
                <div className="annonce-actions">
                  {annonce.statut === 'disponible' && (
                    <button className="demander-btn" onClick={() => demanderLivre(annonce.id)}>
                      💬 Demander
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ============ RENDU MES ANNONCES ============
  const renderMesAnnonces = () => (
    <div className="book-section">
      <button className="add-btn" onClick={() => setShowAddForm(true)}>➕ Déposer</button>
      {mesAnnonces.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📚</span>
          <p>Vous n'avez pas encore d'annonces</p>
        </div>
      ) : (
        <div className="annonces-list">
          {mesAnnonces.map(annonce => {
            const isActivite = annonce.type_depot === '🎯 Activité';
            
            return (
              <div key={annonce.id} className="annonce-card">
                <div className="annonce-icon">{getTypeIcon(annonce.type_depot)}</div>
                <div className="annonce-info">
                  <h3>{annonce.titre}</h3>
                  {annonce.auteur && <p className="auteur">✍️ {annonce.auteur}</p>}
                  <p className="details">📚 {annonce.matiere || 'Toutes matières'} | 🎓 {annonce.niveau || 'Tous niveaux'}</p>
                  <p className="lieu">📍 {annonce.ville} {annonce.quartier ? `- ${annonce.quartier}` : ''}</p>
                  <p className="etablissement">🏫 {annonce.etablissement || 'Non précisé'}</p>
                  
                  {isActivite && annonce.etat_activite && (
                    <div className={`activite-status ${annonce.etat_activite === 'passe' ? 'status-passe' : 'status-utilisable'}`}>
                      {annonce.etat_activite === 'passe' ? (
                        <div className="status-message">
                          <span className="status-icon">⚠️</span>
                          <span className="status-text">Hors programme - exercice complémentaire</span>
                        </div>
                      ) : (
                        <div className="status-message">
                          <span className="status-icon">🟢</span>
                          <span className="status-text">Au programme</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <p className="date">📅 {new Date(annonce.created_at).toLocaleDateString()}</p>
                  {getStatusBadge(annonce.statut)}
                </div>
                <div className="annonce-actions">
                  <button className="supprimer-btn" onClick={() => supprimerAnnonce(annonce.id)}>
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ============ RENDU MES DEMANDES ============
  const renderMesDemandes = () => (
    <div className="book-section">
      {mesDemandes.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">💬</span>
          <p>Aucune demande envoyée</p>
        </div>
      ) : (
        <div className="demandes-list">
          {mesDemandes.map(demande => (
            <div key={demande.id} className="demande-card">
              <div className="demande-icon">📖</div>
              <div className="demande-info">
                <h3>{demande.titre}</h3>
                <p className="proprietaire">👤 Propriétaire: {demande.proprietaire_nom}</p>
                <p className="lieu">📍 {demande.ville} {demande.quartier ? `- ${demande.quartier}` : ''}</p>
                <span className={`statut-demande ${demande.statut}`}>
                  {demande.statut === 'en_attente' ? '⏳ En attente' : demande.statut === 'acceptee' ? '✅ Acceptée' : '❌ Refusée'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ============ ONGLETS ============
  const tabs = [
    { id: 'recherche', name: '🔍 Rechercher' },
    { id: 'mes-annonces', name: '📚 Mes dépôts' },
    { id: 'mes-demandes', name: '💬 Mes demandes' }
  ];

  return (
    <div className="book-container">
      <div className="book-header">
        <button className="back-btn" onClick={onBack || (() => navigate('/dashboard'))}>← Retour</button>
        <h1>📚 PASSLIVRE</h1>
      </div>

      <div className="book-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <div className="book-content">
        {activeTab === 'recherche' && renderRecherche()}
        {activeTab === 'mes-annonces' && renderMesAnnonces()}
        {activeTab === 'mes-demandes' && renderMesDemandes()}
      </div>

      {/* Explications */}
      <div className="book-explication">
        <div className="explication-icon">📌</div>
        <div className="explication-text">
          <h3>C'est quoi PASSLIVRE ?</h3>
          <p><strong>Tu as des livres que tu n'utilises plus ?</strong> Tu peux les donner, les prêter ou les échanger.</p>
          <p><strong>Tu cherches un livre ?</strong> Tu peux trouver des livres près de chez toi.</p>
          <p><strong>Comment chercher ?</strong> Choisis le type, la matière, le niveau, puis ta ville et ton quartier.</p>
          <p><strong>Comment déposer ?</strong> Choisis le type (Livre, Roman, Activité, Autre). Le formulaire s'adapte automatiquement.</p>
          <p><strong>Pour les activités :</strong> Indique si l'activité est encore au programme ou si elle sert d'exercice.</p>
        </div>
      </div>

      {showAddForm && renderAddForm()}
    </div>
  );
}

export default BookMatch;