// src/pages/prepa/MesCours.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MesCours.css';
import api from '../../services/api';

function MesCours({ user, onBack }) {
  const [niveau, setNiveau] = useState('3eme');
  const [serie, setSerie] = useState('C');
  const [matiere, setMatiere] = useState('');
  const [lecon, setLecon] = useState('');
  const [leconsList, setLeconsList] = useState([]);
  const [cours, setCours] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingLecons, setLoadingLecons] = useState(false);
  const [error, setError] = useState(null);
  const [customQuery, setCustomQuery] = useState('');
  const [favorites, setFavorites] = useState([]);

  // Programmes
  // 3ème : seulement 4 matières (pas de langues)
  const matieres3eme = [
    'Mathématiques', 'Français', 'Anglais', 'Physique-Chimie'
  ];

  // Terminale : toutes les matières avec langues
  const matieresTerminale = {
    C: ['Mathématiques', 'Physique-Chimie', 'Anglais', 'Allemand', 'Espagnol', 'Philosophie', 'Histoire-Géo'],
    D: ['SVT', 'Physique-Chimie', 'Anglais', 'Allemand', 'Espagnol', 'Philosophie', 'Histoire-Géo'],
    A: ['Littérature', 'Philosophie', 'Anglais', 'Allemand', 'Espagnol', 'Histoire-Géo'],
    G: ['Comptabilité', 'Gestion', 'Anglais', 'Allemand', 'Espagnol', 'Philosophie', 'Histoire-Géo', 'Maths'],
    F: ['Maths', 'Sciences Tech', 'Anglais', 'Allemand', 'Espagnol', 'Philosophie', 'Histoire-Géo']
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    const matricule = localStorage.getItem('matricule');
    if (token) return { 'Authorization': `Bearer ${token}` };
    if (matricule) return { 'X-Matricule': matricule };
    return {};
  };

  // Générer la liste des leçons via IA
  const genererLecons = async () => {
    if (!matiere) return;
    
    setLoadingLecons(true);
    setError(null);
    setLecon('');
    setCours(null);
    
    try {
      const headers = getAuthHeader();
      const niveauStr = niveau === '3eme' ? '3ème' : 'Terminale';
      const serieStr = niveau === 'terminale' ? ` Série ${serie}` : '';
      
      const response = await api.post('/ia/lecons', {
        matiere: matiere,
        niveau: niveauStr,
        serie: serieStr
      }, { headers });
      
      if (response.data && response.data.lecons) {
        const leconsArray = response.data.lecons.split(',').map(l => l.trim());
        setLeconsList(leconsArray);
      } else {
        setError('Impossible de charger les leçons');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Impossible de charger les leçons. Réessaie plus tard.');
    } finally {
      setLoadingLecons(false);
    }
  };

  // Générer le cours pour une leçon
  const genererCours = async () => {
    if (!lecon) return;
    
    setLoading(true);
    setError(null);
    setCours(null);

    try {
      const headers = getAuthHeader();
      const niveauStr = niveau === '3eme' ? '3ème' : 'Terminale';
      const serieStr = niveau === 'terminale' ? ` Série ${serie}` : '';
      
      const response = await api.post('/ia/cours', {
        matiere: matiere,
        lecon: lecon,
        niveau: niveauStr,
        serie: serieStr
      }, { headers });

      if (response.data && response.data.cours) {
        setCours(response.data.cours);
      } else {
        setError('Erreur lors de la génération du cours');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Service temporairement indisponible. Réessaie plus tard.');
    } finally {
      setLoading(false);
    }
  };

  // Générer un cours personnalisé
  const genererCoursPersonnalise = async () => {
    if (!customQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    setCours(null);
    setLecon('');
    setLeconsList([]);

    try {
      const headers = getAuthHeader();
      const niveauStr = niveau === '3eme' ? '3ème' : 'Terminale';
      const serieStr = niveau === 'terminale' ? ` Série ${serie}` : '';
      
      const response = await api.post('/ia/cours-personnalise', {
        question: customQuery,
        matiere: matiere || 'général',
        niveau: niveauStr,
        serie: serieStr
      }, { headers });

      if (response.data && response.data.cours) {
        setCours(response.data.cours);
        setCustomQuery('');
      } else {
        setError('Erreur lors de la génération');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Service temporairement indisponible');
    } finally {
      setLoading(false);
    }
  };

  // Effet pour charger les leçons quand la matière change
  useEffect(() => {
    if (matiere) {
      genererLecons();
    }
  }, [matiere, niveau, serie]);

  // Formater le cours
  const formatCours = (text) => {
    if (!text) return '';
    return text.split('\n').map((line, i) => {
      if (line.startsWith('📚') || line.startsWith('📝') || line.startsWith('🎯') || line.startsWith('❓')) {
        return <h3 key={i} className="cours-section">{line}</h3>;
      }
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return <li key={i} className="cours-list-item">{line.substring(1)}</li>;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="cours-text">{line}</p>;
    });
  };

  const currentMatieres = niveau === '3eme' ? matieres3eme : (matieresTerminale[serie] || []);

  return (
    <div className="cours-container">
      <div className="cours-header">
        <button className="back-btn" onClick={onBack}>← Retour</button>
        <h1>📚 SCHOOL-IA</h1>
        <button className="favoris-btn" onClick={() => {
          const favs = localStorage.getItem('cours_favoris');
          alert('📖 Cours favoris :\n' + (favs ? JSON.parse(favs).join('\n') : 'Aucun cours favori'));
        }}>⭐ Favoris</button>
      </div>

      <div className="cours-options">
        <div className="option-group">
          <label>🎓 Niveau</label>
          <div className="option-buttons">
            <button 
              className={`option-btn ${niveau === '3eme' ? 'active' : ''}`} 
              onClick={() => { setNiveau('3eme'); setMatiere(''); setLecon(''); setLeconsList([]); setCours(null); }}
            >
              3ème (BEPC)
            </button>
            <button 
              className={`option-btn ${niveau === 'terminale' ? 'active' : ''}`} 
              onClick={() => { setNiveau('terminale'); setMatiere(''); setLecon(''); setLeconsList([]); setCours(null); }}
            >
              Terminale (BAC)
            </button>
          </div>
        </div>

        {niveau === 'terminale' && (
          <div className="option-group">
            <label>🎯 Série BAC</label>
            <div className="option-buttons">
              {['C', 'D', 'A', 'G', 'F'].map(s => (
                <button 
                  key={s} 
                  className={`option-btn ${serie === s ? 'active' : ''}`} 
                  onClick={() => { setSerie(s); setMatiere(''); setLecon(''); setLeconsList([]); setCours(null); }}
                >
                  Série {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="option-group">
          <label>📖 Matière</label>
          <div className="matieres-grid">
            {currentMatieres.map(m => (
              <button 
                key={m} 
                className={`matiere-btn ${matiere === m ? 'active' : ''}`} 
                onClick={() => setMatiere(m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {loadingLecons && (
          <div className="loading-chapitres">
            <div className="spinner-small"></div>
            <span>Chargement des leçons...</span>
          </div>
        )}

        {leconsList.length > 0 && (
          <div className="option-group">
            <label>📚 Leçon</label>
            <div className="chapitres-grid">
              {leconsList.map(l => (
                <button 
                  key={l} 
                  className={`chapitre-btn ${lecon === l ? 'active' : ''}`} 
                  onClick={() => setLecon(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}

        {lecon && (
          <button className="generer-btn" onClick={genererCours} disabled={loading}>
            {loading ? 'Génération en cours... 🤖' : '🚀 Générer le cours'}
          </button>
        )}

        <div className="separator">
          <span>OU</span>
        </div>

        <div className="option-group">
          <label>🔍 Je veux comprendre...</label>
          <div className="custom-search">
            <input
              type="text"
              placeholder="Ex: le théorème de Thalès, the present perfect, die Konjugation..."
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && genererCoursPersonnalise()}
              className="search-input"
            />
            <button className="search-btn" onClick={genererCoursPersonnalise} disabled={loading}>
              🔍 Expliquer
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>L'IA prépare ton cours...</p>
        </div>
      )}

      {cours && (
        <div className="cours-result">
          <div className="cours-result-header">
            <h2>{lecon || customQuery}</h2>
            <button className="favori-btn" onClick={() => {
              const favs = JSON.parse(localStorage.getItem('cours_favoris') || '[]');
              const title = lecon || customQuery;
              if (!favs.includes(title)) {
                favs.push(title);
                localStorage.setItem('cours_favoris', JSON.stringify(favs));
                alert('✅ Ajouté aux favoris !');
              } else {
                alert('⭐ Déjà dans les favoris');
              }
            }}>
              ☆ Ajouter aux favoris
            </button>
          </div>
          <div className="cours-content">
            {formatCours(cours)}
          </div>
        </div>
      )}
    </div>
  );
}

export default MesCours;