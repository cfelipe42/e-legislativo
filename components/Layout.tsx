import React from 'react';
import { supabase } from '../services/supabase';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole?: 'clerk' | 'councilman' | 'president' | 'moderator' | 'mesario';
  userName?: string;
  userAvatar?: string;
  isOnline?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, userRole = 'clerk', userName, userAvatar, isOnline = false }) => {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const allTabs = [
    { id: 'dashboard', label: 'Painel Geral', icon: 'fa-chart-line', restricted: true },
    { id: 'session', label: 'Sessão Plenária', icon: 'fa-gavel', restricted: false },
    { id: 'bills', label: 'Ordem do Dia', icon: 'fa-file-invoice', restricted: false },
    { id: 'management', label: 'Gestão de Vereadores', icon: 'fa-users-gear', restricted: true },
    { id: 'history', label: 'Histórico', icon: 'fa-history', restricted: true },
    { id: 'moderation', label: 'Moderação', icon: 'fa-gears', restricted: true, onlyModerator: true },
    { id: 'plenary', label: 'Painel do Plenário', icon: 'fa-tv', restricted: true },
  ];

  const isCouncilman = userRole === 'councilman';
  const isPresident = userRole === 'president';
  const isClerk = userRole === 'clerk' || userRole === 'mesario';
  const isModerator = userRole === 'moderator';

  // Filtra abas
  let tabs = allTabs;
  if (isCouncilman) {
    tabs = allTabs.filter(tab => !tab.restricted && !tab.onlyModerator);
  } else if (!isModerator) {
    tabs = allTabs.filter(tab => !tab.onlyModerator);
  }

  const sidebarBg = isPresident ? 'bg-emerald-950' :
    isCouncilman ? 'bg-indigo-950' :
      isModerator ? 'bg-purple-950' : 'bg-slate-900';

  const accentColor = isPresident ? 'bg-emerald-600' :
    isCouncilman ? 'bg-amber-500' :
      isModerator ? 'bg-purple-600' : 'bg-blue-600';

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar com cores dinâmicas */}
      <aside className={`w-64 flex flex-col transition-all duration-500 ${sidebarBg} shadow-2xl`}>
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className={`${accentColor} p-2 rounded-xl shadow-lg transition-colors`}>
            <i className={`fa-solid ${isPresident ? 'fa-crown' : isModerator ? 'fa-user-shield' : 'fa-landmark'} text-xl text-white`}></i>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tight text-white leading-none">E-Legislativo</span>
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Câmara Municipal</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${activeTab === tab.id
                ? (accentColor + ' text-white shadow-lg scale-[1.02]')
                : 'text-white/50 hover:bg-white/5 hover:text-white'
                }`}
            >
              <i className={`fa-solid ${tab.icon} w-5 text-lg ${activeTab === tab.id ? 'text-white' : 'group-hover:text-white transition-colors'}`}></i>
              <span className="font-bold text-sm tracking-wide">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              )}
            </button>
          ))}

          {(isCouncilman || isPresident || isModerator) && (
            <div className={`mt-8 px-4 py-5 bg-white/5 rounded-2xl border border-white/10 mx-2`}>
              <div className={`flex items-center gap-2 mb-2 ${isPresident ? 'text-emerald-400' : isModerator ? 'text-purple-400' : 'text-amber-400'}`}>
                <i className={`fa-solid ${isPresident ? 'fa-crown' : isModerator ? 'fa-globe' : 'fa-user-shield'} text-xs`}></i>
                <p className="text-[10px] font-black uppercase tracking-widest">{isPresident ? 'Presidência' : isModerator ? 'Administração Remota' : 'Painel Parlamentar'}</p>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed">
                {isPresident
                  ? 'Você possui controles administrativos e terminal de votação ativos.'
                  : isModerator
                    ? 'Acesso global habilitado. Você pode gerir a sessão de qualquer local.'
                    : 'Seu terminal está pronto para votação e pedidos de fala.'}
              </p>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-white/5 bg-black/10">
          <div className="flex items-center gap-3 p-2">
            <div className="relative">
              <img src={userAvatar || (isClerk || isModerator ? "https://picsum.photos/seed/admin/100/100" : "https://picsum.photos/seed/voter/100/100")} className="w-10 h-10 rounded-full border-2 border-white/10 object-cover" alt="User" />
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-indigo-950 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></div>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black text-white truncate leading-none mb-1">
                {userName || (isClerk ? 'Secretaria Geral' : 'Usuário')}
              </p>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">
                {userRole === 'president' ? 'Vereador Presidente' :
                  userRole === 'councilman' ? 'Vereador(a)' :
                    userRole === 'moderator' ? 'Administrador' :
                      userRole === 'mesario' ? 'Mesário' : 'Secretaria Geral'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center sticky top-0 z-20 shadow-sm">
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              {allTabs.find(t => t.id === activeTab)?.label}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sessão Plenária em Tempo Real</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <i className="fa-regular fa-clock text-slate-400"></i>
              <span className="text-xs font-black text-slate-600">{currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>

            <button
              onClick={() => alert("Você não possui novas notificações no momento. Todos os avisos legislativos estão em dia.")}
              className="relative w-11 h-11 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-100"
            >
              <i className="fa-solid fa-bell"></i>
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            </button>

            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-2 px-4 py-2 text-xs font-black text-red-500 hover:bg-red-50 rounded-xl transition-all uppercase border border-transparent hover:border-red-100"
            >
              Sair <i className="fa-solid fa-power-off"></i>
            </button>
          </div>
        </header>

        <div className="p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
