// src/pages/prepa/MonRapport.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MonRapport.css';

function MonRapport({ user, onBack }) {
  const [stats, setStats] = useState({
    totalQuiz: 0,
    moyenne: 0,
    meilleurScore: 0,
    pireScore: 0,
    parMatiere: [],
    historique: [],
    badges: []
  });
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    const matricule = localStorage.getItem('matricule');
    if (token) return { 'Authorization': `Bearer ${token}` };
    if (matricule) return { 'X-Matricule': matricule };
    return {};
  };

  useEffect(() => {
    loadStats();
    loadRecommendations();
  }, []);

  const loadStats = async () => {
    try {
      const headers = getAuthHeader();
      const response = await axios.get('http://localhost:5000/api/prepa/stats', { headers });
      if (response.data) {
        setStats(response.data);
      } else {
        // Données de démonstration
        setStats({
          totalQuiz: 12,
          moyenne: 68,
          meilleurScore: 100,
          pireScore: 40,
          parMatiere: [
            { matiere: 'Mathématiques', score: 75, total: 100 },
            { matiere: 'Français', score: 82, total: 100 },
            { matiere: 'Anglais', score: 60, total: 100 },
            { matiere: 'SVT', score: 55, total: 100 }
          ],
          historique: [
            { date: '2024-05-20', matiere: 'Mathématiques', score: 8, total: 10 },
            { date: '2024-05-19', matiere: 'Français', score: 9, total: 10 },
            { date: '2024-05-18', matiere: 'Anglais', score: 6, total: 10 }
          ],
          badges: ['🎓 Débutant', '⭐ Expert Maths']
        });
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const headers = getAuthHeader();
      const response = await axios.post('http://localhost:5000/api/ia/recommandations', {
        stats: stats
      }, { headers });
      if (response.data && response.data.recommandations) {
        setRecommendations(response.data.recommandations);
      } else {
        setRecommendations([
          '📚 Révise les fonctions mathématiques (ton point faible)',
          '🗣️ Entraîne-toi en conjugaison',
          '🎧 Écoute des podcasts en anglais pour améliorer ton oreille',
          '📖 Lis des romans pour enrichir ton vocabulaire'
        ]);
      }
    } catch (error) {
      console.error('Erreur recommandations:', error);
    }
  };

  const exportPDF = () => {
    const content = `
SCHOOL+ CI - RAPPORT DE PROGRESSION
===================================
Élève: ${user?.prenom || ''} ${user?.nom || ''}
Niveau: ${user?.classe || user?.niveau || 'Non précisé'}
Date: ${new Date().toLocaleDateString()}

📊 STATISTIQUES GLOBALES
- Quiz complétés: ${stats.totalQuiz}
- Moyenne générale: ${stats.moyenne}%
- Meilleur score: ${stats.meilleurScore}%
- Pire score: ${stats.pireScore}%

📖 DÉTAIL PAR MATIÈRE
${stats.parMatiere.map(m => `- ${m.matiere}: ${m.score}%`).join('\n')}

📅 HISTORIQUE DES QUIZ
${stats.historique.map(h => `- ${h.date}: ${h.matiere} - ${h.score}/${h.total}`).join('\n')}

🏆 BADGES OBTENUS
${stats.badges.map(b => `- ${b}`).join('\n')}

💡 RECOMMANDATIONS
${recommendations.map(r => `- ${r}`).join('\n')}

---
SCHOOL+ CI - Plateforme Éducative Ivoirienne
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_${user?.prenom || 'eleve'}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  if (loading) {
    return (
      <div className="rapport-container">
        <div className="rapport-header">
          <button className="back-btn" onClick={onBack}>← Retour</button>
          <h1>📜 MON RAPPORT</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement de vos statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rapport-container">
      <div className="rapport-header">
        <button className="back-btn" onClick={onBack}>← Retour</button>
        <h1>📜 MON RAPPORT</h1>
        <button className="export-btn" onClick={exportPDF}>📄 Exporter PDF</button>
      </div>

      {/* Résumé des stats */}
      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{stats.totalQuiz}</div>
          <div className="stat-label">Quiz complétés</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-value">{stats.moyenne}%</div>
          <div className="stat-label">Moyenne générale</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-value">{stats.meilleurScore}%</div>
          <div className="stat-label">Meilleur score</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{stats.badges.length}</div>
          <div className="stat-label">Badges obtenus</div>
        </div>
      </div>

      {/* Graphique par matière */}
      <div className="section">
        <h2>📖 Progression par matière</h2>
        <div className="matieres-stats">
          {stats.parMatiere.map((m, idx) => (
            <div key={idx} className="matiere-progress">
              <div className="matiere-name">{m.matiere}</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${m.score}%`, backgroundColor: m.score >= 70 ? '#2e7d32' : (m.score >= 50 ? '#ff8c00' : '#c62828') }}></div>
              </div>
              <div className="matiere-score">{m.score}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Historique */}
      <div className="section">
        <h2>📅 Historique des quiz</h2>
        <div className="historique-table">
          <table>
            <thead>
              <tr><th>Date</th><th>Matière</th><th>Score</th><th>Résultat</th></tr>
            </thead>
            <tbody>
              {stats.historique.map((h, idx) => (
                <tr key={idx}>
                  <td>{new Date(h.date).toLocaleDateString()}</td>
                  <td>{h.matiere}</td>
                  <td>{h.score}/{h.total}</td>
                  <td className={h.score / h.total >= 0.7 ? 'success' : (h.score / h.total >= 0.5 ? 'warning' : 'danger')}>
                    {Math.round((h.score / h.total) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Badges */}
      {stats.badges.length > 0 && (
        <div className="section">
          <h2>🏆 Badges obtenus</h2>
          <div className="badges-list">
            {stats.badges.map((b, idx) => (
              <div key={idx} className="badge-item">{b}</div>
            ))}
          </div>
        </div>
      )}

      {/* Recommandations IA */}
      <div className="section recommendations">
        <h2>💡 Recommandations personnalisées</h2>
        <div className="recommendations-list">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="recommendation-item">
              <span className="rec-icon">✨</span>
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MonRapport;