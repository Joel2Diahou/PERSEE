// src/pages/Home.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const navigate = useNavigate();

  // Vérifier si déjà connecté
  const token = localStorage.getItem('token');
  if (token) {
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
    <div className="home-container">
      {/* ===== HEADER ===== */}
      <header className="home-header">
        <div className="logo-container">
          <img src="/logo.png" alt="PERSEE" className="logo-image" />
          <span className="logo-text">PERSEE</span>
        </div>
        <div className="header-buttons">
          <button className="btn-login" onClick={() => navigate('/login-choice')}>
            Se connecter
          </button>
          <button className="btn-register" onClick={() => navigate('/register-choice')}>
            S'inscrire
          </button>
        </div>
      </header>

      {/* ===== SECTION HERO ===== */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>📚 L'éducation ivoirienne réinventée</h1>
          <p className="hero-subtitle">
            Orientation, quiz, échange de livres et tutorat<br />
            Tout ce dont tu as besoin pour réussir
          </p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => navigate('/login-choice')}>
              🚀 Commencer maintenant
            </button>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-number">6+</span>
            <span className="stat-label">Modules éducatifs</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">100+</span>
            <span className="stat-label">Quiz disponibles</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Assistance IA</span>
          </div>
        </div>
      </section>

      {/* ===== SECTION FONCTIONNALITÉS (supprimée la vidéo) ===== */}
      <section className="features-section">
        <h2>✨ Pourquoi PERSEE ?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Orientation intelligente</h3>
            <p>Découvre les filières et métiers adaptés à tes aptitudes grâce à l'IA.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Quiz interactifs</h3>
            <p>Révise avec des quiz chronométrés et prépare-toi aux examens.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Échange de livres</h3>
            <p>Donne, prête ou échange des livres avec d'autres élèves.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👨‍🏫</div>
            <h3>Tutorat en ligne</h3>
            <p>Trouve un tuteur ou deviens-en un pour aider les autres.</p>
          </div>
        </div>
      </section>

      {/* ===== SECTION CTA ===== */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Prêt à révolutionner ton apprentissage ?</h2>
          <p>Rejoins des milliers d'élèves ivoiriens sur PERSEE</p>
          <button className="btn-cta" onClick={() => navigate('/register-choice')}>
            Créer un compte gratuitement
          </button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <img src="/logo.png" alt="PERSEE" className="footer-logo-image" />
            <span>PERSEE</span>
          </div>
          <div className="footer-links">
            <a href="#">À propos</a>
            <a href="#">Contact</a>
            <a href="#">Mentions légales</a>
          </div>
          <p className="footer-copy">© 2026 PERSEE - Plateforme Éducative Ivoirienne</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;