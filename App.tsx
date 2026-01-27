
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import VotingSession from './components/VotingSession';
import PlenaryDisplay from './components/PlenaryDisplay';
import BillsList from './components/BillsList';
import CouncilmenManagement from './components/CouncilmenManagement';
import ModerationTab from './components/ModerationTab';
import History from './components/History';
import BillDetailsView from './components/BillDetailsView';
import Login from './components/Login';
import { Councilman, Bill, SessionHistory, VoteValue, UserAccount, ChamberConfig } from './types';
import { INITIAL_COUNCILMEN, INITIAL_BILLS } from './constants';
import { supabase } from './services/supabase';

const INITIAL_CHAMBER_CONFIGS: ChamberConfig[] = [
  { city: 'Almenara', allowedIP: '', isActive: true },
  { city: 'Itagimirim', allowedIP: '', isActive: true },
  { city: 'Jequitinhonha', allowedIP: '', isActive: true },
  { city: 'Pedra Azul', allowedIP: '', isActive: true },
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userCity, setUserCity] = useState('');
  const [userRole, setUserRole] = useState<'clerk' | 'councilman' | 'president' | 'moderator' | 'mesario'>('clerk');
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  // Ensure we have activeBillId sync
  const [activeBillId, setActiveBillId] = useState<string | null>(null);
  const [currentCouncilmanId, setCurrentCouncilmanId] = useState<string | undefined>(undefined);

  // Initialize with empty arrays meant to be populated from DB
  const [councilmen, setCouncilmen] = useState<Councilman[]>([]);
  const [bills, setBills] = useState<Bill[]>(INITIAL_BILLS);
  const [chamberConfigs, setChamberConfigs] = useState<ChamberConfig[]>(INITIAL_CHAMBER_CONFIGS);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  // State variables initializations
  const [speakingTimeElapsed, setSpeakingTimeElapsed] = useState(0);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const timerRef = useRef<number | null>(null);
  const channelRef = useRef<any>(null);
  const [isBellRinging, setIsBellRinging] = useState(false);
  const [readingBill, setReadingBill] = useState<Bill | null>(null);

  useEffect(() => {
    // Helper to resolve user context
    const resolveUserContext = async (session: any) => {
      if (!session) {
        setIsAuthenticated(false);
        setCurrentCouncilmanId(undefined);
        return;
      }

      const { user } = session;
      const meta = user.user_metadata;

      // Resolve details from 'users' table (source of truth)
      const email = user.email || '';
      const cpf = email.split('@')[0];

      let finalRole = meta.role || 'clerk';
      let finalCity = meta.city || 'Almenara';
      let finalName = meta.name || 'Usuário';
      let councilmanId = meta.councilman_id;

      if (cpf) {
        const { data } = await supabase.from('users').select('*').eq('cpf', cpf).maybeSingle();
        if (data) {
          finalRole = data.role;
          finalCity = data.city;
          finalName = data.name;
          councilmanId = data.councilman_id;
        }
      }

      // Batch state updates
      setUserRole(finalRole);
      setUserCity(finalCity);
      setUserName(finalName);
      if (councilmanId) setCurrentCouncilmanId(councilmanId);
      setIsAuthenticated(true);

      // Mark as present in DB
      if (councilmanId) {
        await supabase.from('councilmen').update({ is_present: true }).eq('id', councilmanId);
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth Event:', event);
      if (session) {
        resolveUserContext(session);
      } else {
        setIsAuthenticated(false);
        setCurrentCouncilmanId(undefined);
      }
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) resolveUserContext(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch initial data and setup subscriptions
  useEffect(() => {
    if (!isAuthenticated) return;
    // ... existing fetching logic ...
    // 1. Fetch Chamber Configs
    const fetchConfigs = async () => {
      const { data } = await supabase.from('chamber_configs').select('*');
      if (data && data.length > 0) {
        const mapped = data.map((c: any) => ({
          ...c,
          activeBillId: c.active_bill_id,
          activeSpeakerId: c.active_speaker_id,
          isVotingOpen: c.is_voting_open
        }));
        setChamberConfigs(mapped);
      }
    };

    // 2. Fetch Councilmen with mapping to CamelCase types
    const fetchCouncilmen = async () => {
      const { data } = await supabase.from('councilmen').select('*').eq('city', userCity);
      if (data) {
        const mapped = data.map((c: any) => ({
          ...c,
          isPresent: c.is_present,
          currentVote: c.current_vote,
          isRequestingFloor: c.is_requesting_floor,
          isRequestingIntervention: c.is_requesting_intervention,
          isSpeaking: c.is_speaking
        }));
        setCouncilmen(mapped as Councilman[]);
      }
    };

    fetchConfigs();
    fetchCouncilmen();
    // fetchBills if needed from DB, keeping static for now or fetch all
  }, [isAuthenticated, userCity]);

  // Realtime Subscriptions
  useEffect(() => {
    // Listen to Chamber Config changes (Active Session)
    const configSub = supabase
      .channel('public:chamber_configs')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chamber_configs', filter: `city=eq.${userCity}` }, payload => {
        const raw = payload.new;
        const newConfig: ChamberConfig = {
          ...raw as any,
          activeBillId: raw.active_bill_id,
          activeSpeakerId: raw.active_speaker_id,
          activeSpeakerStartTime: raw.active_speaker_start_time,
          isVotingOpen: raw.is_voting_open
        };

        // Auto-navigation: If a new bill is started, jump to session tab
        if (raw.active_bill_id && raw.active_bill_id !== (payload.old as any)?.active_bill_id) {
          setActiveTab('session');
        }

        setChamberConfigs(prev => prev.map(c => c.city === newConfig.city ? newConfig : c));
        setActiveBillId(newConfig.activeBillId || null);
        setActiveSpeakerId(newConfig.activeSpeakerId || null);

        // Timer Sync Logic
        if (newConfig.activeSpeakerId && newConfig.activeSpeakerStartTime) {
          const startTime = new Date(newConfig.activeSpeakerStartTime).getTime();
          const now = Date.now();
          const elapsed = Math.floor((now - startTime) / 1000);
          setSpeakingTimeElapsed(Math.max(0, elapsed));
        } else if (!newConfig.activeSpeakerId) {
          setSpeakingTimeElapsed(0);
        }
      })
      .subscribe();

    const councilmenSub = supabase
      .channel('public:councilmen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'councilmen', filter: `city=eq.${userCity}` }, payload => {
        const mapCouncilman = (c: any): Councilman => ({
          ...c,
          isPresent: c.is_present,
          currentVote: c.current_vote,
          isRequestingFloor: c.is_requesting_floor,
          isRequestingIntervention: c.is_requesting_intervention,
          isSpeaking: c.is_speaking
        });

        if (payload.eventType === 'UPDATE') {
          const mapped = mapCouncilman(payload.new);
          setCouncilmen(prev => prev.map(c => c.id === mapped.id ? mapped : c));
        } else if (payload.eventType === 'INSERT') {
          const mapped = mapCouncilman(payload.new);
          setCouncilmen(prev => [...prev, mapped]);
        } else if (payload.eventType === 'DELETE') {
          setCouncilmen(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(configSub);
      supabase.removeChannel(councilmenSub);
    };
  }, [isAuthenticated, userCity]);

  // Presence Subscription (Scoped by city)
  useEffect(() => {
    // We want to track everyone, but councilmen/presidents specifically by their ID
    if (!isAuthenticated || !userCity) return;

    const channelName = `presence:${userCity}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineIds = new Set<string>();
        Object.keys(state).forEach(key => {
          state[key].forEach((p: any) => {
            if (p.councilmanId) onlineIds.add(p.councilmanId);
          });
        });
        setOnlineUsers(onlineIds);
      })
      .on('broadcast', { event: 'bell' }, () => {
        setIsBellRinging(true);
        setTimeout(() => setIsBellRinging(false), 2000);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            councilmanId: currentCouncilmanId,
            role: userRole,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [isAuthenticated, currentCouncilmanId, userCity, userRole]);

  // Sync Active Bill from loaded config
  useEffect(() => {
    const currentConfig = chamberConfigs.find(c => c.city === userCity);
    if (currentConfig) {
      const newActiveBillId = currentConfig.activeBillId || null;

      // Auto-navigate to session if a new bill is activated and we are not already there
      if (newActiveBillId && newActiveBillId !== activeBillId) {
        setActiveTab('session');
      }

      setActiveBillId(currentConfig.activeBillId ?? null);
      setActiveSpeakerId(currentConfig.activeSpeakerId ?? null);
    }
  }, [chamberConfigs, userCity]);

  // Fetch and Subscribe to Bills
  useEffect(() => {
    if (!isAuthenticated || !userCity) return;

    const mapBill = (b: any): Bill => ({
      id: b.id,
      title: b.title,
      description: b.description,
      author: b.author,
      category: b.category,
      type: b.type,
      status: b.status,
      fullText: b.full_text || b.fullText || ''
    });

    const fetchBills = async () => {
      const { data, error } = await supabase.from('bills').select('*');
      if (!error && data) {
        setBills(data.map(mapBill));
      }
    };

    fetchBills();

    const billsSub = supabase
      .channel('public:bills')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, payload => {
        if (payload.eventType === 'UPDATE') {
          const mapped = mapBill(payload.new);
          setBills(prev => prev.map(b => b.id === mapped.id ? mapped : b));
        } else if (payload.eventType === 'INSERT') {
          const mapped = mapBill(payload.new);
          setBills(prev => [...prev, mapped]);
        } else if (payload.eventType === 'DELETE') {
          setBills(prev => prev.filter(b => b.id !== payload.old.id));
        }
      })
      .subscribe();

    // 3. Fetch History
    const fetchHistory = async () => {
      const { data } = await supabase.from('session_history').select('*').order('created_at', { ascending: false });
      if (data) {
        // Map DB columns to SessionHistory type if needed (snake_case to camelCase conversion mainly happens automatically if we used typed client, but here we cast)
        // Adjusting mapping: DB "bill_id" -> Type "billId", DB "individual_votes" -> "individualVotes"
        const formattedHistory = data.map((h: any) => ({
          id: h.id,
          billId: h.bill_id,
          date: h.date,
          result: h.result,
          individualVotes: h.individual_votes
        }));
        setHistory(formattedHistory);
      }
    };
    fetchHistory();

    const historySub = supabase
      .channel('public:session_history')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'session_history' }, payload => {
        // Handle new history entry
        const h = payload.new;
        const newEntry: SessionHistory = {
          id: h.id,
          billId: h.bill_id,
          date: h.date,
          result: h.result,
          individualVotes: h.individual_votes
        };
        setHistory(prev => [newEntry, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(billsSub);
      supabase.removeChannel(historySub);
    };
  }, [isAuthenticated, userCity]);

  useEffect(() => {
    if (activeSpeakerId) {
      // Find start time from config
      const config = chamberConfigs.find(c => c.city === userCity);
      const startTimeStr = config?.activeSpeakerStartTime;

      timerRef.current = window.setInterval(() => {
        if (startTimeStr) {
          const startTime = new Date(startTimeStr).getTime();
          const now = Date.now();
          const elapsed = Math.floor((now - startTime) / 1000);
          setSpeakingTimeElapsed(Math.min(600, Math.max(0, elapsed)));
        } else {
          // Fallback if no start time (shouldn't happen with new logic, but safe)
          setSpeakingTimeElapsed(v => Math.min(600, v + 1));
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSpeakerId, chamberConfigs, userCity]);

  const handleOpenTransmission = () => {
    // URL hardcoded for now or fetched from config?
    // Using a placeholder that user can request to change later
    const transmissionUrl = "https://www.youtube.com/embed/live_stream?channel=UC-97rnvd90"; // Exemplo de URL de transmissão oficial
    window.open(transmissionUrl, '_blank', 'noopener,noreferrer');
  };


  const handleLogin = (city: string, role: any) => {
    setUserCity(city);
    setUserRole(role);
    setIsAuthenticated(true);
    // Auto-redirect based on role
    if (role === 'councilman' || role === 'president') {
      setActiveTab('session');
    } else if (role === 'moderator') {
      setActiveTab('moderation');
    } else if (role === 'clerk' || role === 'mesario') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleUpdateCouncilman = async (u: Councilman) => {
    // Optimistic update
    setCouncilmen(prev => prev.map(c => c.id === u.id ? u : c));
    // Actual DB Update
    await supabase.from('councilmen').update({
      name: u.name,
      party: u.party,
      avatar: u.avatar
    }).eq('id', u.id);
  };

  const handleToggleFloorRequest = async (councilmanId: string, status?: boolean) => {
    // Optimistic Update
    setCouncilmen(prev => prev.map(c => {
      if (c.id === councilmanId) {
        const newStatus = status !== undefined ? status : !c.isRequestingFloor;
        return { ...c, isRequestingFloor: newStatus };
      }
      return c;
    }));

    // Allow passing explicit status or toggling current based on local state (might be racey but ok for MVP)
    const councilman = councilmen.find(c => c.id === councilmanId);
    const newStatus = status !== undefined ? status : !councilman?.isRequestingFloor;
    await supabase.from('councilmen').update({ is_requesting_floor: newStatus }).eq('id', councilmanId);

    if (status === false && activeSpeakerId === councilmanId) {
      setActiveSpeakerId(null);
      setSpeakingTimeElapsed(0);
      await supabase.from('chamber_configs').update({ active_speaker_id: null }).eq('city', userCity);
    }
  };

  const handleToggleInterventionRequest = async (id: string, status?: boolean) => {
    // Optimistic
    setCouncilmen(prev => prev.map(c => {
      if (c.id === id) {
        const newStatus = status !== undefined ? status : !c.isRequestingIntervention;
        return { ...c, isRequestingIntervention: newStatus };
      }
      return c;
    }));

    const councilman = councilmen.find(c => c.id === id);
    const newStatus = status !== undefined ? status : !councilman?.isRequestingIntervention;
    await supabase.from('councilmen').update({ is_requesting_intervention: newStatus }).eq('id', id);
  };

  const handleAddCouncilman = async (newCouncilman: Councilman) => {
    // Apenas para garantir que o councilmanId seja o mesmo do banco se já existir
    const { error } = await supabase.from('councilmen').insert({
      id: newCouncilman.id || `C-${Date.now()}`,
      name: newCouncilman.name,
      party: newCouncilman.party,
      city: userCity,
      avatar: newCouncilman.avatar,
      current_vote: 'PENDING',
      is_present: false
    });

    if (error) alert('Erro ao adicionar vereador: ' + error.message);
  };

  const handleUpdateConfig = async (conf: ChamberConfig) => {
    const { error } = await supabase.from('chamber_configs').update({
      allowed_ip: conf.allowedIP,
      is_active: conf.isActive
      // Adicione outros campos se necessário
    }).eq('city', conf.city);

    if (error) alert('Erro ao atualizar configuração: ' + error.message);
  };

  const handleAddAccount = async (newAccount: UserAccount & { party?: string }) => {
    try {
      // 1. Create Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `${newAccount.cpf.replace(/\D/g, '')}@camara.leg.br`,
        password: newAccount.password,
        options: {
          data: {
            name: newAccount.name,
            city: newAccount.city,
            role: newAccount.role,
            cpf: newAccount.cpf
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const userId = authData.user.id;

        // 2. Create entry in public.users table
        const { error: userError } = await supabase.from('users').insert({
          id: userId,
          name: newAccount.name,
          cpf: newAccount.cpf,
          role: newAccount.role,
          city: newAccount.city,
          councilman_id: newAccount.role === 'councilman' || newAccount.role === 'president' ? userId : null
        });

        if (userError) throw userError;

        // 3. If Councilman or President, create profile in 'councilmen' table
        if (newAccount.role === 'councilman' || newAccount.role === 'president') {
          const { error: councilmanError } = await supabase.from('councilmen').insert({
            id: userId,
            name: newAccount.name,
            party: newAccount.party || 'SEM PARTIDO',
            city: newAccount.city,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newAccount.name}`,
            current_vote: 'PENDING',
            is_present: false
          });

          if (councilmanError) throw councilmanError;
        }

        alert('Conta criada com sucesso!');
        setAccounts(prev => [...prev, newAccount]);
      }
    } catch (error: any) {
      alert('Erro ao criar conta: ' + error.message);
    }
  };

  const handleStartVoting = async (billId: string) => {
    setActiveBillId(billId);
    setActiveTab('session');
    // Start in DISCUSSION phase (is_voting_open = false)
    await supabase.from('chamber_configs').update({
      active_bill_id: billId,
      is_voting_open: false,
      active_speaker_id: null
    }).eq('city', userCity);

    // Sync bill status
    await supabase.from('bills').update({ status: 'DISCUSSION' }).eq('id', billId);
  };

  const handleOpenVoting = async () => {
    await supabase.from('chamber_configs').update({ is_voting_open: true }).eq('city', userCity);

    // Sync bill status to VOTING
    if (activeBillId) {
      await supabase.from('bills').update({ status: 'VOTING' }).eq('id', activeBillId);
    }
  };

  const handleVote = async (councilmanId: string, vote: VoteValue) => {
    // Optimistic Update
    setCouncilmen(prev => prev.map(c => c.id === councilmanId ? { ...c, currentVote: vote } : c));

    const { error } = await supabase.from('councilmen').update({ current_vote: vote }).eq('id', councilmanId);
    if (error) {
      console.error('Error voting:', error);
      // Rollback or handle error (for now just log)
    }
  };

  const mapBillToDB = (b: Bill) => ({
    id: b.id,
    title: b.title,
    description: b.description,
    author: b.author,
    category: b.category,
    type: b.type,
    status: b.status,
    full_text: b.fullText
  });

  const handleCreateBill = async (newBill: Bill) => {
    const { error } = await supabase.from('bills').insert(mapBillToDB(newBill));
    if (!error) {
      // O estado local será atualizado pelo subscription do Realtime
      alert('Projeto criado com sucesso e salvo no banco de dados!');
    } else {
      alert('Erro ao criar projeto: ' + error.message);
    }
  };

  const handleUpdateBill = async (updatedBill: Bill) => {
    const { error } = await supabase.from('bills')
      .update(mapBillToDB(updatedBill))
      .eq('id', updatedBill.id);

    if (!error) {
      // O estado local será atualizado pelo subscription do Realtime
      alert('Projeto atualizado com sucesso!');
    } else {
      alert('Erro ao atualizar projeto: ' + error.message);
    }
  };



  const activeBill = bills.find(b => b.id === activeBillId) || null;
  const activeCouncilmanObj = councilmen.find(c => c.id === currentCouncilmanId);
  const displayUserName = activeCouncilmanObj ? activeCouncilmanObj.name : userName;
  const displayUserAvatar = activeCouncilmanObj ? activeCouncilmanObj.avatar : undefined;

  return (
    <div className="min-h-screen">
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} chamberConfigs={chamberConfigs} />
      ) : (
        <Layout
          userName={displayUserName}
          userRole={userRole}
          userAvatar={displayUserAvatar}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOnline={currentCouncilmanId ? onlineUsers.has(currentCouncilmanId) : true}
        >
          <div className="mb-4">
            <span className="bg-slate-800 text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase">
              Câmara de {userCity} | Perfil: {userRole}
            </span>
          </div>

          {readingBill ? (
            <BillDetailsView bill={readingBill} onBack={() => setReadingBill(null)} />
          ) : (
            <>
              {activeTab === 'dashboard' && <Dashboard bills={bills} history={history} userRole={userRole} currentCouncilman={councilmen.find(c => c.id === currentCouncilmanId)} />}
              {activeTab === 'bills' && (
                <BillsList
                  bills={bills}
                  onStartVoting={handleStartVoting}
                  onCreateBill={handleCreateBill}
                  onUpdateBill={handleUpdateBill}
                  userRole={userRole as any}
                  onReadBill={setReadingBill}
                />
              )}
              {activeTab === 'session' && (
                <VotingSession
                  bills={bills}
                  councilmen={councilmen}
                  activeBill={activeBill}
                  onVote={handleVote}
                  onToggleFloorRequest={handleToggleFloorRequest}
                  onToggleInterventionRequest={handleToggleInterventionRequest}
                  onAuthorizeSpeech={async (id) => {
                    const startTime = new Date().toISOString();
                    setActiveSpeakerId(id);
                    setSpeakingTimeElapsed(0);
                    await supabase.from('chamber_configs').update({
                      active_speaker_id: id,
                      active_speaker_start_time: startTime
                    }).eq('city', userCity);
                  }}
                  onAddExtraTime={() => {
                    const config = chamberConfigs.find(c => c.city === userCity);
                    if (config?.activeSpeakerStartTime) {
                      const newStart = new Date(new Date(config.activeSpeakerStartTime).getTime() + (5 * 60 * 1000)).toISOString();
                      supabase.from('chamber_configs').update({ active_speaker_start_time: newStart }).eq('city', userCity).then();
                    }
                  }}
                  connectedCouncilmanId={currentCouncilmanId}
                  isVotingOpen={chamberConfigs.find(c => c.city === userCity)?.isVotingOpen || false}
                  onOpenVoting={handleOpenVoting}
                  onOpenTransmission={handleOpenTransmission}
                  onlineUsers={Array.from(onlineUsers)}
                  onComplete={(stats) => {
                    const newH: SessionHistory = {
                      id: `S-${Date.now()}`,
                      billId: activeBillId!,
                      date: new Date().toLocaleDateString(),
                      result: { ...stats, outcome: stats.yes > stats.no ? 'APPROVED' : 'REJECTED' },
                      individualVotes: councilmen.map(c => ({ councilmanId: c.id, councilmanName: c.name, party: c.party, vote: c.currentVote }))
                    };
                    setHistory(prev => [newH, ...prev]);
                    setBills(prev => prev.map(b => b.id === activeBillId ? { ...b, status: newH.result.outcome } : b));
                    supabase.from('bills').update({ status: newH.result.outcome }).eq('id', activeBillId).then();
                    supabase.from('session_history').insert({
                      id: newH.id,
                      bill_id: newH.billId,
                      date: newH.date,
                      result: newH.result,
                      individual_votes: newH.individualVotes
                    }).then();
                    supabase.from('chamber_configs').update({ active_bill_id: null, active_speaker_id: null, is_voting_open: false }).eq('city', userCity).then();
                    councilmen.forEach(c => {
                      supabase.from('councilmen').update({ current_vote: 'PENDING', is_requesting_floor: false }).eq('id', c.id).then();
                    });
                    setActiveBillId(null);
                    setActiveTab('dashboard');
                  }}
                  userRole={userRole}
                  activeSpeakerId={activeSpeakerId}
                  speakingTimeElapsed={speakingTimeElapsed}
                  userCity={userCity}
                  onRingBell={() => channelRef.current?.send({ type: 'broadcast', event: 'bell', payload: {} })}
                  isBellRingingFromSync={isBellRinging}
                />
              )}
              {activeTab === 'history' && <History history={history} />}
              {activeTab === 'plenary' && (
                <PlenaryDisplay
                  city={userCity}
                  activeBill={activeBill}
                  councilmen={councilmen}
                  onBack={() => setActiveTab('session')}
                  sessionTitle="Sessão Ordinária"
                  activeSpeakerId={activeSpeakerId}
                  speakingTimeElapsed={speakingTimeElapsed}
                  onlineUsers={Array.from(onlineUsers)}
                  isBellRinging={isBellRinging}
                />
              )}
              {activeTab === 'management' && <CouncilmenManagement councilmen={councilmen} onlineUsers={Array.from(onlineUsers)} onUpdateCouncilman={handleUpdateCouncilman} />}
              {activeTab === 'moderation' && userRole === 'moderator' && (
                <ModerationTab
                  chamberConfigs={chamberConfigs}
                  onUpdateConfig={handleUpdateConfig}
                  onSwitchCity={setUserCity}
                  currentCity={userCity}
                  councilmen={councilmen}
                  onUpdateCouncilman={handleUpdateCouncilman}
                  onAddCouncilman={handleAddCouncilman}
                  accounts={accounts}
                  onAddAccount={handleAddAccount}
                  onlineUsers={Array.from(onlineUsers)}
                />
              )}
            </>
          )}
        </Layout>
      )}
    </div>
  );
};

export default App;
