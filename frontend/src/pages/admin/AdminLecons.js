// src/pages/admin/AdminLecons.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminCrud.css';

function AdminLecons() {
  const [lecons, setLecons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const [formData, setFormData] = useState({
    titre: '', contenu: '', matiere: '', niveau: '', serie: '', resume_ia: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  const token = localStorage.getItem('token');
  const getAuthHeader = () => ({ Authorization: `Bearer ${token}` });

  const matieres = ['Mathématiques', 'Français', 'Anglais', 'SVT', 'Physique-Chimie', 'Histoire-Géo', 'Philosophie'];
  const niveaux = ['6ème', '5ème', '4ème', '3ème', 'Seconde', '1ère', 'Terminale'];
  const series = ['C', 'D', 'A', 'G', 'F'];

  const loadLecons = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/admin/lecons', { headers: getAuthHeader() });
      setLecons(res.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLecons(); }, []);

  const openModal = (item = null) => {
    setIsEditing(!!item);
    if (item) {
      setFormData(item);
    } else {
      setFormData({ titre: '', contenu: '', matiere: '', niveau: '', serie: '', resume_ia: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.titre || !formData.contenu || !formData.matiere || !formData.niveau) {
      alert('Titre, contenu, matière et niveau requis');
      return;
    }
    try {
      if (isEditing && formData.id) {
        await axios.put(`http://localhost:5000/api/admin/lecons/${formData.id}`, formData, { headers: getAuthHeader() });
      } else {
        await axios.post('http://localhost:5000/api/admin/lecons', formData, { headers: getAuthHeader() });
      }
      setShowModal(false);
      setFormData({ titre: '', contenu: '', matiere: '', niveau: '', serie: '', resume_ia: '' });
      setIsEditing(false);
      loadLecons();
      alert(isEditing ? '✅ Leçon modifiée' : '✅ Leçon ajoutée');
    } catch (error) {
      alert('❌ Erreur: ' + (error.response?.data?.message || error.message));
    }
  };

  const generateResume = async (id) => {
    setGeneratingId(id);
    try {
      const res = await axios.post(`http://localhost:5000/api/admin/lecons/${id}/resume`, {}, { headers: getAuthHeader() });
      if (res.data.success) {
        loadLecons();
        alert('✅ Résumé IA généré avec succès !');
      }
    } catch (error) {
      alert('❌ Erreur génération résumé');
    } finally {
      setGeneratingId(null);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/lecons/${deleteId}`, { headers: getAuthHeader() });
      setShowDeleteConfirm(false);
      loadLecons();
      alert('✅ Leçon supprimée');
    } catch (error) {
      alert('❌ Erreur');
    }
  };

  return (
    <div className="admin-lecons">
      <div className="module-header">
        <h3>📚 Gestion des leçons</h3>
        <button className="add-btn" onClick={() => openModal()}>➕ Ajouter une leçon</button>
      </div>

      <div className="admin-info">
        <p>💡 Les leçons servent à générer des quiz adaptés par l'IA.</p>
        <p>📚 Ajoute une leçon, génère son résumé, puis l'IA créera automatiquement des questions.</p>
      </div>

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : (
        <div className="crud-grid">
          {lecons.length === 0 ? (
            <p className="empty">Aucune leçon. Créez-en une !</p>
          ) : (
            lecons.map(l => (
              <div key={l.id} className="crud-card lecon-card">
                <div className="crud-card-header">
                  <span className="crud-icon">📖</span>
                  <h3>{l.titre}</h3>
                </div>
                <div className="crud-card-body">
                  <p><strong>Matière:</strong> {l.matiere}</p>
                  <p><strong>Niveau:</strong> {l.niveau} {l.serie ? `- Série ${l.serie}` : ''}</p>
                  <p className="contenu-preview">{l.contenu?.substring(0, 100)}...</p>
                  {l.resume_ia && (
                    <div className="resume-preview">
                      <strong>📝 Résumé IA:</strong>
                      <p>{l.resume_ia.substring(0, 150)}...</p>
                    </div>
                  )}
                </div>
                <div className="crud-card-actions">
                  <button className="edit-btn" onClick={() => openModal(l)}>✏️</button>
                  <button 
                    className="resume-btn" 
                    onClick={() => generateResume(l.id)}
                    disabled={generatingId === l.id}
                    title="Générer un résumé avec l'IA"
                  >
                    {generatingId === l.id ? '⏳' : '🤖 Résumé'}
                  </button>
                  <button className="delete-btn" onClick={() => confirmDelete(l.id)}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Ajout/Modification */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{isEditing ? '✏️ Modifier' : '➕ Ajouter'} une leçon</h2>
            <input 
              type="text" 
              placeholder="Titre de la leçon *" 
              value={formData.titre || ''} 
              onChange={(e) => setFormData({...formData, titre: e.target.value})} 
            />
            <select 
              value={formData.matiere || ''} 
              onChange={(e) => setFormData({...formData, matiere: e.target.value})}
            >
              <option value="">Matière *</option>
              {matieres.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select 
              value={formData.niveau || ''} 
              onChange={(e) => setFormData({...formData, niveau: e.target.value})}
            >
              <option value="">Niveau *</option>
              {niveaux.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select 
              value={formData.serie || ''} 
              onChange={(e) => setFormData({...formData, serie: e.target.value})}
            >
              <option value="">Série (optionnel)</option>
              {series.map(s => <option key={s} value={s}>Série {s}</option>)}
            </select>
            <textarea 
              placeholder="Contenu de la leçon *" 
              value={formData.contenu || ''} 
              onChange={(e) => setFormData({...formData, contenu: e.target.value})}
              rows="6"
            />
            {isEditing && formData.resume_ia && (
              <div className="resume-field">
                <label>📝 Résumé IA</label>
                <textarea 
                  value={formData.resume_ia || ''} 
                  onChange={(e) => setFormData({...formData, resume_ia: e.target.value})}
                  rows="3"
                />
              </div>
            )}
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="submit-btn" onClick={handleSubmit}>
                {isEditing ? '💾 Modifier' : '➕ Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Suppression */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content delete-confirm" onClick={(e) => e.stopPropagation()}>
            <h2>⚠️ Confirmer la suppression</h2>
            <p>Êtes-vous sûr de vouloir supprimer cette leçon ?</p>
            <p className="warning-text">Tous les quiz associés seront également supprimés.</p>
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => setShowDeleteConfirm(false)}>Annuler</button>
              <button className="delete-confirm-btn" onClick={handleDelete}>🗑️ Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLecons;