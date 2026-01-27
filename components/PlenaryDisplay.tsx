
import React, { useState } from 'react';
import { Councilman, Bill, VoteValue } from '../types';

interface PlenaryDisplayProps {
  city: string;
  activeBill: Bill | null;
  councilmen: Councilman[];
  onBack: () => void;
  sessionTitle: string;
  activeSpeakerId?: string | null;
  speakingTimeElapsed?: number;
  speakingTimeLimit?: number;
  onlineUsers?: string[];
  isBellRinging?: boolean;
}

const PlenaryDisplay: React.FC<PlenaryDisplayProps> = ({
  city,
  activeBill,
  councilmen,
  onBack,
  sessionTitle,
  activeSpeakerId,
  speakingTimeElapsed = 0,
  speakingTimeLimit = 600,
  onlineUsers = [],
  isBellRinging = false
}) => {
  const [showFullText, setShowFullText] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const voteStats = {
    yes: councilmen.filter(c => c.currentVote === VoteValue.YES).length,
    no: councilmen.filter(c => c.currentVote === VoteValue.NO).length,
    abstain: councilmen.filter(c => c.currentVote === VoteValue.ABSTAIN).length,
    pending: councilmen.filter(c => c.currentVote === VoteValue.PENDING).length,
  };

  const presenceCount = councilmen.filter(c => c.isPresent).length;
  const activeSpeaker = activeSpeakerId ? councilmen.find(c => c.id === activeSpeakerId) : null;

  return (
    <div className="fixed inset-0 bg-slate-950 text-white z-[100] flex flex-col p-6 overflow-hidden font-sans">
      <style>{`
        @keyframes pulse-live { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        .animate-pulse-live { animation: pulse-live 1.5s infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: inline-block; animation: marquee 40s linear infinite; }
        .video-scanlines { background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06)); background-size: 100% 2px, 3px 100%; pointer-events: none; }
        @keyframes slide-right { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .animate-slide-right { animation: slide-right 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes modal-scale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-modal { animation: modal-scale 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes alert-bounce {
          0%, 100% { transform: translateY(0) translateX(-50%); }
          50% { transform: translateY(-10px) translateX(-50%); }
        }
        .animate-alert-bounce { animation: alert-bounce 0.5s infinite; }
      `}</style>

      {/* Alerta de Ordem no Plenário via Realtime */}
      {isBellRinging && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] animate-fadeIn">
          <div className="bg-rose-700 text-white px-10 py-5 rounded-[2.5rem] shadow-[0_20px_60px_rgba(190,18,60,0.6)] border-4 border-rose-500/50 flex items-center gap-8 animate-alert-bounce">
            <div className="bg-white/20 p-4 rounded-full animate-pulse">
              <i className="fa-solid fa-triangle-exclamation text-3xl"></i>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-2xl uppercase tracking-[0.3em] leading-none">Silêncio!</span>
              <span className="font-bold text-xs uppercase tracking-[0.4em] opacity-80 mt-2">Ordem no Plenário Requerida</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Leitura Integral do Projeto */}
      {showFullText && activeBill && (
        <div className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-8 md:p-12 animate-fadeIn">
          <div className="bg-slate-900 w-full max-w-5xl h-full rounded-[2.5rem] border border-white/10 flex flex-col shadow-2xl animate-modal overflow-hidden">
            <div className="p-8 border-b border-white/5 bg-black/20 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <i className="fa-solid fa-file-invoice text-2xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none">{activeBill.id} / {new Date().getFullYear()}</h3>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em] mt-2">Dossiê Legislativo Completo</p>
                </div>
              </div>
              <button
                onClick={() => setShowFullText(false)}
                className="w-12 h-12 bg-white/5 hover:bg-rose-600/20 text-white/40 hover:text-rose-500 rounded-xl flex items-center justify-center transition-all border border-white/10"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <div className="flex-1 p-10 overflow-y-auto scrollbar-hide bg-slate-900/50">
              <div className="max-w-3xl mx-auto space-y-10">
                <div className="text-center space-y-4">
                  <h4 className="text-2xl font-black text-white leading-tight uppercase tracking-tight">{activeBill.title}</h4>
                  <div className="inline-block px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Autor: {activeBill.author}</span>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                <div className="text-lg text-slate-300 leading-relaxed font-medium space-y-8 bg-black/10 p-10 rounded-3xl border border-white/5 shadow-inner">
                  {activeBill.fullText.split('\n').map((para, i) => (
                    <p key={i} className={para.startsWith('Art.') ? 'font-black text-white/90 pt-4 border-l-2 border-blue-600 pl-4' : ''}>
                      {para}
                    </p>
                  ))}
                </div>

                <div className="pt-20 pb-10 text-center opacity-20">
                  <p className="text-[8px] font-black uppercase tracking-[0.6em]">Autenticado via E-Legislativo Digital</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-black/40 border-t border-white/5 flex justify-center">
              <button
                onClick={() => setShowFullText(false)}
                className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-[0.4em] rounded-2xl border border-white/10 transition-all flex items-center gap-3 active:scale-95"
              >
                <i className="fa-solid fa-circle-left"></i> Voltar ao Painel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cronômetro de Transmissão */}
      {activeSpeaker && (
        <div className="fixed top-24 left-10 z-[200] animate-slide-right">
          <div className="flex flex-col">
            <div className="bg-amber-500 text-white px-6 py-3 rounded-t-2xl shadow-2xl flex items-center gap-5 border-l-8 border-amber-700">
              <div className="bg-black/20 p-2 rounded-xl">
                <i className="fa-solid fa-microphone-lines text-2xl animate-pulse"></i>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-900 leading-none mb-1">Na Tribuna</p>
                <p className="text-xl font-black uppercase tracking-tight leading-none">{activeSpeaker.name}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-amber-800 mt-1">{activeSpeaker.party}</p>
              </div>
              <div className="ml-10 border-l border-amber-400/50 pl-10 flex flex-col items-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-amber-900 mb-1">Cronômetro</p>
                <div className={`font-mono text-4xl font-black ${speakingTimeElapsed >= speakingTimeLimit ? 'text-rose-900 animate-pulse' : 'text-white'}`}>
                  {Math.floor(speakingTimeElapsed / 60)}:{String(speakingTimeElapsed % 60).padStart(2, '0')}
                </div>
              </div>
            </div>
            <div className="h-1.5 bg-amber-700/40 rounded-b-2xl overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 linear ${speakingTimeElapsed >= speakingTimeLimit ? 'bg-rose-600' : 'bg-white'}`}
                style={{ width: `${Math.min((speakingTimeElapsed / speakingTimeLimit) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Botão de Fechar Transmissão */}
      <button
        onClick={onBack}
        className="fixed bottom-12 right-6 bg-white/5 hover:bg-rose-600/20 text-white/5 hover:text-rose-500 w-8 h-8 rounded-full border border-white/5 transition-all flex items-center justify-center z-[150]"
      >
        <i className="fa-solid fa-xmark text-[10px]"></i>
      </button>

      {/* Header Técnico */}
      <div className="bg-black/40 backdrop-blur-xl border-b border-white/10 px-8 py-3 -mx-6 -mt-6 mb-6 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-xl font-black uppercase tracking-tight leading-none text-white/95">Câmara de {city}</h1>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] px-2 py-0.5 bg-blue-500/10 rounded">{sessionTitle}</span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SESSÃO AO VIVO</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => window.open("https://www.youtube.com/live_dashboard", "_blank")}
            className="w-10 h-10 bg-white/5 hover:bg-blue-600 text-white/40 hover:text-white rounded-xl flex items-center justify-center transition-all border border-white/10 group"
            title="Abrir Painel de Transmissão"
          >
            <i className="fa-solid fa-arrow-up-right-from-square text-sm group-hover:scale-110 transition-transform"></i>
          </button>

          <div className="flex flex-col items-end">
            <div className="text-lg font-mono font-bold text-white/95 leading-none mb-1">
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest text-right">
              {currentTime.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden mb-2">

        {/* LADO ESQUERDO: Mural de Votos e Info do Projeto */}
        <div className="col-span-7 flex flex-col gap-4 overflow-hidden">
          {activeBill ? (
            <>
              {/* HEADER DO PROJETO - Identidade Visual Igual ao Modelo */}
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 flex justify-between items-center backdrop-blur-sm shadow-2xl animate-fadeIn">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded shadow-lg shadow-blue-500/20 uppercase tracking-tighter">Em Votação</span>
                    <h2 className="text-xl font-black uppercase tracking-tighter text-white/95 leading-none">
                      {activeBill.id} / {new Date().getFullYear()}
                    </h2>
                  </div>
                  <p className="text-[12px] font-black text-slate-400 uppercase tracking-tight truncate pl-1">
                    {activeBill.title}
                  </p>
                </div>

                <button
                  onClick={() => setShowFullText(true)}
                  className="bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white px-5 py-3 rounded-xl border border-blue-500/30 flex items-center gap-3 transition-all group shrink-0 shadow-lg shadow-blue-500/5 active:scale-95"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Ler Projeto Integral</span>
                  <i className="fa-solid fa-book-open text-xs transition-transform group-hover:scale-110"></i>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
                <div className="grid grid-cols-5 gap-3">
                  {councilmen.map(c => {
                    const isTheActiveSpeaker = c.id === activeSpeakerId;

                    return (
                      <div
                        key={c.id}
                        className={`bg-slate-900/90 rounded-xl overflow-hidden flex flex-col items-center border transition-all duration-500 group ${!c.isPresent ? 'border-white/5 opacity-40 grayscale scale-[0.98]' :
                          isTheActiveSpeaker ? 'border-amber-500 bg-amber-950/20 ring-2 ring-amber-500 ring-offset-2 ring-offset-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-[1.03]' :
                            c.currentVote === VoteValue.YES ? 'border-emerald-500 bg-emerald-950/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]' :
                              c.currentVote === VoteValue.NO ? 'border-rose-500 bg-rose-950/20 shadow-[0_0_12px_rgba(244,63,94,0.15)]' :
                                c.currentVote === VoteValue.ABSTAIN ? 'border-slate-400 bg-slate-800/20' :
                                  'border-white/10 opacity-95'
                          }`}
                      >
                        <div className="relative w-full aspect-[3/4] overflow-hidden bg-slate-800 border-b border-white/5">
                          <img
                            src={c.avatar}
                            className={`w-full h-full object-cover transition-all duration-700 ${!c.isPresent ? 'blur-[4px]' : 'group-hover:scale-105'}`}
                            alt={c.name}
                          />

                          <div className={`absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest backdrop-blur-md border ${onlineUsers.includes(c.id)
                            ? 'bg-emerald-500/90 text-white border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse-live'
                            : c.isPresent
                              ? 'bg-emerald-500/80 text-white border-emerald-400'
                              : 'bg-rose-500/80 text-white border-rose-400'
                            }`}>
                            {onlineUsers.includes(c.id) ? '● ONLINE' : c.isPresent ? 'PRESENTE' : 'AUSENTE'}
                          </div>

                          {(c.isRequestingFloor || isTheActiveSpeaker) && c.isPresent && (
                            <div className={`absolute top-2 right-2 text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px] border border-slate-900 animate-pulse z-10 shadow-xl ${isTheActiveSpeaker ? 'bg-amber-500' : 'bg-slate-400'}`}>
                              <i className={`fa-solid ${isTheActiveSpeaker ? 'fa-microphone-lines' : 'fa-microphone'}`}></i>
                            </div>
                          )}
                        </div>

                        <div className="w-full px-2 py-2 text-center bg-black/80 flex-1 flex flex-col justify-center">
                          <p className={`text-[10px] font-black uppercase truncate leading-tight ${c.isPresent ? (isTheActiveSpeaker ? 'text-amber-400' : 'text-white/95') : 'text-white/20'}`}>{c.name}</p>
                          <p className={`text-[8px] font-bold uppercase tracking-widest ${c.isPresent ? 'text-blue-400' : 'text-white/10'}`}>{c.party}</p>
                        </div>

                        <div className={`w-full py-1.5 text-center text-[10px] font-black uppercase tracking-[0.2em] transition-all ${!c.isPresent ? 'bg-black/90 text-white/5' :
                          isTheActiveSpeaker ? 'bg-amber-600 text-white animate-pulse' :
                            c.currentVote === VoteValue.YES ? 'bg-emerald-600 text-white' :
                              c.currentVote === VoteValue.NO ? 'bg-rose-600 text-white' :
                                c.currentVote === VoteValue.ABSTAIN ? 'bg-slate-600 text-white' :
                                  'bg-white/5 text-white/20 italic'
                          }`}>
                          {!c.isPresent ? 'AUSENTE' :
                            isTheActiveSpeaker ? 'FALANDO' :
                              c.currentVote === VoteValue.YES ? 'SIM' :
                                c.currentVote === VoteValue.NO ? 'NÃO' :
                                  c.currentVote === VoteValue.ABSTAIN ? 'ABS' : 'PENDENTE'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-black/20 rounded-3xl border border-white/5">
              <i className="fa-solid fa-landmark text-5xl text-slate-800 mb-4 opacity-50"></i>
              <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-widest">Painel Legislativo Inativo</h2>
            </div>
          )}
        </div>

        {/* LADO DIREITO: Transmissão e Estatísticas */}
        <div className="col-span-5 flex flex-col gap-4">

          <div className="relative aspect-video bg-black rounded-2xl border-4 border-slate-800 shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 z-10 video-scanlines opacity-20"></div>

            <div className="absolute inset-0 z-20 p-4 pointer-events-none flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="bg-rose-600 text-white text-[9px] font-black px-2 py-1 rounded flex items-center gap-2 shadow-lg animate-pulse-live">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div> LIVE
                </div>
              </div>
            </div>

            <img
              src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=1200"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              alt="Plenário"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="bg-emerald-600/10 border border-emerald-500/20 p-4 rounded-xl text-center">
              <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Favoráveis</p>
              <p className="text-2xl font-black text-emerald-400">{voteStats.yes}</p>
            </div>
            <div className="bg-rose-600/10 border border-rose-500/20 p-4 rounded-xl text-center">
              <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">Contrários</p>
              <p className="text-2xl font-black text-rose-400">{voteStats.no}</p>
            </div>
            <div className="bg-slate-400/10 border border-slate-400/20 p-4 rounded-xl text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Abstenções</p>
              <p className="text-2xl font-black text-slate-300">{voteStats.abstain}</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center opacity-40">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Quórum</p>
              <p className="text-2xl font-black text-slate-500">{presenceCount}</p>
            </div>
          </div>

          <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 p-6 flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/30">
                <i className="fa-solid fa-chart-pie text-lg"></i>
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Distribuição do Plenário</p>
                <p className="text-sm font-bold text-white/80">Monitoramento em tempo real dos votos nominais.</p>
              </div>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all duration-1000" style={{ width: `${(presenceCount / councilmen.length) * 100}%` }}></div>
            </div>
          </div>

        </div>
      </div>

      {/* Rodapé Broadcast */}
      <div className="h-8 bg-blue-900/30 border-t border-white/5 -mx-6 -mb-6 mt-auto flex items-center overflow-hidden">
        <div className="whitespace-nowrap flex animate-marquee text-blue-400/60 font-black text-[9px] uppercase tracking-[0.5em]">
          <span className="px-12">SISTEMA ELETRÔNICO DE VOTAÇÃO • CÂMARA MUNICIPAL • TRANSMISSÃO OFICIAL • SESSÃO ORDINÁRIA •</span>
          <span className="px-12">SISTEMA ELETRÔNICO DE VOTAÇÃO • CÂMARA MUNICIPAL • TRANSMISSÃO OFICIAL • SESSÃO ORDINÁRIA •</span>
        </div>
      </div>
    </div>
  );
};

export default PlenaryDisplay;
