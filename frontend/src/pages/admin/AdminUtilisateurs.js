// src/pages/admin/AdminUtilisateurs.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import './AdminCrud.css';

function AdminUtilisateurs() {
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [tuteurs, setTuteurs] = useState([]);
  const [admins, setAdmins] = useState([]);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const getAuthHeader = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [u, e, t, a] = await Promise.all([
        api.get('/admin/users', { headers: getAuthHeader() }),
        api.get('/admin/eleves', { headers: getAuthHeader() }),
        api.get('/admin/tuteurs', { headers: getAuthHeader() }),
        api.get('/admin/list', { headers: getAuthHeader() })
      ]);
      setUsers(u.data || []);
      setEleves(e.data || []);
      setTuteurs(t.data || []);
      setAdmins(a.data || []);
    } catch (error) {
      console.error('Erreur loadData:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const deleteUser = async (id) => {
    if (!window.confirm('⚠️ Supprimer définitivement cet utilisateur ?')) return;
    try {
      await api.delete(`/admin/users/${id}`, { headers: getAuthHeader() });
      loadData();
      alert('✅ Utilisateur supprimé');
    } catch (error) {
      alert('❌ Erreur: ' + (error.response?.data?.message || error.message));
    }
  };

  const deleteEleve = async (id) => {
    if (!window.confirm('⚠️ Supprimer définitivement cet élève ?')) return;
    try {
      await api.delete(`/admin/eleves/${id}`, { headers: getAuthHeader() });
      loadData();
      alert('✅ Élève supprimé');
    } catch (error) {
      alert('❌ Erreur: ' + (error.response?.data?.message || error.message));
    }
  };

  const validerTuteur = async (id, valider) => {
    try {
      await api.put(`/admin/tuteurs/${id}`, { valider }, { headers: getAuthHeader() });
      loadData();
      alert(valider ? '✅ Tuteur validé' : '❌ Demande refusée');
    } catch (error) {
      alert('❌ Erreur: ' + (error.response?.data?.message || error.message));
    }
  };

  const deleteAdmin = async (id) => {
    if (id === user.id) {
      alert('❌ Vous ne pouvez pas vous supprimer vous-même');
      return;
    }
    if (!window.confirm('Supprimer cet administrateur ?')) return;
    try {
      await api.delete(`/admin/${id}`, { headers: getAuthHeader() });
      loadData();
      alert('✅ Admin supprimé');
    } catch (error) {
      alert('❌ Erreur: ' + (error.response?.data?.message || error.message));
    }
  };

  const tabs = [
    { id: 'admins', name: '👑 Admins' },
    { id: 'users', name: '👥 Utilisateurs' },
    { id: 'eleves', name: '👨‍🎓 Élèves' },
    { id: 'tuteurs', name: '👨‍🏫 Tuteurs' }
  ];

  const renderUsersTable = (data, columns, onDelete, extraActions = null) => (
    <div className="table-container">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map(c => <th key={c.key}>{c.label}</th>)}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length + 1} className="empty">Aucun élément</td></tr>
          ) : (
            data.map(item => (
              <tr key={item.id}>
                {columns.map(c => (
                  <td key={c.key}>
                    {c.key === 'role' ? (
                      <span className={`role-badge ${item[c.key] || 'eleve'}`}>{item[c.key] || 'eleve'}</span>
                    ) : c.key === 'matricule' ? (
                      <strong>{item[c.key]}</strong>
                    ) : c.render ? (
                      c.render(item)
                    ) : (
                      item[c.key] || '-'
                    )}
                  </td>
                ))}
                <td>
                  <div className="table-actions">
                    {extraActions && extraActions(item)}
                    <button className="delete-btn" onClick={() => onDelete(item.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'admins':
        return renderUsersTable(
          admins,
          [
            { key: 'prenom', label: 'Prénom' },
            { key: 'nom', label: 'Nom' },
            { key: 'email', label: 'Email' },
            { key: 'telephone', label: 'Téléphone' }
          ],
          deleteAdmin,
          (item) => item.id === user.id ? <span className="you-badge">👑 Vous</span> : null
        );
      case 'users':
        return renderUsersTable(
          users,
          [
            { key: 'prenom', label: 'Prénom' },
            { key: 'nom', label: 'Nom' },
            { key: 'email', label: 'Email' },
            { key: 'role', label: 'Rôle' },
            { key: 'telephone', label: 'Téléphone' }
          ],
          deleteUser,
          (item) => item.role === 'admin' ? <span className="protected-badge">🔒</span> : null
        );
      case 'eleves':
        return renderUsersTable(
          eleves,
          [
            { key: 'matricule', label: 'Matricule' },
            { key: 'prenom', label: 'Prénom' },
            { key: 'nom', label: 'Nom' },
            { key: 'classe', label: 'Classe' },
            { key: 'etablissement', label: 'Établissement' },
            { key: 'ville', label: 'Ville' }
          ],
          deleteEleve
        );
      case 'tuteurs':
        return renderUsersTable(
          tuteurs.filter(t => t.est_volontaire === 1 || t.role === 'tuteur'),
          [
            { key: 'prenom', label: 'Prénom' },
            { key: 'nom', label: 'Nom' },
            { key: 'email', label: 'Email' },
            { 
              key: 'matieres_preferees', 
              label: 'Matières', 
              render: (item) => item.matieres_preferees || '-' 
            },
            { 
              key: 'created_at', 
              label: 'Inscription', 
              render: (item) => new Date(item.created_at).toLocaleDateString() 
            }
          ],
          () => {},
          (item) => (
            <>
              <button className="validate-btn" onClick={() => validerTuteur(item.id, true)} title="Valider">✅</button>
              <button className="reject-btn" onClick={() => validerTuteur(item.id, false)} title="Refuser">❌</button>
            </>
          )
        );
      default:
        return null;
    }
  };

  return (
    <div className="admin-module">
      <div className="module-header">
        <h2>👥 Gestion des utilisateurs</h2>
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

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : (
        renderContent()
      )}
    </div>
  );
}

export default AdminUtilisateurs;