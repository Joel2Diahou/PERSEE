// src/pages/TutoreExpress.js - VERSION SIMPLIFIÉE
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import './TutoreExpress.css';
import api from '../services/api';

function TutoreExpress({ user, onBack }) {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState('pen');

  // ============ DÉTECTION DU RÔLE ============
  const eleve = JSON.parse(localStorage.getItem('eleve') || '{}');
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  
  const isEleve = !!localStorage.getItem('eleve');
  
  const token = localStorage.getItem('token');
  let role = 'eleve';
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      role = payload?.role || 'eleve';
    } catch (e) {}
  }
  
  const isTuteur = userData.role === 'tuteur' || userData.est_volontaire === 1 || role === 'tuteur';
  
  console.log('🔴 Rôle:', role);
  console.log('🔴 Est tuteur:', isTuteur);

  // ============ 9 MATIÈRES ============
  const matieres = [
    'Mathématiques', 'Physique-Chimie', 'Anglais', 'Histoire-Géographie',
    'Français', 'Philosophie', 'SVT', 'Espagnol', 'Allemand'
  ];

  const niveaux = ['6ème', '5ème', '4ème', '3ème', 'Seconde', '1ère', 'Terminale'];
  const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

  // ============ ÉTATS ============
  const [activeTab, setActiveTab] = useState('recherche');
  const [tuteurs, setTuteurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTuteur, setSelectedTuteur] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [matiereFilter, setMatiereFilter] = useState('');
  const [niveauFilter, setNiveauFilter] = useState('');
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [evalNote, setEvalNote] = useState(0);
  const [evalTuteurId, setEvalTuteurId] = useState(null);

  // ============ SOCKET.IO ============
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // ============ AUDIO ============
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    const matricule = localStorage.getItem('matricule');
    if (token) return { 'Authorization': `Bearer ${token}` };
    if (matricule) return { 'X-Matricule': matricule };
    return {};
  };

  // ============ SOCKET.IO - CONNEXION ============
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('🔗 Connecté au serveur Socket');
      setIsConnected(true);
    });

    newSocket.on('draw', (data) => {
      if (data.from !== 'self') {
        drawOnCanvas(data.x, data.y, data.color, data.size, data.isStart);
      }
    });

    newSocket.on('clear-board', () => {
      clearWhiteboard();
    });

    newSocket.on('chat-message', (data) => {
      setMessages(prev => [...prev, {
        envoyeur: data.userId,
        contenu: data.message,
        date: data.date,
        received: true
      }]);
    });

    newSocket.on('new-notification', (data) => {
      alert(`🔔 ${data.title}\n${data.body}`);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // ============ CHARGEMENT ============
  useEffect(() => {
    rechercherTuteurs();
  }, []);

  // ============ FONCTIONS ============
  const rechercherTuteurs = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeader();
      const response = await api.get('/tutor/search', {
        headers,
        params: { matiere: matiereFilter, niveau: niveauFilter }
      });
      setTuteurs(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTuteur = (tuteur) => {
    setSelectedTuteur(tuteur);
    const currentUser = isEleve ? eleve : userData;
    const newRoomId = `room-${Math.min(tuteur.id, currentUser.id)}-${Math.max(tuteur.id, currentUser.id)}`;
    setRoomId(newRoomId);
    
    if (socket && isConnected) {
      socket.emit('join-room', newRoomId);
    }
    
    setActiveTab('messagerie');
  };

  const envoyerMessage = async () => {
    if (!inputMessage.trim() || !selectedTuteur) return;
    
    const currentUser = isEleve ? eleve : userData;
    const newMessage = {
      envoyeur: currentUser.id,
      destinataire: selectedTuteur.id,
      contenu: inputMessage,
      date: new Date().toISOString()
    };
    
    setMessages([...messages, newMessage]);
    setInputMessage('');
    
    if (socket && roomId && isConnected) {
      socket.emit('chat-message', {
        roomId: roomId,
        userId: currentUser.id,
        message: inputMessage,
        destinataireId: selectedTuteur.id
      });
    }
    
    try {
      const headers = getAuthHeader();
      await api.post('/tutor/message', newMessage, { headers });
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const noterTuteur = async (tuteurId, note) => {
    try {
      const headers = getAuthHeader();
      await api.post('/tutor/note', { tuteurId, note }, { headers });
      alert(`⭐ Note ${note}/5 enregistrée !`);
      setShowEvaluation(false);
      setEvalNote(0);
      setEvalTuteurId(null);
      rechercherTuteurs();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  // ============ AUDIO ============
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        sendAudioMessage(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Erreur micro:', error);
      alert('Impossible d\'accéder au microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const sendAudioMessage = async (audioBlob) => {
    if (!selectedTuteur) return;
    const currentUser = isEleve ? eleve : userData;
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'message.wav');
      formData.append('destinataire', selectedTuteur.id);
      formData.append('envoyeur', currentUser.id);

      const headers = getAuthHeader();
      await api.post('/tutor/message-audio', formData, { headers });
    } catch (error) {
      console.error('Erreur envoi audio:', error);
    }
  };

  // ============ TABLEAU BLANC ============
  useEffect(() => {
    if (showWhiteboard) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [showWhiteboard]);

  const drawOnCanvas = (x, y, color, size, isStart) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (isStart) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    
    if (socket && roomId && isConnected) {
      socket.emit('draw', {
        roomId: roomId,
        from: 'self',
        x: x,
        y: y,
        color: tool === 'eraser' ? '#ffffff' : color,
        size: brushSize,
        isStart: true
      });
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    ctx.lineTo(x, y);
    ctx.stroke();
    
    if (socket && roomId && isConnected) {
      socket.emit('draw', {
        roomId: roomId,
        from: 'self',
        x: x,
        y: y,
        color: tool === 'eraser' ? '#ffffff' : color,
        size: brushSize,
        isStart: false
      });
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearWhiteboard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (socket && roomId && isConnected) {
      socket.emit('clear-board', roomId);
    }
  };

  const currentUser = isEleve ? eleve : userData;

  // ============ RENDU RECHERCHE ============
  const renderRecherche = () => (
    <div className="tutore-section">
      <div className="filtres-bar">
        <select className="filtre-select" value={matiereFilter} onChange={(e) => { setMatiereFilter(e.target.value); rechercherTuteurs(); }}>
          <option value="">📚 Toutes matières</option>
          {matieres.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="filtre-select" value={niveauFilter} onChange={(e) => { setNiveauFilter(e.target.value); rechercherTuteurs(); }}>
          <option value="">🎓 Tous niveaux</option>
          {niveaux.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <button className="search-btn" onClick={rechercherTuteurs}>🔍 Rechercher</button>
      </div>

      {loading ? (
        <div className="loading-spinner">Chargement...</div>
      ) : tuteurs.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">👨‍🏫</span>
          <p>Aucun tuteur disponible pour le moment</p>
          {!isTuteur && (
            <button 
              className="devenir-tuteur-btn" 
              onClick={() => navigate('/register-tuteur')}
            >
              ⭐ Devenir tuteur
            </button>
          )}
        </div>
      ) : (
        <div className="tuteurs-list">
          {tuteurs.map(t => (
            <div key={t.id} className="tuteur-card">
              <div className="tuteur-avatar">👨‍🏫</div>
              <div className="tuteur-info">
                <h3>{t.prenom} {t.nom}</h3>
                <p className="tuteur-matiere">📚 {t.matieres}</p>
                <p className="tuteur-note">⭐ {t.note || 'Nouveau'} / 5</p>
                <span className={`status-badge ${t.status === 'enligne' ? 'online' : 'offline'}`}>
                  {t.status === 'enligne' ? '🟢 En ligne' : '🔴 Hors ligne'}
                </span>
              </div>
              <div className="tuteur-actions">
                <button className="contact-btn" onClick={() => handleSelectTuteur(t)}>
                  💬 Contacter
                </button>
                <button className="eval-btn" onClick={() => { setEvalTuteurId(t.id); setShowEvaluation(true); }}>⭐</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ============ RENDU MESSAGERIE ============
  const renderMessagerie = () => (
    <div className="messagerie-section">
      {!selectedTuteur ? (
        <div className="no-chat">
          <span className="chat-icon">💬</span>
          <p>Sélectionne un tuteur pour commencer à discuter</p>
          <button onClick={() => setActiveTab('recherche')}>🔍 Chercher un tuteur</button>
        </div>
      ) : (
        <div className="chat-container">
          <div className="chat-header">
            <button className="back-chat" onClick={() => setSelectedTuteur(null)}>←</button>
            <div className="chat-tuteur">
              <strong>{selectedTuteur.prenom} {selectedTuteur.nom}</strong>
            </div>
            <button className="whiteboard-btn" onClick={() => setShowWhiteboard(!showWhiteboard)}>
              🖊️ Tableau
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.envoyeur === currentUser.id ? 'sent' : 'received'}`}>
                <p>{msg.contenu}</p>
                {msg.audio_url && <audio controls src={msg.audio_url} />}
                <span className="time">{new Date(msg.date).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Écris ton message..."
              onKeyPress={(e) => e.key === 'Enter' && envoyerMessage()}
            />
            <button className={`audio-btn ${isRecording ? 'recording' : ''}`} onClick={isRecording ? stopRecording : startRecording}>
              {isRecording ? '⏹️' : '🎤'}
            </button>
            <button onClick={envoyerMessage}>📤</button>
          </div>
        </div>
      )}
    </div>
  );

  // ============ RENDU PRINCIPAL ============
  return (
    <div className="tutore-container">
      <div className="tutore-header">
        <button className="back-btn" onClick={onBack || (() => navigate('/dashboard'))}>← Retour</button>
        <h1>👨‍🏫 TUTEUREXPRESS</h1>
        <div className="header-actions">
          {!isTuteur && (
            <button 
              className="devenir-tuteur-header-btn" 
              onClick={() => navigate('/register-tuteur')}
            >
              ⭐ Devenir tuteur
            </button>
          )}
          <span className="role-badge">{isTuteur ? '👨‍🏫 Tuteur' : '👨‍🎓 Élève'}</span>
        </div>
      </div>

      <div className="tutore-tabs">
        <button className={`tab-btn ${activeTab === 'recherche' ? 'active' : ''}`} onClick={() => setActiveTab('recherche')}>
          🔍 Chercher un tuteur
        </button>
        <button className={`tab-btn ${activeTab === 'messagerie' ? 'active' : ''}`} onClick={() => setActiveTab('messagerie')}>
          💬 Messages
        </button>
        {isTuteur && (
          <button className={`tab-btn ${activeTab === 'gestion' ? 'active' : ''}`} onClick={() => setActiveTab('gestion')}>
            ⚙️ Gérer
          </button>
        )}
      </div>

      <div className="tutore-content">
        {activeTab === 'recherche' && renderRecherche()}
        {activeTab === 'messagerie' && renderMessagerie()}
        {activeTab === 'gestion' && isTuteur && (
          <div className="gestion-section">
            <p>📋 Gestion des disponibilités et rendez-vous</p>
            <button className="back-btn" onClick={() => navigate('/dashboard-tuteur')}>
              Aller au tableau de bord tuteur →
            </button>
          </div>
        )}
      </div>

      {/* Modal Évaluation */}
      {showEvaluation && (
        <div className="evaluation-modal" onClick={() => setShowEvaluation(false)}>
          <div className="evaluation-content" onClick={(e) => e.stopPropagation()}>
            <h2>⭐ Noter le tuteur</h2>
            <div className="stars">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} className={`star-btn ${n <= evalNote ? 'active' : ''}`} onClick={() => setEvalNote(n)}>★</button>
              ))}
            </div>
            <div className="eval-actions">
              <button className="eval-cancel" onClick={() => setShowEvaluation(false)}>Annuler</button>
              <button className="eval-submit" onClick={() => noterTuteur(evalTuteurId, evalNote)} disabled={evalNote === 0}>Envoyer</button>
            </div>
          </div>
        </div>
      )}

      {/* Tableau Blanc Modal */}
      {showWhiteboard && (
        <div className="whiteboard-modal">
          <div className="whiteboard-content">
            <div className="whiteboard-toolbar">
              <button className={`tool-btn ${tool === 'pen' ? 'active' : ''}`} onClick={() => setTool('pen')}>✏️</button>
              <button className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`} onClick={() => setTool('eraser')}>🧽</button>
              <button className="tool-btn" onClick={clearWhiteboard}>🗑️</button>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
              <select value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))}>
                <option value="3">Fin</option>
                <option value="6">Moyen</option>
                <option value="10">Épais</option>
              </select>
              <button className="close-whiteboard" onClick={() => setShowWhiteboard(false)}>✕</button>
            </div>
            <canvas
              ref={canvasRef}
              className="whiteboard-canvas"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const canvas = canvasRef.current;
                const rect = canvas.getBoundingClientRect();
                const mouseEvent = new MouseEvent('mousedown', {
                  clientX: touch.clientX,
                  clientY: touch.clientY
                });
                canvas.dispatchEvent(mouseEvent);
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const canvas = canvasRef.current;
                const rect = canvas.getBoundingClientRect();
                const mouseEvent = new MouseEvent('mousemove', {
                  clientX: touch.clientX,
                  clientY: touch.clientY
                });
                canvas.dispatchEvent(mouseEvent);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                const canvas = canvasRef.current;
                const mouseEvent = new MouseEvent('mouseup', {});
                canvas.dispatchEvent(mouseEvent);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default TutoreExpress;