// src/pages/admin/AdminTutoreExpress.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './AdminCrud.css';

function AdminTutoreExpress() {
  const [tuteurs, setTuteurs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tuteurs');

  const token = localStorage.getItem('token');
  const getAuthHeader = () => ({ Authorization: `Bearer ${token}` });

  const loadData = async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([
        api.get('/admin/tuteurs', { headers: getAuthHeader() }),
        api.get('/admin/sessions', { headers: getAuthHeader() })
      ]);
      setTuteurs(t.data || []);
      setSessions(s.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const validerTuteur = async (id, valider) => {
    try {
      await api.put(`/admin/tuteurs/${id}`, { valider }, { headers: getAuthHeader() });
      loadData();
      alert(valider ? '✅ Tuteur validé' : '❌ Demande refusée');
    } catch (error) {
      alert('❌ Erreur');
    }
  };

  const tabs = [
    { id: 'tuteurs', name: '👨‍🏫 Tuteurs' },
    { id: 'sessions', name: '📊 Sessions' }
  ];

  return (
    <div className="admin-module">
      <div className="module-header">
        <h2>👨‍🏫 TUTEUREXPRESS - Gestion</h2>
      </div>

      <div className="sub-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`sub-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {loading ? <div className="loading">Chargement...</div> : (
        <>
          {activeTab === 'tuteurs' && (
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr><th>Nom</th><th>Email</th><th>Matières</th><th>Statut</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {tuteurs.length === 0 ? <tr><td colSpan="5" className="empty">Aucun tuteur</td></tr> :
                    tuteurs.map(t => (
                      <tr key={t.id}>
                        <td>{t.prenom} {t.nom}</td>
                        <td>{t.email}</td>
                        <td>{t.matieres_preferees || '-'}</td>
                        <td>
                          {t.est_volontaire === 1 || t.role === 'tuteur' ? (
                            <span className="badge-valid">✅ Validé</span>
                          ) : (
                            <span className="badge-pending">⏳ En attente</span>
                          )}
                        </td>
                        <td>
                          {t.est_volontaire !== 1 && t.role !== 'tuteur' && (
                            <>
                              <button className="validate-btn" onClick={() => validerTuteur(t.id, true)}>✅</button>
                              <button className="reject-btn" onClick={() => validerTuteur(t.id, false)}>❌</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr><th>Élève</th><th>Tuteur</th><th>Matière</th><th>Date</th><th>Statut</th></tr>
                </thead>
                <tbody>
                  {sessions.length === 0 ? <tr><td colSpan="5" className="empty">Aucune session</td></tr> :
                    sessions.map(s => (
                      <tr key={s.id}>
                        <td>{s.eleve_nom || s.eleve_id}</td>
                        <td>{s.tuteur_nom || s.tuteur_id}</td>
                        <td>{s.matiere}</td>
                        <td>{s.date_session ? new Date(s.date_session).toLocaleDateString() : '-'}</td>
                        <td><span className={`statut-badge ${s.statut}`}>{s.statut}</span></td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminTutoreExpress;