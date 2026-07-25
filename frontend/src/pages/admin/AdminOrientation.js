// src/pages/admin/AdminOrientation.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminCrud.css';

function AdminOrientation() {
  const [activeTab, setActiveTab] = useState('ecoles');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteType, setDeleteType] = useState('');

  // États pour chaque type
  const [ecoles, setEcoles] = useState([]);
  const [domaines, setDomaines] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [metiers, setMetiers] = useState([]);

  // Formulaire
  const [formData, setFormData] = useState({});
  const [formType, setFormType] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const token = localStorage.getItem('token');
  const getAuthHeader = () => ({ Authorization: `Bearer ${token}` });

  const loadData = async () => {
    setLoading(true);
    try {
      const [e, d, f, m] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/ecoles', { headers: getAuthHeader() }),
        axios.get('http://localhost:5000/api/admin/domaines', { headers: getAuthHeader() }),
        axios.get('http://localhost:5000/api/admin/filieres', { headers: getAuthHeader() }),
        axios.get('http://localhost:5000/api/admin/metiers', { headers: getAuthHeader() })
      ]);
      setEcoles(e.data);
      setDomaines(d.data);
      setFilieres(f.data);
      setMetiers(m.data);
    } catch (error) { console.error('Erreur loadData:', error); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const openModal = (type, item = null) => {
    setFormType(type);
    setIsEditing(!!item);
    if (item) {
      setFormData(item);
    } else {
      setFormData({});
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      let url = '';
      let method = 'post';
      let data = { ...formData };

      switch (formType) {
        case 'ecole':
          url = 'http://localhost:5000/api/admin/ecoles';
          break;
        case 'domaine':
          url = 'http://localhost:5000/api/admin/domaines';
          break;
        case 'filiere':
          url = 'http://localhost:5000/api/admin/filieres';
          break;
        case 'metier':
          url = 'http://localhost:5000/api/admin/metiers';
          break;
        default: return;
      }

      if (isEditing && data.id) {
        method = 'put';
        url += `/${data.id}`;
      }

      await axios({ method, url, data, headers: getAuthHeader() });
      setShowModal(false);
      loadData();
      alert(isEditing ? '✅ Modifié avec succès' : '✅ Ajouté avec succès');
    } catch (error) {
      alert('❌ Erreur: ' + (error.response?.data?.message || error.message));
    }
  };

  const confirmDelete = (type, id) => {
    setDeleteType(type);
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    try {
      let url = '';
      switch (deleteType) {
        case 'ecole': url = `http://localhost:5000/api/admin/ecoles/${deleteId}`; break;
        case 'domaine': url = `http://localhost:5000/api/admin/domaines/${deleteId}`; break;
        case 'filiere': url = `http://localhost:5000/api/admin/filieres/${deleteId}`; break;
        case 'metier': url = `http://localhost:5000/api/admin/metiers/${deleteId}`; break;
        default: return;
      }
      await axios.delete(url, { headers: getAuthHeader() });
      setShowDeleteConfirm(false);
      loadData();
      alert('✅ Supprimé avec succès');
    } catch (error) {
      alert('❌ Erreur: ' + (error.response?.data?.message || error.message));
    }
  };

  const tabs = [
    { id: 'ecoles', name: '🏫 Écoles' },
    { id: 'domaines', name: '📂 Domaines' },
    { id: 'filieres', name: '🎓 Filières' },
    { id: 'metiers', name: '💼 Métiers' }
  ];

  const getDomaineNom = (id) => {
    const d = domaines.find(item => item.id === id);
    return d ? d.nom : 'Non défini';
  };

  const getFiliereNom = (id) => {
    const f = filieres.find(item => item.id === id);
    return f ? f.nom : 'Non défini';
  };

  const renderItems = (items, type) => {
    if (items.length === 0) return <p className="empty">Aucun élément</p>;

    return (
      <div className="crud-grid">
        {items.map(item => (
          <div key={item.id} className="crud-card">
            <div className="crud-card-header">
              <span className="crud-icon">
                {type === 'ecole' && '🏫'}
                {type === 'domaine' && (item.icon || '📂')}
                {type === 'filiere' && '🎓'}
                {type === 'metier' && '💼'}
              </span>
              <h3>{item.nom}</h3>
            </div>
            <div className="crud-card-body">
              {type === 'ecole' && (
                <>
                  <p>📍 {item.ville} {item.quartier ? `- ${item.quartier}` : ''}</p>
                  <p>🎓 {item.filieres || 'Toutes'}</p>
                  {item.contact && <p>📞 {item.contact}</p>}
                </>
              )}
              {type === 'domaine' && (
                <p>🖼️ {item.icon || '📁'}</p>
              )}
              {type === 'filiere' && (
                <>
                  <p>📂 {getDomaineNom(item.domaine_id)}</p>
                  {item.description && <p className="description">{item.description}</p>}
                </>
              )}
              {type === 'metier' && (
                <>
                  <p>🎓 {getFiliereNom(item.filiere_id)}</p>
                  <p>💰 {item.salaire || 'Non renseigné'}</p>
                  {item.description && <p className="description">{item.description}</p>}
                </>
              )}
            </div>
            <div className="crud-card-actions">
              <button className="edit-btn" onClick={() => openModal(type, item)}>✏️</button>
              <button className="delete-btn" onClick={() => confirmDelete(type, item.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getModalFields = () => {
    switch (formType) {
      case 'ecole':
        return (
          <>
            <input type="text" placeholder="Nom *" value={formData.nom || ''} onChange={(e) => setFormData({...formData, nom: e.target.value})} />
            <input type="text" placeholder="Ville *" value={formData.ville || ''} onChange={(e) => setFormData({...formData, ville: e.target.value})} />
            <input type="text" placeholder="Quartier" value={formData.quartier || ''} onChange={(e) => setFormData({...formData, quartier: e.target.value})} />
            <input type="text" placeholder="Filières" value={formData.filieres || ''} onChange={(e) => setFormData({...formData, filieres: e.target.value})} />
            <input type="text" placeholder="Contact" value={formData.contact || ''} onChange={(e) => setFormData({...formData, contact: e.target.value})} />
          </>
        );
      case 'domaine':
        return (
          <>
            <input type="text" placeholder="Nom *" value={formData.nom || ''} onChange={(e) => setFormData({...formData, nom: e.target.value})} />
            <input type="text" placeholder="Icon (ex: 🔬)" value={formData.icon || '📁'} onChange={(e) => setFormData({...formData, icon: e.target.value})} />
          </>
        );
      case 'filiere':
        return (
          <>
            <select value={formData.domaine_id || ''} onChange={(e) => setFormData({...formData, domaine_id: e.target.value})}>
              <option value="">Choisir un domaine *</option>
              {domaines.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
            </select>
            <input type="text" placeholder="Nom *" value={formData.nom || ''} onChange={(e) => setFormData({...formData, nom: e.target.value})} />
            <input type="text" placeholder="Description" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </>
        );
      case 'metier':
        return (
          <>
            <select value={formData.filiere_id || ''} onChange={(e) => setFormData({...formData, filiere_id: e.target.value})}>
              <option value="">Choisir une filière *</option>
              {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
            <input type="text" placeholder="Nom *" value={formData.nom || ''} onChange={(e) => setFormData({...formData, nom: e.target.value})} />
            <input type="text" placeholder="Salaire" value={formData.salaire || ''} onChange={(e) => setFormData({...formData, salaire: e.target.value})} />
            <input type="text" placeholder="Demande (élevée/moyenne/faible)" value={formData.demande || ''} onChange={(e) => setFormData({...formData, demande: e.target.value})} />
            <input type="text" placeholder="Description" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </>
        );
      default: return null;
    }
  };

  const getModalTitle = () => {
    const titles = {
      ecole: '🏫 École',
      domaine: '📂 Domaine',
      filiere: '🎓 Filière',
      metier: '💼 Métier'
    };
    return `${isEditing ? '✏️ Modifier' : '➕ Ajouter'} ${titles[formType] || ''}`;
  };

  return (
    <div className="admin-module">
      <div className="module-header">
        <h2>🎯 ORIENTEXPRESS - Gestion</h2>
        <button className="add-btn" onClick={() => openModal(activeTab.slice(0, -1))}>➕ Ajouter</button>
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
          {activeTab === 'ecoles' && renderItems(ecoles, 'ecole')}
          {activeTab === 'domaines' && renderItems(domaines, 'domaine')}
          {activeTab === 'filieres' && renderItems(filieres, 'filiere')}
          {activeTab === 'metiers' && renderItems(metiers, 'metier')}
        </>
      )}

      {/* Modal Ajout/Modification */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{getModalTitle()}</h2>
            {getModalFields()}
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
            <p>Êtes-vous sûr de vouloir supprimer définitivement cet élément ?</p>
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

export default AdminOrientation;