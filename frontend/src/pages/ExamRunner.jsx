import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { examApi } from '../services/api';
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Loader2
} from 'lucide-react';

export default function ExamRunner() {
  const { id: attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Dados recebidos via navegação
  const sessionData = location.state?.examSession;

  // Estados principais
  const [exam, setExam] = useState(sessionData?.exam || null);
  const [questions, setQuestions] = useState(sessionData?.questions || []);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Respostas e Flags
  const [userAnswers, setUserAnswers] = useState(() => {
    const saved = localStorage.getItem(`answers_${attemptId}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [flaggedQuestions, setFlaggedQuestions] = useState(() => {
    const saved = localStorage.getItem(`flags_${attemptId}`);
    return saved ? JSON.parse(saved) : {};
  });

  // Timer
  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    const savedTimer = localStorage.getItem(`timer_${attemptId}`);
    if (savedTimer) return parseInt(savedTimer, 10);
    return (sessionData?.exam?.duration_minutes || 90) * 60;
  });

  // Submissão e Resultados
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const timerRef = useRef(null);

  // Redireciona de volta se a página for aberta sem state e sem dados
  useEffect(() => {
    if (!sessionData && !exam) {
      navigate('/dashboard');
    }
  }, [sessionData, exam, navigate]);

  // Persistência em LocalStorage
  const persistAnswers = (updated) => {
    setUserAnswers(updated);
    localStorage.setItem(`answers_${attemptId}`, JSON.stringify(updated));
  };

  const persistFlags = (updated) => {
    setFlaggedQuestions(updated);
    localStorage.setItem(`flags_${attemptId}`, JSON.stringify(updated));
  };

  // Submeter exame
  const handleSubmitExam = useCallback(async () => {
    if (submitting || result) return;
    setSubmitting(true);
    clearInterval(timerRef.current);

    try {
      const durationSeconds = (exam?.duration_minutes || 90) * 60;
      const timeSpent = Math.max(0, durationSeconds - secondsRemaining);

      const response = await examApi.submitExam(exam.id, {
        attempt_id: attemptId,
        user_answers: userAnswers,
        time_spent_seconds: timeSpent,
      });

      // Limpa dados temporários salvos do exame
      localStorage.removeItem(`answers_${attemptId}`);
      localStorage.removeItem(`flags_${attemptId}`);
      localStorage.removeItem(`timer_${attemptId}`);

      navigate(`/exam/${attemptId}/results`, { state: { resultsPayload: response } });

      setResult(response);
    } catch (err) {
      console.error('Failed to submit exam:', err);
      alert('Error submitting exam: ' + (err.message || 'Please retry.'));
      setSubmitting(false);
    }
  }, [submitting, result, exam, secondsRemaining, attemptId, userAnswers]);

  // Timer de Contagem Regressiva
  useEffect(() => {
    if (result) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmitExam();
          return 0;
        }
        const updated = prev - 1;
        // Salva periodicamente a cada 5 segundos
        if (updated % 5 === 0) {
          localStorage.setItem(`timer_${attemptId}`, updated.toString());
        }
        return updated;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [attemptId, handleSubmitExam, result]);

  // Formatação do Relógio HH:MM:SS
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? `${h}:` : ''}${m.toString().padStart(2, '0')}:${s
      .toString()
      .padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];

  // Alternar opção escolhida
  const handleOptionToggle = (optionId) => {
    if (!currentQ) return;
    const qId = currentQ.id;
    const currentSelections = userAnswers[qId] || [];

    let updatedSelections = [];

    if (currentQ.type === 'single_choice') {
      updatedSelections = [optionId];
    } else {
      // Múltipla escolha: toggle
      if (currentSelections.includes(optionId)) {
        updatedSelections = currentSelections.filter((id) => id !== optionId);
      } else {
        updatedSelections = [...currentSelections, optionId];
      }
    }

    const updatedMap = { ...userAnswers, [qId]: updatedSelections };
    persistAnswers(updatedMap);
  };

  // Alternar Flag para Revisão
  const handleToggleFlag = () => {
    if (!currentQ) return;
    const updated = {
      ...flaggedQuestions,
      [currentQ.id]: !flaggedQuestions[currentQ.id],
    };
    persistFlags(updated);
  };

  // Se o exame foi concluído, renderiza a tela de resultado/análise
  if (result) {
    const isPassed = result.attempt?.is_passed;
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 flex justify-center">
        <div className="max-w-4xl w-full space-y-8">
          {/* Header do Resultado */}
          <div
            className={`p-8 rounded-2xl border text-center ${
              isPassed
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
            }`}
          >
            <div className="inline-flex p-3 rounded-full mb-3 bg-slate-900 border border-slate-800">
              {isPassed ? (
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              ) : (
                <XCircle className="w-10 h-10 text-rose-400" />
              )}
            </div>
            <h1 className="text-3xl font-extrabold text-white">
              {isPassed ? 'Exam Passed!' : 'Exam Failed'}
            </h1>
            <p className="text-sm mt-1 text-slate-400">{exam?.title} Simulation</p>

            <div className="mt-6 flex justify-center gap-8 text-center font-mono">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Your Score</p>
                <p className="text-2xl font-bold text-white">
                  {result.attempt?.score_percentage}%
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Passing Score</p>
                <p className="text-2xl font-bold text-white">
                  {result.attempt?.passing_score_percentage}%
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Correct</p>
                <p className="text-2xl font-bold text-white">
                  {result.attempt?.correct_answers_count} / {result.attempt?.total_questions}
                </p>
              </div>
            </div>
          </div>

          {/* Breakdown por Domínio */}
          {result.attempt?.domain_scores?.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white">Domain Breakdown</h2>
              <div className="space-y-3">
                {result.attempt.domain_scores.map((d) => (
                  <div key={d.domain_id} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-300">
                      <span>{d.domain_name}</span>
                      <span className="font-mono">{d.score_percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all ${
                          d.score_percentage >= 70 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${d.score_percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="py-3 px-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-indigo-600/20"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(userAnswers).filter(
    (k) => userAnswers[k] && userAnswers[k].length > 0
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar Fixa: Status, Timer e Ação de Submissão */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-4">
          <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-bold text-xs">
            {exam?.code}
          </span>
          <span className="hidden sm:inline text-sm font-semibold text-slate-200">
            {exam?.title}
          </span>
        </div>

        {/* Timer regressivo */}
        <div
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border font-mono font-bold text-sm tracking-wider ${
            secondsRemaining < 300
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
              : 'bg-slate-950 border-slate-800 text-amber-400'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{formatTime(secondsRemaining)}</span>
        </div>

        <button
          onClick={() => setShowConfirmModal(true)}
          className="flex items-center gap-1.5 py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-emerald-600/20"
        >
          <Send className="w-3.5 h-3.5" /> Submit Exam
        </button>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        {/* Central: Questão Ativa */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-xl">
          {currentQ ? (
            <div>
              {/* Header da questão */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
                <div>
                  <span className="text-xs uppercase font-mono tracking-widest text-indigo-400 font-bold">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {currentQ.type === 'multiple_choice'
                      ? 'Select all applicable options (Multiple Choice)'
                      : 'Select one option (Single Choice)'}
                  </p>
                </div>

                <button
                  onClick={handleToggleFlag}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    flaggedQuestions[currentQ.id]
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Flag
                    className={`w-3.5 h-3.5 ${
                      flaggedQuestions[currentQ.id] ? 'fill-amber-400' : ''
                    }`}
                  />
                  {flaggedQuestions[currentQ.id] ? 'Flagged' : 'Flag for Review'}
                </button>
              </div>

              {/* Texto da questão */}
              <h2 className="text-base md:text-lg font-medium text-slate-100 leading-relaxed mb-8">
                {currentQ.question_text}
              </h2>

              {/* Opções */}
              <div className="space-y-3">
                {currentQ.options.map((opt) => {
                  const isChecked = (userAnswers[currentQ.id] || []).includes(opt.id);

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleOptionToggle(opt.id)}
                      className={`p-4 rounded-xl border flex items-start gap-4 cursor-pointer transition select-none ${
                        isChecked
                          ? 'bg-indigo-600/10 border-indigo-500/60 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/30'
                      }`}
                    >
                      <input
                        type={currentQ.type === 'multiple_choice' ? 'checkbox' : 'radio'}
                        name={`q_${currentQ.id}`}
                        checked={isChecked}
                        onChange={() => {}} // Gerenciado pelo onClick do container
                        className="mt-1 h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer"
                      />
                      <div className="text-sm leading-relaxed flex-1">
                        <span className="font-bold uppercase text-xs text-slate-400 mr-2">
                          {opt.id}.
                        </span>
                        {opt.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">No question loaded.</div>
          )}

          {/* Navegação Inferior (Prev / Next) */}
          <div className="flex justify-between items-center border-t border-slate-800/80 pt-6 mt-8">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <button
              onClick={() =>
                setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
              }
              disabled={currentIndex === questions.length - 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sidebar Lateral: Grade de Navegação das Questões */}
        <aside className="w-full md:w-80 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shrink-0 shadow-xl">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Question Navigator
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {answeredCount}/{questions.length} answered
              </span>
            </div>

            {/* Legenda */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 mb-4 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-indigo-600/40 border border-indigo-500" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-slate-950 border border-slate-800" />
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flag className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>Flagged</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded border-2 border-indigo-400" />
                <span>Current</span>
              </div>
            </div>

            {/* Grade de botões numéricos */}
            <div className="grid grid-cols-5 gap-2 max-h-[50vh] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered =
                  userAnswers[q.id] && userAnswers[q.id].length > 0;
                const isFlagged = flaggedQuestions[q.id];

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-lg font-mono text-xs font-bold relative flex items-center justify-center transition border ${
                      isCurrent
                        ? 'border-indigo-400 text-white ring-2 ring-indigo-500/20'
                        : 'border-transparent'
                    } ${
                      isAnswered
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border-slate-800'
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1">
                        <Flag className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 border-t border-slate-800/80 pt-4">
            <button
              onClick={() => setShowConfirmModal(true)}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition"
            >
              End & Submit
            </button>
          </div>
        </aside>
      </div>

      {/* Modal de Confirmação para Submissão */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Submit Examination?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              You have answered <span className="font-bold text-white">{answeredCount}</span> of{' '}
              <span className="font-bold text-white">{questions.length}</span> questions.
              {answeredCount < questions.length && (
                <span className="block mt-2 text-rose-400">
                  Warning: Unanswered questions will receive zero points.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-300 transition"
              >
                Return to Exam
              </button>
              <button
                onClick={handleSubmitExam}
                disabled={submitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold text-white transition flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  'Confirm & Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}