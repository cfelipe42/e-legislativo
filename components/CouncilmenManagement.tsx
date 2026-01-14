
import React, { useState } from 'react';
import { Councilman } from '../types';

interface CouncilmenManagementProps {
  councilmen: Councilman[];
  onUpdateCouncilman: (updated: Councilman) => void;
}

const CouncilmenManagement: React.FC<CouncilmenManagementProps> = ({ councilmen, onUpdateCouncilman }) => {
  const [editingCouncilman, setEditingCouncilman] = useState<Councilman | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = councilmen.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.party.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCouncilman) {
      onUpdateCouncilman(editingCouncilman);
      setEditingCouncilman(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingCouncilman) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingCouncilman({
          ...editingCouncilman,
          avatar: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Modal de Edição */}
      {editingCouncilman && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Editar Perfil do Vereador</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configurações de conta e identificação</p>
              </div>
              <button onClick={() => setEditingCouncilman(null)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all rounded-xl hover:bg-rose-50">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="flex flex-col items-center gap-4 mb-2">
                <div className="relative group">
                  <img 
                    src={editingCouncilman.avatar} 
                    className="w-32 h-32 rounded-2xl object-cover border-4 border-slate-100 shadow-md transition-all group-hover:brightness-50" 
                    alt="Preview" 
                  />
                  <label className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className="fa-solid fa-camera text-white text-2xl"></i>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clique na foto para alterar</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Nome Parlamentar</label>
                  <input 
                    type="text" 
                    value={editingCouncilman.name}
                    onChange={(e) => setEditingCouncilman({...editingCouncilman, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Partido Político (Sigla)</label>
                  <input 
                    type="text" 
                    value={editingCouncilman.party}
                    onChange={(e) => setEditingCouncilman({...editingCouncilman, party: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setEditingCouncilman(null)} className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 transition-all">
                  Salvar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header e Busca */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Gestão de Parlamentares</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configuração de nomes, fotos e legendas partidárias</p>
        </div>
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="Buscar vereador ou partido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
        </div>
      </div>

      {/* Grid de Vereadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c) => (
          <div key={c.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden group hover:shadow-xl transition-all hover:border-blue-200">
            <div className="h-2 bg-slate-100 group-hover:bg-blue-500 transition-colors"></div>
            <div className="p-6 flex items-center gap-4">
              <img 
                src={c.avatar} 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-50 shadow-sm" 
                alt={c.name} 
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-slate-800 truncate leading-tight uppercase text-sm">{c.name}</h3>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">{c.party}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${c.isPresent ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{c.isPresent ? 'Em Plenário' : 'Offline'}</span>
                </div>
              </div>
              <button 
                onClick={() => setEditingCouncilman(c)}
                className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all border border-slate-100"
                title="Editar Perfil"
              >
                <i className="fa-solid fa-user-gear text-sm"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CouncilmenManagement;
