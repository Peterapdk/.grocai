import { Lightbulb, Loader2, Sparkles, TrendingDown, PlusCircle } from 'lucide-react';
import { ShoppingList } from '../types';

interface ShoppingInsightsProps {
  activeList: ShoppingList | undefined;
  onAddSuggestion: (item: string) => void;
  insights: { hints: string[], suggestions: string[], estimatedTotal?: number } | null;
  loading: boolean;
}

export default function ShoppingInsights({ activeList, onAddSuggestion, insights, loading }: ShoppingInsightsProps) {
  if (!activeList || activeList.items.length === 0) return null;

  return (
    <div className="mt-8 p-6 glass rounded-[2rem] border-white/5 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="relative z-10 flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
          <Sparkles className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h3 className="text-xl font-black text-white tracking-tight">AI Indsigter</h3>
          <p className="text-xs text-zinc-400 font-medium mt-1">Smarte tips og forslag baseret på din liste.</p>
        </div>
      </div>

      {loading && !insights && (
        <div className="relative z-10 flex items-center gap-3 text-zinc-400 p-4 bg-white/5 rounded-xl border border-white/5">
          <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
          <span className="text-sm font-medium">Analyserer din indkøbsliste...</span>
        </div>
      )}

      {insights && (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Hints */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <TrendingDown className="w-3 h-3" />
              Smarte Tips
            </h4>
            <div className="space-y-2">
              {insights.hints.map((hint, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-300 leading-relaxed">{hint}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <PlusCircle className="w-3 h-3" />
              Glemte Varer?
            </h4>
            <div className="flex flex-wrap gap-2">
              {insights.suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onAddSuggestion(suggestion)}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl text-xs font-bold text-purple-300 transition-all group/btn"
                >
                  <PlusCircle className="w-3 h-3 opacity-50 group-hover/btn:opacity-100 transition-opacity" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
