// src/pages/LoginUser.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './AuthCommon.css';
import api from '../services/api';

function LoginUser() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ✅ NE PAS FORCER LE RÔLE
      const response = await api.post('/auth/login-user', {
        email: formData.email.trim(),
        password: formData.password
      });

      console.log('📥 Réponse login:', response.data);

      if (response.data.success) {
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        // 🔴 REDIRECTION SELON LE RÔLE
        const role = response.data.user?.role || 'parent';
        
        switch(role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'tuteur':
            navigate('/dashboard-tuteur');
            break;
          case 'parent':
            navigate('/dashboard-parent');
            break;
          default:
            navigate('/dashboard-eleve');
        }
      } else {
        setError(response.data.message || 'Erreur de connexion');
      }
    } catch (err) {
      console.error('❌ Erreur:', err);
      if (err.response) {
        setError(err.response.data?.message || 'Email ou mot de passe incorrect');
      } else {
        setError('Impossible de contacter le serveur.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>📚 PERSEE</h1>
        <h2>🔐 Connexion</h2>
        <p className="auth-subtitle">Parent • Tuteur • Admin</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
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
          <button type="submit" disabled={loading}>
            {loading ? 'Connexion...' : '🔓 Se connecter'}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            Pas encore de compte ? <Link to="/register-user">S'inscrire</Link>
          </p>
          <p>
            <Link to="/">← Retour à l'accueil</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginUser;