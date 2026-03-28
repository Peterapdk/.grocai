
import React from 'react';
import { Star, Plus, X } from 'lucide-react';
import { FavoriteItem } from '../types';

interface FavoritesBarProps {
  favorites: FavoriteItem[];
  onAdd: (fav: FavoriteItem) => void;
  onRemove: (id: string) => void;
}

const FavoritesBar: React.FC<FavoritesBarProps> = ({ favorites, onAdd, onRemove }) => {
  if (favorites.length === 0) return null;

  return (
    <div className="w-full space-y-3 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Star className="w-3 h-3 text-purple-500 fill-purple-500" />
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Ofte Købt</h3>
        </div>
        <span className="text-[9px] font-bold text-zinc-700 uppercase">{favorites.length} varer</span>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
        {favorites.map((fav) => (
          <div key={fav.id} className="flex-shrink-0 group relative snap-start">
            <button
              onClick={() => onAdd(fav)}
              className="block"
            >
              <div className="flex items-center gap-3 pl-3 pr-4 py-2.5 glass rounded-2xl border border-white/5 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300">
                <span className="text-xl group-hover:scale-125 transition-transform duration-300">{fav.emoji}</span>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-zinc-200 truncate max-w-[80px] leading-tight">{fav.name}</p>
                  {fav.price && (
                    <p className="text-[9px] text-zinc-500 font-medium">{new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', maximumFractionDigits: 0 }).format(fav.price)}</p>
                  )}
                </div>
                <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <Plus className="w-3 h-3 text-purple-400" />
                </div>
              </div>
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(fav.id);
              }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:border-red-500/50 z-20 shadow-lg"
              title="Fjern fra favoritter"
            >
              <X className="w-3 h-3 text-zinc-500 group-hover:text-red-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavoritesBar;
