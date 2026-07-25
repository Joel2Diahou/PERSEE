// src/pages/ParentDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ParentDashboard.css';

function ParentDashboard() {
  const navigate = useNavigate();
  const [enfants, setEnfants] = useState([]);
  const [enfantSelectionne, setEnfantSelectionne] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error, setError] = useState(null);
  const [showLiaisonForm, setShowLiaisonForm] = useState(false);
  const [matriculeLiaison, setMatriculeLiaison] = useState('');
  const [liaisonLoading, setLiaisonLoading] = useState(false);
  const [liaisonError, setLiaisonError] = useState('');

  const userData = JSON.parse(localStorage.getItem('user') || '{}');

  // ============ DÉCONNEXION ============
  const handleLogout = () => {
    localStorage.clear(); // Supprime TOUTES les données
    navigate('/');
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (token) return { 'Authorization': `Bearer ${token}` };
    return {};
  };

  // ============ CHARGER LES ENFANTS ============
  const chargerEnfants = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeader();
      const response = await axios.get('http://localhost:5000/api/parent/enfants', { headers });
      if (response.data.success) {
        setEnfants(response.data.enfants);
        if (response.data.enfants.length > 0) {
          setEnfantSelectionne(response.data.enfants[0]);
        } else {
          setEnfantSelectionne(null);
          setStats(null);
        }
      }
    } catch (error) {
      console.error('Erreur chargement enfants:', error);
      setError('Impossible de charger la liste des enfants');
    } finally {
      setLoading(false);
    }
  };

  // ============ CHARGER LES STATISTIQUES ============
  const chargerStatsEnfant = async (enfantId) => {
    setLoading(true);
    try {
      const headers = getAuthHeader();
      const response = await axios.get(`http://localhost:5000/api/parent/stats/${enfantId}`, { headers });
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      setError('Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerEnfants();
  }, []);

  useEffect(() => {
    if (enfantSelectionne) {
      chargerStatsEnfant(enfantSelectionne.id);
    }
  }, [enfantSelectionne]);

  // ============ LIER UN ENFANT ============
  const lierEnfant = async () => {
    if (!matriculeLiaison.trim()) {
      setLiaisonError('Veuillez entrer le matricule de l\'enfant');
      return;
    }
    setLiaisonLoading(true);
    setLiaisonError('');
    try {
      const headers = getAuthHeader();
      const response = await axios.post('http://localhost:5000/api/parent/lier', 
        { matricule: matriculeLiaison.trim() },
        { headers }
      );
      if (response.data.success) {
        alert('✅ Enfant lié avec succès !');
        setShowLiaisonForm(false);
        setMatriculeLiaison('');
        setLiaisonError('');
        await chargerEnfants();
      }
    } catch (error) {
      console.error('Erreur liaison:', error);
      setLiaisonError(error.response?.data?.message || 'Erreur lors de la liaison');
    } finally {
      setLiaisonLoading(false);
    }
  };

  // ============ GESTIONNAIRES ============
  const handleEnfantChange = (e) => {
    const enfant = enfants.find(e => e.id === parseInt(e.target.value));
    setEnfantSelectionne(enfant);
  };

  // ============ RENDU TABLEAU DE BORD ============
  const renderDashboard = () => {
    if (!stats) return <div className="loading-spinner">Chargement des statistiques...</div>;

    const moyennes = stats.moyennes || {};
    const totalMoyenne = stats.moyenne_generale || 'N/A';

    let meilleureMatiere = { nom: 'Aucune', note: 0 };
    let pireMatiere = { nom: 'Aucune', note: 20 };
    for (const [matiere, note] of Object.entries(moyennes)) {
      if (note > meilleureMatiere.note) {
        meilleureMatiere = { nom: matiere, note: note };
      }
      if (note < pireMatiere.note) {
        pireMatiere = { nom: matiere, note: note };
      }
    }

    return (
      <div className="parent-dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <span className="stat-value">{totalMoyenne}/20</span>
              <span className="stat-label">Moyenne générale</span>
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon">🏆</div>
            <div className="stat-info">
              <span className="stat-value">{meilleureMatiere.note > 0 ? `${meilleureMatiere.note.toFixed(1)}/20` : 'N/A'}</span>
              <span className="stat-label">Meilleure matière: {meilleureMatiere.nom}</span>
            </div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon">📖</div>
            <div className="stat-info">
              <span className="stat-value">{pireMatiere.note < 20 ? `${pireMatiere.note.toFixed(1)}/20` : 'N/A'}</span>
              <span className="stat-label">Matière à améliorer: {pireMatiere.nom}</span>
            </div>
          </div>
          <div className="stat-card info">
            <div className="stat-icon">📚</div>
            <div className="stat-info">
              <span className="stat-value">{stats.total_quiz || 0}</span>
              <span className="stat-label">Quiz complétés</span>
            </div>
          </div>
        </div>

        <div className="matieres-progression">
          <h3>📈 Progression par matière</h3>
          {Object.keys(moyennes).length === 0 ? (
            <p className="empty-message">Aucune donnée disponible pour les matières</p>
          ) : (
            <div className="matieres-list">
              {Object.entries(moyennes).map(([matiere, note]) => (
                <div key={matiere} className="matiere-item">
                  <div className="matiere-info">
                    <span className="matiere-nom">{matiere}</span>
                    <span className={`matiere-note ${note >= 12 ? 'good' : note >= 10 ? 'medium' : 'bad'}`}>
                      {note.toFixed(1)}/20
                    </span>
                  </div>
                  <div className="matiere-bar">
                    <div className="matiere-progress" style={{ width: `${Math.min((note / 20) * 100, 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="recommandations">
          <h3>🎯 Recommandations personnalisées</h3>
          <div className="recommandations-list">
            {pireMatiere.note < 12 && pireMatiere.nom !== 'Aucune' && (
              <div className="recommandation-item">
                <span className="recommandation-icon">📚</span>
                <div>
                  <strong>Réviser {pireMatiere.nom}</strong>
                  <p>Moyenne: {pireMatiere.note.toFixed(1)}/20. Des sessions de tutorat sont recommandées.</p>
                </div>
              </div>
            )}
            {stats.tutorat_recommande && (
              <div className="recommandation-item">
                <span className="recommandation-icon">👨‍🏫</span>
                <div>
                  <strong>Des séances de tutorat</strong>
                  <p>Des tuteurs sont disponibles pour les matières en difficulté.</p>
                </div>
              </div>
            )}
            {stats.orientation && (
              <div className="recommandation-item">
                <span className="recommandation-icon">🎓</span>
                <div>
                  <strong>Orientation recommandée</strong>
                  <p>{stats.orientation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============ RENDU SESSIONS ============
  const renderSessions = () => {
    if (!stats) return <div className="loading-spinner">Chargement...</div>;
    const sessions = stats.sessions || [];
    return (
      <div className="sessions-container">
        <h3>📅 Sessions de tutorat</h3>
        {sessions.length === 0 ? (
          <div className="empty-state">Aucune session de tutorat</div>
        ) : (
          sessions.map((session, idx) => (
            <div key={idx} className="session-card">
              <div className="session-info">
                <span className="session-matiere">📖 {session.matiere}</span>
                <span className={`session-statut ${session.statut}`}>
                  {session.statut === 'accepte' ? '✅ Accepté' : 
                   session.statut === 'en_attente' ? '⏳ En attente' : 
                   session.statut === 'terminee' ? '✅ Terminé' : '❌ Refusé'}
                </span>
              </div>
              <div className="session-details">
                <span>📅 {session.date_session ? new Date(session.date_session).toLocaleDateString() : 'À définir'}</span>
                <span>🕐 {session.heure_debut || 'À définir'}</span>
                <span>👨‍🏫 {session.tuteur_nom || 'Tuteur'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  // ============ RENDU RÉSULTATS ============
  const renderResultats = () => {
    if (!stats) return <div className="loading-spinner">Chargement...</div>;
    const quizHistory = stats.quiz_history || [];
    return (
      <div className="resultats-container">
        <h3>📝 Historique des quiz</h3>
        {quizHistory.length === 0 ? (
          <div className="empty-state">Aucun quiz complété</div>
        ) : (
          <div className="quiz-history-list">
            {quizHistory.map((quiz, idx) => (
              <div key={idx} className="quiz-history-item">
                <div className="quiz-info">
                  <span className="quiz-matiere">{quiz.matiere}</span>
                  <span className={`quiz-score ${quiz.score >= 7 ? 'good' : 'bad'}`}>
                    {quiz.score}/{quiz.total || 10}
                  </span>
                </div>
                <div className="quiz-date">
                  {quiz.date ? new Date(quiz.date).toLocaleDateString() : 'Date inconnue'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============ RENDU RAPPORT ============
  const renderRapport = () => {
    if (!stats) return <div className="loading-spinner">Chargement...</div>;
    const moyennes = stats.moyennes || {};
    const totalMoyenne = stats.moyenne_generale || 'N/A';

    const genererRapport = (type) => {
      const enfant = enfantSelectionne;
      let contenu = `
╔══════════════════════════════════════════════════════════╗
║              SCHOOL+ CI - RAPPORT ÉLÈVE                 ║
╚══════════════════════════════════════════════════════════╝

📋 INFORMATIONS ÉLÈVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nom: ${enfant?.prenom || ''} ${enfant?.nom || ''}
Niveau: ${enfant?.classe || 'Non précisé'}
Établissement: ${enfant?.etablissement || 'Non précisé'}
Date du rapport: ${new Date().toLocaleDateString()}

📊 STATISTIQUES GÉNÉRALES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Moyenne générale: ${totalMoyenne}/20
Quiz complétés: ${stats.total_quiz || 0}

📈 DÉTAIL PAR MATIÈRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${Object.entries(moyennes).map(([matiere, note]) => 
  `  ${matiere}: ${note.toFixed(1)}/20 ${note >= 12 ? '✅' : note >= 10 ? '📊' : '⚠️'}`
).join('\n')}

🎯 RECOMMANDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${stats.orientation || 'Aucune recommandation spécifique'}

${stats.tutorat_recommande ? '👨‍🏫 Des séances de tutorat sont recommandées.' : ''}
      `;
      const blob = new Blob([contenu], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `rapport_${enfant?.prenom || 'eleve'}_${type}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    };

    return (
      <div className="rapport-container">
        <h3>📄 Télécharger le rapport</h3>
        <p>Génère un rapport complet des performances de {enfantSelectionne?.prenom || 'votre enfant'}</p>
        <div className="rapport-options">
          <button className="rapport-btn" onClick={() => genererRapport('complet')}>📄 Rapport complet</button>
          <button className="rapport-btn" onClick={() => genererRapport('simplifie')}>📄 Rapport simplifié</button>
          <button className="rapport-btn" onClick={() => genererRapport('orientation')}>🎓 Rapport d'orientation</button>
        </div>
        <div className="rapport-preview">
          <h4>Aperçu du rapport</h4>
          <div className="rapport-preview-content">
            <p><strong>Élève:</strong> {enfantSelectionne?.prenom || 'N/A'} {enfantSelectionne?.nom || ''}</p>
            <p><strong>Niveau:</strong> {enfantSelectionne?.classe || 'N/A'}</p>
            <p><strong>Moyenne générale:</strong> {totalMoyenne}/20</p>
            <p><strong>Matières suivies:</strong> {Object.keys(moyennes).join(', ') || 'Aucune'}</p>
          </div>
        </div>
      </div>
    );
  };

  // ============ RENDU LIAISON ============
  const renderLiaisonForm = () => {
    if (!showLiaisonForm) return null;
    return (
      <div className="liaison-form-container">
        <div className="liaison-form">
          <h4>➕ Lier un enfant</h4>
          <p>Entrez le matricule scolaire de votre enfant pour le lier à votre compte parent.</p>
          <div className="liaison-form-group">
            <input
              type="text"
              className="liaison-input"
              placeholder="Entrez le matricule de l'enfant"
              value={matriculeLiaison}
              onChange={(e) => setMatriculeLiaison(e.target.value)}
              disabled={liaisonLoading}
            />
            {liaisonError && <p className="liaison-error">{liaisonError}</p>}
          </div>
          <div className="liaison-actions">
            <button 
              className="liaison-confirm" 
              onClick={lierEnfant}
              disabled={liaisonLoading || !matriculeLiaison.trim()}
            >
              {liaisonLoading ? '⏳ Liaison en cours...' : '✅ Confirmer'}
            </button>
            <button 
              className="liaison-cancel" 
              onClick={() => {
                setShowLiaisonForm(false);
                setMatriculeLiaison('');
                setLiaisonError('');
              }}
              disabled={liaisonLoading}
            >
              ❌ Annuler
            </button>
          </div>
          <p className="liaison-info">💡 Le matricule est fourni par l'établissement scolaire de votre enfant.</p>
        </div>
      </div>
    );
  };

  // ============ TABS ============
  const tabs = [
    { id: 'dashboard', name: '📊 Tableau de bord' },
    { id: 'sessions', name: '📅 Tutorat' },
    { id: 'resultats', name: '📝 Quiz' },
    { id: 'rapport', name: '📄 Rapport' }
  ];

  // ============ RENDU PRINCIPAL ============
  if (loading && enfants.length === 0) {
    return (
      <div className="parent-container">
        <header className="parent-header">
          <h1>👨‍👩‍👧‍👦 Espace Parent</h1>
          <div className="parent-user-info">
            <span>👤 {userData.prenom} {userData.nom}</span>
            <button onClick={handleLogout} className="logout-btn">Déconnexion</button>
          </div>
        </header>
        <div className="parent-loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="parent-container">
      <header className="parent-header">
        <h1>👨‍👩‍👧‍👦 Espace Parent</h1>
        <div className="parent-user-info">
          <span>👤 {userData.prenom} {userData.nom}</span>
          <button onClick={handleLogout} className="logout-btn">Déconnexion</button>
        </div>
      </header>

      <div className="enfant-selector">
        <div className="enfant-selector-content">
          <label>👦 Sélectionner un enfant :</label>
          {enfants.length > 0 ? (
            <select value={enfantSelectionne?.id || ''} onChange={handleEnfantChange}>
              {enfants.map(enfant => (
                <option key={enfant.id} value={enfant.id}>
                  {enfant.prenom} {enfant.nom} - {enfant.classe}
                </option>
              ))}
            </select>
          ) : (
            <span className="no-enfant">Aucun enfant lié à ce compte.</span>
          )}
        </div>
        <div className="enfant-actions">
          {enfants.length > 0 && enfantSelectionne && (
            <div className="enfant-info-badge">
              <span>📚 {enfantSelectionne.classe}</span>
              <span>🏫 {enfantSelectionne.etablissement}</span>
            </div>
          )}
          <button 
            className="lier-enfant-btn" 
            onClick={() => {
              setShowLiaisonForm(!showLiaisonForm);
              setLiaisonError('');
              setMatriculeLiaison('');
            }}
            disabled={liaisonLoading}
          >
            {showLiaisonForm ? '✕ Fermer' : '➕ Lier un enfant'}
          </button>
        </div>
      </div>

      {showLiaisonForm && renderLiaisonForm()}

      {enfants.length > 0 && enfantSelectionne && (
        <>
          <div className="parent-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`parent-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.name}
              </button>
            ))}
          </div>

          <div className="parent-content">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'sessions' && renderSessions()}
            {activeTab === 'resultats' && renderResultats()}
            {activeTab === 'rapport' && renderRapport()}
          </div>
        </>
      )}

      {enfants.length === 0 && !showLiaisonForm && (
        <div className="parent-empty-state">
          <div className="empty-icon">👨‍👩‍👧‍👦</div>
          <h3>Aucun enfant lié</h3>
          <p>Pour commencer à suivre les performances de votre enfant,</p>
          <p>cliquez sur le bouton <strong>"➕ Lier un enfant"</strong> ci-dessus</p>
          <p className="empty-hint">et entrez son matricule scolaire.</p>
        </div>
      )}
    </div>
  );
}

export default ParentDashboard;