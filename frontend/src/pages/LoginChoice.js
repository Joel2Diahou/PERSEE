// src/pages/LoginChoice.js
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './LoginChoice.css';

function LoginChoice() {
  const navigate = useNavigate();

  const handleLogin = (role) => {
    if (role === 'eleve') {
      navigate('/login-eleve');
    } else if (role === 'parent') {
      navigate('/login-parent');
    } else if (role === 'tuteur') {
      navigate('/login-tuteur');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card choice-card">
        <div className="choice-header">
          <img src="/logo.png" alt="PERSEE" className="choice-logo" />
          <h1>PERSEE</h1>
          <p className="choice-subtitle">Connectez-vous à votre espace</p>
        </div>

        <div className="choice-grid">
          {/* ===== ÉLÈVE ===== */}
          <div className="choice-option">
            <div className="choice-icon">👨‍🎓</div>
            <h3>Élève</h3>
            <p>Connecte-toi avec ton matricule</p>
            <button className="choice-btn eleve-btn" onClick={() => handleLogin('eleve')}>
              Se connecter
            </button>
          </div>

          {/* ===== PARENT ===== */}
          <div className="choice-option">
            <div className="choice-icon">👨‍👩‍👧‍👦</div>
            <h3>Parent</h3>
            <p>Connecte-toi avec ton email</p>
            <button className="choice-btn parent-btn" onClick={() => handleLogin('parent')}>
              Se connecter
            </button>
          </div>

          {/* ===== TUTEUR ===== */}
          <div className="choice-option">
            <div className="choice-icon">👨‍🏫</div>
            <h3>Tuteur</h3>
            <p>Connecte-toi avec ton email</p>
            <button className="choice-btn tuteur-btn" onClick={() => handleLogin('tuteur')}>
              Se connecter
            </button>
          </div>
        </div>

        <div className="choice-footer">
          <p>
            Pas encore de compte ? <Link to="/register-choice">S'inscrire</Link>
          </p>
          <p>
            <Link to="/">← Retour à l'accueil</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginChoice;