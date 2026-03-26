
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, 
  Zap, 
  LogOut, 
  Cloud, 
  ChevronDown, 
  Database,
  Loader2,
  Trash2,
  PlusCircle,
  LayoutGrid,
  Pencil,
  X,
  Check,
  AlertTriangle,
  RefreshCw,
  Users
} from 'lucide-react';
import { User } from 'firebase/auth';
import SearchInput from './components/SearchInput';
import GroceryList from './components/GroceryList';
import PantryList from './components/PantryList';
import FavoritesBar from './components/FavoritesBar';
import Auth from './components/Auth';
import ShoppingInsights from './components/ShoppingInsights';
import NearbyStores from './components/NearbyStores';
import { GroceryItem, ShoppingList, FavoriteItem, PantryItem } from './types';
import { categorizeAndPriceItem } from './services/geminiService';
import { 
  firebaseEnabled,
  logOut, 
  onAuthChange, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy,
  db,
  deleteDoc,
  writeBatch,
  getDocs,
  where
} from './services/firebaseService';

const LOCAL_STORAGE_KEY = 'grocai_local_lists';
const LOCAL_STORAGE_FAVS = 'grocai_local_favorites';
const LOCAL_STORAGE_PANTRY = 'grocai_local_pantry';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [activeListId, setActiveListId] = useState<string>('');
  const [processingItems, setProcessingItems] = useState<any[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'pantry'>('list');
  const [autoEditPantryId, setAutoEditPantryId] = useState<string | null>(null);
  
  // Renaming state
  const [editingListNameId, setEditingListNameId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  
  // Deleting state
  const [deletingListId, setDeletingListId] = useState<string | null>(null);

  // Sharing state
  const [sharingListId, setSharingListId] = useState<string | null>(null);
  const [shareEmail, setShareEmail] = useState('');

  // Håndter indlæsning af data og migrering
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setCurrentUser(user);
      
      if (!firebaseEnabled || !user) {
        // Indlæs lokale data
        const localLists = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        const localFavs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_FAVS) || '[]');
        const localPantry = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PANTRY) || '[]');
        
        setLists(localLists);
        setFavorites(localFavs);
        setPantryItems(localPantry);
        
        if (localLists.length > 0) {
          setActiveListId(localLists[0].id);
        } else {
          handleCreateNewList("Min Indkøbsliste");
        }
        setAuthLoading(false);
      } else {
        // Ved login: Tjek om der er lokale data der skal migreres
        await migrateLocalDataToCloud(user);
        await migrateCloudLists(user);
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Migreringslogik: Flyt lokal data til Firestore ved login
  const migrateLocalDataToCloud = async (user: User) => {
    if (!db) return;
    setIsSyncing(true);
    
    try {
      const localLists = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      const localFavs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_FAVS) || '[]');
      const localPantry = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PANTRY) || '[]');
      
      if (localLists.length > 0 || localFavs.length > 0 || localPantry.length > 0) {
        const batch = writeBatch(db);
        
        // Migrer lister
        for (const list of localLists) {
          const listRef = doc(db, 'lists', list.id);
          batch.set(listRef, {
            ...list,
            ownerId: user.uid,
            ownerEmail: user.email,
            members: [user.email]
          });
        }
        
        // Migrer favoritter
        for (const fav of localFavs) {
          const favRef = doc(db, `users/${user.uid}/favorites`, fav.id);
          batch.set(favRef, fav);
        }

        // Migrer pantry
        for (const item of localPantry) {
          const pantryRef = doc(db, `users/${user.uid}/pantry`, item.id);
          batch.set(pantryRef, item);
        }
        
        await batch.commit();
        
        // Ryd lokal storage efter succesfuld migrering
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        localStorage.removeItem(LOCAL_STORAGE_FAVS);
        localStorage.removeItem(LOCAL_STORAGE_PANTRY);
      }
    } catch (e) {
      console.error("Migration failed:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const migrateCloudLists = async (user: User) => {
    if (!db) return;
    try {
      const oldListsRef = collection(db, `users/${user.uid}/lists`);
      const oldListsSnap = await getDocs(oldListsRef);
      if (!oldListsSnap.empty) {
        const batch = writeBatch(db);
        oldListsSnap.forEach((docSnap: any) => {
          if (!db) return;
          const data = docSnap.data();
          const newListRef = doc(db, 'lists', docSnap.id);
          batch.set(newListRef, {
            ...data,
            ownerId: user.uid,
            ownerEmail: user.email,
            members: [user.email]
          });
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
    } catch (e) {
      console.error("Cloud list migration failed:", e);
    }
  };

  // Sky Synkronisering (Realtid)
  useEffect(() => {
    if (!firebaseEnabled || !currentUser || !db) return;

    const qLists = query(collection(db, 'lists'), where('members', 'array-contains', currentUser.email));
    const unsubLists = onSnapshot(qLists, (snapshot) => {
      const fetchedLists: ShoppingList[] = [];
      snapshot.forEach((doc) => {
        fetchedLists.push({ id: doc.id, ...doc.data() } as ShoppingList);
      });
      // Sort lists by createdAt descending
      fetchedLists.sort((a, b) => b.createdAt - a.createdAt);
      setLists(fetchedLists);
      if (fetchedLists.length > 0 && !activeListId) {
        setActiveListId(fetchedLists[0].id);
      }
    });

    const qFavs = query(collection(db, `users/${currentUser.uid}/favorites`), orderBy("addedAt", "desc"));
    const unsubFavs = onSnapshot(qFavs, (snapshot) => {
      const fetchedFavs: FavoriteItem[] = [];
      snapshot.forEach((doc) => {
        fetchedFavs.push({ id: doc.id, ...doc.data() } as FavoriteItem);
      });
      setFavorites(fetchedFavs);
    });

    const qPantry = query(collection(db, `users/${currentUser.uid}/pantry`), orderBy("addedAt", "desc"));
    const unsubPantry = onSnapshot(qPantry, (snapshot) => {
      const fetchedPantry: PantryItem[] = [];
      snapshot.forEach((doc) => {
        fetchedPantry.push({ id: doc.id, ...doc.data() } as PantryItem);
      });
      setPantryItems(fetchedPantry);
    });

    return () => {
      unsubLists();
      unsubFavs();
      unsubPantry();
    };
  }, [currentUser, activeListId]);

  // Gem til localStorage (Fallback)
  useEffect(() => {
    if (authLoading) return;
    
    if (!firebaseEnabled || !currentUser) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lists));
      localStorage.setItem(LOCAL_STORAGE_FAVS, JSON.stringify(favorites));
      localStorage.setItem(LOCAL_STORAGE_PANTRY, JSON.stringify(pantryItems));
    }
  }, [lists, favorites, pantryItems, currentUser, authLoading]);

  const activeList = useMemo(() => 
    lists.find(l => l.id === activeListId) || lists[0], 
    [lists, activeListId]
  );

  const grandTotal = useMemo(() => {
    return activeList?.items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0) || 0;
  }, [activeList]);

  const handleAddItem = async (queryStr: string) => {
    let currentId = activeListId || (lists.length > 0 ? lists[0].id : null);
    
    if (!currentId) {
        currentId = await handleCreateNewList("Min Indkøbsliste");
    }

    const newProcessingId = crypto.randomUUID();
    setProcessingItems(prev => [{ id: newProcessingId, query: queryStr }, ...prev]);

    try {
      const aiData = await categorizeAndPriceItem(queryStr);
      const isFav = favorites.some(f => f.name.toLowerCase() === queryStr.toLowerCase());
      
      const newItem: GroceryItem = {
        id: crypto.randomUUID(),
        name: queryStr,
        category: aiData.category,
        emoji: aiData.emoji,
        color: aiData.color,
        quantity: 1,
        price: aiData.approxPrice,
        priceSources: aiData.priceSources,
        addedAt: Date.now(),
        completed: false,
        isFavorite: isFav
      };

      if (firebaseEnabled && currentUser && db && currentId) {
        const listRef = doc(db, 'lists', currentId);
        const currentList = lists.find(l => l.id === currentId);
        const currentItems = currentList?.items || [];
        await updateDoc(listRef, { items: [newItem, ...currentItems] });
      } else {
        setLists(prev => prev.map(l => l.id === currentId ? { ...l, items: [newItem, ...l.items] } : l));
      }
    } catch (e) {
      console.error("Add item failed:", e);
    } finally {
      setProcessingItems(prev => prev.filter(p => p.id !== newProcessingId));
    }
  };

  const handleRenameList = async (id: string, name: string) => {
    if (!name.trim()) return;
    if (firebaseEnabled && currentUser && db) {
      const listRef = doc(db, 'lists', id);
      await updateDoc(listRef, { name: name.trim() });
    } else {
      setLists(prev => prev.map(l => l.id === id ? { ...l, name: name.trim() } : l));
    }
    setEditingListNameId(null);
  };

  const handleShareList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail.trim() || !sharingListId || !firebaseEnabled || !currentUser || !db) return;
    
    const listToShare = lists.find(l => l.id === sharingListId);
    if (!listToShare) return;
    
    // Only owner can share
    if (listToShare.ownerId !== currentUser.uid) {
      alert("Kun ejeren af listen kan tilføje medlemmer.");
      return;
    }

    const emailToAdd = shareEmail.trim().toLowerCase();
    if (listToShare.members?.includes(emailToAdd)) {
      setShareEmail('');
      return; // Already a member
    }

    const newMembers = [...(listToShare.members || []), emailToAdd];
    const listRef = doc(db, 'lists', sharingListId);
    await updateDoc(listRef, { members: newMembers });
    setShareEmail('');
  };

  const handleRemoveMember = async (listId: string, emailToRemove: string) => {
    if (!firebaseEnabled || !currentUser || !db) return;
    
    const listToUpdate = lists.find(l => l.id === listId);
    if (!listToUpdate) return;
    
    // Only owner can remove members, or members can remove themselves
    if (listToUpdate.ownerId !== currentUser.uid && currentUser.email !== emailToRemove) {
      alert("Kun ejeren af listen kan fjerne andre medlemmer.");
      return;
    }

    const newMembers = (listToUpdate.members || []).filter(e => e !== emailToRemove);
    const listRef = doc(db, 'lists', listId);
    await updateDoc(listRef, { members: newMembers });
    
    // If user removed themselves, close the modal and switch active list
    if (currentUser.email === emailToRemove) {
      setSharingListId(null);
      if (activeListId === listId) {
        const remainingLists = lists.filter(l => l.id !== listId);
        setActiveListId(remainingLists.length > 0 ? remainingLists[0].id : '');
      }
    }
  };

  const handleDeleteList = async (id: string) => {
    if (lists.length <= 1) return;
    
    if (firebaseEnabled && currentUser && db) {
      await deleteDoc(doc(db, 'lists', id));
    } else {
      setLists(prev => prev.filter(l => l.id !== id));
    }
    
    if (activeListId === id) {
      const remainingLists = lists.filter(l => l.id !== id);
      setActiveListId(remainingLists[0]?.id || '');
    }
    setDeletingListId(null);
  };

  const handleAddFavoriteToList = async (fav: FavoriteItem) => {
    let currentId = activeListId || (lists.length > 0 ? lists[0].id : null);
    if (!currentId) return;

    const newItem: GroceryItem = {
      id: crypto.randomUUID(),
      name: fav.name,
      category: fav.category,
      emoji: fav.emoji,
      color: fav.color,
      quantity: 1,
      price: fav.price,
      addedAt: Date.now(),
      completed: false,
      isFavorite: true
    };

    if (firebaseEnabled && currentUser && db) {
      const listRef = doc(db, 'lists', currentId);
      const currentItems = lists.find(l => l.id === currentId)?.items || [];
      await updateDoc(listRef, { items: [newItem, ...currentItems] });
    } else {
      setLists(prev => prev.map(l => l.id === currentId ? { ...l, items: [newItem, ...l.items] } : l));
    }
  };

  const toggleFavorite = async (item: GroceryItem) => {
    const isCurrentlyFav = favorites.some(f => f.name.toLowerCase() === item.name.toLowerCase());
    
    if (isCurrentlyFav) {
      const favToRemove = favorites.find(f => f.name.toLowerCase() === item.name.toLowerCase());
      if (favToRemove) {
        if (firebaseEnabled && currentUser && db) {
          await deleteDoc(doc(db, `users/${currentUser.uid}/favorites`, favToRemove.id));
        } else {
          setFavorites(prev => prev.filter(f => f.id !== favToRemove.id));
        }
      }
    } else {
      const newFav: FavoriteItem = {
        id: crypto.randomUUID(),
        name: item.name,
        category: item.category,
        emoji: item.emoji,
        color: item.color,
        price: item.price,
        addedAt: Date.now()
      };

      if (firebaseEnabled && currentUser && db) {
        await setDoc(doc(db, `users/${currentUser.uid}/favorites`, newFav.id), newFav);
      } else {
        setFavorites(prev => [newFav, ...prev]);
      }
    }

    const updateFavStatus = (items: GroceryItem[]) => 
      items.map(i => i.name.toLowerCase() === item.name.toLowerCase() ? { ...i, isFavorite: !isCurrentlyFav } : i);

    if (firebaseEnabled && currentUser && db && activeListId) {
       const listRef = doc(db, 'lists', activeListId);
       await updateDoc(listRef, { items: updateFavStatus(activeList.items) });
    } else {
      setLists(prev => prev.map(l => ({ ...l, items: updateFavStatus(l.items) })));
    }
  };

  const updateItem = async (itemId: string, updates: Partial<GroceryItem>) => {
    if (firebaseEnabled && currentUser && db && activeListId) {
      const listRef = doc(db, 'lists', activeListId);
      const updatedItems = activeList.items.map(i => i.id === itemId ? { ...i, ...updates } : i);
      await updateDoc(listRef, { items: updatedItems });
    } else {
      setLists(prev => prev.map(l => l.id === activeListId ? { ...l, items: l.items.map(i => i.id === itemId ? { ...i, ...updates } : i) } : l));
    }
  };

  const deleteItem = async (itemId: string) => {
    if (firebaseEnabled && currentUser && db && activeListId) {
      const listRef = doc(db, 'lists', activeListId);
      await updateDoc(listRef, { items: activeList.items.filter(i => i.id !== itemId) });
    } else {
      setLists(prev => prev.map(l => l.id === activeListId ? { ...l, items: l.items.filter(i => i.id !== itemId) } : l));
    }
  };

  const handleCreateNewList = async (name = "Ny Liste") => {
    const id = crypto.randomUUID();
    const newList: ShoppingList = { 
      id, 
      name, 
      items: [], 
      createdAt: Date.now(),
      ownerId: currentUser?.uid,
      ownerEmail: currentUser?.email || undefined,
      members: currentUser?.email ? [currentUser.email] : []
    };
    
    if (firebaseEnabled && currentUser && db) {
      await setDoc(doc(db, 'lists', id), newList);
    } else {
      setLists(prev => [newList, ...prev]);
    }
    setActiveListId(id);
    setIsMenuOpen(false);
    return id;
  };

  const handleAddToPantry = async (item: GroceryItem | string) => {
    let newItem: PantryItem;
    
    if (typeof item === 'string') {
      const newProcessingId = crypto.randomUUID();
      setProcessingItems(prev => [{ id: newProcessingId, query: item }, ...prev]);
      
      try {
        const aiData = await categorizeAndPriceItem(item);
        newItem = {
          id: crypto.randomUUID(),
          name: item,
          category: aiData.category,
          emoji: aiData.emoji,
          color: aiData.color,
          quantity: 1,
          addedAt: Date.now()
        };
      } catch (e) {
        console.error("Add to pantry failed:", e);
        return;
      } finally {
        setProcessingItems(prev => prev.filter(p => p.id !== newProcessingId));
      }
    } else {
      newItem = {
        id: crypto.randomUUID(),
        name: item.name,
        category: item.category,
        emoji: item.emoji,
        color: item.color,
        quantity: item.quantity,
        addedAt: Date.now()
      };
      
      // Remove from shopping list if it came from there
      if (activeListId) {
        deleteItem(item.id);
      }
    }

    if (firebaseEnabled && currentUser && db) {
      await setDoc(doc(db, `users/${currentUser.uid}/pantry`, newItem.id), newItem);
    } else {
      setPantryItems(prev => [newItem, ...prev]);
    }
    
    // Automatically enter edit mode for the new item and switch to pantry view
    setCurrentView('pantry');
    setAutoEditPantryId(newItem.id);
  };

  const updatePantryItem = async (itemId: string, updates: Partial<PantryItem>) => {
    const existingItem = pantryItems.find(i => i.id === itemId);
    if (!existingItem) return;

    const updatedItem = { ...existingItem, ...updates };

    // Check if we need to auto-add to shopping list
    const wasLow = (existingItem.percentageLeft !== undefined && existingItem.percentageLeft < 33) || existingItem.quantity === 0;
    const isNowLow = (updatedItem.percentageLeft !== undefined && updatedItem.percentageLeft < 33) || updatedItem.quantity === 0;
    
    const justBecameLow = !wasLow && isNowLow;
    const justFavorited = !existingItem.isFavorite && updatedItem.isFavorite;
    
    if ((updatedItem.isFavorite && justBecameLow) || (isNowLow && justFavorited)) {
      let targetList = lists.find(l => l.name.toLowerCase() === 'husholdning');
      if (!targetList) {
        targetList = lists.find(l => l.id === activeListId) || lists[0];
      }

      if (targetList) {
        const alreadyExists = targetList.items.some(i => i.name.toLowerCase() === updatedItem.name.toLowerCase() && !i.completed);
        
        if (!alreadyExists) {
          const newGroceryItem: GroceryItem = {
            id: crypto.randomUUID(),
            name: updatedItem.name,
            category: updatedItem.category,
            emoji: updatedItem.emoji,
            color: updatedItem.color,
            quantity: 1,
            addedAt: Date.now(),
            completed: false,
            isFavorite: true
          };
          
          if (firebaseEnabled && currentUser && db) {
            const listRef = doc(db, 'lists', targetList.id);
            await updateDoc(listRef, {
              items: [...targetList.items, newGroceryItem]
            });
          } else {
            setLists(prev => prev.map(l => l.id === targetList?.id ? { ...l, items: [...l.items, newGroceryItem] } : l));
          }
        }
      }
    }

    if (firebaseEnabled && currentUser && db) {
      const pantryRef = doc(db, `users/${currentUser.uid}/pantry`, itemId);
      await updateDoc(pantryRef, updates);
    } else {
      setPantryItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));
    }
  };

  const deletePantryItem = async (itemId: string) => {
    if (firebaseEnabled && currentUser && db) {
      await deleteDoc(doc(db, `users/${currentUser.uid}/pantry`, itemId));
    } else {
      setPantryItems(prev => prev.filter(i => i.id !== itemId));
    }
  };

  if (authLoading) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="relative">
        <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full animate-pulse" />
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin relative z-10" />
      </div>
    </div>
  );

  if (firebaseEnabled && !currentUser) return <Auth />;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      {/* Sync Overlay */}
      {isSyncing && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl">
          <RefreshCw className="w-12 h-12 text-purple-500 animate-spin mb-6" />
          <h2 className="text-2xl font-black text-white tracking-tight">Synkroniserer dine data...</h2>
          <p className="text-zinc-500 text-sm mt-2">Vi flytter dine lokale lister til skyen.</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingListId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 glass backdrop-blur-md">
          <div className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-black text-center mb-2">Slet liste?</h3>
            <p className="text-zinc-400 text-sm text-center mb-8">Er du sikker på at du vil slette "{lists.find(l => l.id === deletingListId)?.name}"? Denne handling kan ikke fortrydes.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingListId(null)} className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all">Annuller</button>
              <button onClick={() => handleDeleteList(deletingListId)} className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all">Slet</button>
            </div>
          </div>
        </div>
      )}

      {/* Share List Modal */}
      {sharingListId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 glass backdrop-blur-md">
          <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black">Del liste</h3>
              <button onClick={() => setSharingListId(null)} className="p-2 bg-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-700 transition-all"><X className="w-5 h-5" /></button>
            </div>
            
            <p className="text-zinc-400 text-sm mb-6">Invitér andre til at samarbejde på "{lists.find(l => l.id === sharingListId)?.name}".</p>
            
            {lists.find(l => l.id === sharingListId)?.ownerId === currentUser?.uid ? (
              <form onSubmit={handleShareList} className="flex gap-2 mb-8">
                <input 
                  type="email" 
                  value={shareEmail} 
                  onChange={(e) => setShareEmail(e.target.value)} 
                  placeholder="E-mailadresse" 
                  className="flex-1 bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                  required
                />
                <button type="submit" className="px-6 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all">Tilføj</button>
              </form>
            ) : (
              <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-sm text-blue-400">Du er inviteret til denne liste. Kun ejeren kan tilføje nye medlemmer.</p>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Medlemmer</h4>
              
              {/* Owner */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs">
                    {lists.find(l => l.id === sharingListId)?.ownerEmail?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{lists.find(l => l.id === sharingListId)?.ownerEmail}</p>
                    <p className="text-xs text-zinc-500">Ejer</p>
                  </div>
                </div>
              </div>

              {/* Other Members */}
              {lists.find(l => l.id === sharingListId)?.members?.filter(m => m !== lists.find(l => l.id === sharingListId)?.ownerEmail).map(email => (
                <div key={email} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{email}</p>
                      <p className="text-xs text-zinc-500">Medlem</p>
                    </div>
                  </div>
                  {(lists.find(l => l.id === sharingListId)?.ownerId === currentUser?.uid || currentUser?.email === email) && (
                    <button 
                      onClick={() => handleRemoveMember(sharingListId, email)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title={currentUser?.email === email ? "Forlad liste" : "Fjern medlem"}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-50 border-b border-white/5 glass">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer" onClick={() => window.location.reload()}>
              <div className="absolute inset-0 bg-white/10 blur-lg rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center relative shadow-2xl">
                <ShoppingCart className="w-5 h-5 text-zinc-950" />
              </div>
            </div>
            <div className="relative">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                <LayoutGrid className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 transition-colors" />
                <span className="text-sm font-black tracking-tight truncate max-w-[140px]">{activeList?.name || "Vælg liste"}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                  <div className="absolute top-full left-0 mt-3 w-72 bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <p className="px-3 py-2 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1">Dine Lister</p>
                    <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                      {lists.map(l => (
                        <div key={l.id} className="flex items-center gap-1 group/item">
                          <button onClick={() => { setActiveListId(l.id); setIsMenuOpen(false); }} className={`flex-1 text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${activeListId === l.id ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent'}`}>
                            <span className="truncate">{l.name}</span>
                            <span className="text-[10px] font-medium opacity-40 group-hover/item:opacity-100">{l.items.length}</span>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setDeletingListId(l.id); }} className={`w-10 h-10 flex items-center justify-center rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover/item:opacity-100 ${lists.length <= 1 ? 'hidden' : ''}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="h-px bg-white/5 my-3" />
                    <button onClick={() => handleCreateNewList()} className="w-full p-2.5 rounded-xl border border-dashed border-white/10 text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:border-purple-500/30 hover:text-purple-400 transition-all flex items-center justify-center gap-2">
                      <PlusCircle className="w-3 h-3" />
                      Ny Liste
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => setCurrentView('list')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${currentView === 'list' ? 'bg-purple-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
              >
                Indkøb
              </button>
              <button 
                onClick={() => setCurrentView('pantry')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${currentView === 'pantry' ? 'bg-purple-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
              >
                Spisekammer
              </button>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${currentUser ? 'bg-green-500/5 border-green-500/20 text-green-500' : 'bg-amber-500/5 border-amber-500/20 text-amber-500'}`}>
              {currentUser ? <Cloud className="w-3.5 h-3.5" /> : <Database className="w-3.5 h-3.5" />}
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{currentUser ? 'Sky' : 'Lokal'}</span>
            </div>
            {currentUser && (
              <button onClick={logOut} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-zinc-500 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 transition-all">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="mb-12 space-y-8">
          <div className="space-y-4">
            <p className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em]">
              {currentView === 'list' ? 'Indkøbsoversigt' : 'Spisekammer'}
            </p>
            {currentView === 'list' ? (
              editingListNameId === activeListId ? (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
                  <input autoFocus value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRenameList(activeListId, newListName)} className="text-4xl md:text-6xl font-black tracking-tighter text-white bg-transparent border-b-2 border-purple-500 outline-none w-full max-w-xl pb-1" />
                  <div className="flex gap-2">
                    <button onClick={() => handleRenameList(activeListId, newListName)} className="p-3 bg-purple-500 text-white rounded-2xl hover:bg-purple-600 transition-all"><Check className="w-6 h-6" /></button>
                    <button onClick={() => setEditingListNameId(null)} className="p-3 bg-zinc-800 text-zinc-400 rounded-2xl hover:bg-zinc-700 transition-all"><X className="w-6 h-6" /></button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 group">
                  <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white truncate max-w-2xl">{activeList?.name || "Din Liste"}</h1>
                  <button onClick={() => { setEditingListNameId(activeListId); setNewListName(activeList?.name || ''); }} className="p-3 rounded-2xl bg-white/5 border border-white/5 text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/10 transition-all"><Pencil className="w-5 h-5" /></button>
                  {firebaseEnabled && currentUser && (
                    <button onClick={() => setSharingListId(activeListId)} className="p-3 rounded-2xl bg-white/5 border border-white/5 text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="Del liste"><Users className="w-5 h-5" /></button>
                  )}
                </div>
              )
            ) : (
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white truncate max-w-2xl">Mit Spisekammer</h1>
            )}
          </div>
          <SearchInput onAdd={currentView === 'list' ? handleAddItem : handleAddToPantry} isLoading={false} />
          {currentView === 'list' && (
            <FavoritesBar favorites={favorites} onAdd={handleAddFavoriteToList} onRemove={() => {}} />
          )}
          <div className="space-y-3">
            {processingItems.map(p => (
              <div key={p.id} className="flex items-center gap-4 p-5 bg-purple-500/5 border border-purple-500/20 rounded-[1.5rem] animate-pulse">
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center"><Loader2 className="w-5 h-5 text-purple-500 animate-spin" /></div>
                <div className="space-y-1">
                  <span className="text-xs font-black text-white uppercase tracking-widest">AI Analyse...</span>
                  <p className="text-[10px] text-zinc-500 font-medium">Kategoriserer og estimerer pris på {p.query}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {currentView === 'list' ? (
          <>
            <GroceryList 
              items={activeList?.items || []} 
              onToggle={(id) => updateItem(id, { completed: !activeList?.items.find(i => i.id === id)?.completed })} 
              onDelete={deleteItem} 
              onUpdate={updateItem} 
              onToggleFavorite={toggleFavorite} 
              onMoveToPantry={handleAddToPantry}
            />
            {activeList?.items && activeList.items.length > 0 && (
              <div className="mt-16 p-10 glass rounded-[3rem] border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative z-10">
                  <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-2">Estimeret Totalbeløb</p>
                  <h2 className="text-5xl font-black text-white tracking-tighter tabular-nums">{new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(grandTotal)}</h2>
                </div>
                <div className="relative z-10 p-5 bg-white/5 rounded-3xl border border-white/5"><Zap className="w-10 h-10 text-purple-400" /></div>
              </div>
            )}

            {/* AI Insights and Nearby Stores */}
            <ShoppingInsights 
              activeList={activeList} 
              allLists={lists} 
              onAddSuggestion={handleAddItem} 
            />
            <NearbyStores />
          </>
        ) : (
          <PantryList 
            items={pantryItems} 
            onDelete={deletePantryItem} 
            onUpdate={updatePantryItem}
            autoEditId={autoEditPantryId}
            onAutoEditStart={() => setAutoEditPantryId(null)}
          />
        )}
      </main>
    </div>
  );
};

export default App;
