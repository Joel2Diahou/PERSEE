// src/pages/admin/AdminEmploi.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminCrud.css';
import api from '../../services/api';

function AdminEmploi() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const token = localStorage.getItem('token');
  const getAuthHeader = () => ({ Authorization: `Bearer ${token}` });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/emploi-stats', { headers: getAuthHeader() });
      setData(res.data);
    } catch (error) { console.error('Erreur:', error); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const updateEmploi = async () => {
    if (!window.confirm('Lancer la mise à jour des données du marché de l\'emploi ?')) return;
    setUpdating(true);
    try {
      const res = await api.post('/ia/update-emploi-stats', {}, { headers: getAuthHeader() });
      if (res.data.success) {
        alert(`✅ ${res.data.message}`);
        loadData();
      }
    } catch (error) { alert('❌ Erreur'); } finally { setUpdating(false); }
  };

  return (
    <div className="admin-module">
      <div className="module-header">
        <h2>💼 Marché de l'emploi</h2>
        <button className="add-btn" onClick={updateEmploi} disabled={updating}>
          {updating ? '⏳ Recherche...' : '🔄 Mettre à jour'}
        </button>
      </div>

      {loading ? <div className="loading">Chargement...</div> : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr><th>Métier</th><th>Secteur</th><th>Salaire min</th><th>Salaire max</th><th>Demande</th><th>Source</th></tr>
            </thead>
            <tbody>
              {data.length === 0 ? <tr><td colSpan="6" className="empty">Aucune donnée</td></tr> :
                data.map((item, idx) => (
                  <tr key={idx}>
                    <td><strong>{item.metier}</strong></td>
                    <td>{item.secteur}</td>
                    <td>{item.salaire_min?.toLocaleString() || '-'} FCFA</td>
                    <td>{item.salaire_max?.toLocaleString() || '-'} FCFA</td>
                    <td><span className={`demande-badge ${item.demande?.toLowerCase()}`}>{item.demande || 'N/A'}</span></td>
                    <td>{item.source || 'IA'}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminEmploi;