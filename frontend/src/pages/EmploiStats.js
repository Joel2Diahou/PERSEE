// src/pages/EmploiStats.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EmploiStats.css';
import api from '../services/api';

function EmploiStats({ onBack }) {
    const [stats, setStats] = useState([]);
    const [secteurs, setSecteurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterSecteur, setFilterSecteur] = useState('');
    const [filterDemande, setFilterDemande] = useState('');

    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        const matricule = localStorage.getItem('matricule');
        if (token) return { 'Authorization': `Bearer ${token}` };
        if (matricule) return { 'X-Matricule': matricule };
        return {};
    };

    useEffect(() => {
        loadStats();
        loadSecteurs();
    }, []);

    const loadStats = async () => {
        try {
            const headers = getAuthHeader();
            const res = await api.get('/emploi-stats', { headers });
            setStats(res.data);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSecteurs = async () => {
        try {
            const headers = getAuthHeader();
            const res = await api.get('/emploi-stats/secteurs', { headers });
            setSecteurs(res.data);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const getDemandeEmoji = (demande) => {
        if (demande === 'Très recherché') return '🔥';
        if (demande === 'Moyennement recherché') return '📊';
        if (demande === 'Métier d\'avenir') return '🚀';
        return '⚠️';
    };

    const getDemandeColor = (demande) => {
        if (demande === 'Très recherché') return 'tres-recherche';
        if (demande === 'Moyennement recherché') return 'moyennement-recherche';
        if (demande === 'Métier d\'avenir') return 'metier-avenir';
        return 'peu-recherche';
    };

    const filteredStats = stats.filter(s => {
        if (filterSecteur && s.secteur !== filterSecteur) return false;
        if (filterDemande && s.demande !== filterDemande) return false;
        return true;
    });

    const demandes = [...new Set(stats.map(s => s.demande))];
    const secteursList = [...new Set(stats.map(s => s.secteur))];

    return (
        <div className="emploi-container">
            <div className="emploi-header">
                <button className="back-btn" onClick={onBack}>← Retour</button>
                <h1>📊 Marché de l'Emploi</h1>
                <div className="update-info">
                    <span>🔄 Dernière mise à jour: {new Date().toLocaleDateString()}</span>
                </div>
            </div>

            {/* Résumé par secteur */}
            <div className="secteurs-summary">
                <h3>📈 Secteurs porteurs</h3>
                <div className="secteurs-grid">
                    {secteurs.map(s => (
                        <div key={s.secteur} className="secteur-card">
                            <div className="secteur-name">{s.secteur}</div>
                            <div className="secteur-stats">
                                <span className="secteur-count">{s.total} métiers</span>
                                <span className="secteur-salaire">
                                    {Math.round(s.salaire_moyen_min / 1000)}k - {Math.round(s.salaire_moyen_max / 1000)}k FCFA
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filtres */}
            <div className="emploi-filters">
                <select value={filterSecteur} onChange={(e) => setFilterSecteur(e.target.value)}>
                    <option value="">📂 Tous les secteurs</option>
                    {secteursList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filterDemande} onChange={(e) => setFilterDemande(e.target.value)}>
                    <option value="">📊 Toutes les demandes</option>
                    {demandes.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <button className="clear-filters" onClick={() => { setFilterSecteur(''); setFilterDemande(''); }}>
                    ✕ Effacer les filtres
                </button>
            </div>

            {/* Liste des métiers */}
            {loading ? (
                <div className="loading-spinner">Chargement...</div>
            ) : filteredStats.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-icon">📊</span>
                    <p>Aucune donnée disponible pour le moment.</p>
                    <p className="empty-hint">L'admin peut mettre à jour les données.</p>
                </div>
            ) : (
                <div className="metiers-list">
                    {filteredStats.map(s => (
                        <div key={s.id} className="metier-card">
                            <div className="metier-header">
                                <div className="metier-name">
                                    <span className="metier-icon">{getDemandeEmoji(s.demande)}</span>
                                    <strong>{s.metier}</strong>
                                </div>
                                <span className={`demande-badge ${getDemandeColor(s.demande)}`}>
                                    {s.demande}
                                </span>
                            </div>
                            <div className="metier-body">
                                <div className="metier-info">
                                    <span className="label">📂 Secteur</span>
                                    <span className="value">{s.secteur}</span>
                                </div>
                                <div className="metier-info">
                                    <span className="label">💰 Salaire</span>
                                    <span className="value">
                                        {s.salaire_min.toLocaleString()} - {s.salaire_max.toLocaleString()} FCFA/mois
                                    </span>
                                </div>
                                <div className="metier-info">
                                    <span className="label">📌 Source</span>
                                    <span className="value">{s.source || 'IA'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default EmploiStats;