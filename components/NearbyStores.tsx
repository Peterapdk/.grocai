import { useState } from 'react';
import { MapPin, Loader2, Store, ExternalLink } from 'lucide-react';
import { findNearbyStores } from '../services/geminiService';

export default function NearbyStores() {
  const [loading, setLoading] = useState(false);
  const [storesData, setStoresData] = useState<{ text: string, links: { title: string, uri: string }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFindStores = () => {
    setLoading(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError("Geolokation er ikke understøttet af din browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await findNearbyStores({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          
          if (response && response.text) {
            const text = response.text;
            const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            const links = chunks
              .filter((chunk: any) => chunk.web?.uri || chunk.maps?.uri)
              .map((chunk: any) => {
                const source = chunk.web || chunk.maps;
                return {
                  title: source.title || "Link",
                  uri: source.uri
                };
              });
              
            setStoresData({ text, links });
          } else {
            setError("Kunne ikke finde butikker.");
          }
        } catch (err) {
          console.error(err);
          setError("Der opstod en fejl.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setError("Kunne ikke hente din placering. Tillad venligst geolokation.");
        setLoading(false);
      }
    );
  };

  return (
    <div className="mt-8 p-6 glass rounded-[2rem] border-white/5 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
            <MapPin className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">Find Nærmeste Butikker</h3>
            <p className="text-xs text-zinc-400 font-medium mt-1">Brug AI og din placering til at finde supermarkeder.</p>
          </div>
        </div>
        {!storesData && !loading && (
          <button 
            onClick={handleFindStores}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            Find nu
          </button>
        )}
      </div>

      {loading && (
        <div className="relative z-10 flex items-center gap-3 text-zinc-400 p-4 bg-white/5 rounded-xl border border-white/5">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          <span className="text-sm font-medium">Søger efter butikker i nærheden...</span>
        </div>
      )}

      {error && (
        <div className="relative z-10 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      {storesData && (
        <div className="relative z-10 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
          <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap bg-white/5 p-5 rounded-2xl border border-white/5">
            {storesData.text}
          </div>
          
          {storesData.links.length > 0 && (
            <div className="pt-2">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Kilder & Links</p>
              <div className="flex flex-wrap gap-2">
                {storesData.links.map((link, idx) => (
                  <a 
                    key={idx} 
                    href={link.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-medium text-blue-400 transition-colors"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[200px]">{link.title}</span>
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </a>
                ))}
              </div>
            </div>
          )}
          
          <div className="pt-4 border-t border-white/5 flex justify-end">
            <button 
              onClick={handleFindStores}
              className="text-xs font-bold text-zinc-500 hover:text-white transition-colors flex items-center gap-2"
            >
              <MapPin className="w-3 h-3" />
              Opdater søgning
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
