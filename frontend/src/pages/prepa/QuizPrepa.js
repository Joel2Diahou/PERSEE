// src/pages/prepa/QuizPrepa.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuizPrepa.css';

function QuizPrepa({ user, onBack }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('entrainement');
  const [niveau, setNiveau] = useState('3eme');
  const [serie, setSerie] = useState('C');
  const [matiere, setMatiere] = useState('');
  const [selectedLecon, setSelectedLecon] = useState(null);
  const [lecons, setLecons] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizFinished, setQuizFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [examens, setExamens] = useState([]);
  const [selectedExamen, setSelectedExamen] = useState(null);
  const [examenStarted, setExamenStarted] = useState(false);
  const [examenQuestions, setExamenQuestions] = useState([]);
  const [examenFiltreNiveau, setExamenFiltreNiveau] = useState('3eme');

  const seriesDisponibles = ['A', 'C', 'D'];
  const niveaux = ['3eme', 'terminale'];

  // ============ MATIÈRES PAR SÉRIE ============
  const matieresParSerie = {
    'A': ['Philosophie', 'Français'],
    'C': ['Mathématiques', 'Physique-Chimie'],
    'D': ['Mathématiques', 'SVT', 'Physique-Chimie']
  };

  const matieres3eme = ['Mathématiques', 'Français', 'Anglais', 'Physique-Chimie'];

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    const matricule = localStorage.getItem('matricule');
    if (token) return { 'Authorization': `Bearer ${token}` };
    if (matricule) return { 'X-Matricule': matricule };
    return {};
  };

  // ============ CHARGER LES LECONS QUAND LA MATIERE CHANGE ============
  useEffect(() => {
    if (matiere && mode === 'entrainement') {
      loadLecons();
    }
  }, [matiere, niveau, serie]);

  const loadLecons = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeader();
      const res = await axios.get('http://localhost:5000/api/eleve/lecons', { headers });
      
      // Filtrer les leçons par matière et niveau
      const niveauStr = niveau === '3eme' ? '3ème' : 'Terminale';
      const filtered = res.data.filter(l => 
        l.matiere === matiere && 
        l.niveau === niveauStr
      );
      setLecons(filtered);
    } catch (error) {
      console.error('Erreur chargement leçons:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============ CHARGER LES EXAMENS ============
  useEffect(() => {
    if (mode === 'examen') {
      loadExamens();
    }
  }, [mode, examenFiltreNiveau]);

  const loadExamens = async () => {
    try {
      const headers = getAuthHeader();
      const res = await axios.get('http://localhost:5000/api/eleve/examens', { headers });
      const filtered = res.data.filter(e => e.niveau === examenFiltreNiveau);
      setExamens(filtered);
    } catch (error) {
      console.error('Erreur chargement examens:', error);
    }
  };

  // ============ GÉNÉRER UN QUIZ À PARTIR D'UNE LECON ============
  const genererQuizFromLecon = async (lecon) => {
    setSelectedLecon(lecon);
    setGeneratingQuiz(true);
    setError(null);
    
    try {
      const headers = getAuthHeader();
      const response = await axios.post('http://localhost:5000/api/prepa/generer-quiz',
        { 
          lecon_id: lecon.id,
          titre: lecon.titre,
          contenu: lecon.contenu,
          matiere: lecon.matiere,
          niveau: lecon.niveau,
          resume_ia: lecon.resume_ia
        },
        { headers: { ...headers, 'Content-Type': 'application/json' } }
      );
      
      if (response.data && response.data.questions) {
        setQuestions(response.data.questions);
        setQuizStarted(true);
        setTimeLeft(30);
        setCurrentQuestionIndex(0);
        setAnswers([]);
        setScore(0);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        setError('Impossible de générer les questions');
      }
    } catch (error) {
      console.error('Erreur génération quiz:', error);
      setError('Erreur lors de la génération du quiz');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  // ============ DÉMARRER UN EXAMEN ============
  const startExamen = (examen) => {
    setSelectedExamen(examen);
    setExamenStarted(true);
    setQuizStarted(false);
    setQuizFinished(false);
    setAnswers([]);
    setScore(0);
    setCurrentQuestionIndex(0);
    
    const questionsExtraites = extractQuestionsFromExamen(examen);
    setExamenQuestions(questionsExtraites);
    setQuestions(questionsExtraites);
    setQuizStarted(true);
  };

  const extractQuestionsFromExamen = (examen) => {
    const contenu = examen.contenu || '';
    const lignes = contenu.split('\n').filter(l => l.trim());
    const questionsSimulees = [];
    
    lignes.forEach((ligne, index) => {
      if (ligne.includes('?') || ligne.includes('question') || ligne.includes('exercice')) {
        const options = ['A', 'B', 'C', 'D'];
        const reponse = options[Math.floor(Math.random() * options.length)];
        questionsSimulees.push({
          id: index + 1000,
          question: ligne.trim(),
          type_question: 'qcm',
          options: JSON.stringify(['A', 'B', 'C', 'D']),
          reponse_correcte: reponse
        });
      }
    });
    
    if (questionsSimulees.length === 0) {
      return [
        { id: 1, question: 'Question 1: ' + examen.titre, type_question: 'qcm', options: JSON.stringify(['A', 'B', 'C', 'D']), reponse_correcte: 'A' },
        { id: 2, question: 'Question 2: ' + examen.titre, type_question: 'qcm', options: JSON.stringify(['A', 'B', 'C', 'D']), reponse_correcte: 'B' }
      ];
    }
    
    return questionsSimulees;
  };

  // ============ RÉPONDRE À UNE QUESTION ============
  const handleAnswerClick = (selectedAnswer) => {
    if (showFeedback) return;
    setSelectedAnswer(selectedAnswer);
    setShowFeedback(true);
    
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.reponse_correcte;
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    const newAnswers = [...answers, {
      question_id: currentQuestion.id,
      reponse_donnee: selectedAnswer,
      est_correcte: isCorrect,
      temps: mode === 'entrainement' ? 30 - timeLeft : null
    }];
    setAnswers(newAnswers);
    
    setTimeout(() => {
      if (currentQuestionIndex + 1 < questions.length) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setTimeLeft(30);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        finishQuiz(newAnswers);
      }
    }, 1500);
  };

  // ============ GESTION DU TEMPS ============
  useEffect(() => {
    let timer;
    if (quizStarted && !quizFinished && mode === 'entrainement' && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && quizStarted && !quizFinished && mode === 'entrainement') {
      handleTimeOut();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, quizStarted, quizFinished, mode]);

  const handleTimeOut = () => {
    if (showFeedback) return;
    setShowFeedback(true);
    setSelectedAnswer('(Temps écoulé)');
    
    const currentQuestion = questions[currentQuestionIndex];
    const newAnswers = [...answers, {
      question_id: currentQuestion.id,
      reponse_donnee: '(Temps écoulé)',
      est_correcte: false,
      temps: 0
    }];
    setAnswers(newAnswers);
    
    setTimeout(() => {
      if (currentQuestionIndex + 1 < questions.length) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setTimeLeft(30);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        finishQuiz(newAnswers);
      }
    }, 1500);
  };

  const finishQuiz = async (finalAnswers) => {
    const finalScore = finalAnswers.filter(a => a.est_correcte).length;
    
    try {
      const headers = getAuthHeader();
      await axios.post('http://localhost:5000/api/prepa/save-result', {
        matiere: matiere || 'Examen blanc',
        niveau: niveau,
        score: finalScore,
        total: questions.length,
        answers: finalAnswers,
        mode: mode === 'entrainement' ? 'entrainement' : 'examen',
        lecon_id: selectedLecon?.id || null
      }, { headers });
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    }
    
    setQuizFinished(true);
  };

  const downloadPDF = () => {
    const finalScore = answers.filter(a => a.est_correcte).length;
    const content = `
SCHOOL+ CI - RAPPORT DE RÉVISION
================================
Élève: ${user?.prenom || user?.nom || 'Élève'}
Niveau: ${niveau === '3eme' ? '3ème (BEPC)' : 'Terminale (BAC)'}
Série: ${serie || '-'}
Matière: ${matiere || 'Examen blanc'}
${selectedLecon ? 'Leçon: ' + selectedLecon.titre : ''}
Score: ${finalScore}/${questions.length}
Pourcentage: ${Math.round((finalScore / questions.length) * 100)}%
Mode: ${mode === 'entrainement' ? 'Mode entraînement (chronométré)' : 'Examen blanc'}

Date: ${new Date().toLocaleDateString()}
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_${matiere || 'examen'}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  const goBackToSelection = () => {
    setQuizStarted(false);
    setQuizFinished(false);
    setQuestions([]);
    setSelectedLecon(null);
    setSelectedExamen(null);
    setExamenStarted(false);
    setExamenQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setScore(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  // ============ RENDU DE SÉLECTION ============
  const renderSelection = () => {
    // Mode Examen
    if (mode === 'examen') {
      return (
        <div className="quiz-selection">
          <div className="mode-toggle">
            <button className={`mode-btn ${mode === 'entrainement' ? 'active' : ''}`} onClick={() => setMode('entrainement')}>
              📚 Entraînement (chrono)
            </button>
            <button className={`mode-btn ${mode === 'examen' ? 'active' : ''}`} onClick={() => setMode('examen')}>
              📝 Examen blanc
            </button>
          </div>

          <div className="examen-filters">
            <label>🎓 Classe</label>
            <div className="option-buttons">
              <button className={`option-btn ${examenFiltreNiveau === '3eme' ? 'active' : ''}`} onClick={() => setExamenFiltreNiveau('3eme')}>
                📖 3ème (BEPC)
              </button>
              <button className={`option-btn ${examenFiltreNiveau === 'terminale' ? 'active' : ''}`} onClick={() => setExamenFiltreNiveau('terminale')}>
                🎓 Terminale (BAC)
              </button>
            </div>
          </div>

          <div className="examens-list">
            <h3>📝 Examens blancs disponibles</h3>
            {examens.length === 0 ? (
              <div className="empty-state-examens">
                <span className="empty-icon">📝</span>
                <p>Aucun examen disponible pour {examenFiltreNiveau === '3eme' ? 'la 3ème' : 'la Terminale'}.</p>
                <p className="empty-hint">L'administrateur doit publier des examens.</p>
              </div>
            ) : (
              examens.map(examen => (
                <div key={examen.id} className="examen-select-card" onClick={() => startExamen(examen)}>
                  <div className="examen-select-icon">📄</div>
                  <div className="examen-select-info">
                    <h4>{examen.titre}</h4>
                    <div className="examen-select-meta">
                      <span className="meta-tag">{examen.matiere}</span>
                      <span className="meta-tag">{examen.niveau === '3eme' ? '3ème' : 'Terminale'}</span>
                      {examen.serie && <span className="meta-tag">Série {examen.serie}</span>}
                    </div>
                    <p className="examen-select-date">📅 {new Date(examen.date_publication).toLocaleDateString()}</p>
                  </div>
                  <button className="start-examen-btn">▶ Commencer</button>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    // Mode Entraînement
    const currentMatieres = niveau === '3eme' ? matieres3eme : (matieresParSerie[serie] || []);
    const showSerieSelector = niveau !== '3eme';

    return (
      <div className="quiz-selection">
        <div className="mode-toggle">
          <button className={`mode-btn ${mode === 'entrainement' ? 'active' : ''}`} onClick={() => setMode('entrainement')}>
            📚 Entraînement (chrono)
          </button>
          <button className={`mode-btn ${mode === 'examen' ? 'active' : ''}`} onClick={() => setMode('examen')}>
            📝 Examen blanc
          </button>
        </div>

        <div className="selection-options">
          <div className="option-group">
            <label>📚 Niveau</label>
            <div className="option-buttons">
              <button className={`option-btn ${niveau === '3eme' ? 'active' : ''}`} onClick={() => setNiveau('3eme')}>
                🎓 3ème (BEPC)
              </button>
              <button className={`option-btn ${niveau === 'terminale' ? 'active' : ''}`} onClick={() => setNiveau('terminale')}>
                🎓 Terminale (BAC)
              </button>
            </div>
          </div>

          {showSerieSelector && (
            <div className="option-group">
              <label>🎯 Série BAC (A, C, D)</label>
              <div className="option-buttons">
                {seriesDisponibles.map(s => (
                  <button key={s} className={`option-btn ${serie === s ? 'active' : ''}`} onClick={() => { setSerie(s); setMatiere(''); }}>
                    Série {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="option-group">
            <label>📖 Matière</label>
            <div className="matieres-grid">
              {currentMatieres.map(m => (
                <button key={m} className={`matiere-btn ${matiere === m ? 'active' : ''}`} onClick={() => setMatiere(m)}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {matiere && (
            <div className="lecons-list-entrainement">
              <h4>📚 Leçons disponibles</h4>
              {loading ? (
                <p className="loading-lecons">Chargement des leçons...</p>
              ) : lecons.length === 0 ? (
                <p className="empty-lecons">Aucune leçon pour cette matière.</p>
              ) : (
                lecons.map(lecon => (
                  <div key={lecon.id} className="lecon-select-card" onClick={() => genererQuizFromLecon(lecon)}>
                    <div className="lecon-select-icon">📖</div>
                    <div className="lecon-select-info">
                      <h4>{lecon.titre}</h4>
                      {lecon.resume_ia && <p className="lecon-select-resume">{lecon.resume_ia.substring(0, 100)}...</p>}
                    </div>
                    <button className="start-lecon-btn">
                      {generatingQuiz ? '⏳ Génération...' : '▶ Générer le quiz'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    );
  };

  // ============ ÉCRAN DE QUIZ ============
  if (quizStarted && !quizFinished && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const options = currentQuestion?.options ? JSON.parse(currentQuestion.options) : [];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    
    return (
      <div className="quiz-game-container">
        <div className="quiz-progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        
        <div className="quiz-game-header">
          <button className="quiz-exit-btn" onClick={goBackToSelection}>✕</button>
          <div className="quiz-stats">
            <span className="quiz-question-num">{currentQuestionIndex + 1}/{questions.length}</span>
            {mode === 'entrainement' && (
              <span className={`quiz-time ${timeLeft <= 10 ? 'urgent' : ''}`}>
                ⏱️ {timeLeft}s
              </span>
            )}
            {mode === 'examen' && (
              <span className="quiz-time examen-time">📝 Examen blanc</span>
            )}
          </div>
        </div>
        
        <div className="quiz-question-card">
          <h3>{currentQuestion?.question}</h3>
        </div>
        
        <div className="quiz-options-grid">
          {options.map((opt, idx) => {
            let btnClass = 'quiz-opt-btn';
            if (showFeedback) {
              if (opt === currentQuestion.reponse_correcte) {
                btnClass += ' correct';
              } else if (opt === selectedAnswer && opt !== currentQuestion.reponse_correcte) {
                btnClass += ' wrong';
              }
            }
            return (
              <button 
                key={idx} 
                className={btnClass}
                onClick={() => handleAnswerClick(opt)}
                disabled={showFeedback}
              >
                <span className="opt-letter">{String.fromCharCode(65 + idx)}</span>
                <span className="opt-text">{opt}</span>
              </button>
            );
          })}
        </div>
        
        {showFeedback && (
          <div className={`quiz-feedback ${selectedAnswer === currentQuestion.reponse_correcte ? 'feedback-correct' : 'feedback-wrong'}`}>
            {selectedAnswer === currentQuestion.reponse_correcte ? (
              <span>✅ Bonne réponse !</span>
            ) : (
              <span>❌ Mauvaise réponse. Bonne réponse : {currentQuestion.reponse_correcte}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // ============ ÉCRAN DE RÉSULTAT ============
  if (quizFinished) {
    const finalScore = answers.filter(a => a.est_correcte).length;
    const percentage = (finalScore / questions.length) * 100;
    
    return (
      <div className="result-container">
        <button className="back-result-btn" onClick={goBackToSelection}>← Retour</button>
        <div className="result-icon">{percentage >= 70 ? '🎉' : '💪'}</div>
        <h1>Résultat</h1>
        <div className="result-score">
          <span className="score-number">{finalScore}</span>
          <span className="score-total">/{questions.length}</span>
        </div>
        <div className="score-percentage">{Math.round(percentage)}%</div>
        <div className="result-message">
          {percentage >= 80 ? '🌟 Excellent ! Continue comme ça !' : 
           percentage >= 60 ? '📚 Pas mal ! Tu peux faire mieux !' : 
           '💪 Besoin de révision ? Réessaie !'}
        </div>
        <div className="result-actions">
          <button className="result-btn" onClick={goBackToSelection}>🔁 Nouveau quiz</button>
          <button className="result-btn" onClick={downloadPDF}>📄 PDF</button>
          <button className="result-btn" onClick={onBack}>🏠 Retour</button>
        </div>
      </div>
    );
  }

  // ============ RENDU PRINCIPAL ============
  return (
    <div className="quiz-prepa-container">
      <div className="quiz-prepa-header">
        <button className="back-btn" onClick={onBack}>← Retour</button>
        <h1>🎯 {mode === 'entrainement' ? 'Entraînement' : 'Examen blanc'}</h1>
      </div>

      <div className="quiz-content">
        {renderSelection()}
      </div>
    </div>
  );
}

export default QuizPrepa;