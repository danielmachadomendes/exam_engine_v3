import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Award,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
  Layers
} from 'lucide-react';

export default function UserProfile() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const data = await authApi.getProfile();
        setProfileData(data);
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading candidate profile...
      </div>
    );
  }

  const user = profileData?.user;
  const attempts = profileData?.attempts || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 flex justify-center">
      <div className="max-w-5xl w-full space-y-8">
        {/* Navigation back */}
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>

        {/* Profile Details Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl font-bold font-mono">
                {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'SN'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{user?.full_name}</h1>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5" /> {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                {user?.status} Account
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase font-mono">
                {user?.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs text-slate-400">
            <div>
              <span className="block text-slate-500 uppercase text-[10px] font-bold">User ID</span>
              <span className="font-mono text-slate-300 mt-1 block truncate">{user?.id}</span>
            </div>
            <div>
              <span className="block text-slate-500 uppercase text-[10px] font-bold">
                Member Since
              </span>
              <span className="text-slate-300 mt-1 block">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
              </span>
            </div>
            <div>
              <span className="block text-slate-500 uppercase text-[10px] font-bold">
                Total Attempts Completed
              </span>
              <span className="text-slate-300 mt-1 block font-bold font-mono text-white">
                {attempts.filter((a) => a.status === 'completed').length}
              </span>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" /> Exam Attempt History
            </h2>
            <span className="text-xs text-slate-500 font-mono">{attempts.length} Records</span>
          </div>

          {attempts.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-sm">
              No examination attempts recorded yet.
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-6">Blueprint</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Score</th>
                    <th className="py-3.5 px-6">Outcome</th>
                    <th className="py-3.5 px-6">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {attempts.map((att) => (
                    <tr key={att.attempt_id} className="hover:bg-slate-850/40 transition">
                      <td className="py-4 px-6 font-semibold text-white">
                        <span className="font-mono text-indigo-400 mr-2">[{att.exam_code}]</span>
                        {att.exam_title}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-300">
                        {att.status}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-white">
                        {att.score_percentage !== null ? `${att.score_percentage}%` : '-'}
                      </td>
                      <td className="py-4 px-6">
                        {att.is_passed === true && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                          </span>
                        )}
                        {att.is_passed === false && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                            <XCircle className="w-3.5 h-3.5" /> FAILED
                          </span>
                        )}
                        {att.is_passed === null && (
                          <span className="text-slate-500 italic">Incomplete</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-mono">
                        {new Date(att.started_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}