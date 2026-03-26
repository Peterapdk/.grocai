
import React, { useState } from 'react';
import { ShoppingCart, Sparkles, ShieldCheck, Globe, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { signInWithGoogle, firebaseEnabled } from '../services/firebaseService';

const Auth: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || "Kunne ikke oprette forbindelse. Prøv igen senere.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-lg relative animate-fade-in">
        <div className="glass rounded-[3rem] p-12 border border-white/5 shadow-2xl overflow-hidden relative">
          {/* subtle line effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
          
          <div className="flex flex-col items-center text-center space-y-10">
            {/* Logo */}
            <div className="relative group">
              <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full group-hover:bg-purple-500/30 transition-all duration-500" />
              <div className="relative w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-purple-500/10 transition-transform duration-500 hover:scale-105">
                <ShoppingCart className="w-12 h-12 text-zinc-950" />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl font-black tracking-tighter text-white">
                Groc<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">AI</span>
              </h1>
              <p className="text-zinc-400 font-medium max-w-xs mx-auto leading-relaxed">
                Fremtidens indkøbsliste – drevet af kunstig intelligens og sky-synkronisering.
              </p>
            </div>

            {error && (
              <div className="w-full p-5 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-4 text-left animate-in slide-in-from-top-2">
                <div className="p-2 bg-red-500/10 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-red-400 font-bold">Der opstod en fejl</p>
                  <p className="text-xs text-red-400/80 leading-relaxed font-medium">{error}</p>
                </div>
              </div>
            )}

            <div className="w-full space-y-5">
              <button 
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full h-16 bg-white text-zinc-950 rounded-2xl font-black text-lg flex items-center justify-center gap-4 hover:bg-zinc-100 active:scale-[0.97] transition-all shadow-xl shadow-white/5 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
                    Fortsæt med Google
                    <ArrowRight className="w-5 h-5 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </>
                )}
              </button>
              
              <div className="flex items-center gap-4 px-2">
                <div className="h-px bg-white/5 flex-1" />
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Sikker Synkronisering</span>
                <div className="h-px bg-white/5 flex-1" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 w-full pt-4">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group hover:border-purple-500/30 transition-colors">
                  <Globe className="w-5 h-5 text-zinc-500 group-hover:text-purple-400 transition-colors" />
                </div>
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Global</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group hover:border-blue-500/30 transition-colors">
                  <ShieldCheck className="w-5 h-5 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                </div>
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Sikker</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group hover:border-pink-500/30 transition-colors">
                  <Sparkles className="w-5 h-5 text-zinc-500 group-hover:text-pink-400 transition-colors" />
                </div>
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">AI</span>
              </div>
            </div>
          </div>
        </div>
        
        {!firebaseEnabled && (
          <div className="mt-8 p-6 glass rounded-3xl border-amber-500/20 bg-amber-500/5 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-500/10 rounded-xl">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-amber-500 font-black uppercase tracking-widest">Lokal Tilstand Aktiv</p>
                <p className="text-[11px] text-amber-500/70 font-medium">Ingen Firebase Project ID fundet. Data gemmes kun lokalt i din browser.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
