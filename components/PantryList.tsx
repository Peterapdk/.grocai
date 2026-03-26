import React, { useState } from 'react';
import { PantryItem } from '../types';
import { CATEGORY_STYLES } from '../constants';
import { 
  Trash2, 
  Pencil, 
  Check, 
  X,
  Plus,
  Minus,
  Calendar,
  AlertCircle,
  Star
} from 'lucide-react';

interface PantryListProps {
  items: PantryItem[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<PantryItem>) => void;
  autoEditId?: string | null;
  onAutoEditStart?: () => void;
}

const PantryList: React.FC<PantryListProps> = ({ items, onDelete, onUpdate, autoEditId, onAutoEditStart }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editExpiration, setEditExpiration] = useState<string>('');
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editPercentage, setEditPercentage] = useState<number>(100);

  const groups: Record<string, PantryItem[]> = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PantryItem[]>);

  const sortedCategories = Object.keys(groups).sort();

  const handleQuantity = (item: PantryItem, delta: number) => {
    const nextQty = Math.max(0, item.quantity + delta);
    onUpdate(item.id, { quantity: nextQty });
  };

  const startEditing = (item: PantryItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditQuantity(item.quantity);
    setEditPercentage(item.percentageLeft ?? 100);
    if (item.expirationDate) {
      const date = new Date(item.expirationDate);
      setEditExpiration(date.toISOString().split('T')[0]);
    } else {
      setEditExpiration('');
    }
  };

  React.useEffect(() => {
    if (autoEditId) {
      const item = items.find(i => i.id === autoEditId);
      if (item) {
        startEditing(item);
        if (onAutoEditStart) onAutoEditStart();
      }
    }
  }, [autoEditId, items, onAutoEditStart]);

  const saveEditing = () => {
    if (editingId) {
      let expDate: number | undefined = undefined;
      if (editExpiration) {
        expDate = new Date(editExpiration).getTime();
      }
      
      onUpdate(editingId, { 
        name: editName, 
        category: editCategory,
        color: CATEGORY_STYLES[editCategory]?.color || CATEGORY_STYLES['Andet'].color,
        expirationDate: expDate,
        quantity: editQuantity,
        percentageLeft: editPercentage
      });
      setEditingId(null);
    }
  };

  const isExpiringSoon = (date?: number) => {
    if (!date) return false;
    const daysUntil = (date - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntil <= 3 && daysUntil >= 0;
  };

  const isExpired = (date?: number) => {
    if (!date) return false;
    return date < Date.now();
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-500 animate-in fade-in duration-1000">
        <div className="w-20 h-20 bg-zinc-900/50 rounded-3xl flex items-center justify-center mb-6 ring-1 ring-zinc-800/50 shadow-2xl">
          <span className="text-4xl opacity-50">🥫</span>
        </div>
        <p className="text-xl font-semibold text-zinc-400 tracking-tight">Dit spisekammer er tomt</p>
        <p className="text-sm text-zinc-600 mt-2 font-medium">Tilføj varer eller flyt dem fra indkøbslisten</p>
      </div>
    );
  }

  return (
    <div className="space-y-16 mt-12 pb-12">
      {sortedCategories.map((cat) => {
        const categoryItems = groups[cat];

        return (
          <div key={cat} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-end gap-4 mb-8 group/cat">
              <div 
                className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl transition-transform duration-500 group-hover/cat:scale-105"
                style={{ 
                  backgroundColor: CATEGORY_STYLES[cat]?.color || '#71717a',
                  boxShadow: `0 10px 30px -10px ${CATEGORY_STYLES[cat]?.color}44`
                }}
              >
                {CATEGORY_STYLES[cat]?.icon || CATEGORY_STYLES['Andet'].icon}
              </div>
              <div className="pb-1">
                <h3 className="font-black text-2xl text-zinc-100 tracking-tighter leading-none">{cat}</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.25em] mt-2 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-800" />
                  {categoryItems.length} {categoryItems.length === 1 ? 'genstand' : 'genstande'}
                </p>
              </div>
              <div className="flex-1 h-px bg-zinc-800/50 mb-3 ml-2" />
            </div>

            <div className="grid grid-cols-1 gap-4">
              {categoryItems.map((item) => {
                const isEditing = editingId === item.id;
                const expiring = isExpiringSoon(item.expirationDate);
                const expired = isExpired(item.expirationDate);

                return (
                  <div 
                    key={item.id}
                    className={`group relative flex flex-col bg-[#121214]/60 hover:bg-[#18181b]/80 rounded-[1.5rem] border transition-all duration-300 ${expired ? 'border-red-500/30 bg-red-500/5' : expiring ? 'border-amber-500/30 bg-amber-500/5' : 'border-zinc-800/40'} ${isEditing ? 'ring-2 ring-purple-500/50 bg-[#18181b] border-purple-500/20 shadow-[0_0_40px_-10px_rgba(168,85,247,0.15)]' : 'hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] hover:-translate-y-0.5'}`}
                  >
                    <div className="flex items-center gap-5 p-5">
                      <div className="w-16 h-16 shrink-0 rounded-2xl bg-zinc-900/80 flex items-center justify-center overflow-hidden border border-zinc-800/50 shadow-inner group-hover:scale-105 transition-transform duration-500">
                        <span className="text-3xl filter drop-shadow-lg">{item.emoji}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="grid grid-cols-1 gap-3">
                            <input
                              autoFocus
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none transition-all"
                              placeholder="Varenavn"
                            />
                            <div className="flex gap-2">
                              <div className="flex items-center bg-zinc-950/50 border border-zinc-800 rounded-xl px-3 py-2">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mr-2">Antal</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={editQuantity}
                                  onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                                  className="w-12 bg-transparent text-xs text-white outline-none text-center"
                                />
                              </div>
                              <div className="flex items-center bg-zinc-950/50 border border-zinc-800 rounded-xl px-3 py-2 flex-1">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mr-2">% Tilbage</span>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="10"
                                  value={editPercentage}
                                  onChange={(e) => setEditPercentage(parseInt(e.target.value))}
                                  className="flex-1 accent-purple-500"
                                />
                                <span className="text-xs text-white ml-2 w-8 text-right">{editPercentage}%</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <select
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="flex-1 bg-zinc-950/50 border border-zinc-800 rounded-xl px-3 py-2 text-[10px] text-zinc-300 font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-purple-500/50"
                              >
                                {Object.keys(CATEGORY_STYLES).map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                              <div className="relative flex-1">
                                <input
                                  type="date"
                                  value={editExpiration}
                                  onChange={(e) => setEditExpiration(e.target.value)}
                                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-purple-500/50"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <h4 className="text-lg font-bold text-zinc-100 tracking-tight leading-snug truncate mb-1">
                              {item.name}
                            </h4>
                            
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/5 border border-purple-500/10">
                                <span className="text-[10px] font-black text-purple-400 uppercase tracking-tighter">{item.quantity} stk</span>
                              </div>
                              
                              {item.percentageLeft !== undefined && (
                                <>
                                  <div className="h-3 w-px bg-zinc-800/50" />
                                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border bg-zinc-900/50 border-zinc-800 text-zinc-400">
                                    <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ 
                                          width: `${item.percentageLeft}%`,
                                          backgroundColor: item.percentageLeft > 50 ? '#22c55e' : item.percentageLeft > 20 ? '#eab308' : '#ef4444'
                                        }}
                                      />
                                    </div>
                                    <span className="text-[9px] font-bold uppercase tracking-widest">{item.percentageLeft}%</span>
                                  </div>
                                </>
                              )}

                              {item.expirationDate && (
                                <>
                                  <div className="h-3 w-px bg-zinc-800/50" />
                                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${expired ? 'bg-red-500/10 border-red-500/20 text-red-400' : expiring ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400'}`}>
                                    {expired || expiring ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                                    <span className="text-[9px] font-bold uppercase tracking-widest">
                                      {expired ? 'Udløbet' : expiring ? 'Udløber snart' : 'Udløber'}: {new Date(item.expirationDate).toLocaleDateString('da-DK')}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {!isEditing && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                            <div className="flex items-center bg-zinc-900/80 border border-zinc-800 rounded-xl p-1 shadow-2xl">
                              <button onClick={() => handleQuantity(item, -1)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <div className="w-px h-3 bg-zinc-800 mx-0.5" />
                              <button onClick={() => handleQuantity(item, 1)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center bg-zinc-900/80 border border-zinc-800 rounded-xl p-1 shadow-2xl">
                              <button onClick={() => onUpdate(item.id, { isFavorite: !item.isFavorite })} className={`p-1.5 rounded-lg transition-all ${item.isFavorite ? 'text-yellow-400 bg-yellow-400/10' : 'text-zinc-500 hover:text-yellow-400 hover:bg-yellow-400/10'}`}>
                                <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-yellow-400' : ''}`} />
                              </button>
                              <button onClick={() => startEditing(item)} className="p-1.5 text-zinc-500 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-all">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => onDelete(item.id)} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {isEditing && (
                        <div className="flex flex-col gap-2 shrink-0 animate-in fade-in zoom-in-95 duration-200">
                          <button onClick={saveEditing} className="w-10 h-10 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white rounded-xl transition-all flex items-center justify-center border border-green-500/20">
                            <Check className="w-5 h-5" strokeWidth={3} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="w-10 h-10 bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800 hover:text-white rounded-xl transition-all flex items-center justify-center border border-zinc-700/30">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PantryList;
