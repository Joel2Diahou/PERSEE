// src/utils/clearStorage.js

// Nettoyer toutes les données de session
export const clearAllStorage = () => {
  localStorage.clear();
};

// Nettoyer les données d'élève
export const clearEleveStorage = () => {
  localStorage.removeItem('matricule');
  localStorage.removeItem('eleve');
};

// Nettoyer les données d'utilisateur (parent/tuteur/admin)
export const clearUserStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Nettoyer tout sauf le token (pour garder la session active)
export const clearRoleStorage = () => {
  localStorage.removeItem('matricule');
  localStorage.removeItem('eleve');
  // Garder token et user
};