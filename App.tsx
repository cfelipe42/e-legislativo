
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import VotingSession from './components/VotingSession';
import PlenaryDisplay from './components/PlenaryDisplay';
import BillsList from './components/BillsList';
import CouncilmenManagement from './components/CouncilmenManagement';
import ModerationTab from './components/ModerationTab';
import History from './components/History';
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
  const [userRole, setUserRole] = useState<'clerk' | 'councilman' | 'president' | 'moderator'>('clerk');
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
  // Duplicate lines removed
  const [speakingTimeElapsed, setSpeakingTimeElapsed] = useState(0);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Helper to resolve user context
    const resolveUserContext = (session: any) => {
      if (!session) return;

      setIsAuthenticated(true);
      setUserRole(session.user.user_metadata.role || 'clerk');
      setUserCity(session.user.user_metadata.city || 'Almenara');
      setUserName(session.user.user_metadata.name || 'Usuário');

      // Resolve Councilman ID from Email/CPF
      const email = session.user.email || '';
      const cpf = email.split('@')[0];
      if (cpf) {
        supabase.from('users').select('councilman_id, role').eq('cpf', cpf).single()
          .then(({ data }) => {
            if (data) {
              if (data.councilman_id) setCurrentCouncilmanId(data.councilman_id);
              if (data.role) setUserRole(data.role as 'clerk' | 'councilman' | 'president' | 'moderator');
            }
          });
      }
    };

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) resolveUserContext(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        resolveUserContext(session);
      } else {
        setIsAuthenticated(false);
        setCurrentCouncilmanId(undefined);
      }
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
    if (!isAuthenticated || !userCity) return;
    // ... existing code ...
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
    if (!isAuthenticated || !currentCouncilmanId || !userCity) return;

    const channelName = `presence:${userCity}`;
    const channel = supabase.channel(channelName);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineIds = new Set<string>();
        Object.keys(state).forEach(key => {
          state[key].forEach((p: any) => {
            if (p.councilmanId) onlineIds.add(p.councilmanId);
          });
        });
        console.log('Online Users Sync:', Array.from(onlineIds));
        setOnlineUsers(onlineIds);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User Joined:', key, newPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Presence Subscribed. Tracking ID:', currentCouncilmanId);
          await channel.track({
            councilmanId: currentCouncilmanId,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [isAuthenticated, currentCouncilmanId, userCity]);

  // Sync Active Bill from loaded config
  useEffect(() => {
    const currentConfig = chamberConfigs.find(c => c.city === userCity);
    if (currentConfig) {
      const newActiveBillId = currentConfig.activeBillId || null;

      // Auto-navigate to session if a new bill is activated and we are not already there
      if (newActiveBillId && newActiveBillId !== activeBillId) {
        setActiveTab('session');
      }

      setActiveBillId(newActiveBillId);
      setActiveSpeakerId(currentConfig.activeSpeakerId || null);
    }
  }, [chamberConfigs, userCity]);

  // Fetch and Subscribe to Bills
  useEffect(() => {
    if (!isAuthenticated || !userCity) return;

    const fetchBills = async () => {
      const { data, error } = await supabase.from('bills').select('*');
      if (!error && data && data.length > 0) {
        // Transformar dados se necessário ou garantir que correspondem a Bill[]
        // O tipo Bill da aplicação deve bater com o banco. 
        // Assumindo mapeamento direto por enquanto.
        setBills(data as any);
      }
    };

    fetchBills();

    const billsSub = supabase
      .channel('public:bills')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, payload => {
        if (payload.eventType === 'UPDATE') {
          setBills(prev => prev.map(b => b.id === payload.new.id ? payload.new as Bill : b));
        } else if (payload.eventType === 'INSERT') {
          setBills(prev => [...prev, payload.new as Bill]);
        }
      })
      .subscribe();

    // 3. Fetch History
    const fetchHistory = async () => {
      const { data } = await supabase.from('history').select('*').order('created_at', { ascending: false });
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
      .channel('public:history')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'history' }, payload => {
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
    await supabase.from('councilmen').update({ isRequestingFloor: newStatus }).eq('id', councilmanId);

    if (status === false && activeSpeakerId === councilmanId) {
      setActiveSpeakerId(null);
      setSpeakingTimeElapsed(0);
      await supabase.from('chamber_configs').update({ activeSpeakerId: null }).eq('city', userCity);
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
    await supabase.from('councilmen').update({ isRequestingIntervention: newStatus }).eq('id', id);
  };

  const handleAddCouncilman = (newCouncilman: Councilman) => {
    setCouncilmen(prev => [...prev, newCouncilman]);
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
        // 2. If Councilman, create profile in 'councilmen' table
        if (newAccount.role === 'councilman') {
          const { error: councilmanError } = await supabase.from('councilmen').insert({
            name: newAccount.name,
            party: newAccount.party || 'SEM PARTIDO',
            city: newAccount.city,
            avatar: `https://picsum.photos/seed/${authData.user.id}/200/200`,
            currentVote: 'PENDING',
            isPresent: false
          });

          if (councilmanError) throw councilmanError;
        }

        // 3. Link explicitly in public.users if needed by current logic
        // (Not strictly necessary for the newAccount flow unless we update it to populate users table too, but for now focusing on requested Manoel/Claudio flow)

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
    await supabase.from('councilmen').update({ currentVote: vote }).eq('id', councilmanId);
  };

  const handleCreateBill = async (newBill: Bill) => {
    const { error } = await supabase.from('bills').insert(newBill);
    if (!error) {
      setBills(prev => [...prev, newBill]);
      alert('Projeto criado com sucesso!');
    } else {
      alert('Erro ao criar projeto: ' + error.message);
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

          {activeTab === 'dashboard' && <Dashboard bills={bills} history={history} userRole={userRole} currentCouncilman={councilmen.find(c => c.id === currentCouncilmanId)} />}
          {activeTab === 'bills' && <BillsList bills={bills} onStartVoting={handleStartVoting} onCreateBill={handleCreateBill} onUpdateBill={(b) => setBills(prev => prev.map(old => old.id === b.id ? b : old))} userRole={userRole as any} />}
          {activeTab === 'session' && (

            <VotingSession
              bills={bills} councilmen={councilmen} activeBill={activeBill}
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
                // To add time, we effectively push the start time back
                // New elapsed = Old elapsed - 300
                // New Start = Now - (Old elapsed - 300)
                // This is complex, easier to just manipulate local for now OR update start_time
                // For "Live" sync, better to update start_time:
                // New Start Time = Current Start Time + 5 minutes? No, that Reduces elapsed.
                // We want to reduce elapsed time by 5 mins.
                // So new Start Time = Current Start Time + 5 minutes.
                const config = chamberConfigs.find(c => c.city === userCity);
                if (config?.activeSpeakerStartTime) {
                  const newStart = new Date(new Date(config.activeSpeakerStartTime).getTime() + (5 * 60 * 1000)).toISOString();
                  supabase.from('chamber_configs').update({ active_speaker_start_time: newStart }).eq('city', userCity).then();
                }
              }}

              // New Props for Voting Phase
              connectedCouncilmanId={currentCouncilmanId}
              isVotingOpen={chamberConfigs.find(c => c.city === userCity)?.isVotingOpen || false}
              onOpenVoting={handleOpenVoting}
              onOpenTransmission={handleOpenTransmission}
              onlineUsers={Array.from(onlineUsers)}

              onComplete={(stats) => {
                const newH: SessionHistory = {
                  id: `S-${Date.now()}`, billId: activeBillId!, date: new Date().toLocaleDateString(),
                  result: { ...stats, outcome: stats.yes > stats.no ? 'APPROVED' : 'REJECTED' },
                  individualVotes: councilmen.map(c => ({ councilmanId: c.id, councilmanName: c.name, party: c.party, vote: c.currentVote }))
                };
                setHistory(prev => [newH, ...prev]);
                setBills(prev => prev.map(b => b.id === activeBillId ? { ...b, status: newH.result.outcome } : b));

                // UPDATE SUPABASE: Save Bill Status
                supabase.from('bills').update({ status: newH.result.outcome }).eq('id', activeBillId).then();

                // INSERT HISTORY
                supabase.from('history').insert({
                  id: newH.id,
                  bill_id: newH.billId,
                  date: newH.date,
                  result: newH.result,
                  individual_votes: newH.individualVotes
                }).then();

                // Clear active session in DB
                supabase.from('chamber_configs').update({ active_bill_id: null, active_speaker_id: null, is_voting_open: false }).eq('city', userCity).then();
                // Reset votes in DB
                councilmen.forEach(c => {
                  supabase.from('councilmen').update({ currentVote: 'PENDING', isRequestingFloor: false }).eq('id', c.id).then();
                });

                setActiveBillId(null);
                setActiveTab('dashboard');
              }}
              userRole={userRole}
              activeSpeakerId={activeSpeakerId}
              speakingTimeElapsed={speakingTimeElapsed}
              userCity={userCity}
            />
          )}
          {activeTab === 'history' && <History history={history} />}
          {activeTab === 'plenary' && <PlenaryDisplay city={userCity} activeBill={activeBill} councilmen={councilmen} onBack={() => setActiveTab('session')} sessionTitle="Sessão Ordinária" activeSpeakerId={activeSpeakerId} speakingTimeElapsed={speakingTimeElapsed} onlineUsers={Array.from(onlineUsers)} />}
          {activeTab === 'management' && <CouncilmenManagement councilmen={councilmen} onlineUsers={Array.from(onlineUsers)} onUpdateCouncilman={handleUpdateCouncilman} />}
          {activeTab === 'moderation' && userRole === 'moderator' && (
            <ModerationTab
              chamberConfigs={chamberConfigs}
              onUpdateConfig={(conf) => setChamberConfigs(prev => prev.map(c => c.city === conf.city ? conf : c))}
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
        </Layout>
      )}
    </div>
  );
};

export default App;
