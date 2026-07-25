// src/pages/admin/AdminSujetsProposes.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './AdminCrud.css';

function AdminSujetsProposes() {
  const [sujets, setSujets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSujet, setSelectedSujet] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [analyseResult, setAnalyseResult] = useState(null);

  const token = localStorage.getItem('token');
  const getAuthHeader = () => ({ Authorization: `Bearer ${token}` });

  const loadSujets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/sujets-proposes', { headers: getAuthHeader() });
      setSujets(res.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSujets(); }, []);

  const analyserSujet = async (id) => {
    try {
      const res = await api.post(`/admin/sujets-proposes/${id}/analyser`, {}, { headers: getAuthHeader() });
      if (res.data.success) {
        setAnalyseResult(res.data.analyse);
        alert('✅ Analyse IA terminée !');
        loadSujets();
      }
    } catch (error) {
      alert('❌ Erreur analyse');
    }
  };

  const validerSujet = async (id) => {
    if (!window.confirm('Valider ce sujet pour qu\'il soit disponible aux élèves ?')) return;
    try {
      await api.put(`/admin/sujets-proposes/${id}/valider`, {}, { headers: getAuthHeader() });
      loadSujets();
      alert('✅ Sujet validé !');
    } catch (error) {
      alert('❌ Erreur');
    }
  };

  const rejeterSujet = async (id) => {
    if (!window.confirm('Rejeter ce sujet ?')) return;
    try {
      await api.put(`/admin/sujets-proposes/${id}/rejeter`, {}, { headers: getAuthHeader() });
      loadSujets();
      alert('❌ Sujet rejeté');
    } catch (error) {
      alert('❌ Erreur');
    }
  };

  const supprimerSujet = async (id) => {
    if (!window.confirm('Supprimer définitivement ce sujet ?')) return;
    try {
      await api.delete(`/admin/sujets-proposes/${id}`, { headers: getAuthHeader() });
      loadSujets();
      alert('✅ Sujet supprimé');
    } catch (error) {
      alert('❌ Erreur');
    }
  };

  const getStatusBadge = (statut) => {
    const statusMap = {
      'en_attente': <span className="badge-pending">⏳ En attente</span>,
      'en_analyse': <span className="badge-analyse">🔍 En analyse</span>,
      'valide': <span className="badge-valid">✅ Validé</span>,
      'rejete': <span className="badge-rejected">❌ Rejeté</span>
    };
    return statusMap[statut] || statut;
  };

  return (
    <div className="admin-sujets">
      <div className="module-header">
        <h3>📤 Sujets proposés par les élèves</h3>
        <span className="sujets-count">{sujets.filter(s => s.statut === 'en_attente').length} en attente</span>
      </div>

      <div className="admin-info">
        <p>💡 Les élèves peuvent proposer des sujets et examens. L'IA les analyse et vous pouvez les valider.</p>
      </div>

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : sujets.length === 0 ? (
        <p className="empty">Aucun sujet proposé</p>
      ) : (
        <div className="sujets-list">
          {sujets.map(s => (
            <div key={s.id} className="sujet-card">
              <div className="sujet-header">
                <div className="sujet-info">
                  <h4>{s.titre}</h4>
                  <div className="sujet-meta">
                    <span className="sujet-matiere">{s.matiere}</span>
                    <span className="sujet-niveau">{s.niveau}</span>
                    <span className="sujet-auteur">👤 {s.eleve_nom || 'Anonyme'}</span>
                    <span className="sujet-date">{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="sujet-status">
                  {getStatusBadge(s.statut)}
                </div>
              </div>

              {s.description && (
                <p className="sujet-description">{s.description}</p>
              )}

              <div className="sujet-fichiers">
                {s.fichier_url && (
                  <a href={s.fichier_url} target="_blank" rel="noopener noreferrer" className="fichier-link">
                    📄 Voir le fichier
                  </a>
                )}
                {s.photo_url && (
                  <a href={s.photo_url} target="_blank" rel="noopener noreferrer" className="fichier-link">
                    📸 Voir la photo
                  </a>
                )}
              </div>

              {s.analyse_ia && (
                <div className="analyse-preview">
                  <strong>🤖 Analyse IA:</strong>
                  <p>{s.analyse_ia.substring(0, 200)}...</p>
                </div>
              )}

              <div className="sujet-actions">
                {s.statut === 'en_attente' && (
                  <>
                    <button className="analyse-btn" onClick={() => analyserSujet(s.id)}>
                      🤖 Analyser
                    </button>
                    <button className="validate-btn" onClick={() => validerSujet(s.id)}>
                      ✅ Valider
                    </button>
                    <button className="reject-btn" onClick={() => rejeterSujet(s.id)}>
                      ❌ Rejeter
                    </button>
                  </>
                )}
                {s.statut === 'en_analyse' && (
                  <span className="analyse-loading">⏳ Analyse en cours...</span>
                )}
                {(s.statut === 'valide' || s.statut === 'rejete') && (
                  <button className="delete-btn" onClick={() => supprimerSujet(s.id)}>🗑️</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminSujetsProposes;