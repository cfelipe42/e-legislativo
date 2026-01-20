
import React, { useState } from 'react';
import { SessionHistory, VoteValue } from '../types';

interface HistoryProps {
    history: SessionHistory[];
}

const History: React.FC<HistoryProps> = ({ history }) => {
    const [expandedSession, setExpandedSession] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        if (expandedSession === id) {
            setExpandedSession(null);
        } else {
            setExpandedSession(id);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <i className="fa-solid fa-clock-rotate-left text-white text-xl"></i>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Histórico de Sessões</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Registro oficial de todas as votações realizadas</p>
                    </div>
                </div>

                {history.length === 0 ? (
                    <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                        <i className="fa-solid fa-folder-open text-4xl text-slate-300 mb-4"></i>
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Nenhum registro encontrado</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-2">As votações concluídas aparecerão aqui.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((session) => (
                            <div key={session.id} className="border border-slate-100 rounded-2xl overflow-hidden transition-all hover:shadow-md bg-slate-50/50">
                                <div
                                    onClick={() => toggleExpand(session.id)}
                                    className="p-6 cursor-pointer flex items-center justify-between hover:bg-white transition-colors"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-2 h-12 rounded-full ${session.result.outcome === 'APPROVED' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">{session.date}</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Projeto {session.billId}</span>
                                            </div>
                                            <h3 className="font-black text-slate-800 uppercase tracking-tight">
                                                Resultado: {session.result.outcome === 'APPROVED' ? 'Aprovado' : 'Rejeitado'}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <span className="block text-[10px] font-black text-green-600 uppercase">Sim</span>
                                                <span className="text-lg font-black text-slate-700">{session.result.yes}</span>
                                            </div>
                                            <div className="text-center">
                                                <span className="block text-[10px] font-black text-red-600 uppercase">Não</span>
                                                <span className="text-lg font-black text-slate-700">{session.result.no}</span>
                                            </div>
                                            <div className="text-center">
                                                <span className="block text-[10px] font-black text-slate-400 uppercase">Abs</span>
                                                <span className="text-lg font-black text-slate-700">{session.result.abstain}</span>
                                            </div>
                                        </div>
                                        <i className={`fa-solid fa-chevron-down text-slate-300 transition-transform ${expandedSession === session.id ? 'rotate-180' : ''}`}></i>
                                    </div>
                                </div>

                                {expandedSession === session.id && (
                                    <div className="border-t border-slate-100 bg-white p-6 animate-fadeIn">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Votação Nominal</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {session.individualVotes.map((vote, idx) => (
                                                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                                                    <div className={`w-1.5 h-8 rounded-full ${vote.vote === VoteValue.YES ? 'bg-green-500' :
                                                            vote.vote === VoteValue.NO ? 'bg-red-500' :
                                                                'bg-slate-400'
                                                        }`}></div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-[10px] font-black text-slate-700 uppercase truncate">{vote.councilmanName}</p>
                                                        <div className="flex justify-between items-center mt-0.5">
                                                            <span className="text-[9px] font-bold text-slate-400">{vote.party}</span>
                                                            <span className={`text-[9px] font-black uppercase ${vote.vote === VoteValue.YES ? 'text-green-600' :
                                                                    vote.vote === VoteValue.NO ? 'text-red-600' :
                                                                        'text-slate-500'
                                                                }`}>
                                                                {vote.vote === VoteValue.YES ? 'Sim' : vote.vote === VoteValue.NO ? 'Não' : 'Absteve'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
