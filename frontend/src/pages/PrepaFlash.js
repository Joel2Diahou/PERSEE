// src/pages/PrepaFlash.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PrepaFlash.css';

import QuizPrepa from './prepa/QuizPrepa';
import CoursAdmin from './prepa/CoursAdmin';
import ProposerSujet from './prepa/ProposerSujet';

function PrepaFlash() {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showProposer, setShowProposer] = useState(false);

  const eleve = JSON.parse(localStorage.getItem('eleve') || '{}');
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUser = eleve.nom ? eleve : userData;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const matricule = localStorage.getItem('matricule');
    if (token || matricule) {
      setIsAuthenticated(true);
    }
    if (eleve.nom) {
      setUser(eleve);
    }
  }, []);

  const modules = [
    { id: 'cours', name: '📚 MES COURS', icon: '📚', desc: 'Consulte les leçons préparées par l\'admin', color: '#ff8c00' },
    { id: 'quiz', name: '🎯 ENTRAÎNEMENT', icon: '🎯', desc: 'Quiz chronométrés et examens blancs', color: '#2d6a4f' }
  ];

  const renderModule = () => {
    switch (activeModule) {
      case 'cours':
        return <CoursAdmin user={currentUser} onBack={() => setActiveModule(null)} />;
      case 'quiz':
        return <QuizPrepa user={currentUser} onBack={() => setActiveModule(null)} />;
      default:
        return null;
    }
  };

  const goToRapport = () => {
    alert('📊 Mon Rapport - Bientôt disponible');
  };

  if (!isAuthenticated) {
    return (
      <div className="prepa-container">
        <div className="prepa-header">
          <button className="back-btn" onClick={() => navigate('/')}>← Retour</button>
          <h1>⚡ PRÉPAFLASH</h1>
        </div>
        <div className="error-message">
          🔒 Veuillez vous connecter pour accéder aux quiz.
          <button onClick={() => navigate('/login-user')}>Se connecter</button>
        </div>
      </div>
    );
  }

  if (activeModule) {
    return (
      <div className="prepa-container">
        {renderModule()}
      </div>
    );
  }

  if (showProposer) {
    return (
      <div className="prepa-container">
        <ProposerSujet 
          user={currentUser} 
          onBack={() => setShowProposer(false)} 
        />
      </div>
    );
  }

  return (
    <div className="prepa-container">
      <div className="prepa-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>← Retour</button>
        <h1>⚡ PRÉPAFLASH</h1>
        <div className="header-actions">
          <button className="proposer-btn" onClick={() => setShowProposer(true)}>
            📤 Proposer un sujet
          </button>
          <button className="stats-btn" onClick={goToRapport}>📊 Mon rapport</button>
        </div>
      </div>

      <div className="prepa-content">
        <div className="modules-grid-center">
          {modules.map((module, index) => (
            <div 
              key={index}
              className="module-card-center"
              style={{ borderTop: `4px solid ${module.color}` }}
              onClick={() => setActiveModule(module.id)}
            >
              <div className="module-icon-center">{module.icon}</div>
              <h3>{module.name}</h3>
              <p>{module.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PrepaFlash;