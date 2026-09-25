import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi, apiFetch } from '../services/api';
import {
  Users,
  Layers,
  FileQuestion,
  LogOut,
  Check,
  X,
  Plus,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  Edit3,
  Save,
  Search,
  BookOpen
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'exams' | 'domains' | 'questions'

  // Feedback global
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar de Navegação */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">Exam Engine Administration</h1>
              <p className="text-xs text-slate-400">{user?.full_name}</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" /> User Approvals
            </button>

            <button
              onClick={() => setActiveTab('exams')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'exams'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" /> Exams
            </button>

            <button
              onClick={() => setActiveTab('domains')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'domains'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Domains
            </button>

            <button
              onClick={() => setActiveTab('questions')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'questions'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileQuestion className="w-4 h-4" /> Questions
            </button>
          </nav>
        </div>

        <button
          onClick={logout}
          className="mt-8 flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">
        {notification && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center gap-3 transition-all ${
              notification.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
            }`}
          >
            {notification.type === 'error' ? (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            )}
            <p className="text-sm">{notification.message}</p>
          </div>
        )}

        {activeTab === 'users' && <UserApprovalsTab notify={showNotification} />}
        {activeTab === 'exams' && <ExamsManagerTab notify={showNotification} />}
        {activeTab === 'domains' && <DomainsManagerTab notify={showNotification} />}
        {activeTab === 'questions' && <QuestionManagerTab notify={showNotification} />}
      </main>
    </div>
  );
}

// =========================================================================
// TAB 1: User Approvals
// =========================================================================
function UserApprovalsTab({ notify }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const data = await adminApi.getUsers();
      setUsers(data.users || []);
    } catch (err) {
      notify('error', err.message || 'Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await adminApi.updateUserStatus(id, status);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
      notify('success', `User successfully ${status}`);
    } catch (err) {
      notify('error', err.message || `Failed to ${status} user`);
    }
  };

  const startEditing = (user) => {
    setEditingId(user.id);
    setEditForm({ full_name: user.full_name, email: user.email, role: user.role, status: user.status });
  };

  const saveUser = async (id) => {
    try {
      const data = await adminApi.updateUser(id, editForm);
      setUsers((prev) => prev.map((u) => (u.id === id ? data.user : u)));
      setEditingId(null);
      notify('success', 'User updated successfully');
    } catch (err) {
      notify('error', err.message || 'Failed to update user');
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.full_name}? This action cannot be undone.`)) return;
    try {
      await apiFetch(`/admin/users/${user.id}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      notify('success', 'User deleted successfully');
    } catch (err) {
      notify('error', err.message || 'Failed to delete user');
    }
  };

  const visibleUsers = users.filter((item) =>
    `${item.full_name} ${item.email} ${item.role} ${item.status}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">User Management</h2>
        <p className="text-sm text-slate-400">Review, edit, approve, and remove registered accounts.</p>
      </div>

      <div className="relative max-w-xs mb-6">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users"
          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading pending users...
        </div>
      ) : users.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-slate-400">
          No users found.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Name</th>
                <th className="py-3.5 px-6">Email</th>
                <th className="py-3.5 px-6">Role</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Submitted At</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {visibleUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-850/50 transition">
                  <td className="py-4 px-6 font-medium text-white">
                    {editingId === u.id ? (
                      <input
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded"
                      />
                    ) : (
                      u.full_name
                    )}
                  </td>
                  <td className="py-4 px-6 text-slate-300 font-mono text-xs">
                    {editingId === u.id ? (
                      <input
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded"
                      />
                    ) : (
                      u.email
                    )}
                  </td>
                  <td className="py-4 px-6 text-slate-300 text-xs">
                    {editingId === u.id ? (
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        className="px-2 py-1 bg-slate-950 border border-slate-700 rounded"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    ) : (
                      u.role
                    )}
                  </td>
                  <td className="py-4 px-6 text-slate-300 text-xs">
                    {editingId === u.id ? (
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="px-2 py-1 bg-slate-950 border border-slate-700 rounded"
                      >
                        <option value="pending">pending</option>
                        <option value="approved">approved</option>
                        <option value="rejected">rejected</option>
                      </select>
                    ) : (
                      u.status
                    )}
                  </td>
                  <td className="py-4 px-6 text-slate-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    {editingId === u.id ? (
                      <button
                        onClick={() => saveUser(u.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                    ) : (
                      <button
                        onClick={() => startEditing(u)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                    {u.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(u.id, 'approved')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600 hover:text-white text-xs font-semibold transition"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}
                    {u.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(u.id, 'rejected')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white text-xs font-semibold transition"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    )}
                    <button
                      onClick={() => deleteUser(u)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/10 border border-rose-500/20 text-rose-400 text-xs font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// TAB 2: Exams Only Manager
// =========================================================================
function ExamsManagerTab({ notify }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingExamId, setEditingExamId] = useState(null);
  const [examEdit, setExamEdit] = useState({});

  const [examForm, setExamForm] = useState({
    code: '',
    title: '',
    description: '',
    duration_minutes: 90,
    total_questions: 60,
    passing_score_pct: 70.0,
  });

  const fetchExams = async () => {
    try {
      const data = await adminApi.getExams();
      setExams(data.exams || []);
    } catch (err) {
      notify('error', err.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createExam(examForm);
      notify('success', `Exam '${examForm.code}' created successfully`);
      setExamForm({
        code: '',
        title: '',
        description: '',
        duration_minutes: 90,
        total_questions: 60,
        passing_score_pct: 70.0,
      });
      fetchExams();
    } catch (err) {
      notify('error', err.message || 'Failed to create exam');
    }
  };

  const saveExam = async (id) => {
    try {
      await adminApi.updateExam(id, examEdit);
      setEditingExamId(null);
      await fetchExams();
      notify('success', 'Exam updated successfully');
    } catch (err) {
      notify('error', err.message || 'Failed to update exam');
    }
  };

  const deleteExam = async (exam) => {
    if (!window.confirm(`Delete ${exam.code}? This will also delete all associated domains and questions.`)) return;
    try {
      await adminApi.deleteExam(exam.id);
      setExams((prev) => prev.filter((item) => item.id !== exam.id));
      notify('success', 'Exam deleted successfully');
    } catch (err) {
      notify('error', err.message || 'Failed to delete exam');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Exam Management</h2>
        <p className="text-sm text-slate-400">
          Create, edit, and configure available exams, duration limits, question counts, and passing criteria.
        </p>
      </div>

      {/* Formulário: Criar Exame */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl max-w-2xl">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-indigo-400" /> Create New Exam
        </h3>
        <form onSubmit={handleCreateExam} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Code</label>
              <input
                type="text"
                required
                placeholder="CAD, CSA"
                value={examForm.code}
                onChange={(e) => setExamForm({ ...examForm, code: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-sm text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Duration (min)</label>
              <input
                type="number"
                required
                value={examForm.duration_minutes}
                onChange={(e) => setExamForm({ ...examForm, duration_minutes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-sm text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Title</label>
            <input
              type="text"
              required
              placeholder="Certified Application Developer"
              value={examForm.title}
              onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-sm text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Description</label>
            <textarea
              placeholder="Optional overview or prerequisites"
              value={examForm.description}
              onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-sm text-slate-100"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Total Questions</label>
              <input
                type="number"
                required
                value={examForm.total_questions}
                onChange={(e) => setExamForm({ ...examForm, total_questions: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-sm text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Passing %</label>
              <input
                type="number"
                step="0.1"
                required
                value={examForm.passing_score_pct}
                onChange={(e) => setExamForm({ ...examForm, passing_score_pct: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-sm text-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold text-white transition"
          >
            Save Exam
          </button>
        </form>
      </div>

      {/* Tabela de Exames */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">Configured Exams</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center p-8 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading exams...
          </div>
        ) : exams.length === 0 ? (
          <p className="p-6 text-slate-500 text-center text-sm">No exams configured yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Title & Description</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Questions</th>
                  <th className="py-3.5 px-4">Passing %</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-950/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                      {editingExamId === exam.id ? (
                        <input
                          value={examEdit.code}
                          onChange={(e) => setExamEdit({ ...examEdit, code: e.target.value })}
                          className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs"
                        />
                      ) : (
                        exam.code
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {editingExamId === exam.id ? (
                        <div className="space-y-1">
                          <input
                            value={examEdit.title}
                            onChange={(e) => setExamEdit({ ...examEdit, title: e.target.value })}
                            className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs"
                          />
                          <textarea
                            value={examEdit.description}
                            onChange={(e) => setExamEdit({ ...examEdit, description: e.target.value })}
                            placeholder="Description"
                            className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs"
                            rows={2}
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="text-white font-medium">{exam.title}</div>
                          {exam.description && <div className="text-xs text-slate-400">{exam.description}</div>}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {editingExamId === exam.id ? (
                        <input
                          type="number"
                          value={examEdit.duration_minutes}
                          onChange={(e) => setExamEdit({ ...examEdit, duration_minutes: e.target.value })}
                          className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs"
                        />
                      ) : (
                        `${exam.duration_minutes} min`
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {editingExamId === exam.id ? (
                        <input
                          type="number"
                          value={examEdit.total_questions}
                          onChange={(e) => setExamEdit({ ...examEdit, total_questions: e.target.value })}
                          className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs"
                        />
                      ) : (
                        exam.total_questions
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {editingExamId === exam.id ? (
                        <input
                          type="number"
                          step="0.1"
                          value={examEdit.passing_score_percentage}
                          onChange={(e) => setExamEdit({ ...examEdit, passing_score_percentage: e.target.value })}
                          className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs"
                        />
                      ) : (
                        `${exam.passing_score_percentage}%`
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                      {editingExamId === exam.id ? (
                        <button
                          onClick={() => saveExam(exam.id)}
                          className="px-2 py-1 rounded bg-indigo-600 text-white text-xs font-semibold"
                        >
                          <Save className="inline w-3 h-3 mr-1" /> Save
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingExamId(exam.id);
                            setExamEdit({
                              code: exam.code,
                              title: exam.title,
                              description: exam.description || '',
                              duration_minutes: exam.duration_minutes,
                              total_questions: exam.total_questions,
                              passing_score_percentage: exam.passing_score_percentage,
                            });
                          }}
                          className="px-2 py-1 rounded bg-indigo-600/10 text-indigo-300 text-xs font-semibold"
                        >
                          <Edit3 className="inline w-3 h-3 mr-1" /> Edit
                        </button>
                      )}
                      <button
                        onClick={() => deleteExam(exam)}
                        className="px-2 py-1 rounded bg-rose-600/10 text-rose-300 text-xs font-semibold"
                      >
                        <Trash2 className="inline w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// TAB 3: Domains Only Manager (Lists all domains across all exams)
// =========================================================================
function DomainsManagerTab({ notify }) {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [filterExamId, setFilterExamId] = useState('ALL');
  const [domainSearch, setDomainSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingDomainId, setEditingDomainId] = useState(null);
  const [domainEdit, setDomainEdit] = useState({});

  const [domainForm, setDomainForm] = useState({
    name: '',
    weight_percentage: '',
  });

  const fetchExams = async () => {
    try {
      const data = await adminApi.getExams();
      const examList = data.exams || [];
      setExams(examList);
      if (examList.length > 0 && !selectedExamId) {
        setSelectedExamId(examList[0].id);
      }
    } catch (err) {
      notify('error', err.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleCreateDomain = async (e) => {
    e.preventDefault();
    if (!selectedExamId) {
      notify('error', 'Please select an exam first');
      return;
    }
    try {
      await adminApi.createDomain({
        exam_id: selectedExamId,
        name: domainForm.name,
        weight_percentage: parseFloat(domainForm.weight_percentage),
      });
      notify('success', 'Domain added successfully');
      setDomainForm({ name: '', weight_percentage: '' });
      fetchExams();
    } catch (err) {
      notify('error', err.message || 'Failed to add domain');
    }
  };

  const saveDomain = async (id) => {
    try {
      await adminApi.updateDomain(id, {
        ...domainEdit,
        weight_percentage: parseFloat(domainEdit.weight_percentage),
      });
      setEditingDomainId(null);
      await fetchExams();
      notify('success', 'Domain updated successfully');
    } catch (err) {
      notify('error', err.message || 'Failed to update domain');
    }
  };

  const deleteDomain = async (domain) => {
    if (!window.confirm(`Delete ${domain.name}? This will also delete any questions under it.`)) return;
    try {
      await adminApi.deleteDomain(domain.id);
      await fetchExams();
      notify('success', 'Domain deleted successfully');
    } catch (err) {
      notify('error', err.message || 'Failed to delete domain');
    }
  };

  // Junta todos os domínios de todos os exames com a referência do exame pai
  const allDomains = exams.flatMap((exam) =>
    (exam.domains || []).map((domain) => ({
      ...domain,
      exam_id: exam.id,
      exam_code: exam.code,
      exam_title: exam.title,
    }))
  );

  const visibleDomains = allDomains.filter((d) => {
    const matchesExam = filterExamId === 'ALL' || d.exam_id === filterExamId;
    const matchesQuery = `${d.name} ${d.exam_code} ${d.exam_title}`
      .toLowerCase()
      .includes(domainSearch.toLowerCase());
    return matchesExam && matchesQuery;
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Domain Management</h2>
        <p className="text-sm text-slate-400">
          Define weighted domains and blueprint syllabus sections across all target certifications.
        </p>
      </div>

      {/* Formulário: Adicionar Domínio */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl max-w-2xl">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-400" /> Add Exam Domain
        </h3>
        <form onSubmit={handleCreateDomain} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Target Exam</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="select-custom w-full pl-3 py-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-sm text-slate-100 cursor-pointer"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.code} - {ex.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Domain Name</label>
            <input
              type="text"
              required
              placeholder="Ex: User Interface & Navigation"
              value={domainForm.name}
              onChange={(e) => setDomainForm({ ...domainForm, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-sm text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Weight Percentage (%)
            </label>
            <input
              type="number"
              step="0.1"
              required
              placeholder="Ex: 25.0"
              value={domainForm.weight_percentage}
              onChange={(e) => setDomainForm({ ...domainForm, weight_percentage: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-sm text-slate-100"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold text-white transition"
          >
            Add Domain
          </button>
        </form>
      </div>

      {/* Tabela de Todos os Domínios */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">All Domains</h3>
            <p className="text-xs text-slate-400">Total of {allDomains.length} domains configured across all exams.</p>
          </div>

          {/* Filtros: por Exame e por Busca */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <select
              value={filterExamId}
              onChange={(e) => setFilterExamId(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100"
            >
              <option value="ALL">All Exams</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.code}
                </option>
              ))}
            </select>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                value={domainSearch}
                onChange={(e) => setDomainSearch(e.target.value)}
                placeholder="Search domains..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading domains...
          </div>
        ) : visibleDomains.length === 0 ? (
          <p className="p-6 text-slate-500 text-center text-sm">No domains found matching criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Exam</th>
                  <th className="py-3.5 px-4">Domain Name</th>
                  <th className="py-3.5 px-4">Weight</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {visibleDomains.map((domain) => (
                  <tr key={domain.id} className="hover:bg-slate-950/40">
                    <td className="py-3.5 px-4 font-mono font-semibold text-indigo-300 whitespace-nowrap">
                      {domain.exam_code} - {domain.exam_title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">
                      {editingDomainId === domain.id ? (
                        <input
                          value={domainEdit.name}
                          onChange={(e) => setDomainEdit({ ...domainEdit, name: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs"
                        />
                      ) : (
                        domain.name
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400 font-mono">
                      {editingDomainId === domain.id ? (
                        <input
                          type="number"
                          step="0.1"
                          value={domainEdit.weight_percentage}
                          onChange={(e) => setDomainEdit({ ...domainEdit, weight_percentage: e.target.value })}
                          className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs"
                        />
                      ) : (
                        `${domain.weight_percentage}%`
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                      {editingDomainId === domain.id ? (
                        <button
                          onClick={() => saveDomain(domain.id)}
                          className="px-2 py-1 rounded bg-emerald-600 text-white text-xs font-semibold"
                        >
                          <Save className="inline w-3 h-3 mr-1" /> Save
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingDomainId(domain.id);
                            setDomainEdit({
                              name: domain.name,
                              weight_percentage: domain.weight_percentage,
                            });
                          }}
                          className="px-2 py-1 rounded bg-emerald-600/10 text-emerald-300 text-xs font-semibold"
                        >
                          <Edit3 className="inline w-3 h-3 mr-1" /> Edit
                        </button>
                      )}
                      <button
                        onClick={() => deleteDomain(domain)}
                        className="px-2 py-1 rounded bg-rose-600/10 text-rose-300 text-xs font-semibold"
                      >
                        <Trash2 className="inline w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// TAB 4: Question Manager (Individual Form + Bulk JSON)
// =========================================================================
function QuestionManagerTab({ notify }) {
  const [mode, setMode] = useState('single'); // 'single' | 'bulk'
  const [exams, setExams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [questionSearch, setQuestionSearch] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionEdit, setQuestionEdit] = useState({});
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedDomainId, setSelectedDomainId] = useState('');

  // Estado do formulário individual
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('single_choice');
  const [explanation, setExplanation] = useState('');
  const [options, setOptions] = useState([
    { id: 'a', text: '' },
    { id: 'b', text: '' },
    { id: 'c', text: '' },
    { id: 'd', text: '' },
  ]);
  const [correctAnswers, setCorrectAnswers] = useState(['a']);

  // Estado do Bulk JSON
  const [bulkJson, setBulkJson] = useState('');

  useEffect(() => {
    adminApi.getExams().then((res) => {
      const examList = res.exams || [];
      setExams(examList);
      if (examList.length > 0) {
        setSelectedExamId(examList[0].id);
        if (examList[0].domains?.length > 0) {
          setSelectedDomainId(examList[0].domains[0].id);
        }
      }
    });
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const data = await adminApi.getQuestions();
      setQuestions(data.questions || []);
    } catch (err) {
      notify('error', err.message || 'Failed to load questions');
    }
  };

  const handleExamChange = (examId) => {
    setSelectedExamId(examId);
    const exam = exams.find((e) => e.id === examId);
    if (exam && exam.domains?.length > 0) {
      setSelectedDomainId(exam.domains[0].id);
    } else {
      setSelectedDomainId('');
    }
  };

  const handleOptionChange = (idx, text) => {
    const updated = [...options];
    updated[idx].text = text;
    setOptions(updated);
  };

  const toggleCorrectAnswer = (optionId) => {
    if (questionType === 'single_choice') {
      setCorrectAnswers([optionId]);
    } else {
      if (correctAnswers.includes(optionId)) {
        if (correctAnswers.length > 1) {
          setCorrectAnswers(correctAnswers.filter((id) => id !== optionId));
        }
      } else {
        setCorrectAnswers([...correctAnswers, optionId]);
      }
    }
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDomainId) {
      notify('error', 'Select an exam domain first');
      return;
    }

    const payload = {
      domain_id: selectedDomainId,
      question_text: questionText,
      type: questionType,
      options,
      correct_answers: correctAnswers,
      explanation,
    };

    try {
      await apiFetch('/admin/questions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      notify('success', 'Question saved successfully');
      fetchQuestions();
      setQuestionText('');
      setExplanation('');
    } catch (err) {
      notify('error', err.message || 'Failed to save question');
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) {
        throw new Error('Payload must be a JSON array of questions');
      }

      await apiFetch('/admin/questions/bulk', {
        method: 'POST',
        body: JSON.stringify({ questions: parsed }),
      });

      notify('success', `Bulk upload of ${parsed.length} questions successful!`);
      setBulkJson('');
      fetchQuestions();
    } catch (err) {
      notify('error', err.message || 'Invalid JSON format or upload error');
    }
  };

  const activeDomains = exams.find((e) => e.id === selectedExamId)?.domains || [];
  const visibleQuestions = questions.filter((question) =>
    `${question.question_text} ${question.exam_code} ${question.exam_title} ${question.domain_name}`
      .toLowerCase()
      .includes(questionSearch.toLowerCase())
  );

  const startQuestionEdit = (question) => {
    setEditingQuestionId(question.id);
    setQuestionEdit({
      domain_id: question.domain_id,
      question_text: question.question_text,
      type: question.type,
      options: JSON.stringify(question.options, null, 2),
      correct_answers: JSON.stringify(question.correct_answers),
      explanation: question.explanation || '',
    });
  };

  const saveQuestion = async (id) => {
    try {
      await adminApi.updateQuestion(id, {
        ...questionEdit,
        options: JSON.parse(questionEdit.options),
        correct_answers: JSON.parse(questionEdit.correct_answers),
      });
      setEditingQuestionId(null);
      await fetchQuestions();
      notify('success', 'Question updated successfully');
    } catch (err) {
      notify('error', err.message || 'Invalid question JSON or update failed');
    }
  };

  const deleteQuestion = async (question) => {
    if (!window.confirm('Delete this question? This action cannot be undone.')) return;
    try {
      await adminApi.deleteQuestion(question.id);
      setQuestions((prev) => prev.filter((item) => item.id !== question.id));
      notify('success', 'Question deleted successfully');
    } catch (err) {
      notify('error', err.message || 'Failed to delete question');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Question Management</h2>
          <p className="text-sm text-slate-400">
            Create single exam questions or bulk-import formatted JSON pools.
          </p>
        </div>

        {/* Toggle Single vs Bulk */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl w-fit">
          <button
            onClick={() => setMode('single')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'single' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Form Input
          </button>
          <button
            onClick={() => setMode('bulk')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'bulk' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Bulk JSON Upload
          </button>
        </div>
      </div>

      {/* Seletor de Exame e Domínio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Target Exam</label>
          <select
            value={selectedExamId}
            onChange={(e) => handleExamChange(e.target.value)}
            className="select-custom w-full pl-3 py-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-sm text-slate-100 cursor-pointer"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.code} - {ex.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Exam Domain</label>
          <select
            value={selectedDomainId}
            onChange={(e) => setSelectedDomainId(e.target.value)}
            className="select-custom w-full pl-3 py-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-sm text-slate-100 cursor-pointer"
          >
            {activeDomains.length === 0 ? (
              <option value="">No domains found for this exam</option>
            ) : (
              activeDomains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.weight_percentage}%)
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {mode === 'single' ? (
        <form onSubmit={handleSingleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Question Prompt</label>
            <textarea
              required
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Ex: Which table stores user records in ServiceNow?"
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Question Type</label>
              <select
                value={questionType}
                onChange={(e) => {
                  setQuestionType(e.target.value);
                  if (e.target.value === 'single_choice' && correctAnswers.length > 1) {
                    setCorrectAnswers([correctAnswers[0]]);
                  }
                }}
                className="select-custom w-full pl-3 py-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-sm text-slate-100 cursor-pointer"
              >
                <option value="single_choice">Single Choice (1 Correct)</option>
                <option value="multiple_choice">Multiple Choice (Multiple Correct)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                Explanation (shown during review)
              </label>
              <input
                type="text"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Ex: The sys_user table stores user profile records."
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500"
              />
            </div>
          </div>

          {/* Opções e marcação de respostas certas */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
              Options (Check the box next to correct answer(s))
            </label>
            <div className="space-y-2.5">
              {options.map((opt, idx) => {
                const isSelected = correctAnswers.includes(opt.id);
                return (
                  <div key={opt.id} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleCorrectAnswer(opt.id)}
                      className={`w-7 h-7 shrink-0 rounded flex items-center justify-center font-bold text-xs uppercase transition border ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {opt.id}
                    </button>
                    <input
                      type="text"
                      required
                      placeholder={`Option ${opt.id.toUpperCase()} text`}
                      value={opt.text}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-sm text-slate-100"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm rounded-lg text-white transition shadow-lg shadow-indigo-600/20"
          >
            Save Question
          </button>
        </form>
      ) : (
        <form onSubmit={handleBulkSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Paste JSON Array</label>
            <textarea
              required
              rows={12}
              value={bulkJson}
              onChange={(e) => setBulkJson(e.target.value)}
              placeholder={`[
  {
    "domain_id": "${selectedDomainId || 'uuid-here'}",
    "question_text": "What is the primary table for incidents in ServiceNow?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "incident" },
      { "id": "b", "text": "problem" },
      { "id": "c", "text": "change_request" },
      { "id": "d", "text": "sys_user" }
    ],
    "correct_answers": ["a"],
    "explanation": "Incidents are recorded in the incident table which extends task."
  }
]`}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm rounded-lg text-white transition shadow-lg shadow-indigo-600/20"
          >
            <Upload className="w-4 h-4" /> Import JSON Questions
          </button>
        </form>
      )}

      <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">Question Table</h3>
            <p className="text-xs text-slate-400">Questions linked to their respective domain and parent exam.</p>
          </div>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              value={questionSearch}
              onChange={(e) => setQuestionSearch(e.target.value)}
              placeholder="Search questions, exams, domains"
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Question</th>
                <th className="py-3 px-4">Exam</th>
                <th className="py-3 px-4">Domain</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {visibleQuestions.map((question) => (
                <tr key={question.id} className="align-top hover:bg-slate-950/40">
                  <td className="py-3 px-4 min-w-[280px]">
                    {editingQuestionId === question.id ? (
                      <textarea
                        rows={3}
                        value={questionEdit.question_text}
                        onChange={(e) => setQuestionEdit({ ...questionEdit, question_text: e.target.value })}
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-sm"
                      />
                    ) : (
                      <span className="text-white">{question.question_text}</span>
                    )}
                    {editingQuestionId === question.id && (
                      <textarea
                        rows={4}
                        value={questionEdit.options}
                        onChange={(e) => setQuestionEdit({ ...questionEdit, options: e.target.value })}
                        className="w-full mt-2 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono"
                      />
                    )}
                    {editingQuestionId === question.id && (
                      <input
                        value={questionEdit.correct_answers}
                        onChange={(e) => setQuestionEdit({ ...questionEdit, correct_answers: e.target.value })}
                        placeholder='["a"]'
                        className="w-full mt-2 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono"
                      />
                    )}
                    {editingQuestionId === question.id && (
                      <input
                        value={questionEdit.explanation}
                        onChange={(e) => setQuestionEdit({ ...questionEdit, explanation: e.target.value })}
                        placeholder="Explanation"
                        className="w-full mt-2 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs"
                      />
                    )}
                  </td>
                  <td className="py-3 px-4 text-indigo-300 whitespace-nowrap">
                    {question.exam_code} - {question.exam_title}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {editingQuestionId === question.id ? (
                      <select
                        value={questionEdit.domain_id}
                        onChange={(e) => setQuestionEdit({ ...questionEdit, domain_id: e.target.value })}
                        className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs"
                      >
                        {exams
                          .flatMap((exam) => exam.domains || [])
                          .map((domain) => (
                            <option key={domain.id} value={domain.id}>
                              {domain.name}
                            </option>
                          ))}
                      </select>
                    ) : (
                      question.domain_name
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {editingQuestionId === question.id ? (
                      <select
                        value={questionEdit.type}
                        onChange={(e) => setQuestionEdit({ ...questionEdit, type: e.target.value })}
                        className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs"
                      >
                        <option value="single_choice">single</option>
                        <option value="multiple_choice">multiple</option>
                      </select>
                    ) : (
                      question.type
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {editingQuestionId === question.id ? (
                      <button
                        onClick={() => saveQuestion(question.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 mr-1 rounded bg-indigo-600 text-white text-xs"
                      >
                        <Save className="w-3 h-3" /> Save
                      </button>
                    ) : (
                      <button
                        onClick={() => startQuestionEdit(question)}
                        className="inline-flex items-center gap-1 px-2 py-1 mr-1 rounded bg-indigo-600/10 text-indigo-300 text-xs"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                    )}
                    <button
                      onClick={() => deleteQuestion(question)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-600/10 text-rose-300 text-xs"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleQuestions.length === 0 && (
            <p className="p-6 text-center text-sm text-slate-500">No questions found.</p>
          )}
        </div>
      </section>
    </div>
  );
}