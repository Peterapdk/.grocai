
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GroceryItem } from '../types';
import { CATEGORY_STYLES } from '../constants';
import { 
  Trash2, 
  ShoppingBag, 
  Pencil, 
  Check, 
  X,
  Plus,
  Minus,
  HelpCircle,
  Loader2,
  Store,
  Star,
  PackagePlus,
  ChevronDown
} from 'lucide-react';

interface GroceryListProps {
  items: GroceryItem[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<GroceryItem>) => void;
  onToggleFavorite?: (item: GroceryItem) => void;
  onMoveToPantry?: (item: GroceryItem) => void;
}

const GroceryList: React.FC<GroceryListProps> = ({ items, onToggle, onDelete, onUpdate, onToggleFavorite, onMoveToPantry }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSourcesId, setShowSourcesId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState<string>('');

  const groups: Record<string, GroceryItem[]> = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, GroceryItem[]>);

  const sortedCategories = Object.keys(groups).sort();

  const handleQuantity = (item: GroceryItem, delta: number) => {
    const nextQty = Math.max(1, item.quantity + delta);
    onUpdate(item.id, { quantity: nextQty });
  };

  const startEditing = (item: GroceryItem) => {
    if (item.completed) return;
    setEditingId(item.id);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditPrice(item.price?.toString() || '');
  };

  const saveEditing = () => {
    if (editingId) {
      const rawPrice = parseFloat(editPrice);
      const parsedPrice = isNaN(rawPrice) ? undefined : Math.max(0, rawPrice);
      
      onUpdate(editingId, { 
        name: editName, 
        category: editCategory,
        color: CATEGORY_STYLES[editCategory]?.color || CATEGORY_STYLES['Andet'].color,
        price: parsedPrice
      });
      setEditingId(null);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
    }).format(val);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-500 animate-in fade-in duration-1000">
        <div className="w-20 h-20 bg-zinc-900/50 rounded-3xl flex items-center justify-center mb-6 ring-1 ring-zinc-800/50 shadow-2xl">
          <ShoppingBag className="w-10 h-10 opacity-10" />
        </div>
        <p className="text-xl font-semibold text-zinc-400 tracking-tight">Listen er tom</p>
        <p className="text-sm text-zinc-600 mt-2 font-medium">Hvad skal vi have i dag?</p>
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
                const isSourcesOpen = showSourcesId === item.id;

                return (
                  <div 
                    key={item.id}
                    className={`group relative flex flex-col bg-[#121214]/60 hover:bg-[#18181b]/80 rounded-[1.5rem] border border-zinc-800/40 transition-all duration-300 ${item.completed ? 'opacity-40 grayscale-[0.8]' : ''} ${isEditing ? 'ring-2 ring-purple-500/50 bg-[#18181b] border-purple-500/20 shadow-[0_0_40px_-10px_rgba(168,85,247,0.15)]' : 'hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] hover:-translate-y-0.5'}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 p-4 sm:p-5">
                      <div className="flex items-center gap-4">
                        {!isEditing && (
                          <button 
                            onClick={() => onToggle(item.id)}
                            className="shrink-0 group/check"
                          >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${item.completed ? 'bg-purple-500 text-white scale-100' : 'bg-zinc-800/50 text-transparent border border-zinc-700/50 group-hover/check:border-purple-500/50 group-hover/check:bg-purple-500/10'}`}>
                              {item.completed ? (
                                <Check className="w-4 h-4" strokeWidth={3} />
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 opacity-0 group-hover/check:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </button>
                        )}
                        
                        <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-zinc-900/80 flex items-center justify-center overflow-hidden border border-zinc-800/50 shadow-inner group-hover:scale-105 transition-transform duration-500">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl sm:text-3xl filter drop-shadow-lg">{item.emoji}</span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0 sm:hidden">
                          {/* Mobile title */}
                          {!isEditing && (
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`text-lg font-bold text-zinc-100 tracking-tight leading-snug truncate ${item.completed ? 'line-through text-zinc-600 decoration-purple-500/30' : ''}`}>
                                {item.name}
                              </h4>
                              {item.brand && (
                                <span className="shrink-0 px-2 py-0.5 rounded-md bg-zinc-800/50 border border-zinc-700/30 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                                  {item.brand}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
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
                              <select
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="flex-1 bg-zinc-950/50 border border-zinc-800 rounded-xl px-3 py-2 text-[10px] text-zinc-300 font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-purple-500/50"
                              >
                                {Object.keys(CATEGORY_STYLES).map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                              <div className="relative w-32">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[10px] font-bold">kr.</div>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-purple-500/50"
                                  placeholder="0,00"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <div className="hidden sm:flex items-center gap-2 mb-1">
                              <h4 className={`text-lg font-bold text-zinc-100 tracking-tight leading-snug truncate ${item.completed ? 'line-through text-zinc-600 decoration-purple-500/30' : ''}`}>
                                {item.name}
                              </h4>
                              {item.brand && (
                                <span className="shrink-0 px-2 py-0.5 rounded-md bg-zinc-800/50 border border-zinc-700/30 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                                  {item.brand}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/5 border border-purple-500/10">
                                <span className="text-[10px] font-black text-purple-400 uppercase tracking-tighter">{item.quantity} stk</span>
                              </div>
                              
                              <div className="h-3 w-px bg-zinc-800/50" />
                              
                              {item.price !== undefined ? (
                                <div className="flex items-center gap-2 relative">
                                  <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-zinc-400 tabular-nums">
                                      {formatCurrency(item.price)}
                                    </span>
                                    {item.priceSources && item.priceSources.length > 0 && (
                                      <span className="text-[7px] font-black text-zinc-600 uppercase tracking-tighter -mt-0.5">
                                        fra {item.priceSources.length} {item.priceSources.length === 1 ? 'butik' : 'butikker'}
                                      </span>
                                    )}
                                  </div>
                                  {item.priceSources && item.priceSources.length > 0 && (
                                    <div className="relative">
                                      <button 
                                        onClick={() => setShowSourcesId(isSourcesOpen ? null : item.id)}
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all border ${isSourcesOpen ? 'bg-purple-500 border-purple-400 text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 border-white/5 text-zinc-500 hover:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/20'}`}
                                        title="Se priskilder"
                                      >
                                        <Store className="w-3 h-3" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Priskilder</span>
                                        <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-300 ${isSourcesOpen ? 'rotate-180' : ''}`} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : item.isEstimating ? (
                                <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-purple-500/5 border border-purple-500/10 animate-pulse">
                                  <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
                                  <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">Søger efter pris...</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900/50 border border-dashed border-zinc-800">
                                  <HelpCircle className="w-3 h-3 text-zinc-700" />
                                  <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">Ingen pris fundet</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {!isEditing && !item.completed && (
                        <div className="flex items-center gap-3 mt-3 sm:mt-0">
                          <button 
                            onClick={() => onToggleFavorite?.(item)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300 group/fav ${item.isFavorite ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : 'text-zinc-600 bg-zinc-900/30 border-zinc-800/50 hover:text-purple-400 hover:border-purple-500/30 opacity-100 md:opacity-0 md:group-hover:opacity-100'}`}
                            title={item.isFavorite ? "Fjern fra favoritter" : "Gem som favorit"}
                          >
                            <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-purple-500' : ''}`} />
                            <span className="text-[9px] font-black uppercase tracking-widest hidden md:inline">
                              {item.isFavorite ? 'Favorit' : 'Gem favorit'}
                            </span>
                          </button>

                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 translate-x-0 md:translate-x-2 md:group-hover:translate-x-0">
                            <div className="flex items-center bg-zinc-900/80 border border-zinc-800 rounded-xl p-1 shadow-2xl">
                              <button onClick={() => handleQuantity(item, -1)} className="p-2 sm:p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                                <Minus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                              </button>
                              <div className="w-px h-3 bg-zinc-800 mx-0.5" />
                              <button onClick={() => handleQuantity(item, 1)} className="p-2 sm:p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                                <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center bg-zinc-900/80 border border-zinc-800 rounded-xl p-1 shadow-2xl">
                              <button onClick={() => startEditing(item)} className="p-2 sm:p-1.5 text-zinc-500 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-all">
                                <Pencil className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                              </button>
                              <button onClick={() => onDelete(item.id)} className="p-2 sm:p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                                <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {!isEditing && item.completed && onMoveToPantry && (
                        <div className="flex items-center gap-3 mt-3 sm:mt-0">
                          <button 
                            onClick={() => onMoveToPantry(item)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all duration-300"
                            title="Flyt til spisekammer"
                          >
                            <PackagePlus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                            <span className="text-[9px] font-black uppercase tracking-widest hidden md:inline">
                              Til spisekammer
                            </span>
                          </button>
                          <button onClick={() => onDelete(item.id)} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
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

                    {/* Price Sources Expandable Section */}
                    <AnimatePresence>
                      {isSourcesOpen && item.priceSources && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-0">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <div className="flex items-center gap-2">
                                  <Store className="w-3.5 h-3.5 text-purple-400" />
                                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Priskilder</span>
                                </div>
                                <span className="text-[9px] text-zinc-500 italic">Priser indhentet via AI</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {item.priceSources.map((source, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                                    <span className="text-xs font-bold text-zinc-300">{source.store}</span>
                                    <span className="text-xs font-black text-white tabular-nums">
                                      {formatCurrency(source.price)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <p className="text-[9px] text-zinc-600 leading-tight">
                                Bemærk: Disse priser er estimater baseret på AI-søgninger og kan variere fra de faktiske priser i din lokale butik.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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

export default GroceryList;
