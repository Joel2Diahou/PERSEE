// src/pages/RegisterParent.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';  // ✅ SEULEMENT api
import './AuthCommon.css';

function RegisterParent() {
  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', password: '', profession: '', telephone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/auth/register-user', {
        ...formData,
        role: 'parent'
      });

      if (response.data.success) {
        setSuccess('✅ Inscription réussie en tant que Parent !');
        setTimeout(() => navigate('/login-parent'), 2000);
      }
    } catch (err) {
      console.error('❌ Erreur:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <h1>📚 PERSEE</h1>
        <h2>👨‍👩‍👧‍👦 Inscription Parent</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <input type="text" name="nom" placeholder="Nom" value={formData.nom} onChange={handleChange} required />
            <input type="text" name="prenom" placeholder="Prénom" value={formData.prenom} onChange={handleChange} required />
          </div>
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          <input type="password" name="password" placeholder="Mot de passe" value={formData.password} onChange={handleChange} required />
          <input type="text" name="profession" placeholder="Profession (optionnel)" value={formData.profession} onChange={handleChange} />
          <input type="tel" name="telephone" placeholder="Téléphone" value={formData.telephone} onChange={handleChange} required />
          <button type="submit" disabled={loading}>
            {loading ? 'Inscription...' : "📝 S'inscrire"}
          </button>
        </form>
        <div className="auth-links">
          <p>Déjà inscrit ? <Link to="/login-parent">Se connecter</Link></p>
          <p><Link to="/login-choice">← Changer de rôle</Link></p>
        </div>
      </div>
    </div>
  );
}

export default RegisterParent;