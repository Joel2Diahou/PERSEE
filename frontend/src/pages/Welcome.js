// src/pages/Welcome.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Welcome.css';

function Welcome() {
  const navigate = useNavigate();

  // Vérifier si déjà connecté
  const token = localStorage.getItem('token');
  if (token) {
    // Rediriger selon le rôle
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload?.role || 'eleve';
      if (role === 'admin') navigate('/admin');
      else if (role === 'tuteur') navigate('/dashboard-tuteur');
      else if (role === 'parent') navigate('/dashboard-parent');
      else navigate('/dashboard-eleve');
    } catch {
      // Si token invalide, rester sur la page
    }
  }

  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <div className="welcome-logo">
          <span className="logo-icon">📚</span>
          <h1>SCHOOL+ CI</h1>
          <p>Plateforme Éducative Ivoirienne</p>
        </div>

        <div className="choices">
          {/* ===== ÉLÈVE ===== */}
          <div className="choice-card" onClick={() => navigate('/login-eleve')}>
            <div className="choice-icon">👨‍🎓</div>
            <h2>Élève</h2>
            <p>Connecte-toi avec ton matricule</p>
            <button className="btn-eleve" onClick={(e) => { e.stopPropagation(); navigate('/login-eleve'); }}>
              Se connecter
            </button>
            <button className="btn-inscrit" onClick={(e) => { e.stopPropagation(); navigate('/register-eleve'); }}>
              S'inscrire
            </button>
          </div>

          {/* ===== PARENT ===== */}
          <div className="choice-card" onClick={() => navigate('/login-parent')}>
            <div className="choice-icon">👨‍👩‍👧‍👦</div>
            <h2>Parent</h2>
            <p>Suis les performances de tes enfants</p>
            <button className="btn-parent" onClick={(e) => { e.stopPropagation(); navigate('/login-parent'); }}>
              Se connecter
            </button>
            <button className="btn-inscrit" onClick={(e) => { e.stopPropagation(); navigate('/register-parent'); }}>
              S'inscrire
            </button>
          </div>

          {/* ===== TUTEUR ===== */}
          <div className="choice-card" onClick={() => navigate('/login-tuteur')}>
            <div className="choice-icon">👨‍🏫</div>
            <h2>Tuteur</h2>
            <p>Aide les élèves en difficulté</p>
            <button className="btn-tuteur" onClick={(e) => { e.stopPropagation(); navigate('/login-tuteur'); }}>
              Se connecter
            </button>
            <button className="btn-inscrit" onClick={(e) => { e.stopPropagation(); navigate('/register-tuteur'); }}>
              S'inscrire
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;