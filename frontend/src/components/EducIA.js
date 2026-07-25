// src/components/EducIA.js
import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import './EducIA.css';

function EducIA({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ============ VOICE INPUT ============
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [transcript, setTranscript] = useState('');

  // ============ FILE UPLOAD ============
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);

  // ============ VOICE RECOGNITION ============
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.lang = 'fr-FR';
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;

      recognitionInstance.onstart = () => {
        setIsListening(true);
        console.log('🎤 Microphone activé');
      };

      recognitionInstance.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        setTranscript(currentText);
        setInput(currentText);
      };

      recognitionInstance.onerror = (event) => {
        console.error('❌ Erreur reconnaissance:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setError('⚠️ Autorise l\'accès au microphone');
        }
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
        console.log('🎤 Microphone désactivé');
      };

      setRecognition(recognitionInstance);
    } else {
      console.warn('⚠️ Reconnaissance vocale non supportée');
    }
  }, []);

  // ============ FONCTION VOICE ============
  const toggleListening = () => {
    if (!recognition) {
      alert('⚠️ La reconnaissance vocale n\'est pas supportée par ton navigateur');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      setTranscript('');
      recognition.start();
    }
  };

  // ============ FILE UPLOAD ============
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      const headers = getAuthHeader();
      const response = await api.post('/educIA/upload', formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          console.log(`📤 Upload: ${percent}%`);
        }
      });

      if (response.data.success) {
        const uploaded = response.data.files || [];
        setUploadedFiles(prev => [...prev, ...uploaded]);

        if (response.data.analysis) {
          const fileMsg = {
            role: 'user',
            content: `📎 J'ai uploadé un fichier :\n${response.data.analysis}\n\nPeux-tu m'aider avec ça ?`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, fileMsg]);
          sendMessage(fileMsg.content);
        }
      }
    } catch (error) {
      console.error('❌ Erreur upload:', error);
      setError('Erreur lors de l\'upload du fichier');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  // ============ DÉTECTION MOBILE ============
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ============ CHARGER LES CONVERSATIONS ============
  useEffect(() => {
    const saved = localStorage.getItem('educIA_conversations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed);
        if (parsed.length > 0) {
          setCurrentConversationId(parsed[0].id);
          setMessages(parsed[0].messages || []);
        }
      } catch (e) {
        console.error('Erreur chargement conversations:', e);
      }
    }
  }, []);

  // ============ SAUVEGARDER LES CONVERSATIONS ============
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('educIA_conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  // ============ SAUVEGARDER LES MESSAGES ============
  useEffect(() => {
    if (currentConversationId && messages.length > 0) {
      setConversations(prev =>
        prev.map(conv =>
          conv.id === currentConversationId
            ? { ...conv, messages: messages, updatedAt: new Date().toISOString() }
            : conv
        )
      );
    }
  }, [messages, currentConversationId]);

  // ============ SCROLL ============
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ============ MESSAGE DE BIENVENUE ============
  useEffect(() => {
    if (isOpen && currentConversationId && messages.length === 0) {
      const welcomeMsg = {
        role: 'assistant',
        content: `👋 Bonjour ${user?.prenom || 'cher élève'} ! Je suis **EDUC IA**, ton assistant pédagogique intelligent.\n\nJe peux t'aider à :\n• 📚 **Réviser** tes leçons\n• 🎯 **Choisir** ton orientation\n• 📝 **Résoudre** des exercices\n• 💡 **Comprendre** des concepts difficiles\n• 📎 **Analyser** des fichiers (PDF, images)\n• 🎤 **Parler** avec la reconnaissance vocale\n\nPose-moi ta question ! 🚀`
      };
      setMessages([welcomeMsg]);
    }
  }, [isOpen, currentConversationId]);

  // ============ GET AUTH ============
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    const matricule = localStorage.getItem('matricule');
    if (token) return { 'Authorization': `Bearer ${token}` };
    if (matricule) return { 'X-Matricule': matricule };
    return {};
  };

  // ============ CRÉER CONVERSATION ============
  const createNewConversation = () => {
    const newConv = {
      id: Date.now().toString(),
      title: `Conversation ${conversations.length + 1}`,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setConversations(prev => [newConv, ...prev]);
    setCurrentConversationId(newConv.id);
    setMessages([]);
    setUploadedFiles([]);
    if (isMobile) setShowSidebar(false);
  };

  // ============ CHANGER CONVERSATION ============
  const switchConversation = (convId) => {
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
      setCurrentConversationId(convId);
      setMessages(conv.messages || []);
      setError(null);
      if (isMobile) setShowSidebar(false);
    }
  };

  // ============ SUPPRIMER CONVERSATION ============
  const deleteConversation = (convId, e) => {
    e.stopPropagation();
    if (window.confirm('Supprimer cette conversation ?')) {
      const newConvs = conversations.filter(c => c.id !== convId);
      setConversations(newConvs);
      if (newConvs.length > 0) {
        setCurrentConversationId(newConvs[0].id);
        setMessages(newConvs[0].messages || []);
      } else {
        setCurrentConversationId(null);
        setMessages([]);
        createNewConversation();
      }
      localStorage.setItem('educIA_conversations', JSON.stringify(newConvs));
    }
  };

  // ============ RENOMMER CONVERSATION ============
  const renameConversation = (convId, e) => {
    e.stopPropagation();
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
      const newTitle = prompt('Nouveau titre :', conv.title);
      if (newTitle && newTitle.trim()) {
        setConversations(prev =>
          prev.map(c =>
            c.id === convId ? { ...c, title: newTitle.trim() } : c
          )
        );
      }
    }
  };

  // ============ ENVOYER UN MESSAGE ============
  const sendMessage = async (messageText = null) => {
    const messageToSend = messageText || input;
    if (!messageToSend.trim() || loading) return;

    const userMsg = { role: 'user', content: messageToSend, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    if (!messageText) setInput('');
    setLoading(true);
    setError(null);

    try {
      const headers = getAuthHeader();
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const eleveData = JSON.parse(localStorage.getItem('eleve') || '{}');
      const currentUser = eleveData.nom ? eleveData : userData;

      const contexte = `Élève: ${currentUser.prenom || ''} ${currentUser.nom || ''}, Niveau: ${currentUser.classe || currentUser.niveau || 'Non précisé'}, Établissement: ${currentUser.etablissement || 'Non précisé'}`;

      const history = messages.slice(-15).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await api.post('/educIA/chat', {
        message: messageToSend,
        historique: history,
        contexte: contexte,
        conversationId: currentConversationId,
        files: uploadedFiles.length > 0 ? uploadedFiles : undefined
      }, { headers: { ...headers, 'Content-Type': 'application/json' } });

      if (response.data.success) {
        const assistantMsg = {
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMsg]);

        if (messages.length === 0 && !conversations.find(c => c.id === currentConversationId)?.title?.includes('Conversation')) {
          const title = messageToSend.substring(0, 40) + (messageToSend.length > 40 ? '...' : '');
          setConversations(prev =>
            prev.map(c =>
              c.id === currentConversationId ? { ...c, title: title } : c
            )
          );
        }
      } else {
        setError(response.data.message || 'Erreur lors de la communication');
      }
    } catch (err) {
      console.error('Erreur EDUC IA:', err);
      setError('Impossible de contacter EDUC IA. Vérifie ta connexion.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // ============ GESTION CLAVIER ============
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ============ TOGGLE CHAT ============
  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      if (conversations.length === 0) {
        createNewConversation();
      }
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  };

  // ============ TOGGLE SIDEBAR ============
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // ============ FORMATER LE MESSAGE ============
  const formatMessage = (content) => {
    let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\n/g, '<br/>');
    formatted = formatted.replace(/• /g, '• ');
    return formatted;
  };

  // ============ SUGGESTIONS ============
  const suggestions = [
    { icon: '📚', text: 'Explique-moi le théorème de Pythagore' },
    { icon: '🎯', text: 'Quelle filière choisir si j\'aime les maths ?' },
    { icon: '📝', text: 'Aide-moi à résoudre 2x + 5 = 15' },
    { icon: '🌍', text: 'Quels sont les pays d\'Afrique de l\'Ouest ?' },
    { icon: '💼', text: 'Quels métiers bien payés en Côte d\'Ivoire ?' },
    { icon: '📖', text: 'Résume la leçon sur la Révolution française' },
  ];

  // ============ RENDU ============
  return (
    <>
      <button className={`educ-fab ${isOpen ? 'active' : ''}`} onClick={toggleChat}>
        {isOpen ? '✕' : '🤖'}
        {!isOpen && <span className="educ-badge">IA</span>}
      </button>

      {isOpen && (
        <div className="educ-window">
          <div className={`educ-sidebar ${showSidebar ? 'open' : 'closed'}`}>
            <div className="educ-sidebar-header">
              <h3>💬 Conversations</h3>
              <button className="educ-new-chat" onClick={createNewConversation}>
                ➕ Nouvelle
              </button>
            </div>
            <div className="educ-conversations-list">
              {conversations.length === 0 ? (
                <div className="educ-empty-conv">
                  <p>Aucune conversation</p>
                  <button onClick={createNewConversation}>Commencer une discussion</button>
                </div>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.id}
                    className={`educ-conv-item ${currentConversationId === conv.id ? 'active' : ''}`}
                    onClick={() => switchConversation(conv.id)}
                  >
                    <div className="educ-conv-info">
                      <span className="educ-conv-title">{conv.title || 'Sans titre'}</span>
                      <span className="educ-conv-date">
                        {new Date(conv.updatedAt || conv.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="educ-conv-actions">
                      <button className="educ-conv-rename" onClick={(e) => renameConversation(conv.id, e)}>
                        ✏️
                      </button>
                      <button className="educ-conv-delete" onClick={(e) => deleteConversation(conv.id, e)}>
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={`educ-chat-container ${showSidebar ? 'with-sidebar' : 'full'}`}>
            <div className="educ-header">
              {isMobile && (
                <button className="educ-sidebar-toggle" onClick={toggleSidebar}>
                  ☰
                </button>
              )}
              <div className="educ-header-info">
                <span className="educ-avatar">🤖</span>
                <div>
                  <h3>EDUC IA</h3>
                  <p>Assistant pédagogique • 24h/24</p>
                </div>
              </div>
              <div className="educ-header-actions">
                <button className="educ-clear" onClick={createNewConversation} title="Nouvelle conversation">
                  ➕
                </button>
                <button className="educ-close" onClick={toggleChat}>✕</button>
              </div>
            </div>

            <div className="educ-messages">
              {messages.length === 0 ? (
                <div className="educ-welcome">
                  <div className="educ-welcome-icon">🤖</div>
                  <h3>Bienvenue sur EDUC IA</h3>
                  <p>Ton assistant pédagogique intelligent 24h/24</p>
                  <div className="educ-welcome-features">
                    <span>📚 Révisions</span>
                    <span>🎯 Orientation</span>
                    <span>📝 Exercices</span>
                    <span>💡 Conseils</span>
                    <span>🎤 Vocal</span>
                    <span>📎 Fichiers</span>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`educ-message ${msg.role}`}>
                    <div className="educ-message-avatar">
                      {msg.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className="educ-message-bubble">
                      <div
                        className="educ-message-content"
                        dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                      />
                      {msg.timestamp && (
                        <div className="educ-message-time">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="educ-message assistant">
                  <div className="educ-message-avatar">🤖</div>
                  <div className="educ-message-bubble">
                    <div className="educ-typing">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="educ-error">
                  ⚠️ {error}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {messages.length <= 2 && !loading && (
              <div className="educ-suggestions">
                {suggestions.slice(0, 4).map((s, idx) => (
                  <button key={idx} className="educ-suggestion" onClick={() => sendMessage(s.text)}>
                    <span className="suggestion-icon">{s.icon}</span>
                    <span className="suggestion-text">{s.text}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="educ-input-area">
              {/* ===== BOUTONS PIÈCES JOINTES ===== */}
              <div className="educ-actions">
                <button
                  className="educ-attach-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Joindre un fichier (PDF, DOC, TXT)"
                  disabled={loading}
                >
                  📎
                </button>
                <button
                  className="educ-photo-btn"
                  onClick={() => photoInputRef.current?.click()}
                  title="Prendre ou choisir une photo"
                  disabled={loading}
                >
                  📷
                </button>
                <button
                  className={`educ-voice-btn ${isListening ? 'listening' : ''}`}
                  onClick={toggleListening}
                  title={isListening ? 'Arrêter l\'enregistrement' : 'Parler à l\'IA'}
                  disabled={loading}
                >
                  {isListening ? '⏹️' : '🎤'}
                </button>
                {uploading && <span className="educ-uploading">⏳ Upload...</span>}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />

              <textarea
                ref={inputRef}
                className="educ-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pose ta question à EDUC IA..."
                rows="2"
                disabled={loading}
              />
              <button
                className="educ-send"
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
              >
                📤
              </button>
            </div>

            {/* ===== FICHIERS UPLOADÉS ===== */}
            {uploadedFiles.length > 0 && (
              <div className="educ-files">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="educ-file-item">
                    <span className="educ-file-icon">📄</span>
                    <span className="educ-file-name">{file.filename || file.name}</span>
                    <button
                      className="educ-file-remove"
                      onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="educ-footer">
              <span>💡 Pose-moi des questions sur les cours, l'orientation, les métiers...</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EducIA;