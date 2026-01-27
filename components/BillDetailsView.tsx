
import React from 'react';
import { Bill } from '../types';

interface BillDetailsViewProps {
    bill: Bill;
    onBack: () => void;
}

const BillDetailsView: React.FC<BillDetailsViewProps> = ({ bill, onBack }) => {
    const typeMap = {
        PL: 'Projeto de Lei',
        INDICATION: 'Indicação'
    };

    const statusMap = {
        APPROVED: 'Aprovado',
        REJECTED: 'Rejeitado',
        VOTING: 'Em Votação',
        PENDING: 'Aguardando',
        DISCUSSION: 'Em Discussão'
    };

    const statusColors = {
        APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        REJECTED: 'bg-rose-100 text-rose-700 border-rose-200',
        VOTING: 'bg-blue-100 text-blue-700 border-blue-200',
        DISCUSSION: 'bg-amber-100 text-amber-700 border-amber-200',
        PENDING: 'bg-slate-100 text-slate-600 border-slate-200'
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-20">
            {/* Navigation Header */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-blue-600 font-black text-xs uppercase tracking-widest transition-all bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md"
                >
                    <i className="fa-solid fa-arrow-left"></i> Voltar à Lista
                </button>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.print()}
                        className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-xl transition-all shadow-sm hover:shadow-md"
                        title="Imprimir Matéria"
                    >
                        <i className="fa-solid fa-print"></i>
                    </button>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
                {/* Header Section */}
                <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                    <div className="relative z-10 space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-lg text-xs font-black uppercase tracking-[0.2em] border border-white/10">
                                {bill.id}
                            </span>
                            <span className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-[0.2em] border ${statusColors[bill.status]}`}>
                                {statusMap[bill.status]}
                            </span>
                            <span className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20">
                                {typeMap[bill.type] || bill.type}
                            </span>
                        </div>

                        <h2 className="text-3xl md:text-4xl font-black leading-tight tracking-tight">
                            {bill.title}
                        </h2>

                        <div className="flex flex-wrap items-center gap-8 pt-4 border-t border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                    <i className="fa-solid fa-user-pen text-blue-400"></i>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Autor da Matéria</p>
                                    <p className="text-sm font-bold text-slate-100">{bill.author}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                    <i className="fa-solid fa-tag text-purple-400"></i>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</p>
                                    <p className="text-sm font-bold text-slate-100">{bill.category}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                    <i className="fa-solid fa-calendar text-emerald-400"></i>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ano Legislativo</p>
                                    <p className="text-sm font-bold text-slate-100">2026</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Text Section */}
                <div className="p-10 md:p-16">
                    <div className="prose prose-slate max-w-none">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-3">
                            <span className="w-8 h-1 bg-blue-600 rounded-full"></span>
                            Ementa e Justificativa
                        </h4>
                        <p className="text-lg text-slate-600 leading-relaxed font-medium bg-slate-50 p-8 rounded-3xl border border-slate-100 italic">
                            "{bill.description}"
                        </p>

                        <div className="mt-16">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center gap-3">
                                <span className="w-8 h-1 bg-blue-600 rounded-full"></span>
                                Texto Integral da Matéria
                            </h4>

                            <div className="bg-white p-10 md:p-12 rounded-[2rem] border border-slate-100 shadow-inner min-h-[400px]">
                                {bill.fullText ? (
                                    <div className="space-y-6 text-slate-700 font-serif leading-loose whitespace-pre-wrap text-lg">
                                        {bill.fullText}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                                        <i className="fa-solid fa-file-circle-exclamation text-6xl mb-4"></i>
                                        <p className="font-black uppercase tracking-widest text-sm text-slate-400">Texto ainda não anexado</p>
                                        <p className="text-xs font-bold mt-2">O autor ou secretaria deverá anexar o texto integral.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Signature */}
                    <div className="mt-20 pt-10 border-t border-slate-100 flex flex-col items-center text-center">
                        <div className="w-48 h-px bg-slate-200 mb-8"></div>
                        <p className="text-sm font-black text-slate-800 uppercase tracking-wider">{bill.author}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Gabinete Parlamentar</p>

                        <div className="mt-12 flex gap-4">
                            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center grayscale opacity-50">
                                <i className="fa-solid fa-stamp text-xl"></i>
                            </div>
                            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center grayscale opacity-50">
                                <i className="fa-solid fa-qrcode text-xl"></i>
                            </div>
                        </div>
                        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-4">Documento Digital Autenticado via E-Legislativo API</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillDetailsView;
