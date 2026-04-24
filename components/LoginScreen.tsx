import React, { useState } from 'react';
import { Lock, Shield, AlertTriangle, ChevronRight, Zap } from 'lucide-react';

const CREDENTIALS = { username: 'admin', password: 'geo2026' };

interface Props {
  onLogin: () => void;
}

export const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
      setLoading(true);
      setTimeout(onLogin, 800);
    } else {
      setError(true);
      setShaking(true);
      setPassword('');
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0d1117] flex items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-red-600/8 rounded-full blur-3xl pointer-events-none" />

      <form
        onSubmit={handleSubmit}
        className={`relative z-10 w-full max-w-sm px-4 ${shaking ? 'animate-[shake_0.4s_ease]' : ''}`}
        style={shaking ? { animation: 'shake 0.4s ease' } : {}}
      >
        {/* Logo / Title */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-900/40 border border-blue-500/30 flex items-center justify-center mb-5 shadow-[0_0_60px_rgba(59,130,246,0.15)]">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-[15px] font-black text-white uppercase tracking-[0.35em] mb-1">
            Geopolitical Engine
          </h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.25em]">
            Secure Access Portal · v5.0
          </p>
        </div>

        {/* Fields */}
        <div className="space-y-3 mb-5">
          <div className={`flex items-center gap-3 bg-[#161b22] border ${error ? 'border-red-500/50' : 'border-[#30363d] focus-within:border-blue-500/60'} rounded-xl px-4 py-3 transition-all`}>
            <Zap className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(false); }}
              placeholder="Username"
              autoFocus
              className="flex-1 bg-transparent text-[12px] font-mono text-white outline-none placeholder:text-slate-600"
            />
          </div>

          <div className={`flex items-center gap-3 bg-[#161b22] border ${error ? 'border-red-500/50' : 'border-[#30363d] focus-within:border-blue-500/60'} rounded-xl px-4 py-3 transition-all`}>
            <Lock className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false); }}
              placeholder="Password"
              className="flex-1 bg-transparent text-[12px] font-mono text-white outline-none placeholder:text-slate-600"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-1">
              <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
              <span className="text-[10px] text-red-400 font-bold">Invalid credentials. Access denied.</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3.5 rounded-xl font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-xl flex items-center justify-center gap-2
            ${loading
              ? 'bg-blue-900/40 text-blue-400 border border-blue-700/30 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white hover:shadow-blue-900/40 active:scale-[0.98]'
            }`}
        >
          {loading ? (
            <><span className="w-4 h-4 border-2 border-blue-400/40 border-t-blue-400 rounded-full animate-spin" /> Authenticating...</>
          ) : (
            <><ChevronRight className="w-4 h-4" /> Enter System</>
          )}
        </button>

        <p className="text-center text-[9px] text-slate-600 mt-6 uppercase tracking-widest">
          Unauthorized access is prohibited
        </p>
      </form>

      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
    </div>
  );
};
