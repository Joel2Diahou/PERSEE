// src/pages/Register.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

function Register() {
  const navigate = useNavigate();

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <img src="/logo.png" alt="SCHOOL+ CI" className="register-logo" />
          <h1>SCHOOL+ CI</h1>
          <p>Crée ton compte gratuitement</p>
        </div>
        
        <div className="register-choices">
          <div className="register-choice" onClick={() => navigate('/register-eleve')}>
            <div className="choice-icon">👨‍🎓</div>
            <h3>Élève</h3>
            <p>Inscris-toi avec ton matricule</p>
            <button className="choice-btn eleve-btn">S'inscrire</button>
          </div>
          
          <div className="register-choice" onClick={() => navigate('/register-parent')}>
            <div className="choice-icon">👨‍👩‍👧‍👦</div>
            <h3>Parent / Tuteur</h3>
            <p>Inscris-toi avec ton email</p>
            <button className="choice-btn parent-btn">S'inscrire</button>
          </div>
        </div>
        
        <div className="register-footer">
          <p>Déjà un compte ? <span onClick={() => navigate('/login')}>Se connecter</span></p>
          <button className="back-home" onClick={() => navigate('/')}>← Retour à l'accueil</button>
        </div>
      </div>
    </div>
  );
}

export default Register;