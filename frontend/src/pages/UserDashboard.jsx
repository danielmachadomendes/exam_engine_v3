import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch, examApi } from '../services/api';
import {
  Play,
  Clock,
  HelpCircle,
  Award,
  CheckCircle2,
  XCircle,
  LogOut,
  History,
  Layers,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startingExamId, setStartingExamId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        // Busca os exames disponíveis para candidatos (/exams) e o perfil do usuário
        const [examsRes, profileRes] = await Promise.all([
          apiFetch('/exams').catch(() => []),
          apiFetch('/users/profile').catch(() => ({ attempts: [] })),
        ]);

        // Trata a resposta caso a rota devolva diretamente um array [...] ou um objeto { exams: [...] }
        const examsList = Array.isArray(examsRes) ? examsRes : (examsRes?.exams || []);

        setExams(examsList);
        setProfile(profileRes);
      } catch (err) {
        setError(err.message || 'Error loading dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const handleStartExam = async (examId) => {
    try {
      setStartingExamId(examId);
      setError(null);
      const data = await examApi.startExam(examId);

      // Limpa tentativas residuais no localStorage antes de iniciar nova
      localStorage.removeItem(`exam_state_${data.attempt_id}`);

      // Navega para o runner passando o payload da tentativa no state da rota
      navigate(`/exam/${data.attempt_id}`, { state: { examSession: data } });
    } catch (err) {
      setError(err.message || 'Failed to start the exam. Check question pool quota.');
      setStartingExamId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">Exam Portal</h1>
              <p className="text-xs text-slate-400">{user?.full_name} ({user?.email})</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-10">
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Section 1: Available Certifications */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" /> Available Exam Simulations
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select a blueprint to begin your timed, domain-weighted simulation.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading simulations...
            </div>
          ) : exams.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
              No exams currently active. Contact your administrator.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between transition shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-bold text-xs">
                        {exam.code}
                      </span>
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        Passing: {exam.passing_score_percentage}%
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-2">{exam.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {exam.description || 'Unofficial certification preparation pool.'}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 border-t border-slate-800/80 pt-4 mb-6">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{exam.duration_minutes} Minutes</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                        <span>{exam.total_questions} Questions</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartExam(exam.id)}
                    disabled={startingExamId === exam.id}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/20"
                  >
                    {startingExamId === exam.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Preparing Exam...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" /> Launch Simulator
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Historical Attempts */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" /> Attempts
            </h2>
          </div>

          {profile?.attempts?.length > 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-6">Exam</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Score</th>
                    <th className="py-3 px-6">Result</th>
                    <th className="py-3 px-6">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {profile.attempts.map((attempt) => (
                    <tr key={attempt.attempt_id} className="hover:bg-slate-850/40 transition">
                      <td className="py-3.5 px-6 font-semibold text-white">
                        {attempt.exam_code} - {attempt.exam_title}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-300">
                        {attempt.status}
                      </td>
                      <td className="py-3.5 px-6 font-bold font-mono">
                        {attempt.score_percentage !== null ? `${attempt.score_percentage}%` : '-'}
                      </td>
                      <td className="py-3.5 px-6">
                        {attempt.is_passed === true && (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" /> PASSED
                          </span>
                        )}
                        {attempt.is_passed === false && (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded">
                            <XCircle className="w-3 h-3" /> FAILED
                          </span>
                        )}
                        {attempt.is_passed === null && (
                          <span className="text-slate-500">Incomplete</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-slate-400">
                        {new Date(attempt.started_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No attempts logged yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}