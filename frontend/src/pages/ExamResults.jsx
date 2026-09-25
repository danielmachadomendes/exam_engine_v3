import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Filter,
  Check,
  X
} from 'lucide-react';

export default function ExamResults() {
  const location = useLocation();
  const navigate = useNavigate();

  // Recebe o payload devolvido pelo endpoint POST /api/exams/:id/submit
  const resultsData = location.state?.resultsPayload;
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'incorrect' | 'correct'
  const [expandedExplanations, setExpandedExplanations] = useState({});

  if (!resultsData || !resultsData.attempt) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
          <p className="text-sm text-slate-400 mb-6">No exam result data found.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { attempt, review = [] } = resultsData;
  const isPassed = attempt.is_passed;

  const toggleExplanation = (questionId) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const filteredReview = review.filter((item) => {
    if (filterMode === 'incorrect') return !item.is_correct;
    if (filterMode === 'correct') return item.is_correct;
    return true;
  });

  const formatSeconds = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex justify-center">
      <div className="max-w-4xl w-full space-y-8">
        {/* Top Actions */}
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </Link>
          <span className="text-xs font-mono text-slate-500">
            Attempt ID: {attempt.id.substring(0, 8)}...
          </span>
        </div>

        {/* Hero Banner: PASS / FAIL */}
        <div
          className={`p-8 md:p-10 rounded-3xl border text-center shadow-2xl relative overflow-hidden ${
            isPassed
              ? 'bg-emerald-950/20 border-emerald-500/30'
              : 'bg-rose-950/20 border-rose-500/30'
          }`}
        >
          <div className="inline-flex p-4 rounded-full mb-4 bg-slate-900/90 border border-slate-800 shadow-md">
            {isPassed ? (
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            ) : (
              <XCircle className="w-12 h-12 text-rose-400" />
            )}
          </div>

          <h1
            className={`text-4xl md:text-5xl font-black tracking-tight ${
              isPassed ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isPassed ? 'PASS' : 'FAIL'}
          </h1>
          <p className="text-xs uppercase tracking-widest text-slate-400 mt-2 font-semibold">
            Official Simulation Verdict
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-800/80">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Your Score
              </p>
              <p className="text-2xl font-bold font-mono text-white mt-0.5">
                {attempt.score_percentage}%
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Required
              </p>
              <p className="text-2xl font-bold font-mono text-white mt-0.5">
                {attempt.passing_score_percentage}%
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Correct Answers
              </p>
              <p className="text-2xl font-bold font-mono text-white mt-0.5">
                {attempt.correct_answers_count} / {attempt.total_questions}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Time Spent
              </p>
              <p className="text-2xl font-bold font-mono text-white mt-0.5">
                {formatSeconds(attempt.time_spent_seconds || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Domain-by-Domain Performance */}
        {attempt.domain_scores && attempt.domain_scores.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white tracking-tight">
              Domain Performance Breakdown
            </h2>
            <div className="space-y-4">
              {attempt.domain_scores.map((d) => (
                <div key={d.domain_id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-200">{d.domain_name}</span>
                    <span className="font-mono text-slate-400">
                      {d.correct_questions}/{d.total_questions} (
                      <span
                        className={`font-bold ${
                          d.score_percentage >= 70 ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {d.score_percentage}%
                      </span>
                      )
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
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

        {/* Detailed Question Review List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Detailed Questions Review ({review.length})
            </h2>

            {/* Filter buttons */}
            <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl w-fit">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  filterMode === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode('incorrect')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  filterMode === 'incorrect'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Incorrect Only
              </button>
              <button
                onClick={() => setFilterMode('correct')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  filterMode === 'correct'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Correct Only
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredReview.map((q, idx) => (
              <div
                key={q.question_id}
                className={`bg-slate-900 border rounded-2xl p-6 transition shadow-md ${
                  q.is_correct ? 'border-slate-800' : 'border-rose-900/40 bg-rose-950/10'
                }`}
              >
                {/* Question Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs font-bold">
                      Q{idx + 1}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {q.domain_name}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      q.is_correct
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {q.is_correct ? (
                      <>
                        <Check className="w-3 h-3" /> Correct
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3" /> Incorrect
                      </>
                    )}
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-100 leading-relaxed mb-4">
                  {q.question_text}
                </p>

                {/* Options List */}
                <div className="space-y-2 mb-4">
                  {q.options.map((opt) => {
                    const isUserChoice = (q.user_answers || []).includes(opt.id);
                    const isTargetCorrect = (q.correct_answers || []).includes(opt.id);

                    let badgeColor = 'bg-slate-950/60 border-slate-800 text-slate-300';
                    if (isTargetCorrect) {
                      badgeColor = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200';
                    } else if (isUserChoice && !isTargetCorrect) {
                      badgeColor = 'bg-rose-950/40 border-rose-500/60 text-rose-200';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between ${badgeColor}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold uppercase">{opt.id}.</span>
                          <span>{opt.text}</span>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-[10px]">
                          {isUserChoice && (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              Your Answer
                            </span>
                          )}
                          {isTargetCorrect && (
                            <span className="px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold">
                              Correct Key
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation accordion */}
                {q.explanation && (
                  <div className="border-t border-slate-800/80 pt-3">
                    <button
                      onClick={() => toggleExplanation(q.question_id)}
                      className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      {expandedExplanations[q.question_id] ? (
                        <>
                          Hide Explanation <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          Show Explanation <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                    {expandedExplanations[q.question_id] && (
                      <p className="mt-2 text-xs text-slate-300 bg-slate-950 p-3.5 rounded-xl border border-slate-800 leading-relaxed">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}