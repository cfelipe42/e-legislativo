
import React, { useState, useEffect } from 'react';
import { Councilman, Bill, VoteValue } from '../types';

interface VotingSessionProps {
  bills: Bill[];
  councilmen: Councilman[];
  activeBill: Bill | null;
  onVote: (councilmanId: string, vote: VoteValue) => void;
  onToggleFloorRequest: (councilmanId: string, status?: boolean) => void;
  onAuthorizeSpeech: (councilmanId: string) => void;
  onAddExtraTime: () => void;
  onComplete: (results: any) => void;
  userRole?: 'clerk' | 'councilman' | 'president' | 'moderator';
  activeSpeakerId?: string | null;
  speakingTimeElapsed?: number;
  speakingTimeLimit?: number;
  connectedCouncilmanId?: string;
}

const VotingSession: React.FC<VotingSessionProps> = ({
  councilmen,
  activeBill,
  onVote,
  onToggleFloorRequest,
  onAuthorizeSpeech,
  onAddExtraTime,
  onComplete,
  userRole = 'clerk',
  activeSpeakerId,
  speakingTimeElapsed = 0,
  speakingTimeLimit = 600,
  connectedCouncilmanId
}) => {
  const [showRequestToast, setShowRequestToast] = useState(false);
  const [isProcessingRequest, setIsProcessingRequest] = useState(false);
  const [isBellRinging, setIsBellRinging] = useState(false);
  const [showOrderAlert, setShowOrderAlert] = useState(false);

  // Identify the current user in the councilmen list
  const myData = councilmen.find(c => c.id === connectedCouncilmanId);
  // Fallback for ID if somehow not passed but role is correct (should not happen in prod)
  const myId = connectedCouncilmanId || '';

  const isPresident = userRole === 'president';
  const isClerk = userRole === 'clerk';
  const isCouncilman = userRole === 'councilman';
  const isModerator = userRole === 'moderator';

  const hasClerkPowers = isClerk || isPresident || isModerator;
  const hasCouncilPowers = isCouncilman || isPresident;

  const totalCouncilmen = councilmen.length;
  const presenceCount = councilmen.filter(c => c.isPresent).length;
  const voteStats = {
    yes: councilmen.filter(c => c.currentVote === VoteValue.YES).length,
    no: councilmen.filter(c => c.currentVote === VoteValue.NO).length,
    abstain: councilmen.filter(c => c.currentVote === VoteValue.ABSTAIN).length,
    pending: councilmen.filter(c => c.currentVote === VoteValue.PENDING).length,
  };

  const speakersPending = councilmen.filter(c => c.isRequestingFloor);
  const votesCast = totalCouncilmen - voteStats.pending;
  const progressPercentage = (votesCast / totalCouncilmen) * 100;

  const handleVoteWithFeedback = (vote: VoteValue) => {
    onVote(myId, vote);
  };

  const ringBell = () => {
    setIsBellRinging(true);
    setShowOrderAlert(true);

    // Simulação do som "Triiiim" usando AudioContext com alta frequência
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'triangle'; // Som mais metálico que o sine
        osc.frequency.setValueAtTime(freq, context.currentTime + start);
        gain.gain.setValueAtTime(0.2, context.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start(context.currentTime + start);
        osc.stop(context.currentTime + start + duration);
      };

      // Sequência para simular o "Triiiim" (campainha mecânica)
      playTone(2500, 0, 0.4);
      playTone(2550, 0.05, 0.4);
      playTone(2450, 0.1, 0.4);
      playTone(2600, 0.15, 0.4);

    } catch (e) {
      console.log('Audio feedback not supported');
    }

    setTimeout(() => {
      setIsBellRinging(false);
      setTimeout(() => setShowOrderAlert(false), 2500);
    }, 600);
  };

  const handleFloorRequestWithFeedback = () => {
    if (myData?.isRequestingFloor) {
      onToggleFloorRequest(myId);
      return;
    }

    setIsProcessingRequest(true);
    setTimeout(() => {
      onToggleFloorRequest(myId);
      setIsProcessingRequest(false);
      setShowRequestToast(true);
      setTimeout(() => setShowRequestToast(false), 3000);
    }, 600);
  };

  const getVoteDisplay = (vote: VoteValue) => {
    switch (vote) {
      case VoteValue.YES:
        return { label: 'SIM', icon: 'fa-circle-check', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-500', bar: 'bg-emerald-600' };
      case VoteValue.NO:
        return { label: 'NÃO', icon: 'fa-circle-xmark', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-500', bar: 'bg-rose-600' };
      case VoteValue.ABSTAIN:
        return { label: 'ABS', icon: 'fa-circle-minus', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-400', bar: 'bg-slate-700' };
      default:
        return { label: '...', icon: 'fa-clock', color: 'text-slate-300', bg: 'bg-white', border: 'border-slate-200 border-dashed', bar: 'bg-slate-50 text-slate-300' };
    }
  };

  const getCardStyles = (councilman: Councilman) => {
    const info = getVoteDisplay(councilman.currentVote);
    let styles = `transition-all duration-500 relative group overflow-hidden border-2 rounded-2xl ${info.bg} ${info.border} `;

    if (councilman.currentVote !== VoteValue.PENDING) {
      styles += 'shadow-lg shadow-black/5 scale-[1.02] z-10 ';
    } else {
      styles += 'opacity-80 ';
    }

    if (councilman.isRequestingFloor || councilman.isSpeaking) {
      styles += 'ring-4 ring-amber-400 ring-offset-2 animate-pulse-subtle ';
    }

    return styles;
  };

  return (
    <div className="animate-fadeIn relative">
      <style>{`
        @keyframes pulse-subtle { 0%, 100% { opacity: 1; transform: scale(1.02); } 50% { opacity: 0.95; transform: scale(1.03); } }
        .animate-pulse-subtle { animation: pulse-subtle 2s infinite ease-in-out; }
        @keyframes bell-vibrate {
          0% { transform: translate(0, 0) rotate(0); }
          10% { transform: translate(-2px, -2px) rotate(-5deg); }
          20% { transform: translate(2px, 2px) rotate(5deg); }
          30% { transform: translate(-2px, 2px) rotate(-5deg); }
          40% { transform: translate(2px, -2px) rotate(5deg); }
          50% { transform: translate(-2px, -2px) rotate(-5deg); }
          60% { transform: translate(2px, 2px) rotate(5deg); }
          70% { transform: translate(-2px, 2px) rotate(-5deg); }
          80% { transform: translate(2px, -2px) rotate(5deg); }
          100% { transform: translate(0, 0) rotate(0); }
        }
        .animate-bell-vibrate { animation: bell-vibrate 0.15s infinite; }
        @keyframes alert-bounce {
          0%, 100% { transform: translateY(0) translateX(-50%); }
          50% { transform: translateY(-10px) translateX(-50%); }
        }
        .animate-alert-bounce { animation: alert-bounce 0.5s infinite; }
      `}</style>

      {/* Alerta de Ordem no Plenário (Visível para o Presidente) */}
      {showOrderAlert && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-fadeIn">
          <div className="bg-rose-700 text-white px-10 py-4 rounded-[2rem] shadow-[0_20px_50px_rgba(190,18,60,0.5)] border-4 border-rose-500 flex items-center gap-6 animate-alert-bounce">
            <div className="bg-white/20 p-3 rounded-full animate-pulse">
              <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg uppercase tracking-[0.2em] leading-none">Silêncio!</span>
              <span className="font-bold text-[10px] uppercase tracking-widest opacity-80 mt-1">Ordem no Plenário Requerida</span>
            </div>
          </div>
        </div>
      )}

      {showRequestToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
          <div className="bg-amber-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-amber-400">
            <i className="fa-solid fa-microphone-lines animate-pulse"></i>
            <div className="flex flex-col">
              <p className="font-black text-sm leading-none">Pedido de Fala Enviado!</p>
              <p className="text-[10px] font-bold opacity-80 uppercase mt-1">Aguardando autorização da presidência</p>
            </div>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 ${hasClerkPowers ? 'lg:grid-cols-4' : ''} gap-8`}>

        <div className={`${hasClerkPowers ? 'lg:col-span-3' : ''} space-y-8`}>

          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 space-y-2">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Totalização Eletrônica</h2>
              <div className="flex items-center gap-10">
                <div className="text-center">
                  <p className="text-4xl font-black text-emerald-400 leading-none">{voteStats.yes}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase mt-1 tracking-widest">SIM</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-black text-rose-400 leading-none">{voteStats.no}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase mt-1 tracking-widest">NÃO</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-black text-slate-400 leading-none">{voteStats.abstain}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase mt-1 tracking-widest">ABS</p>
                </div>
              </div>
            </div>

            <div className="w-full md:w-64 relative z-10">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Votos Registrados</span>
                <span className="text-xs font-black text-white">{Math.round(progressPercentage)}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-1000 ease-out" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>

            {hasClerkPowers && activeBill && (
              <div className="flex flex-col gap-3 relative z-10">
                <button
                  onClick={() => onComplete(voteStats)}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase rounded-2xl shadow-xl transition-all flex items-center gap-2 border border-blue-400/30"
                >
                  Encerrar Votação <i className="fa-solid fa-gavel"></i>
                </button>
              </div>
            )}
          </div>

          {activeBill ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 px-6 py-2 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-2xl">
                {activeBill.id} / 2025
              </div>
              <div className="max-w-4xl">
                <h3 className="text-2xl font-black text-slate-800 mb-2 leading-tight">{activeBill.title}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                  <i className="fa-solid fa-user-pen text-blue-500"></i> Autor: {activeBill.author}
                </p>
                <p className="mt-4 text-slate-500 text-sm leading-relaxed">{activeBill.description}</p>
              </div>

              {hasCouncilPowers && (
                <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button onClick={() => handleVoteWithFeedback(VoteValue.YES)} className={`py-6 rounded-2xl font-black text-sm transition-all border-b-4 ${myData?.currentVote === VoteValue.YES ? 'bg-emerald-600 border-emerald-800 text-white scale-105 shadow-xl' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}>
                    <i className="fa-solid fa-check-circle text-xl mb-2 block"></i> VOTAR SIM
                  </button>
                  <button onClick={() => handleVoteWithFeedback(VoteValue.NO)} className={`py-6 rounded-2xl font-black text-sm transition-all border-b-4 ${myData?.currentVote === VoteValue.NO ? 'bg-rose-600 border-rose-800 text-white scale-105 shadow-xl' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}>
                    <i className="fa-solid fa-times-circle text-xl mb-2 block"></i> VOTAR NÃO
                  </button>
                  <button onClick={() => handleVoteWithFeedback(VoteValue.ABSTAIN)} className={`py-6 rounded-2xl font-black text-sm transition-all border-b-4 ${myData?.currentVote === VoteValue.ABSTAIN ? 'bg-slate-800 border-slate-900 text-white scale-105 shadow-xl' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-800 hover:bg-slate-100'}`}>
                    <i className="fa-solid fa-minus-circle text-xl mb-2 block"></i> ABSTER-SE
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white py-12 rounded-3xl border-2 border-dashed border-slate-100 text-center">
              <i className="fa-solid fa-calendar-clock text-4xl text-slate-200 mb-4"></i>
              <h3 className="text-lg font-black text-slate-300 uppercase tracking-widest">Aguardando Matéria</h3>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monitoramento do Plenário</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {councilmen.map((c) => {
                const voteInfo = getVoteDisplay(c.currentVote);
                const hasVoted = c.currentVote !== VoteValue.PENDING;

                return (
                  <div key={c.id} className={getCardStyles(c)}>
                    <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
                      <i className={`fa-solid ${voteInfo.icon} ${hasVoted ? voteInfo.color + ' text-base' : 'text-slate-200 text-xs'} transition-all duration-500`}></i>
                      {c.isSpeaking && <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-black animate-pulse">NO AR</span>}
                    </div>

                    <div className="p-4 flex items-center gap-4 relative">
                      <div className="relative">
                        <img
                          src={c.avatar}
                          className={`w-12 h-12 rounded-xl border border-white/20 object-cover ${!c.isPresent ? 'grayscale' : ''}`}
                          alt={c.name}
                        />
                        {c.isPresent && <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-black truncate leading-none mb-1 uppercase ${hasVoted ? 'text-slate-800' : 'text-slate-500'}`}>
                          {c.name}
                        </p>
                        <p className={`text-[9px] font-bold uppercase ${hasVoted ? 'opacity-50' : 'opacity-30'}`}>
                          {c.party}
                        </p>
                      </div>
                    </div>

                    <div className={`py-2 px-4 text-center text-[10px] font-black uppercase tracking-widest border-t ${hasVoted ? 'border-black/5' : 'border-slate-100'} ${voteInfo.bar} ${hasVoted ? 'text-white' : 'text-slate-300'}`}>
                      {voteInfo.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {hasClerkPowers && (
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-24">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] mb-6 flex items-center gap-3 border-b border-slate-50 pb-4">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><i className="fa-solid fa-desktop text-xs"></i></div>
                Gestão da Mesa
              </h4>

              <div className="space-y-8">
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fila de Oradores</p>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${speakersPending.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                      {speakersPending.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {speakersPending.length > 0 ? (
                      speakersPending.map(s => (
                        <div key={s.id} className={`flex items-center gap-3 p-3 rounded-2xl border group animate-fadeIn ${s.isRequestingIntervention ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                          <img src={s.avatar} className="w-8 h-8 rounded-full border border-white shadow-sm" alt={s.name} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[11px] font-black text-slate-800 truncate leading-tight uppercase">{s.name}</p>
                              {s.isRequestingIntervention && <span className="text-[8px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase">Aparte</span>}
                            </div>
                            <p className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter">{s.party}</p>
                          </div>
                          <button
                            onClick={() => onAuthorizeSpeech(s.id)}
                            className={`w-8 h-8 flex items-center justify-center text-white rounded-xl transition-all shadow-md active:scale-90 ${s.isRequestingIntervention ? 'bg-blue-500 hover:bg-blue-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                            title="Autorizar e Iniciar Cronômetro"
                          >
                            <i className="fa-solid fa-microphone text-[10px]"></i>
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center border-2 border-dashed border-slate-50 rounded-3xl">
                        <i className="fa-solid fa-microphone-slash text-slate-200 text-2xl mb-2 block"></i>
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none">Nenhum vereador<br />na fila de fala</p>
                      </div>
                    )}
                  </div>
                </section>

                {activeSpeakerId && (
                  <section className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-inner">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-amber-500 text-white rounded-lg flex items-center justify-center animate-pulse">
                          <i className="fa-solid fa-microphone-lines text-[10px]"></i>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Tribuna Ativa</p>
                          <p className="text-[10px] font-bold text-amber-900 leading-tight">
                            {councilmen.find(c => c.id === activeSpeakerId)?.name}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={onAddExtraTime}
                        className="bg-amber-500 hover:bg-amber-600 text-white text-[8px] font-black px-2 py-1 rounded shadow-sm transition-all"
                        title="Conceder +5 minutos"
                      >
                        +5 MIN
                      </button>
                    </div>

                    <div className={`text-center font-mono text-4xl font-black py-3 rounded-xl bg-white/50 mb-4 border border-white shadow-inner ${speakingTimeElapsed >= speakingTimeLimit ? 'text-rose-600' : 'text-amber-700'}`}>
                      {Math.floor(speakingTimeElapsed / 60)}:{String(speakingTimeElapsed % 60).padStart(2, '0')}
                    </div>

                    {/* Campainha Legislativa - Estilo Presidência */}
                    <div className="flex flex-col items-center gap-3 py-6 bg-gradient-to-b from-slate-100 to-slate-200 rounded-2xl border border-slate-300 shadow-xl mb-4">
                      <button
                        onClick={ringBell}
                        className={`w-24 h-24 rounded-full bg-gradient-to-b from-amber-200 via-amber-500 to-amber-700 border-[6px] border-amber-800 shadow-[0_15px_30px_rgba(180,83,9,0.5),inset_0_4px_8px_rgba(255,255,255,0.4)] flex items-center justify-center text-amber-900 transition-all active:scale-95 active:shadow-inner relative group ${isBellRinging ? 'animate-bell-vibrate ring-4 ring-rose-500 ring-offset-4 ring-offset-slate-200' : ''}`}
                        title="Tocar Campainha de Ordem (Triiiim!)"
                      >
                        <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <i className="fa-solid fa-bell text-4xl drop-shadow-lg"></i>
                      </button>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-amber-800 uppercase tracking-[0.2em]">Campainha de Ordem</span>
                        <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Clique para Alerta Sonoro</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onToggleFloorRequest(activeSpeakerId, false)}
                        className="py-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-rose-900/10 flex items-center justify-center gap-2 border-b-4 border-rose-800"
                      >
                        Interromper <i className="fa-solid fa-hand-stop"></i>
                      </button>
                      <button
                        onClick={() => {
                          ringBell();
                          setTimeout(() => onToggleFloorRequest(activeSpeakerId, false), 1500);
                        }}
                        className="py-4 bg-amber-400 hover:bg-amber-500 text-amber-900 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all border-b-4 border-amber-600 flex items-center justify-center gap-2"
                      >
                        Avisar e Sair <i className="fa-solid fa-bullhorn"></i>
                      </button>
                    </div>
                  </section>
                )}

                <section className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Quórum da Sessão</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600">Presentes:</span>
                    <span className="text-xs font-black text-blue-600">{presenceCount} / {totalCouncilmen}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${(presenceCount / totalCouncilmen) * 100}%` }}></div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VotingSession;
