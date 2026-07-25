// src/pages/admin/AdminPedagogie.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminCrud.css';
import AdminLecons from './AdminLecons';
import AdminExamens from './AdminExamens';

function AdminPedagogie() {
  const [activeTab, setActiveTab] = useState('quiz');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    matiere: '', niveau: '', question: '', type_question: 'qcm',
    options: '', reponse_correcte: '', difficulte: 'moyen', serie: ''
  });

  const token = localStorage.getItem('token');
  const getAuthHeader = () => ({ Authorization: `Bearer ${token}` });

  const loadQuiz = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/admin/quiz', { headers: getAuthHeader() });
      setItems(res.data);
    } catch (error) { console.error('Erreur:', error); } finally { setLoading(false); }
  };

  useEffect(() => { loadQuiz(); }, []);

  const handleSubmit = async () => {
    if (!formData.matiere || !formData.niveau || !formData.question || !formData.reponse_correcte) {
      alert('Matière, niveau, question et réponse requis');
      return;
    }
    try {
      if (formData.id) {
        await axios.put(`http://localhost:5000/api/admin/quiz/${formData.id}`, formData, { headers: getAuthHeader() });
      } else {
        await axios.post('http://localhost:5000/api/admin/quiz', formData, { headers: getAuthHeader() });
      }
      setShowModal(false);
      setFormData({ matiere: '', niveau: '', question: '', type_question: 'qcm', options: '', reponse_correcte: '', difficulte: 'moyen', serie: '' });
      loadQuiz();
      alert('✅ Quiz enregistré');
    } catch (error) { alert('❌ Erreur'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette question ?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/quiz/${id}`, { headers: getAuthHeader() });
      loadQuiz();
      alert('✅ Quiz supprimé');
    } catch (error) { alert('❌ Erreur'); }
  };

  const openModal = (item = null) => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({ matiere: '', niveau: '', question: '', type_question: 'qcm', options: '', reponse_correcte: '', difficulte: 'moyen', serie: '' });
    }
    setShowModal(true);
  };

  const tabs = [
    { id: 'quiz', name: '📝 Quiz', icon: '📝' },
    { id: 'lecons', name: '📚 Leçons', icon: '📚' },
    { id: 'examens', name: '📝 Examens', icon: '📝' }
  ];

  return (
    <div className="admin-module">
      <div className="module-header">
        <h2>📚 Gestion pédagogique</h2>
        {activeTab === 'quiz' && <button className="add-btn" onClick={() => openModal()}>➕ Ajouter une question</button>}
      </div>

      <div className="sub-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`sub-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {activeTab === 'quiz' && (
        <>
          {loading ? <div className="loading">Chargement...</div> : (
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr><th>Matière</th><th>Niveau</th><th>Question</th><th>Réponse</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {items.length === 0 ? <tr><td colSpan="5" className="empty">Aucun quiz</td></tr> :
                    items.map(q => (
                      <tr key={q.id}>
                        <td>{q.matiere}</td>
                        <td>{q.niveau}</td>
                        <td className="question-cell">{q.question.substring(0, 50)}...</td>
                        <td><span className="answer-badge">{q.reponse_correcte}</span></td>
                        <td>
                          <button className="edit-btn" onClick={() => openModal(q)}>✏️</button>
                          <button className="delete-btn" onClick={() => handleDelete(q.id)}>🗑️</button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'lecons' && <AdminLecons />}
      {activeTab === 'examens' && <AdminExamens />}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{formData.id ? '✏️ Modifier' : '➕ Ajouter'} une question</h2>
            <select value={formData.matiere} onChange={(e) => setFormData({...formData, matiere: e.target.value})}>
              <option value="">Matière *</option>
              <option value="Mathématiques">Mathématiques</option>
              <option value="Français">Français</option>
              <option value="Anglais">Anglais</option>
              <option value="SVT">SVT</option>
              <option value="Physique-Chimie">Physique-Chimie</option>
              <option value="Histoire-Géo">Histoire-Géo</option>
              <option value="Philosophie">Philosophie</option>
            </select>
            <select value={formData.niveau} onChange={(e) => setFormData({...formData, niveau: e.target.value})}>
              <option value="">Niveau *</option>
              <option value="6ème">6ème</option>
              <option value="5ème">5ème</option>
              <option value="4ème">4ème</option>
              <option value="3ème">3ème</option>
              <option value="Seconde">Seconde</option>
              <option value="1ère">1ère</option>
              <option value="Terminale">Terminale</option>
            </select>
            <input type="text" placeholder="Question *" value={formData.question} onChange={(e) => setFormData({...formData, question: e.target.value})} />
            <input type="text" placeholder="Options (ex: A, B, C, D)" value={formData.options} onChange={(e) => setFormData({...formData, options: e.target.value})} />
            <input type="text" placeholder="Réponse correcte *" value={formData.reponse_correcte} onChange={(e) => setFormData({...formData, reponse_correcte: e.target.value})} />
            <select value={formData.difficulte} onChange={(e) => setFormData({...formData, difficulte: e.target.value})}>
              <option value="debutant">Débutant</option>
              <option value="moyen">Moyen</option>
              <option value="avance">Avancé</option>
            </select>
            <input type="text" placeholder="Série (C, D, A...)" value={formData.serie} onChange={(e) => setFormData({...formData, serie: e.target.value})} />
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="submit-btn" onClick={handleSubmit}>
                {formData.id ? '💾 Modifier' : '➕ Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPedagogie;