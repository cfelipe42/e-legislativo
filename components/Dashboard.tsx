
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Bill, SessionHistory, Councilman } from '../types';

interface DashboardProps {
  bills: Bill[];
  history: SessionHistory[];
  userRole?: 'clerk' | 'councilman' | 'president' | 'moderator';
  currentCouncilman?: Councilman;
}

const Dashboard: React.FC<DashboardProps> = ({ bills, history, userRole = 'clerk', currentCouncilman }) => {
  // President also has a voting record in this system, so they should see the same dashboard features as a councilman
  const isCouncilman = userRole === 'councilman' || userRole === 'president';

  const stats = [
    { label: 'Projetos em Pauta', value: bills.filter(b => b.status === 'PENDING').length, icon: 'fa-clock', color: 'bg-blue-500' },
    { label: 'Aprovados este mês', value: history.filter(h => h.result.outcome === 'APPROVED').length, icon: 'fa-check-circle', color: 'bg-green-500' },
    { label: 'Presença Média', value: '92%', icon: 'fa-users', color: 'bg-purple-500' },
    { label: 'Total de Sessões', value: '14', icon: 'fa-calendar-check', color: 'bg-orange-500' },
  ];

  const chartData = [
    { name: 'Aprovados', value: history.filter(h => h.result.outcome === 'APPROVED').length, color: '#22c55e' },
    { name: 'Rejeitados', value: history.filter(h => h.result.outcome === 'REJECTED').length, color: '#ef4444' },
  ];

  // Dados mockados para o histórico individual do vereador (baseado no histórico global)
  const myVotingHistory = history.map((h, index) => ({
    ...h,
    myVote: index % 2 === 0 ? 'SIM' : 'NÃO', // Simulação: alternando votos para o exemplo
  }));

  const myStats = {
    total: myVotingHistory.length,
    yes: myVotingHistory.filter(v => v.myVote === 'SIM').length,
    no: myVotingHistory.filter(v => v.myVote === 'NÃO').length,
    aligned: myVotingHistory.filter(v => (v.myVote === 'SIM' && v.result.outcome === 'APPROVED') || (v.myVote === 'NÃO' && v.result.outcome === 'REJECTED')).length
  };

  const handleViewBillDetails = (billId: string) => {
    alert(`Visualizando detalhes técnicos do projeto ${billId}. Esta funcionalidade abrirá o dossiê completo da matéria.`);
  };

  const handleViewVoteBreakdown = (billId: string) => {
    alert(`Abrindo painel nominal de votos do projeto ${billId}. Visualize como cada bancada se posicionou.`);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className={`${stat.color} text-white p-4 rounded-xl shadow-inner`}>
              <i className={`fa-solid ${stat.icon} text-xl`}></i>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LADO ESQUERDO: Cards Principais */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* CARD DE HISTÓRICO DO VEREADOR */}
          {isCouncilman && (
            <div className="bg-indigo-900 text-white p-8 rounded-3xl shadow-xl shadow-indigo-900/20 relative overflow-hidden border border-white/5">
               <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl"></div>
               
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
                  <div>
                    <h3 className="text-xl font-black flex items-center gap-3">
                      <i className="fa-solid fa-file-signature text-amber-400"></i> Meu Histórico Parlamentar
                    </h3>
                    <p className="text-indigo-300 text-xs mt-1 font-medium italic">Resumo de suas decisões e alinhamento com o plenário</p>
                  </div>
                  <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Alinhamento Plenário</span>
                    <span className="text-xl font-black text-amber-400">{Math.round((myStats.aligned / myStats.total) * 100)}%</span>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                    <p className="text-[10px] font-black text-indigo-300 uppercase mb-2">Votos Favoráveis</p>
                    <p className="text-3xl font-black text-green-400">{myStats.yes}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                    <p className="text-[10px] font-black text-indigo-300 uppercase mb-2">Votos Contrários</p>
                    <p className="text-3xl font-black text-red-400">{myStats.no}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                    <p className="text-[10px] font-black text-indigo-300 uppercase mb-2">Total Registrado</p>
                    <p className="text-3xl font-black text-white">{myStats.total}</p>
                  </div>
               </div>

               <div className="bg-black/20 rounded-2xl overflow-hidden border border-white/5 relative z-10">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[500px]">
                      <thead className="bg-white/5 text-indigo-200 font-black uppercase tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Projeto</th>
                          <th className="px-6 py-4 text-center">Meu Voto</th>
                          <th className="px-6 py-4 text-center">Resultado Final</th>
                          <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {myVotingHistory.map((v, i) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4 font-bold">{v.billId}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2 py-1 rounded-lg font-black ${v.myVote === 'SIM' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {v.myVote}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2 py-1 rounded-lg font-black border ${v.result.outcome === 'APPROVED' ? 'border-green-500/30 text-green-500 bg-green-500/5' : 'border-red-500/30 text-red-500 bg-red-500/5'}`}>
                                {v.result.outcome === 'APPROVED' ? 'APROVADO' : 'REJEITADO'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleViewBillDetails(v.billId)}
                                  className="w-8 h-8 flex items-center justify-center bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white rounded-lg transition-all border border-indigo-500/30"
                                  title="Ver Detalhes do Projeto"
                                >
                                  <i className="fa-solid fa-eye text-[10px]"></i>
                                </button>
                                <button 
                                  onClick={() => handleViewVoteBreakdown(v.billId)}
                                  className="w-8 h-8 flex items-center justify-center bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white rounded-lg transition-all border border-amber-500/30"
                                  title="Ver Histórico Nominal"
                                >
                                  <i className="fa-solid fa-list-ul text-[10px]"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>
          )}

          {/* Gráfico Geral de Votações */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 mb-8 uppercase tracking-widest flex items-center gap-2">
               <i className="fa-solid fa-chart-bar text-blue-500"></i> Desempenho do Plenário
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '700' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: Atividade e Avisos */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-full">
            <h3 className="text-sm font-black text-slate-800 mb-8 uppercase tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-clock-rotate-left text-blue-500"></i> Atividades Recentes
            </h3>
            <div className="space-y-8 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {history.slice(0, 5).map((h, i) => (
                <div key={i} className="flex gap-6 relative">
                  <div className={`mt-1.5 w-4 h-4 rounded-full border-4 border-white flex-shrink-0 shadow-sm z-10 ${h.result.outcome === 'APPROVED' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                       <p className="text-[11px] font-black text-slate-800 leading-tight">Projeto {h.billId}</p>
                       <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{h.date}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                       Resultado: {h.result.outcome === 'APPROVED' ? 'Aprovado por maioria' : 'Rejeitado pelo plenário'}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                       <span className="text-[9px] font-black text-green-600 bg-green-50 px-1.5 rounded">{h.result.yes} S</span>
                       <span className="text-[9px] font-black text-red-600 bg-red-50 px-1.5 rounded">{h.result.no} N</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 p-4 bg-slate-50 rounded-2xl border border-slate-100 border-dashed text-center">
               <button 
                 onClick={() => alert("Gerando relatório executivo completo da sessão. Esta função processa as estatísticas e exporta um arquivo PDF oficial.")}
                 className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
               >
                  Ver Relatório Completo <i className="fa-solid fa-arrow-right ml-1"></i>
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
