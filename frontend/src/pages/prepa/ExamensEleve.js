// src/pages/prepa/ExamensEleve.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ExamensEleve.css';
import api from '../../services/api';

function ExamensEleve({ user, onBack }) {
  const [examens, setExamens] = useState([]);
  const [selectedExamen, setSelectedExamen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reponses, setReponses] = useState({});
  const [resultat, setResultat] = useState(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    const matricule = localStorage.getItem('matricule');
    if (token) return { 'Authorization': `Bearer ${token}` };
    if (matricule) return { 'X-Matricule': matricule };
    return {};
  };

  useEffect(() => {
    loadExamens();
  }, []);

  const loadExamens = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeader();
      const res = await api.get('/eleve/examens', { headers });
      setExamens(res.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const soumettreExamen = async () => {
    alert('✅ Examen soumis ! (Simulation)');
    setSelectedExamen(null);
    setReponses({});
  };

  return (
    <div className="examens-eleve-container">
      <div className="examens-eleve-header">
        <button className="back-btn" onClick={onBack}>← Retour</button>
        <h1>📝 Examens Blancs</h1>
      </div>

      {loading ? (
        <div className="loading-spinner">Chargement...</div>
      ) : examens.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📝</span>
          <p>Aucun examen disponible.</p>
          <p className="empty-hint">L'administrateur doit publier des examens.</p>
        </div>
      ) : selectedExamen ? (
        <div className="examen-detail">
          <button className="back-examen-btn" onClick={() => setSelectedExamen(null)}>
            ← Retour à la liste
          </button>
          <div className="examen-detail-card">
            <h2>{selectedExamen.titre}</h2>
            <div className="examen-meta">
              <span className="meta-matiere">{selectedExamen.matiere}</span>
              <span className="meta-niveau">{selectedExamen.niveau}</span>
              {selectedExamen.serie && <span className="meta-serie">Série {selectedExamen.serie}</span>}
            </div>
            <div className="examen-contenu">
              <pre>{selectedExamen.contenu}</pre>
            </div>
            <button className="soumettre-btn" onClick={soumettreExamen}>
              📤 Soumettre ma copie
            </button>
          </div>
        </div>
      ) : (
        <div className="examens-list">
          {examens.map(examen => (
            <div key={examen.id} className="examen-card" onClick={() => setSelectedExamen(examen)}>
              <div className="examen-card-icon">📄</div>
              <div className="examen-card-info">
                <h3>{examen.titre}</h3>
                <p className="examen-card-meta">
                  <span className="meta-matiere">{examen.matiere}</span>
                  <span className="meta-niveau">{examen.niveau}</span>
                  {examen.serie && <span className="meta-serie">Série {examen.serie}</span>}
                </p>
                <p className="examen-card-date">📅 {new Date(examen.date_publication).toLocaleDateString()}</p>
              </div>
              <div className="examen-card-arrow">→</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExamensEleve;