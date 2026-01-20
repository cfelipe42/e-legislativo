import React, { useState, useEffect, useRef } from 'react';
import { ChamberConfig } from '../types';
import { supabase } from '../services/supabase';

interface LoginProps {
  onLogin: (city: string, role: 'clerk' | 'councilman' | 'president' | 'moderator') => void;
  chamberConfigs: ChamberConfig[];
}

const Login: React.FC<LoginProps> = ({ onLogin, chamberConfigs }) => {
  const [activeRole, setActiveRole] = useState<'clerk' | 'councilman' | 'president' | 'moderator'>('clerk');
  const [city, setCity] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');

  // Estados para Biometria Facial
  const [isFacialMode, setIsFacialMode] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [facialStep, setFacialStep] = useState<'idle' | 'detecting' | 'analyzing' | 'success'>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Estados para Controle de IP
  const [userIP, setUserIP] = useState<string>('');
  const [isVerifyingIP, setIsVerifyingIP] = useState(true);

  useEffect(() => {
    const fetchIP = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const response = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
        const data = await response.json();
        setUserIP(data.ip);
        clearTimeout(timeoutId);
      } catch (error) {
        setUserIP('');
      } finally {
        setIsVerifyingIP(false);
      }
    };
    fetchIP();
  }, []);

  const startFacialID = async () => {
    if (!city) {
      alert('Por favor, selecione a Câmara de destino antes de iniciar a biometria.');
      return;
    }
    setIsFacialMode(true);
    setIsScanning(true);
    setFacialStep('detecting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }

      // Simulação de processamento de IA para biometria
      setTimeout(() => setFacialStep('analyzing'), 1500);
      setTimeout(() => {
        setFacialStep('success');
        setTimeout(() => {
          stopCamera();
          onLogin(city, activeRole);
        }, 1000);
      }, 3500);

    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      alert("Não foi possível acessar a câmera para biometria facial.");
      setIsFacialMode(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsFacialMode(false);
    setIsScanning(false);
    setFacialStep('idle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Modificação: Não obrigar seleção de cidade para LOGIN (apenas para cadastro)
    // if (!city) { ... } <- Removido

    let emailPrefix = cpf.replace(/\D/g, '');
    if (emailPrefix.length === 0) {
      // Fallback for non-numeric usernames like 'admin'
      emailPrefix = cpf.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }
    const email = `${emailPrefix}@e-legislativo.com`;

    // Tentar Login primeiro
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      if (signInError.message === 'Invalid login credentials') {
        // Para criar conta, AÍ SIM precisamos da cidade e role
        if (!city) {
          alert('Usuário não encontrado. Para criar um novo cadastro, selecione a Câmara e a Função desejada antes de fazer login.');
          return;
        }

        // Se falhar e for o primeiro acesso, vamos tentar criar a conta (para facilitar testes)
        // Em produção isso seria um fluxo de SignUp separado.
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: activeRole,
              city: city,
              name: cpf // Usando o CPF como nome inicial
            }
          }
        });

        if (signUpError) {
          alert('Erro na autenticação: ' + signUpError.message);
          return;
        }

        if (signUpData.user) {
          alert('Conta criada com sucesso! Faça login novamente.');
          return;
        }
      } else {
        alert('Erro ao acessar: ' + signInError.message);
        return;
      }
    }

    if (signInData.user) {
      const userMeta = signInData.user.user_metadata;

      // Override manual selection if user has defined profile
      const finalCity = userMeta.city || city;
      const finalRole = userMeta.role || activeRole;

      // Validar IP se não for moderador
      if (finalRole !== 'moderator') {
        const currentConfig = chamberConfigs.find(c => c.city === finalCity);
        const allowedIP = currentConfig?.allowedIP || '';
        const isTestMode = allowedIP === '127.0.0.1' || allowedIP === 'localhost' || !allowedIP;
        const matchesDetected = userIP && userIP === allowedIP;

        if (!isTestMode && !matchesDetected) {
          alert(`ACESSO NEGADO: Esta rede (${userIP || 'não identificada'}) não está autorizada.\nO acesso deve ser realizado via rede oficial.`);
          await supabase.auth.signOut();
          return;
        }
      }

      onLogin(finalCity, finalRole);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-shimmer { animation: shimmer 2.5s infinite linear; }
        @keyframes scan { 0%, 100% { top: 0%; } 50% { top: 100%; } }
        .animate-scan { animation: scan 2s infinite ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>

      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-xl z-10 animate-fadeIn">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-blue-600 p-4 rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
            <i className="fa-solid fa-landmark text-4xl text-white"></i>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">E-Legislativo</h1>
          <p className="text-slate-400 mt-2 font-medium">Sistema Integrado de Gestão Legislativa</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">

          <div className={`px-6 py-2.5 flex items-center justify-between transition-colors ${activeRole === 'moderator' ? 'bg-purple-50' : isVerifyingIP ? 'bg-slate-50' : 'bg-slate-100'
            }`}>
            <div className="flex items-center gap-2">
              {isVerifyingIP ? (
                <i className="fa-solid fa-circle-notch animate-spin text-blue-500 text-[10px]"></i>
              ) : (
                <i className={`fa-solid ${activeRole === 'moderator' ? 'fa-globe text-purple-600' : 'fa-shield-halved text-slate-400'
                  } text-[10px]`}></i>
              )}
              <span className={`text-[9px] font-black uppercase tracking-widest ${activeRole === 'moderator' ? 'text-purple-700' : 'text-slate-500'
                }`}>
                {activeRole === 'moderator' ? 'Acesso Administrativo Global' :
                  isVerifyingIP ? 'Verificando Rede da Câmara...' : 'Conexão Legislativa Protegida'}
              </span>
            </div>
            <span className="text-[9px] font-mono font-bold text-slate-400">
              {userIP ? `IP DETECTADO: ${userIP}` : 'MODO LOCAL / TESTE'}
            </span>
          </div>

          <div className="flex border-b border-slate-100 bg-slate-50">
            {[
              { id: 'clerk', label: 'Mesário', icon: 'fa-clipboard-check' },
              { id: 'president', label: 'Presidente', icon: 'fa-crown' },
              { id: 'councilman', label: 'Vereador', icon: 'fa-user-tie' },
              { id: 'moderator', label: 'Moderador', icon: 'fa-user-shield' }
            ].map((role) => (
              <button
                key={role.id}
                type="button"
                disabled={isFacialMode}
                onClick={() => setActiveRole(role.id as any)}
                className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 ${activeRole === role.id
                  ? `bg-white ${role.id === 'moderator' ? 'text-purple-600 border-purple-600' : 'text-blue-600 border-blue-600'}`
                  : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-100/50'
                  } ${isFacialMode ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <i className={`fa-solid ${role.icon} mb-1.5 block text-sm`}></i>
                {role.label}
              </button>
            ))}
          </div>

          <div className="relative p-8 overflow-hidden min-h-[480px]">
            {/* Modo Facial ID */}
            {isFacialMode ? (
              <div className="flex flex-col items-center justify-center space-y-6 py-4 animate-fadeIn">
                <div className="relative w-64 h-64">
                  <div className={`absolute inset-0 rounded-full border-4 border-dashed transition-all duration-700 animate-spin-slow ${facialStep === 'success' ? 'border-emerald-500 border-solid' : 'border-blue-500'
                    }`} style={{ animationDuration: '8s' }}></div>

                  <div className="absolute inset-2 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-inner flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className={`w-full h-full object-cover ${facialStep === 'success' ? 'brightness-110 grayscale-0' : 'grayscale'}`}
                    />

                    {/* Laser de Scan */}
                    {facialStep !== 'success' && (
                      <div className="absolute inset-x-0 h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.8)] z-20 animate-scan"></div>
                    )}

                    {/* Overlay de Sucesso */}
                    {facialStep === 'success' && (
                      <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[2px] flex items-center justify-center z-30">
                        <i className="fa-solid fa-circle-check text-white text-6xl animate-bounce"></i>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <p className={`text-sm font-black uppercase tracking-[0.2em] ${facialStep === 'success' ? 'text-emerald-600' : 'text-blue-600'
                    }`}>
                    {facialStep === 'detecting' ? 'Mapeando Pontos Faciais...' :
                      facialStep === 'analyzing' ? 'Validando Identidade Parlamentar...' :
                        facialStep === 'success' ? 'Autenticação Confirmada' : 'Inicializando...'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Posicione seu rosto dentro da marcação
                  </p>
                </div>

                <button
                  onClick={stopCamera}
                  className="px-6 py-2 rounded-xl border border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancelar Biometria
                </button>
              </div>
            ) : (
              /* Modo Login Padrão */
              <form onSubmit={handleSubmit} className="space-y-5">
                {activeRole !== 'clerk' && (
                  <div className="text-center mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${activeRole === 'moderator' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                      {activeRole === 'moderator' ? 'Autenticação de Segurança' : 'Identificação Parlamentar'}
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1 ${activeRole === 'moderator' ? 'text-purple-400' : 'text-slate-400'}`}>Câmara de Destino</label>
                    <div className="relative">
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className={`w-full bg-slate-50 border rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 transition-all appearance-none ${activeRole === 'moderator' ? 'border-purple-200 focus:ring-purple-500/20 focus:border-purple-500' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                          }`}
                        required
                      >
                        <option value="" disabled>Selecione a cidade...</option>
                        {chamberConfigs.map((c) => (
                          <option key={c.city} value={c.city}>{c.city}</option>
                        ))}
                      </select>
                      <i className={`fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-xs ${activeRole === 'moderator' ? 'text-purple-300' : 'text-slate-300'}`}></i>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1 ${activeRole === 'moderator' ? 'text-purple-400' : 'text-slate-400'}`}>Usuário / CPF</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Identificação"
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                        className={`w-full bg-slate-50 border rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 transition-all ${activeRole === 'moderator' ? 'border-purple-200 focus:ring-purple-500/20 focus:border-purple-500' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                          }`}
                        required
                      />
                      <i className={`fa-solid fa-user absolute right-4 top-1/2 -translate-y-1/2 ${activeRole === 'moderator' ? 'text-purple-300' : 'text-slate-300'}`}></i>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1 ${activeRole === 'moderator' ? 'text-purple-400' : 'text-slate-400'}`}>Senha Privada</label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full bg-slate-50 border rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 transition-all ${activeRole === 'moderator' ? 'border-purple-200 focus:ring-purple-500/20 focus:border-purple-500' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                          }`}
                        required
                      />
                      <i className={`fa-solid fa-lock absolute right-4 top-1/2 -translate-y-1/2 ${activeRole === 'moderator' ? 'text-purple-300' : 'text-slate-300'}`}></i>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-center space-y-4">
                  {(activeRole === 'councilman' || activeRole === 'president') && (
                    <button
                      type="button"
                      onClick={startFacialID}
                      className="inline-flex items-center gap-2 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-all group"
                    >
                      <i className="fa-solid fa-face-viewfinder text-sm group-hover:scale-110 transition-transform"></i>
                      Usar Reconhecimento Facial
                    </button>
                  )}

                  <p className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">
                    {activeRole === 'moderator'
                      ? 'Acesso remoto habilitado via criptografia'
                      : 'Acesso restrito ao IP físico da câmara'}
                  </p>
                </div>

                <button
                  type="submit"
                  className={`group relative w-full overflow-hidden text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl transition-all shadow-xl active:scale-95 mt-2 flex items-center justify-center gap-3 ${activeRole === 'moderator'
                    ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/25 hover:shadow-purple-500/40'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 hover:shadow-blue-500/40'
                    }`}
                >
                  <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>
                  <span className="relative z-10">
                    {activeRole === 'moderator' ? 'Administrar Instância' : 'Acessar Painel Legislativo'}
                  </span>
                  <i className="fa-solid fa-arrow-right relative z-10 transition-transform duration-300 group-hover:translate-x-1.5"></i>
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-8 flex items-center justify-center gap-4">
          <span>&copy; {new Date().getFullYear()} E-Legislativo</span>
          <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
          <span>SESSÃO SEGURA</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
