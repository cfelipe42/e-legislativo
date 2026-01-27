
import React, { useState, useRef } from 'react';
import { Bill } from '../types';

interface BillsListProps {
  bills: Bill[];
  onStartVoting: (billId: string) => void;
  onUpdateBill: (updatedBill: Bill) => void;
  onCreateBill?: (bill: Bill) => void;
  userRole: 'clerk' | 'councilman' | 'president' | 'moderator' | 'mesario';
  onReadBill: (bill: Bill) => void;
}

const ITEMS_PER_PAGE = 5;

const BillsList: React.FC<BillsListProps> = ({ bills, onStartVoting, onUpdateBill, onCreateBill, userRole, onReadBill }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [attachingToBill, setAttachingToBill] = useState<Bill | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [newBillData, setNewBillData] = useState<Partial<Bill>>({ status: 'PENDING', type: 'PL' });

  // Filtragem simples por termo de busca
  const filteredBills = bills.filter(bill =>
    bill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredBills.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedBills = filteredBills.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const statusMap = {
    APPROVED: 'Aprovado',
    REJECTED: 'Rejeitado',
    VOTING: 'Em Votação',
    PENDING: 'Aguardando',
    DISCUSSION: 'Em Discussão'
  };

  const typeMap = {
    PL: 'Projeto de Lei',
    INDICATION: 'Indicação'
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REJECTED': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'VOTING': return 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse';
      case 'DISCUSSION': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const canManage = userRole === 'clerk' || userRole === 'president' || userRole === 'mesario';

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBill) {
      onUpdateBill(editingBill);
      setEditingBill(null);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBillData.title && newBillData.author && onCreateBill) {
      const newBill: Bill = {
        id: `PL-${Date.now().toString().slice(-4)}/${new Date().getFullYear()}`,
        title: newBillData.title,
        description: newBillData.description || '',
        author: newBillData.author,
        category: newBillData.category || 'Geral',
        type: newBillData.type || 'PL',
        status: 'PENDING',
        fullText: newBillData.fullText || ''
      };
      onCreateBill(newBill);
      setIsCreating(false);
      setNewBillData({ status: 'PENDING' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && attachingToBill) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        onUpdateBill({
          ...attachingToBill,
          fullText: text || "Texto extraído do documento em anexo.\n\n" + attachingToBill.fullText
        });
        setAttachingToBill(null);
        alert('Documento anexado com sucesso ao texto integral!');
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Modal de Criação */}
      {isCreating && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Novo Projeto de Lei</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cadastro de nova proposição legislativa</p>
              </div>
              <button onClick={() => setIsCreating(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all rounded-xl hover:bg-rose-50">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-8 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Título do Projeto</label>
                <input
                  type="text"
                  value={newBillData.title || ''}
                  onChange={(e) => setNewBillData({ ...newBillData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Ex: Dispõe sobre..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Autor</label>
                  <input
                    type="text"
                    value={newBillData.author || ''}
                    onChange={(e) => setNewBillData({ ...newBillData, author: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Tipo</label>
                  <select
                    value={newBillData.type || 'PL'}
                    onChange={(e) => setNewBillData({ ...newBillData, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PL">Projeto de Lei</option>
                    <option value="INDICATION">Indicação</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Categoria</label>
                <input
                  type="text"
                  value={newBillData.category || ''}
                  onChange={(e) => setNewBillData({ ...newBillData, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Ex: Saúde, Educação..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Descrição Executiva</label>
                <textarea
                  value={newBillData.description || ''}
                  onChange={(e) => setNewBillData({ ...newBillData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-none"
                  required
                ></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-100 rounded-xl">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 transition-all">
                  Cadastrar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição de Projeto */}
      {editingBill && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Editar Projeto de Lei</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Alterando dados da proposição {editingBill.id}</p>
              </div>
              <button onClick={() => setEditingBill(null)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all rounded-xl hover:bg-rose-50">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-8 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Título do Projeto</label>
                <input
                  type="text"
                  value={editingBill.title}
                  onChange={(e) => setEditingBill({ ...editingBill, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Autor</label>
                  <input
                    type="text"
                    value={editingBill.author}
                    onChange={(e) => setEditingBill({ ...editingBill, author: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Categoria</label>
                  <input
                    type="text"
                    value={editingBill.category}
                    onChange={(e) => setEditingBill({ ...editingBill, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Descrição Executiva</label>
                <textarea
                  value={editingBill.description}
                  onChange={(e) => setEditingBill({ ...editingBill, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-none"
                  required
                ></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setEditingBill(null)} className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-100 rounded-xl">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 transition-all">
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Anexo de Projeto */}
      {attachingToBill && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-blue-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-blue-900 tracking-tight">Anexar Documento</h3>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Upload de projeto integral para {attachingToBill.id}</p>
              </div>
              <button onClick={() => setAttachingToBill(null)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all rounded-xl hover:bg-white">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="p-8 space-y-6 text-center">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-12 border-4 border-dashed border-blue-100 rounded-[2rem] bg-blue-50/30 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-file-arrow-up text-2xl"></i>
                </div>
                <p className="text-sm font-black text-blue-900 uppercase tracking-tight">Clique para selecionar</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Formatos aceitos: .PDF, .DOCX, .TXT</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setAttachingToBill(null)} className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header e Busca */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Ordem do Dia</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Consulte e gerencie matérias em tramitação</p>
        </div>
        <div className="flex items-center gap-3">
          {canManage && (
            <button onClick={() => setIsCreating(true)} className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-slate-900/20 transition-all flex items-center gap-2">
              <i className="fa-solid fa-plus"></i> Novo Projeto
            </button>
          )}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Buscar por ID, Título ou Autor..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
          </div>
        </div>
      </div>

      {/* Lista de Projetos */}
      <div className="space-y-4">
        {paginatedBills.length > 0 ? (
          paginatedBills.map((bill) => (
            <div key={bill.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
                      {bill.id}
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${bill.type === 'INDICATION' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                      {typeMap[bill.type] || 'Projeto'}
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(bill.status)}`}>
                      {statusMap[bill.status] || bill.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase bg-blue-50 px-2 py-1 rounded border border-blue-100">
                      {bill.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">
                    {bill.title}
                  </h3>
                  <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                    <span className="flex items-center gap-1.5"><i className="fa-solid fa-user-pen text-blue-500/50"></i> {bill.author}</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                    <span className="flex items-center gap-1.5"><i className="fa-solid fa-calendar text-slate-300"></i> Sessão {new Date().getFullYear()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onReadBill(bill)}
                    className="px-5 py-3 bg-white hover:bg-slate-50 text-blue-600 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-blue-100 shadow-sm hover:shadow-md flex items-center gap-2 group"
                  >
                    Ver Texto <i className="fa-solid fa-file-lines opacity-50 group-hover:opacity-100 transition-opacity"></i>
                  </button>

                  {/* Botão de Edição restrito a Presidente ou Mesário */}
                  {canManage && (
                    <>
                      <button
                        onClick={() => setEditingBill(bill)}
                        className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-slate-900 shadow-lg shadow-slate-900/10 flex items-center gap-2"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button
                        onClick={() => setAttachingToBill(bill)}
                        className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-blue-700 shadow-lg shadow-blue-900/10 flex items-center gap-2"
                      >
                        <i className="fa-solid fa-paperclip"></i>
                      </button>
                    </>
                  )}

                  {canManage && (
                    <button
                      onClick={() => onStartVoting(bill.id)}
                      className="px-5 py-3 bg-green-600 hover:bg-green-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                      title="Clique para iniciar a votação deste projeto"
                    >
                      Abrir Votação <i className="fa-solid fa-gavel"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <i className="fa-solid fa-folder-open text-4xl text-slate-200 mb-4"></i>
            <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Nenhuma matéria encontrada</p>
          </div>
        )}
      </div>

      {/* Controles de Paginação */}
      {
        totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 disabled:opacity-50 disabled:hover:text-slate-400 transition-all shadow-sm"
            >
              <i className="fa-solid fa-chevron-left text-xs"></i>
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all shadow-sm ${currentPage === i + 1
                  ? 'bg-blue-600 text-white border border-blue-500'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 disabled:opacity-50 disabled:hover:text-slate-400 transition-all shadow-sm"
            >
              <i className="fa-solid fa-chevron-right text-xs"></i>
            </button>
          </div>
        )
      }
    </div>
  );
};

export default BillsList;
