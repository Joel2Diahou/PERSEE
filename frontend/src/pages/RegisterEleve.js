// src/pages/RegisterEleve.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './AuthCommon.css';

function RegisterEleve() {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    matricule: '',
    classe: '6eme',
    etablissement: '',
    ville: '',
    quartier: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const classes = ['6eme', '5eme', '4eme', '3eme', 'Seconde', '1ere', 'Terminale'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register-eleve', formData);
      if (response.data.success) {
        setSuccess('✅ Inscription réussie ! Tu peux maintenant te connecter.');
        setTimeout(() => navigate('/login-eleve'), 2000);
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
        <h2>📝 Inscription Élève</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleSubmit}>
          <input type="text" name="nom" placeholder="Nom" value={formData.nom} onChange={handleChange} required />
          <input type="text" name="prenom" placeholder="Prénom" value={formData.prenom} onChange={handleChange} required />
          <input type="text" name="matricule" placeholder="Matricule" value={formData.matricule} onChange={handleChange} required />
          <select name="classe" value={formData.classe} onChange={handleChange}>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="text" name="etablissement" placeholder="Établissement" value={formData.etablissement} onChange={handleChange} required />
          <input type="text" name="ville" placeholder="Ville" value={formData.ville} onChange={handleChange} required />
          <input type="text" name="quartier" placeholder="Quartier" value={formData.quartier} onChange={handleChange} required />
          <button type="submit" disabled={loading}>{loading ? 'Inscription...' : "S'inscrire"}</button>
        </form>
        <p>Déjà inscrit ? <Link to="/login-eleve">Se connecter</Link></p>
        <p><Link to="/">← Retour à l'accueil</Link></p>
      </div>
    </div>
  );
}

export default RegisterEleve;