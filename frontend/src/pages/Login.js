// src/pages/Login.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/logo.png" alt="SCHOOL+ CI" className="login-logo" />
          <h1>SCHOOL+ CI</h1>
          <p>Connecte-toi à ton espace</p>
        </div>
        
        <div className="login-choices">
          <div className="login-choice" onClick={() => navigate('/login-eleve')}>
            <div className="choice-icon">👨‍🎓</div>
            <h3>Élève</h3>
            <p>Connecte-toi avec ton matricule</p>
            <button className="choice-btn eleve-btn">Se connecter</button>
          </div>
          
          <div className="login-choice" onClick={() => navigate('/login-parent')}>
            <div className="choice-icon">👨‍👩‍👧‍👦</div>
            <h3>Parent / Tuteur</h3>
            <p>Connecte-toi avec ton email</p>
            <button className="choice-btn parent-btn">Se connecter</button>
          </div>
        </div>
        
        <div className="login-footer">
          <p>Pas encore de compte ? <span onClick={() => navigate('/register')}>S'inscrire</span></p>
          <button className="back-home" onClick={() => navigate('/')}>← Retour à l'accueil</button>
        </div>
      </div>
    </div>
  );
}

export default Login;