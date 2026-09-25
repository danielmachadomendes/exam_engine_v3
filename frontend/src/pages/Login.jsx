import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { Clock, ShieldAlert, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null); // 'pending' | 'rejected' | 'generic'
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorStatus(null);
    setErrorMessage('');

    try {
      const data = await authApi.login(formData);
      login(data.user, data.token);

      // Redireciona conforme role
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.status === 403) {
        if (err.data?.status === 'pending') {
          setErrorStatus('pending');
          setErrorMessage(
            'Your registration was received and is currently under review by an administrator.'
          );
        } else if (err.data?.status === 'rejected') {
          setErrorStatus('rejected');
          setErrorMessage(
            'Your account registration was not approved. Please contact support or your lead.'
          );
        } else {
          setErrorStatus('generic');
          setErrorMessage(err.message || 'Access forbidden.');
        }
      } else {
        setErrorStatus('generic');
        setErrorMessage(err.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Exam Engine
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Sign in to access your exam simulations and evaluation
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 py-8 px-6 shadow-xl rounded-2xl sm:px-10">
          {/* Pending Approval Notice */}
          {errorStatus === 'pending' && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-300">Pending Admin Approval</h4>
                <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Account Rejected Notice */}
          {errorStatus === 'rejected' && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-rose-300">Access Denied</h4>
                <p className="text-xs text-rose-200/80 mt-1 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Generic Error Notice */}
          {errorStatus === 'generic' && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-200 leading-relaxed">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                E-mail
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition"
                placeholder="name@company.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-slate-800/80 pt-6">
            <p className="text-xs text-slate-400">
              Don't have an account yet?{' '}
              <Link
                to="/register"
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition"
              >
                Request Registration
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}