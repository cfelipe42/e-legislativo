import React, { useState } from 'react';
import { ChamberConfig, Councilman, VoteValue, UserAccount } from '../types';

interface ModerationTabProps {
  chamberConfigs: ChamberConfig[];
  onUpdateConfig: (config: ChamberConfig) => void;
  onSwitchCity: (city: string) => void;
  currentCity: string;
  councilmen: Councilman[];
  onUpdateCouncilman: (updated: Councilman) => void;
  onAddCouncilman: (newCouncilman: Councilman) => void;
  accounts: UserAccount[];
  onAddAccount: (newAccount: UserAccount, linkedCouncilmanId?: string) => void;
  onlineUsers?: string[];
}

const ModerationTab: React.FC<ModerationTabProps> = ({
  chamberConfigs,
  onUpdateConfig,
  onSwitchCity,
  currentCity,
  councilmen,
  onUpdateCouncilman,
  onAddCouncilman,
  accounts,
  onAddAccount,
  onlineUsers = []
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'network' | 'legislators' | 'accounts'>('network');
  const [editingCity, setEditingCity] = useState<string | null>(null);
  const [tempIP, setTempIP] = useState('');

  // Estados para Gestão de Vereadores
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCouncilman, setEditingCouncilman] = useState<Councilman | null>(null);
  const [linkingCouncilman, setLinkingCouncilman] = useState<Councilman | null>(null);
  const [formCouncilman, setFormCouncilman] = useState<Partial<Councilman>>({
    name: '',
    party: '',
    avatar: 'https://picsum.photos/seed/new/100/100',
    isPresent: false,
    currentVote: VoteValue.PENDING
  });

  // Estados para Gestão de Contas
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [formAccount, setFormAccount] = useState<Partial<UserAccount> & { party?: string }>({
    name: '',
    cpf: '',
    password: '',
    role: 'councilman',
    city: currentCity,
    allowedIP: '',
    party: ''
  });

  const handleStartEditIP = (config: ChamberConfig) => {
    setEditingCity(config.city);
    setTempIP(config.allowedIP);
  };

  const handleSaveIP = (config: ChamberConfig) => {
    onUpdateConfig({ ...config, allowedIP: tempIP });
    setEditingCity(null);
  };

  const handleOpenAdd = () => {
    setEditingCouncilman(null);
    setFormCouncilman({
      name: '',
      party: '',
      avatar: `https://picsum.photos/seed/${Date.now()}/100/100`,
      isPresent: false,
      currentVote: VoteValue.PENDING
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Councilman) => {
    setEditingCouncilman(c);
    setFormCouncilman(c);
    setIsModalOpen(true);
  };

  const handleSaveCouncilman = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCouncilman) {
      onUpdateCouncilman(formCouncilman as Councilman);
    } else {
      const newC: Councilman = {
        ...(formCouncilman as Councilman),
        id: `C-${Date.now()}`,
      };
      onAddCouncilman(newC);
    }
    setIsModalOpen(false);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const newAcc: UserAccount = {
      ...(formAccount as UserAccount),
      id: `ACC-${Date.now()}`,
    };
    onAddAccount(newAcc, linkingCouncilman?.id);
    setIsAccountModalOpen(false);
    setLinkingCouncilman(null);
    setFormAccount({ name: '', cpf: '', password: '', role: 'councilman', city: currentCity, allowedIP: '', party: '' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormCouncilman(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header do Painel */}
      <div className="bg-purple-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
              <i className="fa-solid fa-gears text-purple-300"></i> Painel de Moderação Central
            </h2>
            <p className="text-purple-200 text-sm mt-2 opacity-80 font-medium">
              Gestão administrativa de infraestrutura, parlamentares e acessos.
            </p>
          </div>

          <div className="flex bg-black/20 p-1 rounded-2xl border border-white/10 backdrop-blur-sm">
            {[
              { id: 'network', icon: 'fa-network-wired', label: 'Redes' },
              { id: 'legislators', icon: 'fa-users-gear', label: 'Parlamentares' },
              { id: 'accounts', icon: 'fa-user-lock', label: 'Acessos' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === tab.id ? 'bg-purple-600 text-white shadow-lg' : 'text-purple-300 hover:text-white'}`}
              >
                <i className={`fa-solid ${tab.icon} mr-2`}></i> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo das Sub-Abas */}
      {activeSubTab === 'network' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {chamberConfigs.map((config) => (
            <div
              key={config.city}
              className={`bg-white rounded-3xl border-2 transition-all p-6 ${currentCity === config.city ? 'border-purple-500 shadow-purple-100 shadow-xl' : 'border-slate-100 hover:border-slate-200 shadow-sm'
                }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${currentCity === config.city ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                    <i className="fa-solid fa-city"></i>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 uppercase tracking-tight">{config.city}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Instância: {config.city.substring(0, 3).toUpperCase()}-2025
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${config.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                    {config.isActive ? 'Sistema Ativo' : 'Manutenção'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IP Autorizado</span>
                    {editingCity !== config.city && (
                      <button onClick={() => handleStartEditIP(config)} className="text-[10px] font-black text-purple-600 hover:text-purple-700 uppercase">Alterar</button>
                    )}
                  </div>

                  {editingCity === config.city ? (
                    <div className="flex gap-2">
                      <input
                        type="text" value={tempIP} onChange={(e) => setTempIP(e.target.value)}
                        className="flex-1 bg-white border border-purple-200 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-700 focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                      <button onClick={() => handleSaveIP(config)} className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase">Ok</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <i className="fa-solid fa-shield-halved text-slate-300"></i>
                      <span className="text-sm font-mono font-bold text-slate-600">{config.allowedIP || 'Conexão Livre'}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onSwitchCity(config.city)}
                  disabled={currentCity === config.city}
                  className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentCity === config.city
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200 shadow-sm'
                    }`}
                >
                  {currentCity === config.city ? 'Monitorando Esta Câmara' : 'Gerenciar Instância'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'legislators' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Composição da Casa</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total: {councilmen.length} vereadores cadastrados</p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-purple-500/20 transition-all flex items-center gap-3"
            >
              <i className="fa-solid fa-plus"></i> Novo Vereador
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {councilmen.map(c => (
              <div key={c.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden group hover:shadow-2xl transition-all hover:border-purple-200 hover:-translate-y-1">
                <div className="h-1.5 bg-slate-100 group-hover:bg-purple-500 transition-colors"></div>
                <div className="p-5 flex flex-col items-center text-center">
                  <img src={c.avatar} className="w-20 h-20 rounded-2xl object-cover border-4 border-slate-50 shadow-md mb-4" alt={c.name} />
                  <h4 className="font-black text-slate-800 uppercase text-xs leading-tight mb-1">{c.name}</h4>
                  <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">{c.party}</p>

                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2 h-2 rounded-full ${onlineUsers.includes(c.id) ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                    <span className={`text-[8px] font-black uppercase tracking-tighter ${onlineUsers.includes(c.id) ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {onlineUsers.includes(c.id) ? 'Online' : 'Offline'}
                    </span>
                  </div>

                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="flex-1 py-2 bg-slate-50 hover:bg-purple-50 text-slate-400 hover:text-purple-600 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-slate-100 hover:border-purple-200"
                    >
                      <i className="fa-solid fa-user-gear mr-1.5"></i> Editar
                    </button>
                    <button
                      onClick={() => {
                        setLinkingCouncilman(c);
                        setFormAccount({
                          name: c.name,
                          cpf: '',
                          password: '',
                          role: 'councilman',
                          city: c.city,
                          allowedIP: '',
                          party: c.party
                        });
                        setIsAccountModalOpen(true);
                      }}
                      className="flex-1 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 hover:text-purple-800 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-purple-100"
                      title="Criar Login de Acesso"
                    >
                      <i className="fa-solid fa-key mr-1.5"></i> Criar Acesso
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'accounts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Controle de Acessos</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gerencie credenciais e permissões de login</p>
            </div>
            <button
              onClick={() => setIsAccountModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-purple-500/20 transition-all flex items-center gap-3"
            >
              <i className="fa-solid fa-user-lock"></i> Criar Novo Acesso
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome / CPF</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cidade</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Perfil</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.length > 0 ? accounts.map(acc => (
                  <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-800 uppercase">{acc.name}</p>
                      <p className="text-[9px] font-mono text-slate-400 mt-0.5">{acc.cpf}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-purple-600 uppercase tracking-tight">{acc.city}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase tracking-widest border border-slate-200">
                        {acc.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => alert(`Gerenciando conta: ${acc.name}. Opções: Redefinir Senha, Bloquear Acesso, Alterar Permissões.`)}
                        className="text-purple-600 hover:text-purple-800 transition-colors"
                      >
                        <i className="fa-solid fa-ellipsis-vertical"></i>
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-300 italic text-sm">
                      Nenhuma credencial cadastrada para esta instância.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Cadastro de Acesso */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col">
            <div className="p-8 border-b border-slate-100 bg-purple-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-purple-900 tracking-tight">
                  {linkingCouncilman ? `Vinculando Acesso: ${linkingCouncilman.name}` : 'Novo Login Legislativo'}
                </h3>
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mt-1">Definition de credenciais de acesso</p>
              </div>
              <button onClick={() => setIsAccountModalOpen(false)} className="w-12 h-12 flex items-center justify-center text-purple-300 hover:text-purple-600 transition-all rounded-2xl hover:bg-white">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Nome Completo</label>
                  <input
                    type="text" value={formAccount.name} onChange={(e) => setFormAccount({ ...formAccount, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">CPF (Acesso)</label>
                  <input
                    type="text" value={formAccount.cpf} onChange={(e) => setFormAccount({ ...formAccount, cpf: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                    placeholder="000.000.000-00" required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Senha Provisória</label>
                  <input
                    type="password" value={formAccount.password} onChange={(e) => setFormAccount({ ...formAccount, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Câmara Destino</label>
                  <select
                    value={formAccount.city} onChange={(e) => setFormAccount({ ...formAccount, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                    required
                  >
                    {chamberConfigs.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">IP Específico (Opcional)</label>
                  <input
                    type="text" value={formAccount.allowedIP} onChange={(e) => setFormAccount({ ...formAccount, allowedIP: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                    placeholder="0.0.0.0"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Perfil de Usuário</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['clerk', 'president', 'councilman', 'moderator'].map(role => (
                      <button
                        key={role} type="button"
                        onClick={() => setFormAccount({ ...formAccount, role: role as any })}
                        className={`py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${formAccount.role === role ? 'bg-purple-600 border-purple-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {formAccount.role === 'councilman' && (
                  <div className="col-span-2 animate-fadeIn">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Legenda Partidária</label>
                    <input
                      type="text" value={formAccount.party || ''} onChange={(e) => setFormAccount({ ...formAccount, party: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                      placeholder="Ex: MDB" required
                    />
                  </div>
                )}
              </div>

              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => { setIsAccountModalOpen(false); setLinkingCouncilman(null); }} className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Descartar</button>
                <button type="submit" className="flex-[2] py-4 bg-purple-600 hover:bg-purple-700 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-purple-500/20 transition-all">
                  {linkingCouncilman ? 'Vincular e Habilitar' : 'Habilitar Acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Vereador (Reuse existing logic) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col scale-100">
            <div className="p-8 border-b border-slate-100 bg-purple-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-purple-900 tracking-tight">
                  {editingCouncilman ? 'Editar Parlamentar' : 'Cadastrar Novo Vereador'}
                </h3>
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mt-1">
                  {editingCouncilman ? `ID: ${editingCouncilman.id}` : 'Inclusão de membro no corpo legislativo'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center text-purple-300 hover:text-purple-600 transition-all rounded-2xl hover:bg-white shadow-sm border border-transparent hover:border-purple-100">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSaveCouncilman} className="p-8 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <img src={formCouncilman.avatar} className="w-32 h-32 rounded-[2rem] object-cover border-4 border-white shadow-xl group-hover:brightness-50 transition-all" alt="Preview" />
                  <label className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className="fa-solid fa-camera text-white text-3xl"></i>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
                <p className="text-[9px] font-black text-purple-400 uppercase tracking-[0.2em]">Clique para alterar a foto oficial</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Nome Parlamentar</label>
                  <input
                    type="text" value={formCouncilman.name} onChange={(e) => setFormCouncilman({ ...formCouncilman, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                    placeholder="Ex: João da Silva" required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Legenda Partidária</label>
                  <input
                    type="text" value={formCouncilman.party} onChange={(e) => setFormCouncilman({ ...formCouncilman, party: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                    placeholder="Ex: MDB" required
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Cancelar</button>
                <button type="submit" className="flex-[2] py-5 bg-purple-600 hover:bg-purple-700 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-purple-500/20 transition-all active:scale-95">
                  {editingCouncilman ? 'Atualizar Registro' : 'Confirmar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alerta de Segurança */}
      <div className="bg-purple-50 border-2 border-dashed border-purple-200 p-6 rounded-[2.5rem]">
        <div className="flex gap-4">
          <div className="bg-purple-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <i className="fa-solid fa-user-shield text-lg"></i>
          </div>
          <div>
            <h4 className="text-sm font-black text-purple-900 uppercase tracking-tight">Privilégios de Moderação Ativos</h4>
            <p className="text-[11px] text-purple-700 mt-1 opacity-80 leading-relaxed font-medium">
              Como Moderador Global, você tem autoridade para gerir redes, parlamentares e credenciais de acesso para todas as instâncias municipais cadastradas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModerationTab;
