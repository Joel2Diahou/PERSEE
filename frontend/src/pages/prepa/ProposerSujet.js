// src/pages/prepa/ProposerSujet.js
import React, { useState, useRef } from 'react';
import api from '../../services/api';
import './ProposerSujet.css';

function ProposerSujet({ user, onBack }) {
  const [formData, setFormData] = useState({
    titre: '',
    matiere: '',
    niveau: '',
    description: '',
    fichier: null,
    photo: null
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultat, setResultat] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);

  const matieres = ['Mathématiques', 'Français', 'Anglais', 'SVT', 'Physique-Chimie', 'Histoire-Géo', 'Philosophie'];
  const niveaux = ['6ème', '5ème', '4ème', '3ème', 'Seconde', '1ère', 'Terminale'];

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    const matricule = localStorage.getItem('matricule');
    if (token) return { 'Authorization': `Bearer ${token}` };
    if (matricule) return { 'X-Matricule': matricule };
    return {};
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
        setError('⚠️ Veuillez uploader un fichier PDF ou Word (.doc, .docx)');
        e.target.value = '';
        return;
      }
      setFormData({ ...formData, fichier: file });
      setError(null);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('⚠️ Veuillez sélectionner une image');
        e.target.value = '';
        return;
      }
      setFormData({ ...formData, photo: file });
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre || !formData.matiere || !formData.niveau) {
      setError('⚠️ Titre, matière et niveau sont requis');
      return;
    }
    if (!formData.fichier && !formData.photo) {
      setError('⚠️ Veuillez joindre un fichier (PDF/Word) ou une photo');
      return;
    }

    setLoading(true);
    setProgress(10);
    setError(null);

    try {
      const headers = getAuthHeader();
      const formDataToSend = new FormData();
      formDataToSend.append('titre', formData.titre);
      formDataToSend.append('matiere', formData.matiere);
      formDataToSend.append('niveau', formData.niveau);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('eleve_id', user.id || user.matricule);
      formDataToSend.append('eleve_nom', `${user.prenom || ''} ${user.nom || ''}`);

      if (formData.fichier) {
        formDataToSend.append('fichier', formData.fichier);
        setProgress(30);
      }
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo);
        setProgress(40);
      }

      // ✅ Utiliser api au lieu de axios
      const response = await api.post('/prepa/proposer-sujet', formDataToSend, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = 40 + Math.round((progressEvent.loaded / progressEvent.total) * 40);
          setProgress(Math.min(percent, 80));
        }
      });

      setProgress(90);

      if (response.data.success) {
        setResultat({
          message: '✅ Sujet proposé avec succès !',
          details: response.data.message || 'L\'équipe pédagogique va analyser votre proposition.',
          analyse: response.data.analyse || null
        });
        setProgress(100);
      } else {
        setError('❌ ' + (response.data.message || 'Erreur lors de l\'envoi'));
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('❌ ' + (error.response?.data?.message || 'Erreur de connexion'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      titre: '',
      matiere: '',
      niveau: '',
      description: '',
      fichier: null,
      photo: null
    });
    setResultat(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  return (
    <div className="proposer-container">
      <div className="proposer-header">
        <button className="back-btn" onClick={onBack}>← Retour</button>
        <h1>📤 Proposer un sujet / examen</h1>
      </div>

      {resultat ? (
        <div className="proposer-resultat">
          <div className="resultat-icon">✅</div>
          <h2>{resultat.message}</h2>
          <p>{resultat.details}</p>
          {resultat.analyse && (
            <div className="analyse-preview">
              <h4>📋 Analyse IA</h4>
              <p>{resultat.analyse}</p>
            </div>
          )}
          <div className="resultat-actions">
            <button className="submit-btn" onClick={resetForm}>📝 Proposer un autre sujet</button>
            <button className="back-btn-result" onClick={onBack}>🏠 Retour</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="proposer-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Titre du sujet *</label>
            <input
              type="text"
              name="titre"
              placeholder="Ex: Examen blanc de maths - 2024"
              value={formData.titre}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Matière *</label>
              <select name="matiere" value={formData.matiere} onChange={handleChange} required>
                <option value="">Choisir</option>
                {matieres.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Niveau *</label>
              <select name="niveau" value={formData.niveau} onChange={handleChange} required>
                <option value="">Choisir</option>
                {niveaux.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description (optionnel)</label>
            <textarea
              name="description"
              placeholder="Décrivez brièvement le sujet..."
              value={formData.description}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-group upload-section">
            <label>📄 Fichier (PDF ou Word)</label>
            <div className="upload-zone">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="file-input"
              />
              <div className="upload-icon">📤</div>
              <p>Glissez ou cliquez pour uploader un fichier</p>
              <span className="upload-hint">PDF, DOC, DOCX acceptés</span>
              {formData.fichier && (
                <div className="file-name">✅ {formData.fichier.name}</div>
              )}
            </div>
          </div>

          <div className="form-group upload-section">
            <label>📸 Photo (optionnel - pour prise en photo)</label>
            <div className="upload-zone">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="file-input"
              />
              <div className="upload-icon">📷</div>
              <p>Prenez ou choisissez une photo</p>
              <span className="upload-hint">JPG, PNG, GIF acceptés</span>
              {formData.photo && (
                <div className="file-name">✅ {formData.photo.name}</div>
              )}
            </div>
          </div>

          <div className="info-box">
            <p>💡 <strong>L'IA analysera votre sujet</strong> et le structurera automatiquement pour le rendre disponible aux autres élèves.</p>
          </div>

          {loading && (
            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="progress-text">{progress}% - Traitement en cours...</span>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onBack}>Annuler</button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? '⏳ Envoi...' : '📤 Proposer'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ProposerSujet;