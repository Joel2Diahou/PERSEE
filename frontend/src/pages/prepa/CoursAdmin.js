// src/pages/prepa/CoursAdmin.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CoursAdmin.css';
import api from '../../services/api';
function CoursAdmin({ user, onBack }) {
  const [lecons, setLecons] = useState([]);
  const [selectedLecon, setSelectedLecon] = useState(null);
  const [loading, setLoading] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    const matricule = localStorage.getItem('matricule');
    if (token) return { 'Authorization': `Bearer ${token}` };
    if (matricule) return { 'X-Matricule': matricule };
    return {};
  };

  useEffect(() => {
    loadLecons();
  }, []);

  const loadLecons = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeader();
      const res = await api.get('/eleve/lecons', { headers });
      setLecons(res.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNiveauEmoji = (niveau) => {
    if (niveau === '3ème') return '🎓';
    if (niveau === 'Terminale') return '🎯';
    return '📚';
  };

  return (
    <div className="cours-admin-container">
      <div className="cours-admin-header">
        <button className="back-btn" onClick={onBack}>← Retour</button>
        <h1>📚 Mes Cours</h1>
      </div>

      {loading ? (
        <div className="loading-spinner">Chargement des cours...</div>
      ) : lecons.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📚</span>
          <p>Aucun cours disponible pour le moment.</p>
          <p className="empty-hint">L'administrateur doit ajouter des leçons.</p>
        </div>
      ) : selectedLecon ? (
        <div className="lecon-detail">
          <button className="back-lecon-btn" onClick={() => setSelectedLecon(null)}>
            ← Retour à la liste
          </button>
          <div className="lecon-detail-card">
            <div className="lecon-detail-header">
              <h2>{selectedLecon.titre}</h2>
              <div className="lecon-detail-badges">
                <span className="badge-matiere">{selectedLecon.matiere}</span>
                <span className="badge-niveau">{getNiveauEmoji(selectedLecon.niveau)} {selectedLecon.niveau}</span>
                {selectedLecon.serie && <span className="badge-serie">Série {selectedLecon.serie}</span>}
              </div>
            </div>
            {selectedLecon.resume_ia ? (
              <div className="lecon-resume-ia">
                <div className="resume-header">🤖 Résumé généré par l'IA</div>
                <div className="resume-content">{selectedLecon.resume_ia}</div>
              </div>
            ) : (
              <div className="lecon-no-resume">
                <p>⚠️ Ce cours n'a pas encore de résumé IA.</p>
              </div>
            )}
            <div className="lecon-contenu-complet">
              <h4>📖 Contenu complet</h4>
              <p>{selectedLecon.contenu}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="lecons-list">
          {lecons.map(lecon => (
            <div key={lecon.id} className="lecon-card" onClick={() => setSelectedLecon(lecon)}>
              <div className="lecon-card-icon">📖</div>
              <div className="lecon-card-info">
                <h3>{lecon.titre}</h3>
                <p className="lecon-card-meta">
                  <span className="meta-matiere">{lecon.matiere}</span>
                  <span className="meta-niveau">{getNiveauEmoji(lecon.niveau)} {lecon.niveau}</span>
                  {lecon.serie && <span className="meta-serie">Série {lecon.serie}</span>}
                </p>
                {lecon.resume_ia && <p className="lecon-card-resume">{lecon.resume_ia.substring(0, 120)}...</p>}
              </div>
              <div className="lecon-card-arrow">→</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CoursAdmin;