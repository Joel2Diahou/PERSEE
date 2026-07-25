// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages publiques
import Home from './pages/Home';
import LoginChoice from './pages/LoginChoice';      // ✅ Page connexion (3 rôles)
import RegisterChoice from './pages/RegisterChoice'; // ✅ Page inscription (3 rôles)
import LoginEleve from './pages/LoginEleve';
import RegisterEleve from './pages/RegisterEleve';
import LoginParent from './pages/LoginParent';
import RegisterParent from './pages/RegisterParent';
import LoginTuteur from './pages/LoginTuteur';
import RegisterTuteur from './pages/RegisterTuteur';

// Dashboards
import Dashboard from './pages/Dashboard';
import ParentDashboard from './pages/ParentDashboard';
import DashboardTuteur from './pages/DashboardTuteur';
import Admin from './pages/Admin';

// Modules
import Orientation from './pages/Orientation';
import PrepaFlash from './pages/PrepaFlash';
import BookMatch from './pages/BookMatch';
import TutoreExpress from './pages/TutoreExpress';

// ============ FONCTIONS D'AUTH ============
const decodeToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
};

const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  const payload = decodeToken();
  if (!payload) return false;
  return payload.exp > Math.floor(Date.now() / 1000);
};

// ============ ROUTES PROTÉGÉES ============
const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login-choice" />;
};

const AdminRoute = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/login-choice" />;
  const payload = decodeToken();
  return payload?.role === 'admin' ? children : <Navigate to="/dashboard-eleve" />;
};

const EleveRoute = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/login-choice" />;
  const payload = decodeToken();
  if (payload?.role === 'eleve' || payload?.role === undefined || payload?.role === null) {
    return children;
  }
  return <Navigate to="/dashboard-eleve" />;
};

const ParentRoute = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/login-choice" />;
  const payload = decodeToken();
  return payload?.role === 'parent' ? children : <Navigate to="/dashboard-eleve" />;
};

const TuteurRoute = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/login-choice" />;
  const payload = decodeToken();
  return payload?.role === 'tuteur' ? children : <Navigate to="/dashboard-eleve" />;
};

const RoleBasedRedirect = () => {
  if (!isAuthenticated()) return <Navigate to="/login-choice" />;
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

// ============ APP ============
function App() {
  return (
    <Router>
      <Routes>
        {/* ============ PAGE D'ACCUEIL ============ */}
        <Route path="/" element={<Home />} />

        {/* ============ PAGES DE CHOIX ============ */}
        <Route path="/login-choice" element={<LoginChoice />} />
        <Route path="/register-choice" element={<RegisterChoice />} />

        {/* ============ ROUTES PUBLIQUES ============ */}
        {/* Élève */}
        <Route path="/login-eleve" element={<LoginEleve />} />
        <Route path="/register-eleve" element={<RegisterEleve />} />
        
        {/* Parent */}
        <Route path="/login-parent" element={<LoginParent />} />
        <Route path="/register-parent" element={<RegisterParent />} />
        
        {/* Tuteur */}
        <Route path="/login-tuteur" element={<LoginTuteur />} />
        <Route path="/register-tuteur" element={<RegisterTuteur />} />

        {/* ============ REDIRECTION APRÈS CONNEXION ============ */}
        <Route path="/dashboard" element={<RoleBasedRedirect />} />

        {/* ============ DASHBOARDS PROTÉGÉS ============ */}
        <Route 
          path="/dashboard-eleve" 
          element={
            <PrivateRoute>
              <EleveRoute>
                <Dashboard />
              </EleveRoute>
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/dashboard-parent" 
          element={
            <PrivateRoute>
              <ParentRoute>
                <ParentDashboard />
              </ParentRoute>
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/dashboard-tuteur" 
          element={
            <PrivateRoute>
              <TuteurRoute>
                <DashboardTuteur />
              </TuteurRoute>
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          } 
        />

        {/* ============ MODULES PROTÉGÉS ============ */}
        <Route 
          path="/orientation" 
          element={
            <PrivateRoute>
              <EleveRoute>
                <Orientation />
              </EleveRoute>
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/prepa" 
          element={
            <PrivateRoute>
              <EleveRoute>
                <PrepaFlash />
              </EleveRoute>
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/bookmatch" 
          element={
            <PrivateRoute>
              <EleveRoute>
                <BookMatch />
              </EleveRoute>
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/tutorat" 
          element={
            <PrivateRoute>
              <TutoreExpress />
            </PrivateRoute>
          } 
        />

        {/* ============ REDIRECTION PAR DÉFAUT ============ */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;