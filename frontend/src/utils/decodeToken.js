// src/utils/decodeToken.js

// Décoder le token JWT pour récupérer les informations
export const decodeToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    // JWT est composé de 3 parties séparées par des points
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // La deuxième partie est le payload (encodé en base64)
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('❌ Erreur décodage token:', error);
    return null;
  }
};

// Récupérer le rôle depuis le token
export const getRoleFromToken = () => {
  const payload = decodeToken();
  return payload?.role || null;
};

// Récupérer l'ID utilisateur depuis le token
export const getUserIdFromToken = () => {
  const payload = decodeToken();
  return payload?.id || null;
};

// Vérifier si l'utilisateur est connecté
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  const payload = decodeToken();
  if (!payload) return false;
  
  // Vérifier si le token n'a pas expiré
  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now;
};

// Vérifier si l'utilisateur a un rôle spécifique
export const hasRole = (role) => {
  const tokenRole = getRoleFromToken();
  return tokenRole === role;
};