// src/pages/DashboardTuteur.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import './DashboardTuteur.css';

function DashboardTuteur() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState('pen');

  // ============ VÉRIFICATION D'AUTHENTIFICATION ============
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
      navigate('/login-user');
      return;
    }
    
    // Si l'utilisateur n'est pas tuteur, le rediriger
    if (user.role !== 'tuteur' && user.est_tuteur !== 1) {
      console.log('⚠️ Utilisateur non tuteur, redirection vers dashboard');
      navigate('/dashboard');
      return;
    }
  }, [navigate]);

  // ============ DÉCONNEXION ============
  const handleLogout = () => {
    localStorage.clear(); // Supprime TOUTES les données
    navigate('/');
  };

  // ============ ÉTATS ============
  const [activeTab, setActiveTab] = useState('profil');
  const [matieresTuteur, setMatieresTuteur] = useState([]);
  const [classesTuteur, setClassesTuteur] = useState([]);
  const [professionTuteur, setProfessionTuteur] = useState('');
  const [matieresSelectionnees, setMatieresSelectionnees] = useState([]);
  const [classesSelectionnees, setClassesSelectionnees] = useState([]);
  const [professionSaisie, setProfessionSaisie] = useState('');
  const [disponibilites, setDisponibilites] = useState([]);
  const [mesRendezVous, setMesRendezVous] = useState([]);
  const [showDispoForm, setShowDispoForm] = useState(false);
  const [newDispo, setNewDispo] = useState({ jour: 'lundi', heure_debut: '14:00', heure_fin: '16:00' });
  const [estTuteur, setEstTuteur] = useState(false);
  const [loading, setLoading] = useState(false);

  // ============ NOTIFICATIONS ============
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [demandesEnAttente, setDemandesEnAttente] = useState([]);
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // ============ MESSAGERIE ============
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUser = userData;

  // ============ LISTES ============
  const matieres = [
    'Mathématiques',
    'Physique-Chimie',
    'Anglais',
    'Histoire-Géographie',
    'Français',
    'Philosophie',
    'SVT',
    'Espagnol',
    'Allemand'
  ];

  const classesDisponibles = ['6ème', '5ème', '4ème', '3ème', 'Seconde', '1ère', 'Terminale'];
  const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (token) return { 'Authorization': `Bearer ${token}` };
    return {};
  };

  // ============ URL TO BASE64 ============
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
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
      setNotifications(prev => [{
        id: Date.now(),
        title: data.title,
        message: data.body,
        ...data.data
      }, ...prev]);
      setDemandesEnAttente(prev => prev + 1);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // ============ NOTIFICATIONS PUSH ============
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      registerPushNotifications();
    }
  }, []);

  const registerPushNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker enregistré');

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('❌ Permission de notification refusée');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          'BBFyZQkbSRwrBKad1EGSxlpTR0RzsXIHHkvSCorf78UzwYwuSLr7w2QBXdNRUVUo4Tlh_AKBOQcwo5NnpfO9byM'
        )
      });

      const headers = getAuthHeader();
      await axios.post('http://localhost:5000/api/notification/subscribe', {
        subscription: subscription
      }, { headers });

      console.log('✅ Abonnement push enregistré');
    } catch (error) {
      console.error('❌ Erreur abonnement push:', error);
    }
  };

  // ============ CHARGEMENT ============
  useEffect(() => {
    verifierStatutTuteur();
    loadProfilTuteur();
    loadDisponibilites(currentUser.id);
    loadMesRendezVous();
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // ============ FONCTIONS TUTEUR ============
  const verifierStatutTuteur = async () => {
    try {
      const headers = getAuthHeader();
      const response = await axios.get('http://localhost:5000/api/tutor/status', { headers });
      setEstTuteur(response.data.isTuteur);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const loadProfilTuteur = async () => {
    try {
      const headers = getAuthHeader();
      const response = await axios.get('http://localhost:5000/api/tutor/profil', { headers });
      setMatieresTuteur(response.data.matieres || []);
      setMatieresSelectionnees(response.data.matieres || []);
      setClassesTuteur(response.data.classes || []);
      setClassesSelectionnees(response.data.classes || []);
      setProfessionTuteur(response.data.profession || '');
      setProfessionSaisie(response.data.profession || '');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const devenirTuteur = async () => {
    if (matieresSelectionnees.length === 0) {
      alert('⚠️ Veuillez sélectionner au moins une matière');
      return;
    }
    if (classesSelectionnees.length === 0) {
      alert('⚠️ Veuillez sélectionner au moins une classe');
      return;
    }
    if (!professionSaisie.trim()) {
      alert('⚠️ Veuillez saisir votre profession');
      return;
    }
    try {
      const headers = getAuthHeader();
      await axios.post('http://localhost:5000/api/tutor/devenir', {
        matieres: matieresSelectionnees,
        classes: classesSelectionnees,
        profession: professionSaisie.trim()
      }, { headers });
      alert('✅ Félicitations ! Vous êtes maintenant tuteur volontaire !');
      setEstTuteur(true);
      window.location.reload();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la demande');
    }
  };

  const toggleMatiere = (matiere) => {
    if (matieresSelectionnees.includes(matiere)) {
      setMatieresSelectionnees(matieresSelectionnees.filter(m => m !== matiere));
    } else {
      setMatieresSelectionnees([...matieresSelectionnees, matiere]);
    }
  };

  const toggleClasse = (classe) => {
    if (classesSelectionnees.includes(classe)) {
      setClassesSelectionnees(classesSelectionnees.filter(c => c !== classe));
    } else {
      setClassesSelectionnees([...classesSelectionnees, classe]);
    }
  };

  // ============ DISPONIBILITÉS ============
  const loadDisponibilites = async (tuteurId) => {
    try {
      const headers = getAuthHeader();
      const response = await axios.get(`http://localhost:5000/api/tutor/disponibilites/${tuteurId}`, { headers });
      setDisponibilites(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const ajouterDisponibilite = async () => {
    if (!newDispo.jour || !newDispo.heure_debut || !newDispo.heure_fin) {
      alert('⚠️ Veuillez remplir tous les champs');
      return;
    }
    if (newDispo.heure_debut >= newDispo.heure_fin) {
      alert('⚠️ L\'heure de début doit être avant l\'heure de fin');
      return;
    }
    try {
      const headers = getAuthHeader();
      await axios.post('http://localhost:5000/api/tutor/disponibilites', newDispo, { headers });
      setShowDispoForm(false);
      setNewDispo({ jour: 'lundi', heure_debut: '14:00', heure_fin: '16:00' });
      loadDisponibilites(currentUser.id);
      alert('✅ Disponibilité ajoutée !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'ajout');
    }
  };

  const supprimerDisponibilite = async (id) => {
    if (window.confirm('Supprimer cette disponibilité ?')) {
      try {
        const headers = getAuthHeader();
        await axios.delete(`http://localhost:5000/api/tutor/disponibilites/${id}`, { headers });
        loadDisponibilites(currentUser.id);
        alert('✅ Disponibilité supprimée');
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  // ============ NOTIFICATIONS ============
  const loadNotifications = async () => {
    try {
      const headers = getAuthHeader();
      const response = await axios.get('http://localhost:5000/api/tutor/notifications', { headers });
      setNotifications(response.data);
      const enAttente = response.data.filter(n => n.type === 'demande_tutorat' && n.statut === 'en_attente');
      setDemandesEnAttente(enAttente);
      if (enAttente.length > 0 && notifications.length > 0) {
        try {
          const audio = new Audio('/notification.mp3');
          audio.play();
        } catch (e) {
          console.log('Son non disponible');
        }
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  };

  const repondreDemande = async (demandeId, statut) => {
    try {
      const headers = getAuthHeader();
      await axios.put(`http://localhost:5000/api/tutor/demande/${demandeId}/repondre`, 
        { statut }, 
        { headers }
      );
      alert(statut === 'accepte' ? '✅ Demande acceptée !' : '❌ Demande refusée');
      loadNotifications();
      loadMesRendezVous();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la réponse');
    }
  };

  // ============ RENDEZ-VOUS ============
  const loadMesRendezVous = async () => {
    try {
      const headers = getAuthHeader();
      const response = await axios.get('http://localhost:5000/api/tutor/mes-rendez-vous', { headers });
      setMesRendezVous(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const confirmerRendezVous = async (id, statut) => {
    try {
      const headers = getAuthHeader();
      await axios.put(`http://localhost:5000/api/tutor/rendez-vous/${id}/confirmer`, { statut }, { headers });
      alert(`✅ Rendez-vous ${statut === 'accepte' ? 'accepté' : 'refusé'} !`);
      loadMesRendezVous();
      loadNotifications();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // ============ MESSAGERIE ============
  const handleSelectEleve = (eleve) => {
    setSelectedEleve(eleve);
    const newRoomId = `room-${Math.min(eleve.id, currentUser.id)}-${Math.max(eleve.id, currentUser.id)}`;
    setRoomId(newRoomId);
    if (socket && isConnected) {
      socket.emit('join-room', newRoomId);
    }
    loadMessages(eleve.id);
  };

  const loadMessages = async (eleveId) => {
    try {
      const headers = getAuthHeader();
      const response = await axios.get(`http://localhost:5000/api/tutor/messages/${eleveId}`, { headers });
      setMessages(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const envoyerMessage = async () => {
    if (!inputMessage.trim() || !selectedEleve) return;
    const newMessage = {
      envoyeur: currentUser.id,
      destinataire: selectedEleve.id,
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
        destinataireId: selectedEleve.id
      });
    }
    try {
      const headers = getAuthHeader();
      await axios.post('http://localhost:5000/api/tutor/message', newMessage, { headers });
    } catch (error) {
      console.error('Erreur:', error);
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
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
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
    if (!selectedEleve) return;
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'message.wav');
      formData.append('destinataire', selectedEleve.id);
      formData.append('envoyeur', currentUser.id);
      const headers = getAuthHeader();
      await axios.post('http://localhost:5000/api/tutor/message-audio', formData, { headers });
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

  // ============ RENDU PROFIL ============
  const renderProfil = () => {
    if (!estTuteur) {
      return (
        <div className="devenir-section">
          <div className="devenir-form">
            <h2>⭐ Devenir tuteur volontaire</h2>
            <p>Aide les autres élèves dans leurs difficultés scolaires.</p>
            <div className="profession-choix">
              <label>👤 Quelle est ta profession / ton statut ? *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Étudiant, Enseignant, Ingénieur..."
                value={professionSaisie}
                onChange={(e) => setProfessionSaisie(e.target.value)}
                required
              />
            </div>
            <div className="matieres-choix">
              <label>📚 Sélectionne tes matières :</label>
              <div className="matieres-grid">
                {matieres.map(m => (
                  <label key={m} className={`matiere-checkbox ${matieresSelectionnees.includes(m) ? 'selected' : ''}`}>
                    <input type="checkbox" checked={matieresSelectionnees.includes(m)} onChange={() => toggleMatiere(m)} />
                    {m}
                  </label>
                ))}
              </div>
              <p className="info-text">📊 <strong>{matieresSelectionnees.length}</strong> matière(s) sélectionnée(s)</p>
            </div>
            <div className="classes-choix">
              <label>🎓 Classes que tu peux enseigner :</label>
              <div className="classes-grid">
                {classesDisponibles.map(c => (
                  <label key={c} className={`classe-checkbox ${classesSelectionnees.includes(c) ? 'selected' : ''}`}>
                    <input type="checkbox" checked={classesSelectionnees.includes(c)} onChange={() => toggleClasse(c)} />
                    {c}
                  </label>
                ))}
              </div>
              <p className="info-text">📊 <strong>{classesSelectionnees.length}</strong> classe(s) sélectionnée(s)</p>
            </div>
            <button className="devenir-btn" onClick={devenirTuteur}>🚀 Devenir tuteur</button>
            <p className="info-text">⚠️ Ta demande sera validée par un administrateur</p>
          </div>
        </div>
      );
    }

    return (
      <div className="profil-tuteur">
        <div className="profil-header">
          <h2>👨‍🏫 Mon profil tuteur</h2>
          <div className="header-actions">
            <span className="status-badge online">🟢 En ligne</span>
            <button className="notif-bell" onClick={() => setShowNotifications(!showNotifications)}>
              🔔 {demandesEnAttente.length > 0 && <span className="notif-count">{demandesEnAttente.length}</span>}
            </button>
          </div>
        </div>

        {showNotifications && renderNotifications()}

        <div className="profil-info">
          <p><strong>👤 Profession :</strong> <span className="profil-value">{professionTuteur || 'Non renseignée'}</span></p>
          <p><strong>📚 Matières :</strong> <span className="profil-value">{matieresTuteur.join(', ') || 'Aucune'}</span></p>
          <p><strong>🎓 Classes :</strong> <span className="profil-value">{classesTuteur.join(', ') || 'Aucune'}</span></p>
          <p><strong>📊 Sessions :</strong> <span className="profil-value">{mesRendezVous.filter(r => r.statut === 'terminee').length}</span></p>
          <p><strong>⭐ Note moyenne :</strong> <span className="profil-value">4.5/5</span></p>
        </div>

        {/* ===== DISPONIBILITÉS ===== */}
        <div className="disponibilites-section">
          <h3>📅 Mon emploi du temps</h3>
          <p className="dispo-hint">💡 C'est selon cet emploi du temps que vous serez sollicité</p>
          <div className="dispo-list">
            {jours.map(jour => {
              const dispoJour = disponibilites.filter(d => d.jour === jour);
              return (
                <div key={jour} className="dispo-jour">
                  <span className="jour-nom">{jour.charAt(0).toUpperCase() + jour.slice(1)}</span>
                  <div className="dispo-creneaux">
                    {dispoJour.length > 0 ? (
                      dispoJour.map(d => (
                        <span key={d.id} className="dispo-creneau">
                          {d.heure_debut} - {d.heure_fin}
                          <button className="dispo-suppr" onClick={() => supprimerDisponibilite(d.id)}>✕</button>
                        </span>
                      ))
                    ) : (
                      <span className="dispo-vide">❌ Aucun créneau</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {showDispoForm ? (
            <div className="dispo-form-container">
              <select value={newDispo.jour} onChange={(e) => setNewDispo({...newDispo, jour: e.target.value})}>
                {jours.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
              <input type="time" value={newDispo.heure_debut} onChange={(e) => setNewDispo({...newDispo, heure_debut: e.target.value})} />
              <input type="time" value={newDispo.heure_fin} onChange={(e) => setNewDispo({...newDispo, heure_fin: e.target.value})} />
              <button className="dispo-valid" onClick={ajouterDisponibilite}>✅</button>
              <button className="dispo-annul" onClick={() => setShowDispoForm(false)}>Annuler</button>
            </div>
          ) : (
            <button className="add-dispo-btn" onClick={() => setShowDispoForm(true)}>➕ Ajouter un créneau</button>
          )}
        </div>

        {/* ===== RENDEZ-VOUS ===== */}
        <div className="rendezvous-section">
          <h3>📋 Mes rendez-vous</h3>
          {mesRendezVous.length === 0 ? (
            <p className="empty-message">Aucun rendez-vous pour le moment</p>
          ) : (
            <div className="rdv-list">
              {mesRendezVous.map(rdv => (
                <div key={rdv.id} className="rdv-card">
                  <div className="rdv-info">
                    <p><strong>{rdv.prenom} {rdv.nom}</strong></p>
                    <p>📅 {rdv.date_rendezvous} - {rdv.heure_debut} à {rdv.heure_fin}</p>
                    <p>📝 {rdv.message_eleve || 'Aucun message'}</p>
                    <span className={`rdv-statut ${rdv.statut}`}>
                      {rdv.statut === 'en_attente' ? '⏳ En attente' : rdv.statut === 'accepte' ? '✅ Accepté' : '❌ Refusé'}
                    </span>
                  </div>
                  {rdv.statut === 'en_attente' && (
                    <div className="rdv-actions">
                      <button className="rdv-accepter" onClick={() => confirmerRendezVous(rdv.id, 'accepte')}>✅ Accepter</button>
                      <button className="rdv-refuser" onClick={() => confirmerRendezVous(rdv.id, 'refuse')}>❌ Refuser</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============ RENDU NOTIFICATIONS ============
  const renderNotifications = () => (
    <div className="notifications-popup">
      <div className="notifications-header">
        <h3>🔔 Notifications</h3>
        <button className="close-notif" onClick={() => setShowNotifications(false)}>✕</button>
      </div>
      <div className="notifications-list">
        {notifications.length === 0 ? (
          <p className="no-notif">Aucune notification</p>
        ) : (
          notifications.map(notif => (
            <div key={notif.id} className={`notif-item ${notif.statut}`}>
              <div className="notif-icon">
                {notif.type === 'demande_tutorat' ? '👨‍🎓' : '📅'}
              </div>
              <div className="notif-content">
                <p><strong>{notif.eleve_nom || 'Un élève'}</strong> demande un cours</p>
                <p className="notif-details">📚 {notif.matiere} | 🎓 {notif.niveau}</p>
                <p className="notif-time">{new Date(notif.created_at).toLocaleString()}</p>
                {notif.statut === 'en_attente' && (
                  <div className="notif-actions">
                    <button className="notif-accepter" onClick={() => repondreDemande(notif.id, 'accepte')}>
                      ✅ Accepter
                    </button>
                    <button className="notif-refuser" onClick={() => repondreDemande(notif.id, 'refuse')}>
                      ❌ Refuser
                    </button>
                  </div>
                )}
                {notif.statut === 'accepte' && <span className="notif-status accepte">✅ Accepté</span>}
                {notif.statut === 'refuse' && <span className="notif-status refuse">❌ Refusé</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // ============ RENDU MESSAGERIE ============
  const renderMessagerie = () => (
    <div className="messagerie-section">
      {!selectedEleve ? (
        <div className="no-chat">
          <span className="chat-icon">💬</span>
          <p>Sélectionne un élève pour commencer à discuter</p>
          <button onClick={() => setActiveTab('profil')}>📋 Retour au profil</button>
        </div>
      ) : (
        <div className="chat-container">
          <div className="chat-header">
            <button className="back-chat" onClick={() => setSelectedEleve(null)}>←</button>
            <div className="chat-tuteur">
              <strong>{selectedEleve.prenom} {selectedEleve.nom}</strong>
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

  // ============ ONGLETS ============
  const tabs = [
    { id: 'profil', name: '👨‍🏫 Profil' },
    { id: 'messagerie', name: '💬 Messages' }
  ];

  // ============ RENDU PRINCIPAL ============
  return (
    <div className="dashboard-tuteur-container">
      <header className="tuteur-header">
        <h1>👨‍🏫 TUTEUREXPRESS</h1>
        <div className="user-info">
          <span>👋 {currentUser.prenom} {currentUser.nom}</span>
          <button onClick={handleLogout} className="logout-btn">Déconnexion</button>
        </div>
      </header>

      <div className="tuteur-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <div className="tuteur-content">
        {activeTab === 'profil' && renderProfil()}
        {activeTab === 'messagerie' && renderMessagerie()}
      </div>

      {/* ===== TABLEAU BLANC MODAL ===== */}
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

export default DashboardTuteur;