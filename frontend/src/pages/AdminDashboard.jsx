import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi, apiFetch } from '../services/api';
import AdminModal from '../components/AdminModal';
import PaginationControls from '../components/PaginationControls';
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
  BookOpen,
  Download,
  Flag,
  ClipboardList,
  ScrollText,
} from 'lucide-react';

const TABLE_ACTION_BUTTON_CLASS =
  'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  // Feedback global
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }, []);

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

            <button
              onClick={() => setActiveTab('issues')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'issues'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Flag className="w-4 h-4" /> Reported issues
            </button>

            <button
              onClick={() => setActiveTab('attempts')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'attempts'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ClipboardList className="w-4 h-4" /> Exam attempts
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'audit'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ScrollText className="w-4 h-4" /> Audit log
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
        {activeTab === 'issues' && <QuestionIssuesTab notify={showNotification} />}
        {activeTab === 'attempts' && <ExamAttemptsTab notify={showNotification} />}
        {activeTab === 'audit' && <AuditLogsTab notify={showNotification} />}
      </main>
    </div>
  );
}

function CsvTools({ entity, notify, onImported, hint = 'Keep IDs to update; blank IDs add rows. Missing rows are not deleted.' }) {
  const fileInput = useRef(null);
  const [busy, setBusy] = useState(false);

  const exportCsv = async () => {
    setBusy(true);
    try {
      const blob = await adminApi.exportCsv(entity);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${entity}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      notify('error', err.message || `Failed to export ${entity}`);
    } finally {
      setBusy(false);
    }
  };

  const importCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    if (!file.name.toLowerCase().endsWith('.csv')) {
      notify('error', 'Choose a .csv file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      notify('error', 'CSV files cannot be larger than 10 MB');
      return;
    }

    setBusy(true);
    try {
      const result = await adminApi.importCsv(entity, await file.text());
      notify('success', result.message || `${entity} imported successfully`);
      await onImported();
    } catch (err) {
      notify('error', err.message || `Failed to import ${entity}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={fileInput}
        type="file"
        accept=".csv,text/csv"
        onChange={importCsv}
        className="hidden"
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => fileInput.current?.click()}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
      >
        <Upload className="h-4 w-4" /> Import CSV
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={exportCsv}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
      >
        <Download className="h-4 w-4" /> Export CSV
      </button>
      <span className="text-xs text-slate-500">{hint}</span>
    </div>
  );
}

// =========================================================================
// TAB 1: User Approvals
// =========================================================================
function UserApprovalsTab({ notify }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'user',
    status: 'pending',
  });
  const [editForm, setEditForm] = useState({});
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [usersReload, setUsersReload] = useState(0);
  const [pagination, setPagination] = useState({ page_size: 25, total: 0, total_pages: 0 });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setAppliedSearch(search.trim());
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    adminApi.getUsers({ page, page_size: pagination.page_size, search: appliedSearch })
      .then((data) => {
        if (!active) return;
        setUsers(data.users || []);
        setPagination(data.pagination || { page, page_size: 25, total: 0, total_pages: 0 });
        if (data.pagination && page > Math.max(data.pagination.total_pages, 1)) {
          setPage(Math.max(data.pagination.total_pages, 1));
        }
      })
      .catch((err) => {
        if (active) notify('error', err.message || 'Failed to load users');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [appliedSearch, page, pagination.page_size, usersReload, notify]);

  const handleStatusChange = async (id, status) => {
    try {
      await adminApi.updateUserStatus(id, status);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
      setUsersReload((value) => value + 1);
      notify('success', `User successfully ${status}`);
    } catch (err) {
      notify('error', err.message || `Failed to ${status} user`);
    }
  };

  const startEditing = (user) => {
    setEditingUser(user);
    setEditForm({ full_name: user.full_name, email: user.email, role: user.role, status: user.status });
  };

  const saveUser = async (event) => {
    event.preventDefault();
    try {
      const data = await adminApi.updateUser(editingUser.id, editForm);
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? data.user : u)));
      setUsersReload((value) => value + 1);
      setEditingUser(null);
      notify('success', 'User updated successfully');
    } catch (err) {
      notify('error', err.message || 'Failed to update user');
    }
  };

  const createUser = async (event) => {
    event.preventDefault();
    try {
      await adminApi.createUser(createUserForm);
      setCreateUserOpen(false);
      setCreateUserForm({ full_name: '', email: '', password: '', role: 'user', status: 'pending' });
      setUsersReload((value) => value + 1);
      notify('success', 'User created successfully');
    } catch (err) {
      notify('error', err.message || 'Failed to create user');
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.full_name}? This action cannot be undone.`)) return;
    try {
      await apiFetch(`/admin/users/${user.id}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      setUsersReload((value) => value + 1);
      notify('success', 'User deleted successfully');
    } catch (err) {
      notify('error', err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">User Management</h2>
        <p className="text-sm text-slate-400">Review, edit, approve, and remove registered accounts.</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCreateUserOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" /> Add user
        </button>
          <CsvTools
            entity="users"
            notify={notify}
            onImported={() => setUsersReload((value) => value + 1)}
            hint="New users need a password; exports leave password blank. Keep IDs to update; blank IDs add rows."
          />
        </div>
      </div>

      <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">User table</h3>
            <p className="text-xs text-slate-400">There's a total of {pagination.total} registered users.</p>
          </div>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users"
              aria-label="Search users"
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100"
            />
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center p-10 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading users...
          </div>
        ) : pagination.total === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
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
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-850/50 transition">
                  <td className="py-4 px-6 font-medium text-white">{u.full_name}</td>
                  <td className="py-4 px-6 text-slate-300 font-mono text-xs">{u.email}</td>
                  <td className="py-4 px-6 text-slate-300 text-xs">{u.role}</td>
                  <td className="py-4 px-6 text-slate-300 text-xs">{u.status}</td>
                  <td className="py-4 px-6 text-slate-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => startEditing(u)}
                        className={`${TABLE_ACTION_BUTTON_CLASS} border-indigo-500/20 bg-indigo-600/10 text-indigo-300 hover:bg-indigo-600 hover:text-white`}
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                      {u.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(u.id, 'approved')}
                          className={`${TABLE_ACTION_BUTTON_CLASS} border-emerald-500/20 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white`}
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                      )}
                      {u.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(u.id, 'rejected')}
                          className={`${TABLE_ACTION_BUTTON_CLASS} border-rose-500/20 bg-rose-600/10 text-rose-400 hover:bg-rose-600 hover:text-white`}
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      )}
                      <button
                        onClick={() => deleteUser(u)}
                        className={`${TABLE_ACTION_BUTTON_CLASS} border-rose-500/20 bg-rose-600/10 text-rose-300 hover:bg-rose-600 hover:text-white`}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationControls
            page={page}
            pageSize={pagination.page_size}
            total={pagination.total}
            totalPages={pagination.total_pages}
            onPageChange={setPage}
          />
          </div>
        )}
      </section>
      <AdminModal open={Boolean(editingUser)} title="Edit user" onClose={() => setEditingUser(null)}>
        <form onSubmit={saveUser} className="space-y-4">
          <label className="block text-xs font-semibold uppercase text-slate-300">
            Full name
            <input required value={editForm.full_name || ''} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="block text-xs font-semibold uppercase text-slate-300">
            Email
            <input type="email" required value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold uppercase text-slate-300">
              Role
              <select value={editForm.role || 'user'} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                <option value="user">user</option><option value="admin">admin</option>
              </select>
            </label>
            <label className="block text-xs font-semibold uppercase text-slate-300">
              Status
              <select value={editForm.status || 'pending'} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                <option value="pending">pending</option><option value="approved">approved</option><option value="rejected">rejected</option>
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEditingUser(null)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancel</button>
            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"><Save className="mr-1 inline h-4 w-4" />Save user</button>
          </div>
        </form>
      </AdminModal>
      <AdminModal open={createUserOpen} title="Create user" onClose={() => setCreateUserOpen(false)}>
        <form onSubmit={createUser} className="space-y-4">
          <label className="block text-xs font-semibold uppercase text-slate-300">
            Full name
            <input required maxLength={150} value={createUserForm.full_name} onChange={(e) => setCreateUserForm({ ...createUserForm, full_name: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="block text-xs font-semibold uppercase text-slate-300">
            Email
            <input type="email" required maxLength={255} value={createUserForm.email} onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="block text-xs font-semibold uppercase text-slate-300">
            Initial password
            <input type="password" required autoComplete="new-password" value={createUserForm.password} onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold uppercase text-slate-300">
              Role
              <select value={createUserForm.role} onChange={(e) => setCreateUserForm({ ...createUserForm, role: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                <option value="user">user</option><option value="admin">admin</option>
              </select>
            </label>
            <label className="block text-xs font-semibold uppercase text-slate-300">
              Status
              <select value={createUserForm.status} onChange={(e) => setCreateUserForm({ ...createUserForm, status: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                <option value="pending">pending</option><option value="approved">approved</option><option value="rejected">rejected</option>
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setCreateUserOpen(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancel</button>
            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"><Plus className="mr-1 inline h-4 w-4" />Create user</button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}

// =========================================================================
// TAB 2: Exams Only Manager
// =========================================================================
function ExamsManagerTab({ notify }) {
  const [exams, setExams] = useState([]);
  const [examSearch, setExamSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingExamId, setEditingExamId] = useState(null);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const emptyExam = {
    code: '',
    title: '',
    description: '',
    display_order: 0,
    duration_minutes: 90,
    total_questions: 60,
    passing_score_pct: 70.0,
  };
  const [examForm, setExamForm] = useState(emptyExam);

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
      if (editingExamId) {
        const { passing_score_pct, ...fields } = examForm;
        await adminApi.updateExam(editingExamId, {
          ...fields,
          passing_score_percentage: passing_score_pct,
        });
        notify('success', 'Exam updated successfully');
      } else {
        await adminApi.createExam(examForm);
        notify('success', `Exam '${examForm.code}' created successfully`);
      }
      setExamModalOpen(false);
      setEditingExamId(null);
      setExamForm(emptyExam);
      await fetchExams();
    } catch (err) {
      notify('error', err.message || 'Failed to save exam');
    }
  };

  const openCreateExam = () => {
    setEditingExamId(null);
    setExamForm(emptyExam);
    setExamModalOpen(true);
  };

  const openEditExam = (exam) => {
    setEditingExamId(exam.id);
    setExamForm({
      code: exam.code,
      title: exam.title,
      description: exam.description || '',
      display_order: exam.display_order,
      duration_minutes: exam.duration_minutes,
      total_questions: exam.total_questions,
      passing_score_pct: exam.passing_score_percentage,
    });
    setExamModalOpen(true);
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

  const visibleExams = exams.filter((exam) =>
    `${exam.code} ${exam.title} ${exam.description || ''}`
      .toLowerCase()
      .includes(examSearch.trim().toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Exam Management</h2>
        <p className="text-sm text-slate-400">
          Create, edit, and configure available exams, duration limits, question counts, and passing criteria.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={openCreateExam} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
          <Plus className="h-4 w-4" /> Create exam
        </button>
        <CsvTools entity="exams" notify={notify} onImported={fetchExams} />
      </div>

      <AdminModal
        open={examModalOpen}
        title={editingExamId ? 'Edit exam' : 'Create exam'}
        onClose={() => setExamModalOpen(false)}
      >
        <form onSubmit={handleCreateExam} className="space-y-4">

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Dashboard order</label>
            <input
              type="number"
              min="0"
              max="1000000"
              step="1"
              required
              value={examForm.display_order}
              onChange={(e) => setExamForm({ ...examForm, display_order: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-sm text-slate-100"
            />
          </div>

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

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setExamModalOpen(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancel</button>
            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Save Exam</button>
          </div>
        </form>
      </AdminModal>

      {/* Tabela de Exames */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">Exam table</h3>
            <p className="text-xs text-slate-400">There's a total of {exams.length} exams configured.</p>
          </div>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              value={examSearch}
              onChange={(e) => setExamSearch(e.target.value)}
              placeholder="Search exams"
              aria-label="Search exams"
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100"
            />
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center p-10 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading exams...
          </div>
        ) : visibleExams.length === 0 ? (
          <p className="p-6 text-slate-500 text-center text-sm">
            {exams.length === 0 ? 'No exams configured yet.' : 'No exams found.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Order</th>
                  <th className="py-3.5 px-4">Title & Description</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Questions</th>
                  <th className="py-3.5 px-4">Passing %</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {visibleExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-950/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">{exam.code}</td>
                    <td className="py-3.5 px-4 text-slate-300">{exam.display_order}</td>
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="text-white font-medium">{exam.title}</div>
                        {exam.description && <div className="text-xs text-slate-400">{exam.description}</div>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {`${exam.duration_minutes} min`}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {exam.total_questions}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {`${exam.passing_score_percentage}%`}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditExam(exam)} className={`${TABLE_ACTION_BUTTON_CLASS} border-indigo-500/20 bg-indigo-600/10 text-indigo-300 hover:bg-indigo-600 hover:text-white`}>
                          <Edit3 className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => deleteExam(exam)}
                          className={`${TABLE_ACTION_BUTTON_CLASS} border-rose-500/20 bg-rose-600/10 text-rose-300 hover:bg-rose-600 hover:text-white`}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
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
  const [domainModalOpen, setDomainModalOpen] = useState(false);

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

  const handleSaveDomain = async (e) => {
    e.preventDefault();
    if (!editingDomainId && !selectedExamId) {
      notify('error', 'Please select an exam first');
      return;
    }
    try {
      const payload = {
        name: domainForm.name,
        weight_percentage: parseFloat(domainForm.weight_percentage),
      };
      if (editingDomainId) {
        await adminApi.updateDomain(editingDomainId, payload);
        notify('success', 'Domain updated successfully');
      } else {
        await adminApi.createDomain({ exam_id: selectedExamId, ...payload });
        notify('success', 'Domain added successfully');
      }
      setDomainModalOpen(false);
      setEditingDomainId(null);
      setDomainForm({ name: '', weight_percentage: '' });
      await fetchExams();
    } catch (err) {
      notify('error', err.message || 'Failed to save domain');
    }
  };

  const openCreateDomain = () => {
    setEditingDomainId(null);
    setDomainForm({ name: '', weight_percentage: '' });
    setDomainModalOpen(true);
  };

  const openEditDomain = (domain) => {
    setEditingDomainId(domain.id);
    setDomainForm({ name: domain.name, weight_percentage: domain.weight_percentage });
    setDomainModalOpen(true);
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

      <div className="flex flex-wrap gap-2">
        <button onClick={openCreateDomain} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
          <Plus className="h-4 w-4" /> Add domain
        </button>
        <CsvTools entity="domains" notify={notify} onImported={fetchExams} />
      </div>

      <AdminModal
        open={domainModalOpen}
        title={editingDomainId ? 'Edit domain' : 'Add exam domain'}
        onClose={() => setDomainModalOpen(false)}
      >
        <form onSubmit={handleSaveDomain} className="space-y-4">
          {!editingDomainId && (
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
          )}

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

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setDomainModalOpen(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancel</button>
            <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">{editingDomainId ? 'Save Domain' : 'Add Domain'}</button>
          </div>
        </form>
      </AdminModal>

      {/* Tabela de Todos os Domínios */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Domain table</h3>
            <p className="text-xs text-slate-400">There's a total of {allDomains.length} domains configured across all exams.</p>
          </div>

          {/* Filtros: por Exame e por Busca */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <select
              value={filterExamId}
              onChange={(e) => setFilterExamId(e.target.value)}
              aria-label="Filter domains by exam"
              className="select-custom w-full pl-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 cursor-pointer"
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
                aria-label="Search domains"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-10 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading domains...
          </div>
        ) : visibleDomains.length === 0 ? (
          <p className="p-6 text-slate-500 text-center text-sm">No domains found matching criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Exam</th>
                  <th className="py-3.5 px-4">Domain Name</th>
                  <th className="py-3.5 px-4">Weight</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {visibleDomains.map((domain) => (
                  <tr key={domain.id} className="hover:bg-slate-950/40 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-indigo-300 whitespace-nowrap">
                      {domain.exam_code} - {domain.exam_title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">{domain.name}</td>
                    <td className="py-3.5 px-4 text-emerald-400 font-mono">
                      {`${domain.weight_percentage}%`}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditDomain(domain)} className={`${TABLE_ACTION_BUTTON_CLASS} border-emerald-500/20 bg-emerald-600/10 text-emerald-300 hover:bg-emerald-600 hover:text-white`}>
                          <Edit3 className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => deleteDomain(domain)}
                          className={`${TABLE_ACTION_BUTTON_CLASS} border-rose-500/20 bg-rose-600/10 text-rose-300 hover:bg-rose-600 hover:text-white`}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// =========================================================================
// TAB 4: Question Manager (Individual Form + Bulk JSON)
// =========================================================================
function QuestionManagerTab({ notify }) {
  const [exams, setExams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [questionSearch, setQuestionSearch] = useState('');
  const [appliedQuestionSearch, setAppliedQuestionSearch] = useState('');
  const [questionPage, setQuestionPage] = useState(1);
  const [questionPagination, setQuestionPagination] = useState({ page_size: 25, total: 0, total_pages: 0 });
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionReload, setQuestionReload] = useState(0);
  const [questionModal, setQuestionModal] = useState(null);
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
    }).catch((err) => notify('error', err.message || 'Failed to load exams'));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuestionPage(1);
      setAppliedQuestionSearch(questionSearch.trim());
    }, 300);
    return () => clearTimeout(timeout);
  }, [questionSearch]);

  useEffect(() => {
    let active = true;
    setQuestionsLoading(true);
    adminApi.getQuestions({
      search: appliedQuestionSearch,
      page: questionPage,
      page_size: questionPagination.page_size,
    }).then((data) => {
      if (!active) return;
      setQuestions(data.questions || []);
      setQuestionPagination(data.pagination || { page: questionPage, page_size: 25, total: 0, total_pages: 0 });
      if (data.pagination && questionPage > Math.max(data.pagination.total_pages, 1)) {
        setQuestionPage(Math.max(data.pagination.total_pages, 1));
      }
    }).catch((err) => {
      if (active) notify('error', err.message || 'Failed to load questions');
    }).finally(() => {
      if (active) setQuestionsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [appliedQuestionSearch, questionPage, questionPagination.page_size, questionReload, notify]);

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

  const handleOptionCountChange = (count) => {
    const updatedOptions = Array.from({ length: count }, (_, index) => {
      const id = String.fromCharCode(97 + index);
      return options.find((option) => option.id === id) || { id, text: '' };
    });
    const validCorrectAnswers = questionType === 'drag_and_drop'
      ? correctAnswers.filter((pair) =>
          Array.isArray(pair) &&
          updatedOptions.some((option) => option.id === pair[0]) &&
          updatedOptions.some((option) => option.id === pair[1])
        )
      : correctAnswers.filter((id) => updatedOptions.some((option) => option.id === id));
    setOptions(updatedOptions);
    setCorrectAnswers(
      validCorrectAnswers.length
        ? validCorrectAnswers
        : questionType === 'drag_and_drop'
          ? []
          : [updatedOptions[0].id]
    );
  };

  const handleQuestionTypeChange = (type) => {
    setQuestionType(type);
    if (type === 'drag_and_drop') {
      setOptions((current) => {
        const evenLength = current.length % 2 === 0 ? current.length : Math.min(current.length + 1, 14);
        return Array.from({ length: evenLength }, (_, index) =>
          current[index] || { id: String.fromCharCode(97 + index), text: '' }
        );
      });
      setCorrectAnswers([]);
    } else if (questionType === 'drag_and_drop') {
      setCorrectAnswers([options[0].id]);
    } else if (type === 'single_choice' && correctAnswers.length > 1) {
      setCorrectAnswers([correctAnswers[0]]);
    }
  };

  const updateMatchingAnswer = (leftId, rightId) => {
    setCorrectAnswers((current) => {
      const pairs = current.filter((pair) => Array.isArray(pair) && pair[0] !== leftId && (!rightId || pair[1] !== rightId));
      if (!rightId) return pairs;
      return [...pairs, [leftId, rightId]];
    });
  };

  const handleEditedOptionCountChange = (count) => {
    const currentOptions = Array.isArray(questionEdit.options) ? questionEdit.options : [];
    const updatedOptions = Array.from({ length: count }, (_, index) => {
      if (currentOptions[index]) return currentOptions[index];
      let id = String.fromCharCode(97 + index);
      while (currentOptions.some((option) => option.id === id)) id = `answer-${index + 1}`;
      return { id, text: '' };
    });
    const availableIds = updatedOptions.map((option) => option.id);
    const answers = questionEdit.type === 'drag_and_drop'
      ? (questionEdit.correct_answers || []).filter((pair) =>
          Array.isArray(pair) && availableIds.includes(pair[0]) && availableIds.includes(pair[1])
        )
      : (questionEdit.correct_answers || []).filter((id) => availableIds.includes(id));
    setQuestionEdit({
      ...questionEdit,
      options: updatedOptions,
      correct_answers: answers.length
        ? answers
        : questionEdit.type === 'drag_and_drop'
          ? []
          : [updatedOptions[0].id],
    });
  };

  const handleEditedQuestionTypeChange = (type) => {
    const currentOptions = questionEdit.options || [];
    if (type === 'drag_and_drop') {
      const evenLength = currentOptions.length % 2 === 0 ? currentOptions.length : Math.min(currentOptions.length + 1, 14);
      const options = Array.from({ length: evenLength }, (_, index) =>
        currentOptions[index] || { id: String.fromCharCode(97 + index), text: '' }
      );
      setQuestionEdit({ ...questionEdit, type, options, correct_answers: [] });
    } else {
      const answers = Array.isArray(questionEdit.correct_answers) &&
        !questionEdit.correct_answers.some(Array.isArray)
        ? questionEdit.correct_answers
        : [currentOptions[0]?.id].filter(Boolean);
      setQuestionEdit({
        ...questionEdit,
        type,
        correct_answers: type === 'single_choice' ? [answers[0] || currentOptions[0]?.id] : answers,
      });
    }
  };

  const updateEditedMatchingAnswer = (leftId, rightId) => {
    const current = questionEdit.correct_answers || [];
    const pairs = current.filter((pair) => Array.isArray(pair) && pair[0] !== leftId && (!rightId || pair[1] !== rightId));
    setQuestionEdit({
      ...questionEdit,
      correct_answers: rightId ? [...pairs, [leftId, rightId]] : pairs,
    });
  };

  const toggleEditedCorrectAnswer = (optionId) => {
    if (questionEdit.type === 'single_choice') {
      setQuestionEdit({ ...questionEdit, correct_answers: [optionId] });
      return;
    }
    const answers = questionEdit.correct_answers || [];
    setQuestionEdit({
      ...questionEdit,
      correct_answers: answers.includes(optionId)
        ? (answers.length > 1 ? answers.filter((id) => id !== optionId) : answers)
        : [...answers, optionId],
    });
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
      setQuestionModal(null);
      setQuestionReload((value) => value + 1);
      setQuestionText('');
      setExplanation('');
    } catch (err) {
      const message = err.data?.detail
        ? `${err.message}: ${err.data.detail}`
        : err.message || 'Failed to save question';
      notify('error', message);
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
      setQuestionModal(null);
      setQuestionReload((value) => value + 1);
    } catch (err) {
      notify('error', err.message || 'Invalid JSON format or upload error');
    }
  };

  const activeDomains = exams.find((e) => e.id === selectedExamId)?.domains || [];
  const editDomainExam = exams.find((exam) =>
    exam.domains?.some((domain) => domain.id === questionEdit.domain_id)
  );
  const editDomains = editDomainExam?.domains || [];
  const startQuestionEdit = (question) => {
    setEditingQuestionId(question.id);
    setQuestionEdit({
      domain_id: question.domain_id,
      question_text: question.question_text,
      type: question.type,
      options: question.options,
      correct_answers: question.correct_answers,
      explanation: question.explanation || '',
    });
    setQuestionModal('edit');
  };

  const saveQuestion = async (event) => {
    event.preventDefault();
    try {
      await adminApi.updateQuestion(editingQuestionId, questionEdit);
      setEditingQuestionId(null);
      setQuestionModal(null);
      setQuestionReload((value) => value + 1);
      notify('success', 'Question updated successfully');
    } catch (err) {
      const message = err.data?.detail
        ? `${err.message}: ${err.data.detail}`
        : err.message || 'Invalid question JSON or update failed';
      notify('error', message);
    }
  };

  const deleteQuestion = async (question) => {
    if (!window.confirm('Delete this question? This action cannot be undone.')) return;
    try {
      await adminApi.deleteQuestion(question.id);
      setQuestionReload((value) => value + 1);
      notify('success', 'Question deleted successfully');
    } catch (err) {
      notify('error', err.message || 'Failed to delete question');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Question Management</h2>
        <p className="text-sm text-slate-400">Create single exam questions or bulk-import formatted CSV files.</p>
      </div>
        
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setQuestionModal('create')} disabled={exams.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
          <Plus className="h-4 w-4" /> Add question
        </button>
        <CsvTools entity="questions" notify={notify} onImported={() => setQuestionReload((value) => value + 1)} />

        {/* This was the original button for bulk JSON import, but it's commented out in the code.
          <button
          onClick={() => setQuestionModal('bulk')}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
        >
          <Upload className="h-4 w-4" /> Import JSON
        </button> */}
      </div>


      <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">Question table</h3>
            <p className="text-xs text-slate-400">There's a total of {questions.length} questions linked to their respective domain and parent exam.</p>
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
        {questionsLoading ? (
          <div className="flex items-center justify-center p-10 text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading questions...
          </div>
        ) : questionPagination.total === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">No questions found.</p>
        ) : <div className="overflow-x-auto">
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
              {questions.map((question) => (
                <tr key={question.id} className="align-top hover:bg-slate-950/40">
                  <td className="min-w-[280px] py-3 px-4"><span className="text-white">{question.question_text}</span></td>
                  <td className="py-3 px-4 text-indigo-300 whitespace-nowrap">
                    {question.exam_code} - {question.exam_title}
                  </td>
                  <td className="py-3 px-4 text-slate-300">{question.domain_name}</td>
                  <td className="py-3 px-4 text-slate-400">
                    {question.type === 'single_choice' ? 'Single choice' : question.type === 'multiple_choice' ? 'Multiple choice' : 'Drag and drop'}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => startQuestionEdit(question)} className={`${TABLE_ACTION_BUTTON_CLASS} border-indigo-500/20 bg-indigo-600/10 text-indigo-300 hover:bg-indigo-600 hover:text-white`}>
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => deleteQuestion(question)}
                        className={`${TABLE_ACTION_BUTTON_CLASS} border-rose-500/20 bg-rose-600/10 text-rose-300 hover:bg-rose-600 hover:text-white`}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationControls
            page={questionPage}
            pageSize={questionPagination.page_size}
            total={questionPagination.total}
            totalPages={questionPagination.total_pages}
            onPageChange={setQuestionPage}
          />
        </div>
        }
      </section>

      <AdminModal
        open={questionModal === 'create'}
        title="Create question"
        onClose={() => setQuestionModal(null)}
        size="max-w-3xl"
      >
        <form onSubmit={handleSingleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">Question prompt</label>
            <textarea required rows={3} value={questionText} onChange={(e) => setQuestionText(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-xs font-semibold uppercase text-slate-300">
              Target Exam
              <select
                required
                value={selectedExamId}
                onChange={(e) => handleExamChange(e.target.value)}
                className="select-custom mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              >
                <option value="">Select an exam</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.code} - {exam.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold uppercase text-slate-300">
              Exam Domain
              <select
                required
                value={selectedDomainId}
                onChange={(e) => setSelectedDomainId(e.target.value)}
                className="select-custom mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              >
                <option value="">
                  {activeDomains.length === 0 ? 'No domains found for this exam' : 'Select a domain'}
                </option>
                {activeDomains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.name} ({domain.weight_percentage}%)
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-xs font-semibold uppercase text-slate-300">
              Question type
              <select value={questionType} onChange={(e) => handleQuestionTypeChange(e.target.value)} className="select-custom mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                <option value="single_choice">Single choice</option>
                <option value="multiple_choice">Multiple choice</option>
                <option value="drag_and_drop">Drag and drop</option>
              </select>
            </label>
            <label className="block text-xs font-semibold uppercase text-slate-300">
              Number of answer options
              <select value={options.length} onChange={(e) => handleOptionCountChange(Number(e.target.value))} className="select-custom mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                {Array.from({ length: 13 }, (_, index) => index + 2)
                  .filter((count) => questionType !== 'drag_and_drop' || count % 2 === 0)
                  .map((count) => <option key={count} value={count}>{count} answers{questionType === 'drag_and_drop' ? ` (${count / 2} pairs)` : ''}</option>)}
              </select>
            </label>
          </div>
          {questionType === 'drag_and_drop' ? (
            <fieldset className="space-y-3">
              <legend className="mb-2 text-xs font-semibold uppercase text-slate-300">Enter the matching pairs</legend>
              {options.slice(0, options.length / 2).map((leftOption, index) => {
                const rightOptions = options.slice(options.length / 2);
                const selectedRight = correctAnswers.find((pair) => pair[0] === leftOption.id)?.[1] || '';
                const otherSelections = correctAnswers.filter((pair) => pair[0] !== leftOption.id).map((pair) => pair[1]);
                return (
                  <div key={leftOption.id} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                    <label className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-6 font-bold uppercase">{leftOption.id}</span>
                      <input required value={leftOption.text} onChange={(e) => handleOptionChange(index, e.target.value)} placeholder={`Prompt ${leftOption.id.toUpperCase()}`} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
                    </label>
                    <select required aria-label={`Correct match for ${leftOption.id}`} value={selectedRight} onChange={(e) => updateMatchingAnswer(leftOption.id, e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100">
                      <option value="">Pair with</option>
                      {rightOptions.map((option) => <option key={option.id} value={option.id} disabled={otherSelections.includes(option.id)}>{option.id.toUpperCase()}</option>)}
                    </select>
                    <label className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-6 font-bold uppercase">{rightOptions[index].id}</span>
                      <input required value={rightOptions[index].text} onChange={(e) => handleOptionChange(index + rightOptions.length, e.target.value)} placeholder={`Match ${rightOptions[index].id.toUpperCase()}`} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
                    </label>
                  </div>
                );
              })}
            </fieldset>
          ) : (
            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase text-slate-300">
                {questionType === 'multiple_choice' ? 'Select all correct answers' : 'Select the correct answer'}
              </legend>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-3">
                    <button type="button" aria-label={`Mark answer ${option.id} as correct`} aria-pressed={correctAnswers.includes(option.id)} onClick={() => toggleCorrectAnswer(option.id)} className={`h-8 w-8 rounded border text-xs font-bold uppercase ${correctAnswers.includes(option.id) ? 'border-emerald-500 bg-emerald-600 text-white' : 'border-slate-700 bg-slate-950 text-slate-400'}`}>
                      {option.id}
                    </button>
                    <input required value={option.text} onChange={(e) => handleOptionChange(index, e.target.value)} placeholder={`Answer ${option.id.toUpperCase()}`} className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
                  </div>
                ))}
              </div>
            </fieldset>
          )}
          <label className="block text-xs font-semibold uppercase text-slate-300">
            Explanation
            <textarea rows={5} value={explanation} onChange={(e) => setExplanation(e.target.value)} className="mt-1 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setQuestionModal(null)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancel</button>
            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Save question</button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={questionModal === 'bulk'}
        title="Bulk import questions"
        onClose={() => setQuestionModal(null)}
        size="max-w-3xl"
      >
        <form onSubmit={handleBulkSubmit} className="space-y-4">
          <label className="block text-xs font-semibold uppercase text-slate-300">
            Paste JSON array
            <textarea required rows={14} value={bulkJson} onChange={(e) => setBulkJson(e.target.value)} placeholder={`[
  {
    "domain_id": "${selectedDomainId || 'uuid-here'}",
    "question_text": "What is the primary table for incidents?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "incident" },
      { "id": "b", "text": "problem" }
    ],
    "correct_answers": ["a"]
  }
]`} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-100" />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setQuestionModal(null)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancel</button>
            <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"><Upload className="h-4 w-4" />Import questions</button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={questionModal === 'edit'}
        title="Edit question"
        onClose={() => setQuestionModal(null)}
        size="max-w-3xl"
      >
        <form onSubmit={saveQuestion} className="space-y-4">
          <label className="block text-xs font-semibold uppercase text-slate-300">
            Question prompt
            <textarea required rows={3} value={questionEdit.question_text || ''} onChange={(e) => setQuestionEdit({ ...questionEdit, question_text: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
          </label>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-xs font-semibold uppercase text-slate-300">
              Target Exam
              <select
                required
                value={editDomainExam?.id || ''}
                onChange={(e) => {
                  const exam = exams.find((item) => item.id === e.target.value);
                  setQuestionEdit({ ...questionEdit, domain_id: exam?.domains?.[0]?.id || '' });
                }}
                className="select-custom mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              >
                <option value="">Select an exam</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>{exam.code} - {exam.title}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold uppercase text-slate-300">
              Exam Domain
              <select
                required
                value={questionEdit.domain_id || ''}
                onChange={(e) => setQuestionEdit({ ...questionEdit, domain_id: e.target.value })}
                className="select-custom mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              >
                <option value="">
                  {editDomains.length === 0 ? 'No domains found for this exam' : 'Select a domain'}
                </option>
                {editDomains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.name} ({domain.weight_percentage}%)
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-xs font-semibold uppercase text-slate-300">
              Question type
              <select value={questionEdit.type || 'single_choice'} onChange={(e) => handleEditedQuestionTypeChange(e.target.value)} className="select-custom mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                <option value="single_choice">Single choice</option><option value="multiple_choice">Multiple choice</option><option value="drag_and_drop">Drag and drop</option>
              </select>
            </label>
            <label className="block text-xs font-semibold uppercase text-slate-300">
              Number of answer options
              <select value={questionEdit.options?.length || 0} onChange={(e) => handleEditedOptionCountChange(Number(e.target.value))} className="select-custom mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                {Array.from({ length: Math.max(14, questionEdit.options?.length || 0) - 1 }, (_, index) => index + 2)
                  .filter((count) => questionEdit.type !== 'drag_and_drop' || count % 2 === 0)
                  .map((count) => <option key={count} value={count}>{count} answers{questionEdit.type === 'drag_and_drop' ? ` (${count / 2} pairs)` : ''}</option>)}
              </select>
            </label>
          </div>
          {questionEdit.type === 'drag_and_drop' ? (
            <fieldset className="space-y-3">
              <legend className="mb-2 text-xs font-semibold uppercase text-slate-300">Enter the matching pairs</legend>
              {(questionEdit.options || []).slice(0, (questionEdit.options || []).length / 2).map((leftOption, index) => {
                const rightOptions = questionEdit.options.slice(questionEdit.options.length / 2);
                const selectedRight = (questionEdit.correct_answers || []).find((pair) => pair[0] === leftOption.id)?.[1] || '';
                const otherSelections = (questionEdit.correct_answers || []).filter((pair) => pair[0] !== leftOption.id).map((pair) => pair[1]);
                return (
                  <div key={leftOption.id} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                    <label className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-6 font-bold uppercase">{leftOption.id}</span>
                      <input required value={leftOption.text} onChange={(e) => setQuestionEdit({ ...questionEdit, options: questionEdit.options.map((item, itemIndex) => itemIndex === index ? { ...item, text: e.target.value } : item) })} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
                    </label>
                    <select required aria-label={`Correct match for ${leftOption.id}`} value={selectedRight} onChange={(e) => updateEditedMatchingAnswer(leftOption.id, e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100">
                      <option value="">Pair with</option>
                      {rightOptions.map((option) => <option key={option.id} value={option.id} disabled={otherSelections.includes(option.id)}>{option.id.toUpperCase()}</option>)}
                    </select>
                    <label className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-6 font-bold uppercase">{rightOptions[index].id}</span>
                      <input required value={rightOptions[index].text} onChange={(e) => setQuestionEdit({ ...questionEdit, options: questionEdit.options.map((item, itemIndex) => itemIndex === index + rightOptions.length ? { ...item, text: e.target.value } : item) })} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
                    </label>
                  </div>
                );
              })}
            </fieldset>
          ) : (
            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase text-slate-300">
                {questionEdit.type === 'multiple_choice' ? 'Select all correct answers' : 'Select the correct answer'}
              </legend>
              <div className="space-y-2">
                {(questionEdit.options || []).map((option, index) => (
                  <div key={`${option.id}-${index}`} className="flex items-center gap-3">
                    <button type="button" aria-label={`Mark answer ${option.id} as correct`} aria-pressed={(questionEdit.correct_answers || []).includes(option.id)} onClick={() => toggleEditedCorrectAnswer(option.id)} className={`h-8 w-8 rounded border text-xs font-bold uppercase ${(questionEdit.correct_answers || []).includes(option.id) ? 'border-emerald-500 bg-emerald-600 text-white' : 'border-slate-700 bg-slate-950 text-slate-400'}`}>
                      {option.id}
                    </button>
                    <input required value={option.text} onChange={(e) => setQuestionEdit({
                      ...questionEdit,
                      options: questionEdit.options.map((item, itemIndex) => itemIndex === index ? { ...item, text: e.target.value } : item),
                    })} className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
                  </div>
                ))}
              </div>
            </fieldset>
          )}
          <label className="block text-xs font-semibold uppercase text-slate-300">
            Explanation
            <textarea rows={5} value={questionEdit.explanation || ''} onChange={(e) => setQuestionEdit({ ...questionEdit, explanation: e.target.value })} className="mt-1 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setQuestionModal(null)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancel</button>
            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"><Save className="mr-1 inline h-4 w-4" />Save question</button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}

function QuestionIssuesTab({ notify }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const data = await adminApi.getQuestionIssues();
      setReports(data.reports || []);
    } catch (error) {
      notify('error', error.message || 'Failed to load reported issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const updateStatus = async (report, status) => {
    try {
      await adminApi.updateQuestionIssue(report.id, status);
      setReports((current) =>
        current.map((item) =>
          item.id === report.id
            ? { ...item, status, resolved_at: status === 'resolved' ? new Date().toISOString() : null }
            : item
        )
      );
      notify('success', status === 'resolved' ? 'Issue marked resolved' : 'Issue reopened');
    } catch (error) {
      notify('error', error.message || 'Failed to update issue status');
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Reported question issues</h2>
        <p className="text-sm text-slate-400">Review candidate feedback and track corrections.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading reports...
        </div>
      ) : reports.length === 0 ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
          No question issues have been reported.
        </p>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <article key={report.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {report.exam_code} - {report.exam_title}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Reported by {report.user_name} ({report.user_email}) · {new Date(report.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  report.status === 'open'
                    ? 'bg-amber-500/10 text-amber-300'
                    : 'bg-emerald-500/10 text-emerald-300'
                }`}>
                  {report.status}
                </span>
              </div>
              <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Question</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-200">{report.question_text}</p>
              </div>
              <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Issue reported</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-200">{report.issue_description}</p>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => updateStatus(report, report.status === 'open' ? 'resolved' : 'open')}
                  className={`${TABLE_ACTION_BUTTON_CLASS} ${
                    report.status === 'open'
                      ? 'border-emerald-500/20 bg-emerald-600/10 text-emerald-300 hover:bg-emerald-600 hover:text-white'
                      : 'border-amber-500/20 bg-amber-600/10 text-amber-300 hover:bg-amber-600 hover:text-white'
                  }`}
                >
                  {report.status === 'open' ? 'Mark resolved' : 'Reopen'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ExamAttemptsTab({ notify }) {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [pagination, setPagination] = useState({ page_size: 25, total: 0, total_pages: 0 });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminApi.getExamAttempts({
      page,
      page_size: pagination.page_size,
      search: appliedSearch,
      status,
    }).then((data) => {
      if (cancelled) return;
      const nextPagination = data.pagination || { page, page_size: 25, total: 0, total_pages: 0 };
      setAttempts(data.attempts || []);
      setPagination(nextPagination);
      if (page > Math.max(nextPagination.total_pages, 1)) {
        setPage(Math.max(nextPagination.total_pages, 1));
      }
    }).catch((error) => {
      if (!cancelled) notify('error', error.message || 'Failed to load exam attempts');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [page, pagination.page_size, appliedSearch, status, reload, notify]);

  const deleteAttempt = async (attempt) => {
    if (!window.confirm(`Delete this ${attempt.exam_code} attempt by ${attempt.user_name}? This action cannot be undone.`)) return;
    try {
      await adminApi.deleteExamAttempt(attempt.id);
      notify('success', 'Exam attempt deleted successfully');
      setReload((current) => current + 1);
    } catch (error) {
      notify('error', error.message || 'Failed to delete exam attempt');
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Exam attempts</h2>
        <p className="text-sm text-slate-400">Review candidate attempt status, timing, and results. Exited attempts are complete but ungraded.</p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setAppliedSearch(search.trim());
        }}
        className="flex flex-wrap gap-3"
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search candidate or exam"
          className="min-w-56 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
        />
        <select
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value);
          }}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
        >
          <option value="">All statuses</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="timed_out">Timed out</option>
        </select>
        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
          Search
        </button>
      </form>

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading exam attempts...
        </div>
      ) : pagination.total === 0 ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
          No exam attempts match these filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">Exam</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {attempts.map((attempt) => (
                <tr key={attempt.id} className="text-slate-300">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{attempt.user_name}</p>
                    <p className="text-xs text-slate-500">{attempt.user_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-white">{attempt.exam_code}</p>
                    <p className="text-xs text-slate-500">{attempt.exam_title}</p>
                  </td>
                  <td className="px-4 py-3">{attempt.status.replace('_', ' ')}</td>
                  <td className="px-4 py-3">{new Date(attempt.started_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {attempt.completed_at ? new Date(attempt.completed_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {attempt.time_spent_seconds == null
                      ? '—'
                      : `${Math.floor(attempt.time_spent_seconds / 60)}m ${attempt.time_spent_seconds % 60}s`}
                  </td>
                  <td className="px-4 py-3">
                    {attempt.score_percentage == null
                      ? 'Ungraded'
                      : `${attempt.score_percentage}% · ${attempt.is_passed ? 'Passed' : 'Failed'}`}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => deleteAttempt(attempt)}
                      aria-label={`Delete ${attempt.exam_code} attempt by ${attempt.user_name}`}
                      className={`${TABLE_ACTION_BUTTON_CLASS} border-rose-500/20 bg-rose-600/10 text-rose-300 hover:bg-rose-600 hover:text-white`}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationControls
            page={page}
            pageSize={pagination.page_size}
            total={pagination.total}
            totalPages={pagination.total_pages}
            onPageChange={setPage}
          />
        </div>
      )}
    </section>
  );
}

function AuditLogsTab({ notify }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page_size: 25, total: 0, total_pages: 0 });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminApi.getAuditLogs({ page, page_size: pagination.page_size })
      .then((data) => {
        if (cancelled) return;
        setLogs(data.logs || []);
        setPagination(data.pagination || { page, page_size: 25, total: 0, total_pages: 0 });
      })
      .catch((error) => {
        if (!cancelled) notify('error', error.message || 'Failed to load audit logs');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, pagination.page_size, notify]);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Administrative audit log</h2>
        <p className="text-sm text-slate-400">A record of administrative creations, edits, status changes, imports, and deletions.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading audit log...
        </div>
      ) : pagination.total === 0 ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
          No administrative actions have been recorded.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Administrator</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Record</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.map((entry) => (
                <tr key={entry.id} className="text-slate-300">
                  <td className="whitespace-nowrap px-4 py-3">{new Date(entry.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{entry.actor_email}</td>
                  <td className="px-4 py-3">{entry.action.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{entry.entity}</p>
                    <p className="break-all text-xs text-slate-500">{entry.entity_id || '—'}</p>
                  </td>
                  <td className="max-w-sm break-words px-4 py-3 text-xs text-slate-400">
                    {JSON.stringify(entry.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationControls
            page={page}
            pageSize={pagination.page_size}
            total={pagination.total}
            totalPages={pagination.total_pages}
            onPageChange={setPage}
          />
        </div>
      )}
    </section>
  );
}