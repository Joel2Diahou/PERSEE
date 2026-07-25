// src/pages/admin/AdminCompte.js
import React, { useState } from 'react';
import axios from 'axios';
import './AdminCrud.css';
import api from '../../services/api';

function AdminCompte() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const getAuthHeader = () => ({ Authorization: `Bearer ${token}` });

  const [formData, setFormData] = useState({
    email: user.email || '',
    telephone: user.telephone || '',
    ancienMotDePasse: '',
    nouveauMotDePasse: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.put('/admin/compte', formData, { headers: getAuthHeader() });
      const updatedUser = { ...user, email: formData.email, telephone: formData.telephone };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      alert('✅ Compte mis à jour');
      setFormData({ ...formData, ancienMotDePasse: '', nouveauMotDePasse: '' });
    } catch (error) {
      alert('❌ ' + (error.response?.data?.message || 'Erreur'));
    } finally { setLoading(false); }
  };

  return (
    <div className="admin-module">
      <div className="module-header">
        <h2>⚙️ Mon compte</h2>
      </div>

      <div className="compte-container">
        <div className="compte-card">
          <div className="compte-info">
            <p><strong>👤 Nom :</strong> {user.prenom} {user.nom}</p>
            <p><strong>👑 Rôle :</strong> Administrateur</p>
          </div>
        </div>

        <div className="compte-form">
          <h3>✏️ Modifier mes informations</h3>
          <div className="form-group">
            <label>📧 Email</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="form-group">
            <label>📱 Téléphone</label>
            <input type="text" value={formData.telephone} onChange={(e) => setFormData({...formData, telephone: e.target.value})} />
          </div>
          <div className="form-group">
            <label>🔒 Ancien mot de passe</label>
            <input type="password" placeholder="Laissez vide si inchangé" value={formData.ancienMotDePasse} onChange={(e) => setFormData({...formData, ancienMotDePasse: e.target.value})} />
          </div>
          <div className="form-group">
            <label>🔑 Nouveau mot de passe</label>
            <input type="password" placeholder="Laissez vide si inchangé" value={formData.nouveauMotDePasse} onChange={(e) => setFormData({...formData, nouveauMotDePasse: e.target.value})} />
          </div>
          <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? '⏳ Enregistrement...' : '💾 Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminCompte;