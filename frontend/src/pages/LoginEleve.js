// src/pages/LoginEleve.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './AuthCommon.css';

function LoginEleve() {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    matricule: ''
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
      const response = await axios.post('http://localhost:5000/api/auth/login-eleve', {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        matricule: formData.matricule.trim()
      });

      console.log('📥 Réponse login:', response.data);

      if (response.data.success) {
        // ✅ Sauvegarder le token
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        
        // ✅ Sauvegarder l'élève
        if (response.data.eleve) {
          localStorage.setItem('eleve', JSON.stringify(response.data.eleve));
        }
        
        // ✅ Rediriger vers le dashboard élève
        navigate('/dashboard-eleve');
      } else {
        setError(response.data.message || 'Erreur de connexion');
      }
    } catch (err) {
      console.error('❌ Erreur:', err);
      if (err.response) {
        setError(err.response.data?.message || 'Matricule incorrect');
      } else if (err.request) {
        setError('Impossible de contacter le serveur.');
      } else {
        setError('Erreur lors de la connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>📚 PERSEE</h1>
        <h2>👨‍🎓 Connexion Élève</h2>
        <p className="auth-subtitle">Utilise ton matricule scolaire</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="nom"
            placeholder="Nom"
            value={formData.nom}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="prenom"
            placeholder="Prénom"
            value={formData.prenom}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="matricule"
            placeholder="Matricule"
            value={formData.matricule}
            onChange={handleChange}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Connexion...' : '🔓 Se connecter'}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            Pas encore inscrit ? <Link to="/register-eleve">S'inscrire</Link>
          </p>
          <p>
            <Link to="/">← Retour à l'accueil</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginEleve;