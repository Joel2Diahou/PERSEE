// frontend/src/routes/ProtectedRoutes.js
import { Navigate } from 'react-router-dom';

// ============ DÉCODAGE DU TOKEN ============
const decodeToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('❌ Erreur décodage token:', error);
    return null;
  }
};

const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  const payload = decodeToken();
  if (!payload) return false;
  
  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now;
};

// ============ ROUTE PROTÉGÉE DE BASE ============
export const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/" />;
};

// ============ ROUTE ADMIN UNIQUEMENT ============
export const AdminRoute = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/" />;
  const payload = decodeToken();
  return payload?.role === 'admin' ? children : <Navigate to="/dashboard-eleve" />;
};

// ============ ROUTE ÉLÈVE UNIQUEMENT ============
export const EleveRoute = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/" />;
  const payload = decodeToken();
  // Élève = role 'eleve' OU pas de role (ancien système)
  if (payload?.role === 'eleve' || payload?.role === undefined || payload?.role === null) {
    return children;
  }
  return <Navigate to="/dashboard-eleve" />;
};

// ============ ROUTE PARENT UNIQUEMENT ============
export const ParentRoute = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/" />;
  const payload = decodeToken();
  return payload?.role === 'parent' ? children : <Navigate to="/dashboard-eleve" />;
};

// ============ ROUTE TUTEUR UNIQUEMENT ============
export const TuteurRoute = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/" />;
  const payload = decodeToken();
  return payload?.role === 'tuteur' ? children : <Navigate to="/dashboard-eleve" />;
};

// ============ REDIRECTION SELON LE RÔLE ============
export const RoleBasedRedirect = () => {
  if (!isAuthenticated()) return <Navigate to="/" />;
  
  const payload = decodeToken();
  const role = payload?.role || 'eleve';
  
  switch(role) {
    case 'admin':
      return <Navigate to="/admin" />;
    case 'tuteur':
      return <Navigate to="/dashboard-tuteur" />;
    case 'parent':
      return <Navigate to="/dashboard-parent" />;
    default:
      return <Navigate to="/dashboard-eleve" />;
  }
};