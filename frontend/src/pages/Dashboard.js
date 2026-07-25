// src/pages/Dashboard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import EducIA from '../components/EducIA';

function Dashboard() {
  const navigate = useNavigate();
  
  const eleve = JSON.parse(localStorage.getItem('eleve') || '{}');
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUser = eleve.nom ? eleve : userData;
  const estTuteur = currentUser.role === 'tuteur' || currentUser.est_tuteur === 1;

  const modules = [
    { name: '🎯 ORIENTEXPRESS', icon: '🎯', desc: 'Découvre ta voie (Filières,Écoles)', path: '/orientation', color: '#ff8c00' },
    { name: '⚡ PRÉPAFLASH', icon: '⚡', desc: 'Révise avec des quiz chronométrés', path: '/prepa', color: '#4ecdc4' },
    { name: '📚 PASSLIVRE', icon: '📚', desc: 'Échange des livres gratuitement', path: '/bookmatch', color: '#45b7d1' },
    { name: '👨‍🏫 TUTEUREXPRESS', icon: '👨‍🏫', desc: 'Trouve un tuteur ou deviens-en un', path: '/tutorat', color: '#96ceb4' }
  ];

  // ===== DÉCONNEXION =====
  const handleLogout = () => {
    localStorage.clear(); // Supprime TOUTES les données
    navigate('/');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>📚 PERSEE</h1>
        <div className="user-info">
          <span>👋 {currentUser.prenom || currentUser.nom || 'Utilisateur'}</span>
          <span className="role-badge">{estTuteur ? '👨‍🏫 Tuteur' : '👨‍🎓 Élève'}</span>
          <button onClick={handleLogout} className="logout-btn">Déconnexion</button>
        </div>
      </header>

      <div className="user-badge">
        <div className="badge-card">
          <span className="badge-icon">📖</span>
          <div>
            {currentUser.classe && <p>Niveau : <strong>{currentUser.classe}</strong></p>}
            {currentUser.niveau && <p>Niveau : <strong>{currentUser.niveau}</strong></p>}
            {currentUser.etablissement && <p>Établissement : <strong>{currentUser.etablissement}</strong></p>}
            {currentUser.ville && <p>Ville : <strong>{currentUser.ville}</strong></p>}
          </div>
        </div>
      </div>

      <div className="modules-grid">
        {modules.map((module, index) => (
          <div 
            key={index}
            className="module-card"
            style={{ borderTop: `4px solid ${module.color}` }}
            onClick={() => navigate(module.path)}
          >
            <div className="module-icon">{module.icon}</div>
            <h3>{module.name}</h3>
            <p>{module.desc}</p>
          </div>
        ))}
      </div>

      <EducIA user={currentUser} />
    </div>
  );
}

export default Dashboard;