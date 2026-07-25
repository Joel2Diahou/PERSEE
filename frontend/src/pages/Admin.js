// src/pages/Admin.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Admin.css';

// Import des modules admin (les CSS sont dans leurs propres fichiers)
import AdminDashboard from './admin/AdminDashboard';
import AdminOrientation from './admin/AdminOrientation';
import AdminPrepaFlash from './admin/AdminPrepaFlash';
import AdminBookMatch from './admin/AdminBookMatch';
import AdminTutoreExpress from './admin/AdminTutoreExpress';
import AdminSettings from './admin/AdminSettings';

function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState({});

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const getAuthHeader = () => ({ Authorization: `Bearer ${token}` });

  useEffect(() => {
    if (user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const loadStats = async () => {
    try {
      const endpoints = ['eleves', 'users', 'quiz', 'ecoles', 'lecons', 'annonces', 'tuteurs', 'sessions', 'domaines', 'filieres', 'metiers'];
      const results = await Promise.all(
        endpoints.map(async (endpoint) => {
          try {
            const res = await axios.get(`http://localhost:5000/api/admin/stats/${endpoint}`, { headers: getAuthHeader() });
            return { [endpoint]: res.data.count || 0 };
          } catch { return { [endpoint]: 0 }; }
        })
      );
      setStats(Object.assign({}, ...results));
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // ===== DÉCONNEXION CORRIGÉE =====
  const handleLogout = () => {
    localStorage.clear(); // Supprime TOUTES les données
    navigate('/');
  };

  // ===== MODULES ADMIN =====
  const modules = [
    { id: 'dashboard', name: '📊 Dashboard', icon: '📊', color: '#2d6a4f' },
    { id: 'orientexpress', name: '🎯 ORIENTEXPRESS', icon: '🎯', color: '#ff6b6b' },
    { id: 'prepaflash', name: '⚡ PRÉPAFLASH', icon: '⚡', color: '#4ecdc4' },
    { id: 'bookmatch', name: '📚 BOOKMATCH', icon: '📚', color: '#45b7d1' },
    { id: 'tuteurexpress', name: '👨‍🏫 TUTEUREXPRESS', icon: '👨‍🏫', color: '#96ceb4' }
  ];

  return (
    <div className="admin-container">
      {/* HEADER */}
      <header className="admin-header">
        <div className="admin-header-left">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>← Retour</button>
          <h1>👑 Administration</h1>
        </div>
        <div className="admin-header-right">
          <span className="admin-user">👤 {user.prenom} {user.nom}</span>
          <button className="settings-btn" onClick={() => setShowSettings(!showSettings)}>
            ⚙️
          </button>
          <button className="admin-logout-btn" onClick={handleLogout}>🚪 Déconnexion</button>
        </div>
      </header>

      {/* Menu Paramètres */}
      {showSettings && (
        <div className="settings-dropdown">
          <AdminSettings onClose={() => setShowSettings(false)} />
        </div>
      )}

      {/* MODULES */}
      <div className="admin-modules">
        {modules.map(module => (
          <div 
            key={module.id}
            className={`admin-module-card ${activeTab === module.id ? 'active' : ''}`}
            style={{ borderTop: `4px solid ${module.color}` }}
            onClick={() => setActiveTab(module.id)}
          >
            <div className="admin-module-icon">{module.icon}</div>
            <h3>{module.name}</h3>
          </div>
        ))}
      </div>

      {/* CONTENU */}
      <div className="admin-content">
        {activeTab === 'dashboard' && <AdminDashboard stats={stats} loadStats={loadStats} />}
        {activeTab === 'orientexpress' && <AdminOrientation />}
        {activeTab === 'prepaflash' && <AdminPrepaFlash />}
        {activeTab === 'bookmatch' && <AdminBookMatch />}
        {activeTab === 'tuteurexpress' && <AdminTutoreExpress />}
      </div>
    </div>
  );
}

export default Admin;