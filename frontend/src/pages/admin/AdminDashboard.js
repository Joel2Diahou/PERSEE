// src/pages/admin/AdminDashboard.js
import React, { useState } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

function AdminDashboard({ stats, loadStats }) {
  const [updating, setUpdating] = useState(false);

  const token = localStorage.getItem('token');
  const getAuthHeader = () => ({ Authorization: `Bearer ${token}` });

  const updateEmploi = async () => {
    if (!window.confirm('Lancer la mise à jour des données du marché de l\'emploi ?')) return;
    setUpdating(true);
    try {
      const res = await axios.post('http://localhost:5000/api/ia/update-emploi-stats', {}, { headers: getAuthHeader() });
      alert(res.data.success ? `✅ ${res.data.message}` : '❌ Erreur');
      if (res.data.success) loadStats();
    } catch (error) { alert('❌ Erreur'); } finally { setUpdating(false); }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>📊 Tableau de bord</h2>
        <span className="dashboard-date">📅 {new Date().toLocaleDateString()}</span>
      </div>

      {/* Cartes résumé */}
      <div className="summary-cards">
        <div className="summary-card eleves">
          <div className="summary-icon">👨‍🎓</div>
          <div className="summary-info">
            <span className="summary-number">{stats.eleves || 0}</span>
            <span className="summary-label">Élèves</span>
          </div>
        </div>
        <div className="summary-card users">
          <div className="summary-icon">👤</div>
          <div className="summary-info">
            <span className="summary-number">{stats.users || 0}</span>
            <span className="summary-label">Utilisateurs</span>
          </div>
        </div>
        <div className="summary-card tuteurs">
          <div className="summary-icon">👨‍🏫</div>
          <div className="summary-info">
            <span className="summary-number">{stats.tuteurs || 0}</span>
            <span className="summary-label">Tuteurs</span>
          </div>
        </div>
        <div className="summary-card sessions">
          <div className="summary-icon">📊</div>
          <div className="summary-info">
            <span className="summary-number">{stats.sessions || 0}</span>
            <span className="summary-label">Sessions</span>
          </div>
        </div>
        <div className="summary-card quiz">
          <div className="summary-icon">📝</div>
          <div className="summary-info">
            <span className="summary-number">{stats.quiz || 0}</span>
            <span className="summary-label">Quiz</span>
          </div>
        </div>
        <div className="summary-card lecons">
          <div className="summary-icon">📚</div>
          <div className="summary-info">
            <span className="summary-number">{stats.lecons || 0}</span>
            <span className="summary-label">Leçons</span>
          </div>
        </div>
      </div>

      {/* Bouton mise à jour emploi */}
      <div className="emploi-update-section">
        <div className="emploi-update-info">
          <span className="emploi-update-icon">💼</span>
          <div>
            <strong>Marché de l'emploi</strong>
            <p>Mise à jour des métiers qui recrutent en Côte d'Ivoire</p>
          </div>
        </div>
        <button className="emploi-update-btn" onClick={updateEmploi} disabled={updating}>
          {updating ? '⏳ Recherche...' : '🔄 Mettre à jour'}
        </button>
      </div>
    </div>
  );
}

export default AdminDashboard;