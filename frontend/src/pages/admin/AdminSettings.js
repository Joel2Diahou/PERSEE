// src/pages/admin/AdminSettings.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './AdminSettings.css';

function AdminSettings({ onClose }) {
  const [activeTab, setActiveTab] = useState('compte');
  const [loading, setLoading] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  
  // État compte
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [compteData, setCompteData] = useState({
    email: user.email || '',
    telephone: user.telephone || '',
    ancienMotDePasse: '',
    nouveauMotDePasse: ''
  });

  // États utilisateurs
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [eleves, setEleves] = useState([]);

  const token = localStorage.getItem('token');
  const getAuthHeader = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔍 Chargement des utilisateurs...');
      
      const [u, a, e] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/users', { headers: getAuthHeader() }),
        axios.get('http://localhost:5000/api/admin/list', { headers: getAuthHeader() }),
        axios.get('http://localhost:5000/api/admin/eleves', { headers: getAuthHeader() })
      ]);
      
      console.log('📊 Utilisateurs reçus:', u.data?.length || 0);
      console.log('📊 Admins reçus:', a.data?.length || 0);
      console.log('📊 Élèves reçus:', e.data?.length || 0);
      
      setUsers(u.data || []);
      setAdmins(a.data || []);
      setEleves(e.data || []);
      
      if (u.data?.length === 0) {
        console.log('⚠️ Aucun utilisateur trouvé dans la base de données');
      }
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      console.error('❌ Détails:', error.response?.data);
      alert('Erreur de chargement des données. Vérifie que le backend est démarré.');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers, reloadTrigger]);

  const updateCompte = async () => {
    setLoading(true);
    try {
      await axios.put('http://localhost:5000/api/admin/compte', compteData, { headers: getAuthHeader() });
      const updatedUser = { ...user, email: compteData.email, telephone: compteData.telephone };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      alert('✅ Compte mis à jour');
      setCompteData({ ...compteData, ancienMotDePasse: '', nouveauMotDePasse: '' });
    } catch (error) {
      alert('❌ ' + (error.response?.data?.message || 'Erreur'));
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('⚠️ Supprimer définitivement cet utilisateur ?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${id}`, { headers: getAuthHeader() });
      alert('✅ Utilisateur supprimé');
      setReloadTrigger(prev => prev + 1);
    } catch (error) {
      alert('❌ Erreur: ' + (error.response?.data?.message || error.message));
    }
  };

  const deleteAdmin = async (id) => {
    if (id === user.id) { alert('❌ Vous ne pouvez pas vous supprimer'); return; }
    if (!window.confirm('Supprimer cet administrateur ?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/${id}`, { headers: getAuthHeader() });
      alert('✅ Admin supprimé');
      setReloadTrigger(prev => prev + 1);
    } catch (error) {
      alert('❌ Erreur: ' + (error.response?.data?.message || error.message));
    }
  };

  const deleteEleve = async (id) => {
    if (!window.confirm('⚠️ Supprimer définitivement cet élève ?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/eleves/${id}`, { headers: getAuthHeader() });
      alert('✅ Élève supprimé');
      setReloadTrigger(prev => prev + 1);
    } catch (error) {
      alert('❌ Erreur: ' + (error.response?.data?.message || error.message));
    }
  };

  const reloadUsers = () => {
    setReloadTrigger(prev => prev + 1);
  };

  const tabs = [
    { id: 'compte', name: '⚙️ Mon compte' },
    { id: 'admins', name: '👑 Admins' },
    { id: 'users', name: '👥 Utilisateurs' },
    { id: 'eleves', name: '👨‍🎓 Élèves' }
  ];

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>⚙️ Paramètres</h2>
        <button className="settings-close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="settings-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <div className="settings-content">
        {/* ===== COMPTE ===== */}
        {activeTab === 'compte' && (
          <div className="settings-compte">
            <h3>✏️ Modifier mes informations</h3>
            <div className="form-group">
              <label>📧 Email</label>
              <input type="email" value={compteData.email} onChange={(e) => setCompteData({...compteData, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label>📱 Téléphone</label>
              <input type="text" value={compteData.telephone} onChange={(e) => setCompteData({...compteData, telephone: e.target.value})} />
            </div>
            <div className="form-group">
              <label>🔒 Ancien mot de passe</label>
              <input type="password" placeholder="Laissez vide si inchangé" value={compteData.ancienMotDePasse} onChange={(e) => setCompteData({...compteData, ancienMotDePasse: e.target.value})} />
            </div>
            <div className="form-group">
              <label>🔑 Nouveau mot de passe</label>
              <input type="password" placeholder="Laissez vide si inchangé" value={compteData.nouveauMotDePasse} onChange={(e) => setCompteData({...compteData, nouveauMotDePasse: e.target.value})} />
            </div>
            <button className="submit-btn" onClick={updateCompte} disabled={loading}>
              {loading ? '⏳ Enregistrement...' : '💾 Enregistrer'}
            </button>
          </div>
        )}

        {/* ===== ADMINS ===== */}
        {activeTab === 'admins' && (
          <div className="settings-table">
            <h3>👑 Administrateurs</h3>
            {loading ? (
              <p>Chargement...</p>
            ) : admins.length === 0 ? (
              <div className="empty-state">
                <p>Aucun administrateur</p>
                <button className="reload-btn" onClick={reloadUsers}>🔄 Recharger</button>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr><th>Nom</th><th>Email</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {admins.map(a => (
                    <tr key={a.id}>
                      <td>{a.prenom} {a.nom}</td>
                      <td>{a.email}</td>
                      <td>
                        {a.id !== user.id ? (
                          <button className="delete-btn" onClick={() => deleteAdmin(a.id)}>🗑️</button>
                        ) : (
                          <span className="you-badge">👑 Vous</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ===== UTILISATEURS (CORRIGÉ) ===== */}
        {activeTab === 'users' && (
          <div className="settings-table">
            <h3>👥 Utilisateurs</h3>
            {loading ? (
              <p>⏳ Chargement...</p>
            ) : users.length === 0 ? (
              <div className="empty-state">
                <p>📭 Aucun utilisateur trouvé dans la base de données</p>
                <p className="empty-hint">Connectez-vous en tant que parent ou tuteur pour créer des comptes.</p>
                <button className="reload-btn" onClick={reloadUsers}>🔄 Recharger</button>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Téléphone</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.prenom} {u.nom}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-badge ${u.role || 'eleve'}`}>
                          {u.role || 'eleve'}
                        </span>
                      </td>
                      <td>{u.telephone || '-'}</td>
                      <td>
                        {u.role !== 'admin' ? (
                          <button className="delete-btn" onClick={() => deleteUser(u.id)} title="Supprimer">🗑️</button>
                        ) : (
                          <span className="protected-badge">🔒</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ===== ÉLÈVES ===== */}
        {activeTab === 'eleves' && (
          <div className="settings-table">
            <h3>👨‍🎓 Élèves</h3>
            {loading ? (
              <p>Chargement...</p>
            ) : eleves.length === 0 ? (
              <div className="empty-state">
                <p>Aucun élève</p>
                <button className="reload-btn" onClick={reloadUsers}>🔄 Recharger</button>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Matricule</th>
                    <th>Nom</th>
                    <th>Classe</th>
                    <th>Établissement</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {eleves.map(e => (
                    <tr key={e.id}>
                      <td><strong>{e.matricule}</strong></td>
                      <td>{e.prenom} {e.nom}</td>
                      <td>{e.classe}</td>
                      <td>{e.etablissement}</td>
                      <td>
                        <button className="delete-btn" onClick={() => deleteEleve(e.id)} title="Supprimer">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminSettings;