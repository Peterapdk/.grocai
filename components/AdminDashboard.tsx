
import React, { useState } from 'react';
import { 
  Trash2, 
  CheckSquare, 
  Square, 
  Plus, 
  X, 
  Package, 
  Star, 
  ArrowLeft
} from 'lucide-react';
import { PantryItem, FavoriteItem } from '../types';

interface AdminDashboardProps {
  pantryItems: PantryItem[];
  favorites: FavoriteItem[];
  onUpdatePantry: (id: string, updates: Partial<PantryItem>) => void;
  onDeletePantry: (id: string) => void;
  onUpdateFavorite: (id: string, updates: Partial<FavoriteItem>) => void;
  onDeleteFavorite: (id: string) => void;
  onAddPantryItems: (names: string[]) => void;
  onClose: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  pantryItems,
  favorites,
  onUpdatePantry,
  onDeletePantry,
  onUpdateFavorite,
  onDeleteFavorite,
  onAddPantryItems,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'pantry' | 'favorites'>('pantry');
  const [selectedPantryIds, setSelectedPantryIds] = useState<string[]>([]);
  const [bulkAddText, setBulkAddText] = useState('');
  const [isBulkAdding, setIsBulkAdding] = useState(false);

  const togglePantrySelection = (id: string) => {
    setSelectedPantryIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAllPantry = () => {
    if (selectedPantryIds.length === pantryItems.length) {
      setSelectedPantryIds([]);
    } else {
      setSelectedPantryIds(pantryItems.map(i => i.id));
    }
  };

  const handleBulkUpdatePantry = (percentage: number) => {
    selectedPantryIds.forEach(id => onUpdatePantry(id, { percentageLeft: percentage }));
    setSelectedPantryIds([]);
  };

  const handleBulkDeletePantry = () => {
    if (window.confirm(`Er du sikker på, at du vil slette ${selectedPantryIds.length} varer?`)) {
      selectedPantryIds.forEach(id => onDeletePantry(id));
      setSelectedPantryIds([]);
    }
  };

  const handleBulkAdd = () => {
    const names = bulkAddText.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    if (names.length > 0) {
      onAddPantryItems(names);
      setBulkAddText('');
      setIsBulkAdding(false);
    }
  };

  const handleUpdatePrice = (id: string, priceStr: string) => {
    const price = parseFloat(priceStr.replace(',', '.'));
    if (!isNaN(price)) {
      onUpdateFavorite(id, { price });
    }
  };

  return (
    <div className="fixed inset-0 z-[600] bg-[#09090b] flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">Admin Dashboard</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Administrativ styring</p>
          </div>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setActiveTab('pantry')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'pantry' ? 'bg-purple-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            <Package className="w-3.5 h-3.5" />
            Spisekammer
          </button>
          <button 
            onClick={() => setActiveTab('favorites')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'favorites' ? 'bg-purple-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            <Star className="w-3.5 h-3.5" />
            Favoritter
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {activeTab === 'pantry' && (
            <div className="space-y-4">
              {/* Pantry Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={toggleAllPantry}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-zinc-300 transition-all border border-white/5"
                  >
                    {selectedPantryIds.length === pantryItems.length ? <CheckSquare className="w-4 h-4 text-purple-400" /> : <Square className="w-4 h-4" />}
                    Vælg alle
                  </button>
                  
                  {selectedPantryIds.length > 0 && (
                    <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-300">
                      <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest px-2">{selectedPantryIds.length} valgt</span>
                      <div className="h-4 w-px bg-white/10 mx-1" />
                      <button onClick={() => handleBulkUpdatePantry(100)} className="px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-green-500/20">Sæt 100%</button>
                      <button onClick={() => handleBulkUpdatePantry(25)} className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-amber-500/20">Sæt 25%</button>
                      <button onClick={handleBulkDeletePantry} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-red-500/20"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setIsBulkAdding(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Batch Tilføj
                </button>
              </div>

              {/* Bulk Add Modal */}
              {isBulkAdding && (
                <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Batch Tilføj til Spisekammer</h3>
                    <button onClick={() => setIsBulkAdding(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                  <p className="text-xs text-zinc-500">Indtast én vare pr. linje. AI vil automatisk kategorisere dem.</p>
                  <textarea 
                    value={bulkAddText}
                    onChange={(e) => setBulkAddText(e.target.value)}
                    placeholder="Mælk&#10;Rugbrød&#10;Kaffe"
                    className="w-full h-40 bg-black/50 border border-white/5 rounded-xl p-4 text-sm text-white outline-none focus:border-purple-500/50 transition-all font-mono"
                  />
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setIsBulkAdding(false)} className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white">Annuller</button>
                    <button onClick={handleBulkAdd} className="px-6 py-2 bg-purple-500 text-white rounded-xl text-xs font-bold hover:bg-purple-600 transition-all">Tilføj Varer</button>
                  </div>
                </div>
              )}

              {/* Pantry Table */}
              <div className="bg-zinc-900/30 rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="p-4 w-10"></th>
                      <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Vare</th>
                      <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Kategori</th>
                      <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Beholdning</th>
                      <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Handlinger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pantryItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-zinc-500 italic text-sm">Ingen varer i spisekammeret</td>
                      </tr>
                    ) : (
                      pantryItems.map(item => (
                        <tr key={item.id} className={`hover:bg-white/5 transition-colors ${selectedPantryIds.includes(item.id) ? 'bg-purple-500/5' : ''}`}>
                          <td className="p-4">
                            <button onClick={() => togglePantrySelection(item.id)} className="text-zinc-600 hover:text-purple-400 transition-colors">
                              {selectedPantryIds.includes(item.id) ? <CheckSquare className="w-5 h-5 text-purple-500" /> : <Square className="w-5 h-5" />}
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{item.emoji}</span>
                              <span className="text-sm font-bold text-white">{item.name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-[10px] font-black px-2 py-1 rounded-md bg-zinc-800 text-zinc-400 uppercase tracking-widest">
                              {item.category}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all"
                                  style={{ 
                                    width: `${item.percentageLeft}%`,
                                    backgroundColor: item.percentageLeft! > 50 ? '#22c55e' : item.percentageLeft! > 25 ? '#eab308' : '#ef4444'
                                  }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-zinc-500 w-8">{item.percentageLeft}%</span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => onDeletePantry(item.id)}
                              className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="space-y-4">
              <div className="bg-zinc-900/30 rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Vare</th>
                      <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Kategori</th>
                      <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pris</th>
                      <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Handlinger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {favorites.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-zinc-500 italic text-sm">Ingen favoritter endnu</td>
                      </tr>
                    ) : (
                      favorites.map(fav => (
                        <tr key={fav.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{fav.emoji}</span>
                              <span className="text-sm font-bold text-white">{fav.name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-[10px] font-black px-2 py-1 rounded-md bg-zinc-800 text-zinc-400 uppercase tracking-widest">
                              {fav.category}
                            </span>
                          </td>
                          <td className="p-4">
                            <input 
                              type="text"
                              defaultValue={fav.price || ''}
                              onBlur={(e) => handleUpdatePrice(fav.id, e.target.value)}
                              placeholder="0,00 kr"
                              className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                            />
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => onDeleteFavorite(fav.id)}
                                className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
