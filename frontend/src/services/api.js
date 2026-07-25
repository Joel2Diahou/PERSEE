// src/services/api.js
import axios from 'axios';

// ⚠️ IMPORTANT : Remplace localhost par l'IP de ton ordinateur pour les tests mobiles
// Sur PC : http://localhost:5000/api
// Sur téléphone : http://192.168.43.232:5000/api

// Détection automatique de l'environnement
const getBaseUrl = () => {
  // Si on est sur mobile (détection simple)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // IP de ton ordinateur (à modifier selon ton réseau)
  const PC_IP = '192.168.43.232';
  
  if (isMobile) {
    // Sur téléphone, utiliser l'IP du PC
    return `http://${PC_IP}:5000/api`;
  }
  // Sur PC, utiliser localhost
  return 'http://localhost:5000/api';
};

const API_URL = getBaseUrl();

console.log('📡 API URL:', API_URL);

const api = axios.create({ 
  baseURL: API_URL, 
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000 // 30 secondes de timeout
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const matricule = localStorage.getItem('matricule');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (matricule && !token) {
    config.headers['X-Matricule'] = matricule;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('⚠️ Temps d\'attente dépassé');
    } else if (error.response?.status === 401) {
      console.error('🔒 Non autorisé, redirection vers login');
      localStorage.removeItem('token');
      localStorage.removeItem('matricule');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============ AUTHENTIFICATION ============
export const registerEleve = (data) => api.post('/auth/register-eleve', data);
export const loginEleve = (data) => api.post('/auth/login-eleve', data);
export const registerUser = (data) => api.post('/auth/register-user', data);
export const loginUser = (data) => api.post('/auth/login-user', data);
export const getMe = () => api.get('/auth/me');

// ============ ORIENTEXPRESS ============
export const orientationChat = (message, niveau, historique) => 
  api.post('/orientation/chat', { message, niveau, historique });

// ============ PRÉPAFLASH ============
export const getQuiz = (params) => api.get('/prepa/quiz', { params });
export const submitAnswer = (data) => api.post('/prepa/submit', data);
export const getProgression = () => api.get('/prepa/progression');
export const getMatieres = () => api.get('/prepa/matieres');
export const getPrepaStats = () => api.get('/prepa/stats');

// ============ BOOKMATCH ============
export const createAnnonce = (data) => api.post('/book/annonces', data);
export const getAnnonces = (params) => api.get('/book/annonces', { params });
export const getMesAnnonces = () => api.get('/book/mes-annonces');
export const getMesDemandes = () => api.get('/book/mes-demandes');
export const demanderLivre = (annonceId) => api.post('/book/demander', { annonceId });
export const supprimerAnnonce = (annonceId) => api.delete(`/book/annonces/${annonceId}`);
export const marquerEchange = (annonceId) => api.put(`/book/annonces/${annonceId}/echange`);

// ============ TUTEUREXPRESS ============
export const devenirTuteur = (data) => api.post('/tutor/devenir', data);
export const getTuteurs = (params) => api.get('/tutor/search', { params });
export const demanderSession = (data) => api.post('/tutor/premium/request', data);
export const getMesSessions = () => api.get('/tutor/sessions');
export const getTuteurStatus = () => api.get('/tutor/status');
export const updateTuteurStatus = (status) => api.post('/tutor/status', { status });
export const ajouterFavori = (tuteurId) => api.post('/tutor/favoris', { tuteurId });
export const getFavoris = () => api.get('/tutor/favoris');
export const envoyerMessage = (message) => api.post('/tutor/message', message);
export const noterTuteur = (tuteurId, note) => api.post('/tutor/note', { tuteurId, note });

// ============ ADMIN ============
export const getStats = () => api.get('/admin/stats');
export const getEcoles = () => api.get('/admin/ecoles');
export const addEcole = (data) => api.post('/admin/ecoles', data);
export const deleteEcole = (id) => api.delete(`/admin/ecoles/${id}`);
export const getUsers = () => api.get('/admin/users');
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);
export const getEleves = () => api.get('/admin/eleves');
export const deleteEleve = (id) => api.delete(`/admin/eleves/${id}`);
export const validerTuteur = (id, valider) => api.put(`/admin/tuteurs/${id}`, { valider });
export const createAdmin = (data) => api.post('/admin/create', data);

export default api;