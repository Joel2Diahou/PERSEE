// src/pages/Orientation.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Orientation.css';
import EmploiStats from './EmploiStats';

function Orientation() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');
  const [niveau, setNiveau] = useState('3eme');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [searchFiliere, setSearchFiliere] = useState('');
  const [searchEcole, setSearchEcole] = useState('');

  // États admin
  const [domaines, setDomaines] = useState([]);
  const [adminFilieres, setAdminFilieres] = useState([]);
  const [adminEcoles, setAdminEcoles] = useState([]);
  const [showDomaineForm, setShowDomaineForm] = useState(false);
  const [showFiliereForm, setShowFiliereForm] = useState(false);
  const [showEcoleForm, setShowEcoleForm] = useState(false);
  const [showMetierForm, setShowMetierForm] = useState(false);
  const [newDomaine, setNewDomaine] = useState({ nom: '', icon: '📁' });
  const [newFiliere, setNewFiliere] = useState({ domaine_id: '', nom: '', description: '' });
  const [newEcoleAdmin, setNewEcoleAdmin] = useState({ nom: '', ville: '', quartier: '', site_web: '', contact: '', description: '', image: '🏫' });
  const [newMetier, setNewMetier] = useState({ nom: '', salaire: '', demande: 'Moyennement recherche', description: '' });
  const [selectedFiliere, setSelectedFiliere] = useState(null);
  const [metiers, setMetiers] = useState([]);
  const [updatingEmploi, setUpdatingEmploi] = useState(false);

  const messagesEndRef = useRef(null);
  const niveaux = ['6eme', '5eme', '4eme', '3eme', 'Seconde', '1ere', 'Terminale'];

  const isAdmin = user?.role === 'admin';

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    const matricule = localStorage.getItem('matricule');
    if (token) return { 'Authorization': `Bearer ${token}` };
    if (matricule) return { 'X-Matricule': matricule };
    return {};
  };

  // ============ FORMATER LES LIENS ============
  const formatMessageWithLinks = (text) => {
    if (!text) return '';

    let formattedText = text.replace(
      /<((?:https?:\/\/)?[^>\s]+)>/g,
      (match, url) => {
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;
        return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" class="message-link">${url}</a>`;
      }
    );

    formattedText = formattedText.split('\n').map((line, i) => {
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        const content = line.trim().substring(1).trim();
        return `<li>${content}</li>`;
      }
      if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
        const content = line.trim().replace(/\*\*/g, '');
        return `<strong>${content}</strong>`;
      }
      if (line.trim().startsWith('**')) {
        const boldMatch = line.match(/\*\*(.*?)\*\*/);
        if (boldMatch) {
          const before = line.substring(0, line.indexOf('**'));
          const after = line.substring(line.indexOf('**') + boldMatch[0].length);
          return `<span>${before}<strong>${boldMatch[1]}</strong>${after}</span>`;
        }
      }
      if (line.trim() === '') return '<br/>';
      return `<span>${line}</span>`;
    }).join('\n');

    return formattedText;
  };

  useEffect(() => {
    const eleve = localStorage.getItem('eleve');
    const userData = localStorage.getItem('user');
    if (eleve) setUser(JSON.parse(eleve));
    else if (userData) setUser(JSON.parse(userData));
    else navigate('/');
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Charger les données admin
  useEffect(() => {
    if (isAdmin) {
      loadDomaines();
      loadAdminFilieres();
      loadAdminEcoles();
    }
  }, [isAdmin]);

  // ============ ADMIN - CHARGER DONNÉES ============
  const loadDomaines = async () => {
    try {
      const headers = getAuthHeader();
      const res = await api.get('/admin/domaines', { headers });
      setDomaines(res.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const loadAdminFilieres = async () => {
    try {
      const headers = getAuthHeader();
      const res = await api.get('/admin/filieres', { headers });
      setAdminFilieres(res.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const loadAdminEcoles = async () => {
    try {
      const headers = getAuthHeader();
      const res = await api.get('/admin/ecoles', { headers });
      setAdminEcoles(res.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const loadMetiers = async (filiereId) => {
    try {
      const headers = getAuthHeader();
      // ✅ CORRIGÉ
      const res = await api.get(`/admin/filieres/${filiereId}/metiers`, { headers });
      setMetiers(res.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // ============ ADMIN - DOMAINES ============
  const addDomaine = async () => {
    if (!newDomaine.nom) {
      alert('Le nom du domaine est requis');
      return;
    }
    try {
      const headers = getAuthHeader();
      await api.post('/admin/domaines', newDomaine, { headers });
      setShowDomaineForm(false);
      setNewDomaine({ nom: '', icon: '📁' });
      loadDomaines();
      alert('✅ Domaine ajouté');
    } catch (error) {
      alert('❌ Erreur');
    }
  };

  const deleteDomaine = async (id) => {
    if (window.confirm('Supprimer ce domaine ?')) {
      try {
        const headers = getAuthHeader();
        // ✅ CORRIGÉ
        await api.delete(`/admin/domaines/${id}`, { headers });
        loadDomaines();
        alert('✅ Domaine supprimé');
      } catch (error) {
        alert('❌ Erreur');
      }
    }
  };

  // ============ ADMIN - FILIÈRES ============
  const addFiliere = async () => {
    if (!newFiliere.domaine_id || !newFiliere.nom) {
      alert('Domaine et nom requis');
      return;
    }
    try {
      const headers = getAuthHeader();
      await api.post('/admin/filieres', newFiliere, { headers });
      setShowFiliereForm(false);
      setNewFiliere({ domaine_id: '', nom: '', description: '' });
      loadAdminFilieres();
      alert('✅ Filière ajoutée');
    } catch (error) {
      alert('❌ Erreur');
    }
  };

  const deleteFiliere = async (id) => {
    if (window.confirm('Supprimer cette filière ?')) {
      try {
        const headers = getAuthHeader();
        // ✅ CORRIGÉ
        await api.delete(`/admin/filieres/${id}`, { headers });
        loadAdminFilieres();
        alert('✅ Filière supprimée');
      } catch (error) {
        alert('❌ Erreur');
      }
    }
  };

  // ============ ADMIN - METIERS ============
  const addMetier = async () => {
    if (!newMetier.nom) {
      alert('Le nom du métier est requis');
      return;
    }
    try {
      const headers = getAuthHeader();
      await api.post('/admin/metiers', {
        ...newMetier,
        filiere_id: selectedFiliere
      }, { headers });
      setShowMetierForm(false);
      setNewMetier({ nom: '', salaire: '', demande: 'Moyennement recherche', description: '' });
      loadMetiers(selectedFiliere);
      alert('✅ Métier ajouté');
    } catch (error) {
      alert('❌ Erreur');
    }
  };

  const deleteMetier = async (id) => {
    if (window.confirm('Supprimer ce métier ?')) {
      try {
        const headers = getAuthHeader();
        // ✅ CORRIGÉ
        await api.delete(`/admin/metiers/${id}`, { headers });
        loadMetiers(selectedFiliere);
        alert('✅ Métier supprimé');
      } catch (error) {
        alert('❌ Erreur');
      }
    }
  };

  // ============ ADMIN - ÉCOLES ============
  const addEcoleAdmin = async () => {
    if (!newEcoleAdmin.nom || !newEcoleAdmin.ville) {
      alert('Nom et ville requis');
      return;
    }
    try {
      const headers = getAuthHeader();
      await api.post('/admin/ecoles', newEcoleAdmin, { headers });
      setShowEcoleForm(false);
      setNewEcoleAdmin({ nom: '', ville: '', quartier: '', site_web: '', contact: '', description: '', image: '🏫' });
      loadAdminEcoles();
      alert('✅ École ajoutée');
    } catch (error) {
      alert('❌ Erreur');
    }
  };

  const deleteEcoleAdmin = async (id) => {
    if (window.confirm('Supprimer cette école ?')) {
      try {
        const headers = getAuthHeader();
        // ✅ CORRIGÉ
        await api.delete(`/admin/ecoles/${id}`, { headers });
        loadAdminEcoles();
        alert('✅ École supprimée');
      } catch (error) {
        alert('❌ Erreur');
      }
    }
  };

  // ============ IA - APPROFONDIR FILIÈRE ============
  const approfondirFiliere = async (filiereId) => {
    if (window.confirm('Lancer la recherche approfondie IA sur cette filière ?')) {
      try {
        const headers = getAuthHeader();
        // ✅ CORRIGÉ
        const res = await api.post(`/admin/filieres/${filiereId}/approfondir`, {}, { headers });
        if (res.data.success) {
          alert('✅ Recherche IA terminée ! Consulte le champ "recherche_ia" en base de données.');
          loadAdminFilieres();
        }
      } catch (error) {
        alert('❌ Erreur lors de la recherche IA');
      }
    }
  };

  // ============ ADMIN - MISE À JOUR MARCHÉ EMPLOI ============
  const updateEmploiStats = async () => {
    if (window.confirm('Lancer la mise à jour des données du marché de l\'emploi ?\nL\'IA va rechercher les dernières informations sur les métiers qui recrutent en Côte d\'Ivoire.')) {
      setUpdatingEmploi(true);
      try {
        const headers = getAuthHeader();
        const res = await api.post('/ia/update-emploi-stats', {}, { headers });
        if (res.data.success) {
          alert(`✅ ${res.data.message}`);
        }
      } catch (error) {
        alert('❌ Erreur lors de la mise à jour');
      } finally {
        setUpdatingEmploi(false);
      }
    }
  };

  // ============ CHAT IA ============
  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const headers = getAuthHeader();
      const response = await api.post('/orientation/chat',
        { message: input, niveau, historique: messages },
        { headers: { ...headers, 'Content-Type': 'application/json' } }
      );
      if (response.data.success) {
        const aiMessage = { role: 'assistant', content: response.data.response };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erreur de connexion.' }]);
    }
    setLoading(false);
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter') sendMessage(); };

  // ============ RENDU ÉLÈVE ============
  const renderEleve = () => (
    <div className="orientation-eleve">
      <div className="chat-container">
        <div className="chat-header">
          <h3>🤖 Conseiller d'Orientation</h3>
          <select value={niveau} onChange={(e) => setNiveau(e.target.value)} className="chat-niveau-select">
            {niveaux.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="welcome-chat">
              <p>👋 Salut {user?.prenom || 'cher élève'} !</p>
              <p>Parle-moi de ce que tu veux faire plus tard.</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.role}`}>
              <strong>{msg.role === 'user' ? '👤' : '🤖'}</strong>
              <p dangerouslySetInnerHTML={{ __html: formatMessageWithLinks(msg.content) }} />
            </div>
          ))}
          {loading && <div className="chat-loading">🤖 L'IA réfléchit...</div>}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Pose ta question..." disabled={loading} />
          <button onClick={sendMessage} disabled={loading}>➤</button>
        </div>
      </div>
    </div>
  );

  // ============ RENDU ADMIN ============
  const renderAdmin = () => (
    <div className="admin-gestion-container">
      <h2 className="admin-title">🛠️ Gestion ORIENTEXPRESS</h2>

      {/* Bouton Mise à jour marché de l'emploi */}
      <div className="admin-section" style={{ border: '2px solid #ff8c00' }}>
        <div className="admin-section-header">
          <h3>📊 Marché de l'emploi</h3>
          <button
            className="update-emploi-btn"
            onClick={updateEmploiStats}
            disabled={updatingEmploi}
          >
            {updatingEmploi ? '⏳ Recherche en cours...' : '🔄 Mettre à jour les données'}
          </button>
        </div>
        <p style={{ color: '#666', fontSize: '13px', margin: '5px 0 0 0' }}>
          L'IA va rechercher les métiers qui recrutent en Côte d'Ivoire et mettre à jour les salaires et la demande.
        </p>
      </div>

      {/* Gestion Domaines */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h3>📂 Domaines <span className="badge-count">{domaines.length}</span></h3>
          <button className="add-btn" onClick={() => setShowDomaineForm(!showDomaineForm)}>
            {showDomaineForm ? '✕ Fermer' : '➕ Ajouter'}
          </button>
        </div>

        {showDomaineForm && (
          <div className="admin-form">
            <input type="text" placeholder="Nom du domaine *" value={newDomaine.nom} onChange={(e) => setNewDomaine({...newDomaine, nom: e.target.value})} />
            <input type="text" placeholder="Icône (émoji)" value={newDomaine.icon} onChange={(e) => setNewDomaine({...newDomaine, icon: e.target.value})} />
            <button className="submit-btn" onClick={addDomaine}>💾 Ajouter</button>
          </div>
        )}

        <div className="admin-list">
          {domaines.length === 0 ? (
            <p className="empty-message">Aucun domaine</p>
          ) : (
            domaines.map(d => (
              <div key={d.id} className="admin-item">
                <div className="item-info">
                  <strong>{d.icon} {d.nom}</strong>
                </div>
                <div className="item-actions">
                  <button className="delete-btn" onClick={() => deleteDomaine(d.id)}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Gestion Filières */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h3>🎓 Filières <span className="badge-count">{adminFilieres.length}</span></h3>
          <button className="add-btn" onClick={() => setShowFiliereForm(!showFiliereForm)}>
            {showFiliereForm ? '✕ Fermer' : '➕ Ajouter'}
          </button>
        </div>

        {showFiliereForm && (
          <div className="admin-form">
            <select value={newFiliere.domaine_id} onChange={(e) => setNewFiliere({...newFiliere, domaine_id: e.target.value})}>
              <option value="">Choisir un domaine *</option>
              {domaines.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
            </select>
            <input type="text" placeholder="Nom de la filière *" value={newFiliere.nom} onChange={(e) => setNewFiliere({...newFiliere, nom: e.target.value})} />
            <textarea placeholder="Description" value={newFiliere.description} onChange={(e) => setNewFiliere({...newFiliere, description: e.target.value})} rows="2" />
            <button className="submit-btn" onClick={addFiliere}>💾 Ajouter</button>
          </div>
        )}

        <div className="admin-list">
          {adminFilieres.length === 0 ? (
            <p className="empty-message">Aucune filière</p>
          ) : (
            adminFilieres.map(f => (
              <div key={f.id} className="admin-item">
                <div className="item-info">
                  <strong>{f.nom}</strong>
                  <div className="sub-info">{f.domaine_nom || 'Sans domaine'} {f.recherche_ia && '🤖'}</div>
                </div>
                <div className="item-actions">
                  <button className="ia-btn" onClick={() => approfondirFiliere(f.id)}>🤖 IA</button>
                  <button className="delete-btn" onClick={() => deleteFiliere(f.id)}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Gestion Métiers */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h3>💼 Métiers <span className="badge-count">{metiers.length}</span></h3>
          <button className="add-btn" onClick={() => setShowMetierForm(!showMetierForm)}>
            {showMetierForm ? '✕ Fermer' : '➕ Ajouter'}
          </button>
        </div>

        <div className="admin-form" style={{ marginBottom: '10px' }}>
          <select value={selectedFiliere || ''} onChange={(e) => { setSelectedFiliere(e.target.value); loadMetiers(e.target.value); }}>
            <option value="">Choisir une filière pour voir ses métiers</option>
            {adminFilieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </select>
        </div>

        {showMetierForm && selectedFiliere && (
          <div className="admin-form">
            <input type="text" placeholder="Nom du métier *" value={newMetier.nom} onChange={(e) => setNewMetier({...newMetier, nom: e.target.value})} />
            <input type="text" placeholder="Salaire (ex: 350 000 - 800 000 FCFA)" value={newMetier.salaire} onChange={(e) => setNewMetier({...newMetier, salaire: e.target.value})} />
            <select value={newMetier.demande} onChange={(e) => setNewMetier({...newMetier, demande: e.target.value})}>
              <option value="Tres recherche">🔥 Très recherché</option>
              <option value="Moyennement recherche">📊 Moyennement recherché</option>
              <option value="Metier d avenir">🚀 Métier d'avenir</option>
              <option value="Peu recherche">⚠️ Peu recherché</option>
            </select>
            <button className="submit-btn" onClick={addMetier}>💾 Ajouter</button>
          </div>
        )}

        <div className="metiers-list">
          {metiers.length === 0 ? (
            <p className="empty-message">Aucun métier pour cette filière</p>
          ) : (
            metiers.map(m => (
              <div key={m.id} className="metier-item">
                <div className="metier-info">
                  <strong>{m.nom}</strong>
                  <span className="salaire">{m.salaire}</span>
                  <span className={`demande-badge ${m.demande?.toLowerCase().replace(/\s/g, '-')}`}>
                    {m.demande === 'Tres recherche' ? '🔥 Très recherché' :
                     m.demande === 'Moyennement recherche' ? '📊 Moyennement recherché' :
                     m.demande === 'Metier d avenir' ? '🚀 Métier d\'avenir' : '⚠️ Peu recherché'}
                  </span>
                </div>
                <button className="delete-small" onClick={() => deleteMetier(m.id)}>🗑️</button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Gestion Écoles */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h3>🏫 Écoles <span className="badge-count">{adminEcoles.length}</span></h3>
          <button className="add-btn" onClick={() => setShowEcoleForm(!showEcoleForm)}>
            {showEcoleForm ? '✕ Fermer' : '➕ Ajouter'}
          </button>
        </div>

        {showEcoleForm && (
          <div className="admin-form">
            <input type="text" placeholder="Nom *" value={newEcoleAdmin.nom} onChange={(e) => setNewEcoleAdmin({...newEcoleAdmin, nom: e.target.value})} />
            <input type="text" placeholder="Ville *" value={newEcoleAdmin.ville} onChange={(e) => setNewEcoleAdmin({...newEcoleAdmin, ville: e.target.value})} />
            <input type="text" placeholder="Quartier" value={newEcoleAdmin.quartier} onChange={(e) => setNewEcoleAdmin({...newEcoleAdmin, quartier: e.target.value})} />
            <input type="text" placeholder="Site web" value={newEcoleAdmin.site_web} onChange={(e) => setNewEcoleAdmin({...newEcoleAdmin, site_web: e.target.value})} />
            <input type="text" placeholder="Contact" value={newEcoleAdmin.contact} onChange={(e) => setNewEcoleAdmin({...newEcoleAdmin, contact: e.target.value})} />
            <textarea placeholder="Description" value={newEcoleAdmin.description} onChange={(e) => setNewEcoleAdmin({...newEcoleAdmin, description: e.target.value})} rows="2" />
            <button className="submit-btn" onClick={addEcoleAdmin}>💾 Ajouter</button>
          </div>
        )}

        <div className="admin-list">
          {adminEcoles.length === 0 ? (
            <p className="empty-message">Aucune école</p>
          ) : (
            adminEcoles.map(e => (
              <div key={e.id} className="admin-item">
                <div className="item-info">
                  <strong>{e.nom}</strong>
                  <div className="sub-info">📍 {e.ville} - {e.quartier || 'N/A'}</div>
                </div>
                <div className="item-actions">
                  <button className="delete-btn" onClick={() => deleteEcoleAdmin(e.id)}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // ============ MODULES ============
  const modules = [
    { id: 'chat', name: '💬 Chat IA', icon: '💬', color: '#ff8c00' },
    { id: 'emploi', name: '📊 Marché de l\'emploi', icon: '📊', color: '#2d6a4f' },
    { id: 'filieres', name: '🎓 Filières', icon: '🎓', color: '#ff8c00' }
  ];

  if (isAdmin) {
    modules.push({ id: 'admin', name: '🛠️ Gestion', icon: '🛠️', color: '#c62828' });
  }

  // ============ RENDU PRINCIPAL ============
  return (
    <div className="orientation-container">
      <div className="orientation-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>← Retour</button>
        <h1>🎯 ORIENTEXPRESS</h1>
      </div>

      <div className="sub-modules-tabs">
        {modules.map(module => (
          <button
            key={module.id}
            className={`sub-tab ${activeTab === module.id ? 'active' : ''}`}
            onClick={() => setActiveTab(module.id)}
          >
            <span className="sub-tab-icon">{module.icon}</span>
            <span>{module.name}</span>
          </button>
        ))}
      </div>

      <div className="sub-module-content">
        {activeTab === 'chat' && renderEleve()}
        {activeTab === 'emploi' && <EmploiStats onBack={() => setActiveTab('chat')} />}
        {activeTab === 'filieres' && <div className="filieres-placeholder">🎓 Page des filières à venir</div>}
        {activeTab === 'admin' && isAdmin && renderAdmin()}
      </div>
    </div>
  );
}

export default Orientation;