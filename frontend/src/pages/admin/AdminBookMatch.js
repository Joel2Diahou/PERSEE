// src/pages/admin/AdminBookMatch.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminCrud.css';

function AdminBookMatch() {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const token = localStorage.getItem('token');
  const getAuthHeader = () => ({ Authorization: `Bearer ${token}` });

  const loadAnnonces = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/admin/annonces', { headers: getAuthHeader() });
      setAnnonces(res.data || []);
    } catch (error) { console.error('Erreur:', error); } finally { setLoading(false); }
  };

  useEffect(() => { loadAnnonces(); }, []);

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/annonces/${deleteId}`, { headers: getAuthHeader() });
      setShowDeleteConfirm(false);
      loadAnnonces();
      alert('✅ Annonce supprimée');
    } catch (error) { alert('❌ Erreur'); }
  };

  return (
    <div className="admin-module">
      <div className="module-header">
        <h2>📚 PASSLIVRE - Gestion des annonces</h2>
      </div>

      {loading ? <div className="loading">Chargement...</div> : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>Titre</th><th>Auteur</th><th>Type</th><th>Ville</th><th>Quartier</th><th>Statut</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {annonces.length === 0 ? <tr><td colSpan="8" className="empty">Aucune annonce</td></tr> :
                annonces.map(a => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{a.titre_livre || a.titre}</td>
                    <td>{a.auteur || '-'}</td>
                    <td>{a.type_depot || '📚 Livre'}</td>
                    <td>{a.ville}</td>
                    <td>{a.quartier}</td>
                    <td><span className={`statut-badge ${a.statut}`}>{a.statut}</span></td>
                    <td>
                      <button className="delete-btn" onClick={() => confirmDelete(a.id)}>🗑️</button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Confirmation Suppression */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content delete-confirm" onClick={(e) => e.stopPropagation()}>
            <h2>⚠️ Confirmer la suppression</h2>
            <p>Êtes-vous sûr de vouloir supprimer définitivement cette annonce ?</p>
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

export default AdminBookMatch;