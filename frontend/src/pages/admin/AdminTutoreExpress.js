// src/pages/admin/AdminTutoreExpress.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './AdminCrud.css';

function AdminTutoreExpress() {
  const [tuteurs, setTuteurs] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');
  const getAuthHeader = () => ({ Authorization: `Bearer ${token}` });

  const loadTuteurs = async () => {
    setLoading(true);
    try {
      console.log('📥 Chargement des tuteurs...');
      const res = await api.get('/admin/tuteurs', { headers: getAuthHeader() });
      console.log('📥 Tuteurs reçus:', res.data);
      setTuteurs(res.data || []);
    } catch (error) {
      console.error('❌ Erreur chargement tuteurs:', error);
      alert('Erreur de chargement des tuteurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTuteurs();
  }, []);

  const validerTuteur = async (id, valider) => {
    try {
      await api.put(`/admin/tuteurs/${id}`, { valider }, { headers: getAuthHeader() });
      loadTuteurs();
      alert(valider ? '✅ Tuteur validé' : '❌ Demande refusée');
    } catch (error) {
      alert('❌ Erreur: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return <div className="loading">Chargement des tuteurs...</div>;
  }

  return (
    <div className="admin-module">
      <div className="module-header">
        <h2>👨‍🏫 Gestion des tuteurs</h2>
        <span className="badge-count">{tuteurs.length} tuteur(s)</span>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Matières</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tuteurs.length === 0 ? (
              <tr><td colSpan="5" className="empty">Aucun tuteur trouvé</td></tr>
            ) : (
              tuteurs.map(t => (
                <tr key={t.id}>
                  <td>{t.prenom} {t.nom}</td>
                  <td>{t.email}</td>
                  <td>{t.matieres_preferees || '-'}</td>
                  <td>
                    {t.role === 'tuteur' || t.est_volontaire === 1 ? (
                      <span className="badge-valid">✅ Validé</span>
                    ) : (
                      <span className="badge-pending">⏳ En attente</span>
                    )}
                  </td>
                  <td>
                    {t.role !== 'tuteur' && t.est_volontaire !== 1 && (
                      <>
                        <button className="validate-btn" onClick={() => validerTuteur(t.id, true)}>✅ Valider</button>
                        <button className="reject-btn" onClick={() => validerTuteur(t.id, false)}>❌ Refuser</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminTutoreExpress;