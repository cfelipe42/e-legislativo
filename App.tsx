
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
  const [councilmen, setCouncilmen] = useState<Councilman[]>(INITIAL_COUNCILMEN);
  const [bills, setBills] = useState<Bill[]>(INITIAL_BILLS);
  const [chamberConfigs, setChamberConfigs] = useState<ChamberConfig[]>(INITIAL_CHAMBER_CONFIGS);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [activeBillId, setActiveBillId] = useState<string | null>(null);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [speakingTimeElapsed, setSpeakingTimeElapsed] = useState(0);
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        setUserRole(session.user.user_metadata.role || 'clerk');
        setUserCity(session.user.user_metadata.city || 'Almenara');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setUserRole(session.user.user_metadata.role || 'clerk');
        setUserCity(session.user.user_metadata.city || 'Almenara');
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
    if (role === 'councilman' || role === 'president') {
      setCouncilmen(prev => prev.map(c => c.id === '1' ? { ...c, isPresent: true } : c));
      setActiveTab('session');
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

  const handleAddAccount = (newAccount: UserAccount) => {
    setAccounts(prev => [...prev, newAccount]);
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
          {activeTab === 'bills' && <BillsList bills={bills} onStartVoting={(id) => { setActiveBillId(id); setActiveTab('session'); }} onUpdateBill={(b) => setBills(prev => prev.map(old => old.id === b.id ? b : old))} userRole={userRole as any} />}
          {activeTab === 'session' && (
            <VotingSession
              bills={bills} councilmen={councilmen} activeBill={activeBill}
              onVote={(id, v) => setCouncilmen(prev => prev.map(c => c.id === id ? { ...c, currentVote: v } : c))}
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
                setActiveBillId(null);
                setActiveTab('dashboard');
              }}
              userRole={userRole}
              activeSpeakerId={activeSpeakerId}
              speakingTimeElapsed={speakingTimeElapsed}
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
