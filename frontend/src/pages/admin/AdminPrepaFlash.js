// src/pages/admin/AdminPrepaFlash.js
import React, { useState } from 'react';
import './AdminCrud.css';
import AdminLecons from './AdminLecons';
import AdminExamens from './AdminExamens';
import AdminSujetsProposes from './AdminSujetsProposes';

function AdminPrepaFlash() {
  const [activeTab, setActiveTab] = useState('lecons');

  const tabs = [
    { id: 'lecons', name: '📚 Leçons' },
    { id: 'examens', name: '📝 Examens' },
    { id: 'sujets', name: '📤 Sujets proposés' }
  ];

  return (
    <div className="admin-module">
      <div className="module-header">
        <h2>⚡ PRÉPAFLASH - Gestion</h2>
        <p className="module-hint">💡 Les quiz sont générés automatiquement par l'IA à partir des leçons.</p>
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

      {activeTab === 'lecons' && <AdminLecons />}
      {activeTab === 'examens' && <AdminExamens />}
      {activeTab === 'sujets' && <AdminSujetsProposes />}
    </div>
  );
}

export default AdminPrepaFlash;