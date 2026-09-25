import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="relative min-h-screen bg-night-purple text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white overflow-x-hidden">
      {/* Luz ambiente desfocada no fundo */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-blue-600/15 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-[130px]" />
      </div>

      {/* Conteúdo principal */}
      <div className="relative z-10 flex flex-col flex-1">
        {children}
      </div>
    </div>
  );
}