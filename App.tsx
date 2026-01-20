
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import VotingSession from './components/VotingSession';
import PlenaryDisplay from './components/PlenaryDisplay';
import BillsList from './components/BillsList';
import CouncilmenManagement from './components/CouncilmenManagement';
import ModerationTab from './components/ModerationTab';
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
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        setUserRole(session.user.user_metadata.role || 'clerk');
        setUserCity(session.user.user_metadata.city || 'Almenara');

        // Resolve Councilman ID from Email/CPF
        const email = session.user.email || '';
        const cpf = email.split('@')[0];
        if (cpf) {
          supabase.from('users').select('councilman_id').eq('cpf', cpf).single()
            .then(({ data }) => {
              if (data?.councilman_id) setCurrentCouncilmanId(data.councilman_id);
            });
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setUserRole(session.user.user_metadata.role || 'clerk');
        setUserCity(session.user.user_metadata.city || 'Almenara');

        // Resolve Councilman ID from Email/CPF
        const email = session.user.email || '';
        const cpf = email.split('@')[0];
        if (cpf) {
          supabase.from('users').select('councilman_id').eq('cpf', cpf).single()
            .then(({ data }) => {
              if (data?.councilman_id) setCurrentCouncilmanId(data.councilman_id);
            });
        }
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
      if (data && data.length > 0) setChamberConfigs(data as any);
    };

    // 2. Fetch Councilmen
    const fetchCouncilmen = async () => {
      const { data } = await supabase.from('councilmen').select('*').eq('city', userCity);
      if (data) setCouncilmen(data as any);
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
        const newConfig = payload.new as ChamberConfig;
        setChamberConfigs(prev => prev.map(c => c.city === newConfig.city ? newConfig : c));
        setActiveBillId(newConfig.activeBillId || null);
        setActiveSpeakerId(newConfig.activeSpeakerId || null);
      })
      .subscribe();

    // Listen to Councilmen changes (Votes & Presence)
    const councilmenSub = supabase
      .channel('public:councilmen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'councilmen', filter: `city=eq.${userCity}` }, payload => {
        if (payload.eventType === 'UPDATE') {
          setCouncilmen(prev => prev.map(c => c.id === payload.new.id ? payload.new as Councilman : c));
        } else if (payload.eventType === 'INSERT') {
          setCouncilmen(prev => [...prev, payload.new as Councilman]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(configSub);
      supabase.removeChannel(councilmenSub);
    };
  }, [isAuthenticated, userCity]);

  // Sync Active Bill from loaded config
  useEffect(() => {
    const currentConfig = chamberConfigs.find(c => c.city === userCity);
    if (currentConfig) {
      setActiveBillId(currentConfig.activeBillId || null);
      setActiveSpeakerId(currentConfig.activeSpeakerId || null);
    }
  }, [chamberConfigs, userCity]);

  useEffect(() => {
    if (activeSpeakerId) {
      timerRef.current = window.setInterval(() => setSpeakingTimeElapsed(v => v + 1), 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeSpeakerId]);

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

  const handleToggleFloorRequest = (id: string, status?: boolean) => {
    setCouncilmen(prev => prev.map(c => {
      if (c.id === id) {
        const newStatus = status !== undefined ? status : !c.isRequestingFloor;
        return { ...c, isRequestingFloor: newStatus };
      }
      return c;
    }));

    if (status === false && activeSpeakerId === id) {
      setActiveSpeakerId(null);
      setSpeakingTimeElapsed(0);
    }
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
    await supabase.from('chamber_configs').update({ activeBillId: billId }).eq('city', userCity);
  };

  const handleVote = async (councilmanId: string, vote: VoteValue) => {
    await supabase.from('councilmen').update({ currentVote: vote }).eq('id', councilmanId);
  };



  const activeBill = bills.find(b => b.id === activeBillId) || null;

  return (
    <div className="min-h-screen">
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} chamberConfigs={chamberConfigs} />
      ) : (
        <Layout activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole}>
          <div className="mb-4">
            <span className="bg-slate-800 text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase">
              Câmara de {userCity} | Perfil: {userRole}
            </span>
          </div>

          {activeTab === 'dashboard' && <Dashboard bills={bills} history={history} userRole={userRole} />}
          {activeTab === 'bills' && <BillsList bills={bills} onStartVoting={handleStartVoting} onUpdateBill={(b) => setBills(prev => prev.map(old => old.id === b.id ? b : old))} userRole={userRole as any} />}
          {activeTab === 'session' && (
            <VotingSession
              bills={bills} councilmen={councilmen} activeBill={activeBill}
              onVote={handleVote}
              onToggleFloorRequest={handleToggleFloorRequest}
              onAuthorizeSpeech={(id) => { setActiveSpeakerId(id); setSpeakingTimeElapsed(0); }}
              onAddExtraTime={() => setSpeakingTimeElapsed(prev => Math.max(0, prev - 300))}
              onComplete={(stats) => {
                const newH: SessionHistory = {
                  id: `S-${Date.now()}`, billId: activeBillId!, date: new Date().toLocaleDateString(),
                  result: { ...stats, outcome: stats.yes > stats.no ? 'APPROVED' : 'REJECTED' },
                  individualVotes: councilmen.map(c => ({ councilmanId: c.id, councilmanName: c.name, party: c.party, vote: c.currentVote }))
                };
                setHistory(prev => [newH, ...prev]);
                setBills(prev => prev.map(b => b.id === activeBillId ? { ...b, status: newH.result.outcome } : b));

                // Clear active session in DB
                supabase.from('chamber_configs').update({ activeBillId: null, activeSpeakerId: null }).eq('city', userCity).then();
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
              connectedCouncilmanId={currentCouncilmanId}
            />
          )}
          {activeTab === 'plenary' && <PlenaryDisplay city={userCity} activeBill={activeBill} councilmen={councilmen} onBack={() => setActiveTab('session')} sessionTitle="Sessão Ordinária" activeSpeakerId={activeSpeakerId} speakingTimeElapsed={speakingTimeElapsed} />}
          {activeTab === 'management' && <CouncilmenManagement councilmen={councilmen} onUpdateCouncilman={(u) => setCouncilmen(prev => prev.map(c => c.id === u.id ? u : c))} />}
          {activeTab === 'moderation' && userRole === 'moderator' && (
            <ModerationTab
              chamberConfigs={chamberConfigs}
              onUpdateConfig={(conf) => setChamberConfigs(prev => prev.map(c => c.city === conf.city ? conf : c))}
              onSwitchCity={setUserCity}
              currentCity={userCity}
              councilmen={councilmen}
              onUpdateCouncilman={(u) => setCouncilmen(prev => prev.map(c => c.id === u.id ? u : c))}
              onAddCouncilman={handleAddCouncilman}
              accounts={accounts}
              onAddAccount={handleAddAccount}
            />
          )}
        </Layout>
      )}
    </div>
  );
};

export default App;
