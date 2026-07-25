// src/pages/admin/AdminExamens.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminExamens.css';

function AdminExamens() {
  const [examens, setExamens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    titre: '',
    matiere: '',
    niveau: '3ème',
    serie: '',
    contenu: '',
    fichier: null
  });
  const [scanning, setScanning] = useState(false);
  const [scannedText, setScannedText] = useState('');

  const token = localStorage.getItem('token');
  const matieres = ['Mathématiques', 'Français', 'Anglais', 'SVT', 'Physique-Chimie', 'Histoire-Géo', 'Philosophie'];
  const niveaux = ['3ème', 'Terminale'];
  const series = ['', 'C', 'D', 'A', 'G', 'F'];

  const getAuthHeader = () => ({
    Authorization: `Bearer ${token}`
  });

  useEffect(() => {
    loadExamens();
  }, []);

  const loadExamens = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/admin/examens', {
        headers: getAuthHeader()
      });
      setExamens(res.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'fichier' && formData[key]) {
          data.append(key, formData[key]);
        }
      });
      if (formData.fichier) {
        data.append('fichier', formData.fichier);
      }

      if (editingId) {
        await axios.put(`http://localhost:5000/api/admin/examens/${editingId}`, data, {
          headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('http://localhost:5000/api/admin/examens', data, {
          headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' }
        });
      }
      resetForm();
      loadExamens();
      alert(editingId ? '✅ Examen modifié !' : '✅ Examen ajouté !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const deleteExamen = async (id) => {
    if (window.confirm('Supprimer cet examen ?')) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/examens/${id}`, {
          headers: getAuthHeader()
        });
        loadExamens();
        alert('✅ Examen supprimé');
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setFormData({ ...formData, fichier: file });
    setScanning(true);
    
    // Simuler l'OCR (à remplacer par une vraie API OCR)
    setTimeout(() => {
      const simulatedText = `📝 ${file.name} - Contenu scanné automatiquement.
      
1. Question 1: ...
2. Question 2: ...
3. Question 3: ...`;
      setScannedText(simulatedText);
      setFormData(prev => ({ ...prev, contenu: simulatedText }));
      setScanning(false);
    }, 1500);
  };

  const resetForm = () => {
    setFormData({ titre: '', matiere: '', niveau: '3ème', serie: '', contenu: '', fichier: null });
    setScannedText('');
    setEditingId(null);
    setShowForm(false);
  };

  const editExamen = (examen) => {
    setFormData({
      titre: examen.titre,
      matiere: examen.matiere,
      niveau: examen.niveau,
      serie: examen.serie || '',
      contenu: examen.contenu || '',
      fichier: null
    });
    setEditingId(examen.id);
    setShowForm(true);
  };

  return (
    <div className="admin-examens">
      <div className="admin-section-header">
        <h2>📝 Examens Blancs</h2>
        <button className="add-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Fermer' : '➕ Ajouter un examen'}
        </button>
      </div>

      {showForm && (
        <div className="admin-form">
          <h3>{editingId ? '✏️ Modifier l\'examen' : '📝 Nouvel examen'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <input
                type="text"
                placeholder="Titre *"
                value={formData.titre}
                onChange={(e) => setFormData({...formData, titre: e.target.value})}
                required
              />
              <select
                value={formData.matiere}
                onChange={(e) => setFormData({...formData, matiere: e.target.value})}
                required
              >
                <option value="">Matière *</option>
                {matieres.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-row">
              <select
                value={formData.niveau}
                onChange={(e) => setFormData({...formData, niveau: e.target.value})}
              >
                {niveaux.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              {formData.niveau === 'Terminale' && (
                <select
                  value={formData.serie}
                  onChange={(e) => setFormData({...formData, serie: e.target.value})}
                >
                  <option value="">Série (optionnel)</option>
                  {series.filter(s => s !== '').map(s => <option key={s} value={s}>Série {s}</option>)}
                </select>
              )}
            </div>

            <div className="form-group">
              <label>📄 Importer un fichier (PDF, Image, Word)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                className="file-input"
              />
              {scanning && <div className="scanning-indicator">📡 Analyse du fichier...</div>}
              {scannedText && (
                <div className="scanned-preview">
                  <strong>📝 Texte scanné :</strong>
                  <textarea
                    value={formData.contenu}
                    onChange={(e) => setFormData({...formData, contenu: e.target.value})}
                    rows="8"
                  />
                </div>
              )}
            </div>

            {!scannedText && (
              <textarea
                placeholder="Contenu de l'examen (questions, consignes...)"
                value={formData.contenu}
                onChange={(e) => setFormData({...formData, contenu: e.target.value})}
                rows="6"
              />
            )}

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={resetForm}>Annuler</button>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Enregistrement...' : editingId ? '💾 Modifier' : '💾 Ajouter'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">Chargement...</div>
      ) : (
        <div className="examens-list">
          {examens.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📝</span>
              <p>Aucun examen pour le moment</p>
            </div>
          ) : (
            examens.map(examen => (
              <div key={examen.id} className="examen-card">
                <div className="examen-header">
                  <h3>{examen.titre}</h3>
                  <div className="examen-badges">
                    <span className="badge-matiere">{examen.matiere}</span>
                    <span className="badge-niveau">{examen.niveau}</span>
                    {examen.serie && <span className="badge-serie">Série {examen.serie}</span>}
                  </div>
                </div>
                <p className="examen-contenu">{examen.contenu?.substring(0, 200)}...</p>
                <p className="examen-date">📅 Publié le {new Date(examen.date_publication).toLocaleDateString()}</p>
                <div className="examen-actions">
                  <button className="edit-btn" onClick={() => editExamen(examen)}>✏️ Modifier</button>
                  <button className="delete-btn" onClick={() => deleteExamen(examen.id)}>🗑️ Supprimer</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default AdminExamens;