// src/pages/RegisterUser.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './AuthCommon.css';
import api from '../services/api';

function RegisterUser() {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    profession: '',
    telephone: '',
    role: 'parent' // Par défaut: parent
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ===== LES DEUX RÔLES DISPONIBLES À L'INSCRIPTION =====
  const roles = [
    { value: 'parent', label: '👨‍👩‍👧‍👦 Parent', description: 'Suivre les performances de vos enfants' },
    { value: 'tuteur', label: '👨‍🏫 Tuteur', description: 'Aider les élèves en difficulté' }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role: role });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Envoyer le rôle dans la requête
      const response = await api.post('/auth/register-user', {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        password: formData.password,
        profession: formData.profession || '',
        telephone: formData.telephone,
        role: formData.role // 'parent' ou 'tuteur'
      });

      if (response.data.success) {
        setSuccess(`✅ Inscription réussie en tant que ${formData.role === 'parent' ? 'Parent' : 'Tuteur'} !`);
        setTimeout(() => navigate('/login-user'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <h1>📚 PERSEE</h1>
        <h2>📝 Inscription</h2>
        <p className="auth-subtitle">Parent ou Tuteur</p>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <input
                type="text"
                name="nom"
                placeholder="Nom"
                value={formData.nom}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                name="prenom"
                placeholder="Prénom"
                value={formData.prenom}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Mot de passe"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="profession"
            placeholder="Profession (optionnel)"
            value={formData.profession}
            onChange={handleChange}
          />

          <input
            type="tel"
            name="telephone"
            placeholder="Téléphone"
            value={formData.telephone}
            onChange={handleChange}
            required
          />

          {/* ===== SÉLECTION DU RÔLE ===== */}
          <div className="role-selector">
            <label>📌 Je m'inscris en tant que :</label>
            <div className="role-options">
              {roles.map(role => (
                <button
                  key={role.value}
                  type="button"
                  className={`role-btn ${formData.role === role.value ? 'active' : ''}`}
                  onClick={() => handleRoleSelect(role.value)}
                >
                  <span className="role-icon">{role.label}</span>
                  <span className="role-desc">{role.description}</span>
                  {formData.role === role.value && <span className="role-check">✅</span>}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Inscription...' : "📝 S'inscrire"}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            Déjà inscrit ? <Link to="/login-user">Se connecter</Link>
          </p>
          <p>
            <Link to="/">← Retour à l'accueil</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterUser;