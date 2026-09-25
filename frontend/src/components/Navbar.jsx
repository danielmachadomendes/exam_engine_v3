import React from 'react';
import { BookOpen, User, LogOut } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-night-950/70 border-b border-purple-500/15 px-6 py-3.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/30">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
              Exam Engine
            </h1>
            <p className="text-[10px] tracking-widest uppercase text-purple-400/80 font-semibold">
              Certification Prep
            </p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-300 bg-purple-950/40 border border-purple-800/30 px-3 py-1.5 rounded-lg">
              <User className="w-4 h-4 text-purple-400" />
              <span>{user.name || user.email}</span>
            </div>
            {onLogout && (
              <button 
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800/50"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}