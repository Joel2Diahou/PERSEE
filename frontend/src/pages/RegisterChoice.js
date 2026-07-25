// src/pages/RegisterChoice.js
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './RegisterChoice.css';

function RegisterChoice() {
  const navigate = useNavigate();

  const handleRegister = (role) => {
    if (role === 'eleve') {
      navigate('/register-eleve');
    } else if (role === 'parent') {
      navigate('/register-parent');
    } else if (role === 'tuteur') {
      navigate('/register-tuteur');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card choice-card">
        <div className="choice-header">
          <img src="/logo.png" alt="PERSEE" className="choice-logo" />
          <h1>PERSEE</h1>
          <p className="choice-subtitle">Créez votre compte gratuitement</p>
        </div>

        <div className="choice-grid">
          {/* ===== ÉLÈVE ===== */}
          <div className="choice-option">
            <div className="choice-icon">👨‍🎓</div>
            <h3>Élève</h3>
            <p>Inscris-toi avec ton matricule</p>
            <button className="choice-btn eleve-btn" onClick={() => handleRegister('eleve')}>
              S'inscrire
            </button>
          </div>

          {/* ===== PARENT ===== */}
          <div className="choice-option">
            <div className="choice-icon">👨‍👩‍👧‍👦</div>
            <h3>Parent</h3>
            <p>Inscris-toi avec ton email</p>
            <button className="choice-btn parent-btn" onClick={() => handleRegister('parent')}>
              S'inscrire
            </button>
          </div>

          {/* ===== TUTEUR ===== */}
          <div className="choice-option">
            <div className="choice-icon">👨‍🏫</div>
            <h3>Tuteur</h3>
            <p>Inscris-toi avec ton email</p>
            <button className="choice-btn tuteur-btn" onClick={() => handleRegister('tuteur')}>
              S'inscrire
            </button>
          </div>
        </div>

        <div className="choice-footer">
          <p>
            Déjà un compte ? <Link to="/login-choice">Se connecter</Link>
          </p>
          <p>
            <Link to="/">← Retour à l'accueil</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterChoice;