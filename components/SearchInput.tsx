
import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2, ScanBarcode, Type, X, CheckCircle2, WifiOff } from 'lucide-react';

interface SearchInputProps {
  onAdd: (query: string) => void;
  isLoading: boolean;
}

type InputMode = 'manual' | 'barcode';

const SearchInput: React.FC<SearchInputProps> = ({ onAdd, isLoading }) => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<InputMode>('manual');
  const [lastAdded, setLastAdded] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
        setIsOnline(false);
        setMode('manual'); // Skift automatisk til manuel når vi går offline
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    
    const handleGlobalClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('button, select, input, textarea')) return;
      inputRef.current?.focus();
    };
    
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [mode]);

  useEffect(() => {
    if (!isLoading && lastAdded) {
      const timer = setTimeout(() => setLastAdded(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, lastAdded]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim() && !isLoading) {
      setLastAdded(true);
      onAdd(query.trim());
      setQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Mode Slider */}
      <div className="flex justify-center">
        <div className="relative flex p-1 bg-zinc-900 border border-zinc-800 rounded-full w-64 h-10 overflow-hidden shadow-inner">
          <div 
            className={`absolute top-1 left-1 bottom-1 w-[calc(50%-4px)] bg-zinc-100 rounded-full transition-transform duration-300 ease-out shadow-sm ${
              mode === 'barcode' ? 'translate-x-full' : 'translate-x-0'
            }`}
          />
          <button
            onClick={() => setMode('manual')}
            className={`relative flex-1 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 z-10 ${
              mode === 'manual' ? 'text-zinc-950' : 'text-zinc-500'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            Manuel
          </button>
          <button
            disabled={!isOnline}
            onClick={() => setMode('barcode')}
            className={`relative flex-1 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 z-10 ${
              mode === 'barcode' ? 'text-zinc-950' : 'text-zinc-500'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            <ScanBarcode className="w-3.5 h-3.5" />
            Stregkode
          </button>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute top-5 left-5 pointer-events-none z-10">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
          ) : lastAdded ? (
            <CheckCircle2 className="w-5 h-5 text-green-500 animate-in zoom-in duration-300" />
          ) : !isOnline && mode === 'barcode' ? (
            <WifiOff className="w-5 h-5 text-amber-500" />
          ) : (
            mode === 'manual' ? 
              <Search className="w-5 h-5 text-zinc-500 group-focus-within:text-purple-500 transition-colors" /> :
              <ScanBarcode className="w-5 h-5 text-zinc-500 group-focus-within:text-purple-500 transition-colors" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder={
            isLoading 
              ? "Behandler..." 
              : !isOnline 
              ? "Offline: Kun manuel indtastning" 
              : mode === 'manual' 
              ? "Hvad mangler vi?" 
              : "Afventer scanning..."
          }
          inputMode={mode === 'barcode' ? 'none' : 'text'}
          className={`w-full h-16 pl-14 pr-16 bg-zinc-900/40 border rounded-2xl outline-none transition-all text-zinc-100 placeholder:text-zinc-600 glass text-lg font-medium ${
            isLoading ? 'border-purple-500/50 ring-2 ring-purple-500/10' : 'border-zinc-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50'
          }`}
        />

        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {query && !isLoading ? (
            <button 
              onClick={() => setQuery('')}
              className="p-2 text-zinc-600 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          ) : query && isLoading ? (
            <div className="text-[10px] font-bold text-purple-500 uppercase tracking-widest animate-pulse px-2">
              Opslag
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 opacity-50 group-focus-within:opacity-100 transition-opacity">
              <span className="text-[10px] font-bold text-zinc-500">ENTER</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-center px-2">
        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] animate-in fade-in duration-700">
          {!isOnline 
            ? 'Forbindelse afbrudt • Ændringer synkroniseres senere' 
            : mode === 'barcode' 
            ? 'Scanner Aktiv • Ingen Tastatur' 
            : 'Standard Indtastning'}
        </p>
      </div>
    </div>
  );
};

export default SearchInput;
