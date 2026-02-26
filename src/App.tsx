/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShoppingCart,
  Package,
  Plus,
  Minus,
  Trash2,
  X,
  ChefHat,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Sparkles,
  Loader2,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStorage } from './hooks/useAppStorage';
import { Category, InventoryItem, SuggestedIngredient } from './types';

const CATEGORIES: Category[] = ['食品', '日用品', '調味料', '飲料', 'その他'];

const CATEGORY_EMOJI: Record<Category, string> = {
  '食品': '🥩',
  '日用品': '🧴',
  '調味料': '🧂',
  '飲料': '🥤',
  'その他': '📦',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'shopping' | 'inventory'>('shopping');
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // 料理から食材提案
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [dishName, setDishName] = useState('');
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(false);
  const [suggestedIngredients, setSuggestedIngredients] = useState<SuggestedIngredient[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  const {
    inventory,
    shoppingList,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    addShoppingItem,
    addShoppingItems,
    toggleBought,
    deleteShoppingItem,
    clearBoughtItems,
    suggestIngredients,
  } = useAppStorage();

  const [formData, setFormData] = useState({
    name: '',
    category: '食品' as Category,
    quantity: 1,
    unit: '個',
    threshold: 1,
    memo: ''
  });

  const handleOpenInventoryModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        threshold: item.threshold,
        memo: item.memo || ''
      });
    } else {
      setEditingItem(null);
      setFormData({ name: '', category: '食品', quantity: 1, unit: '個', threshold: 1, memo: '' });
    }
    setIsInventoryModalOpen(true);
  };

  const closeInventoryModal = () => {
    setIsInventoryModalOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const handleInventorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateInventoryItem(editingItem.id, formData);
    } else {
      addInventoryItem(formData);
    }
    closeInventoryModal();
  };

  // 料理名から食材提案を取得
  const handleFetchIngredients = async () => {
    if (!dishName.trim()) return;
    setIsLoadingIngredients(true);
    setAiError(null);
    try {
      const ingredients = await suggestIngredients(dishName.trim());
      setSuggestedIngredients(ingredients);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : '食材の取得に失敗しました');
    } finally {
      setIsLoadingIngredients(false);
    }
  };

  const toggleIngredientSelection = (index: number) => {
    setSuggestedIngredients(prev =>
      prev.map((ing, i) => i === index ? { ...ing, selected: !ing.selected } : ing)
    );
  };

  const handleAddSelectedIngredients = () => {
    const toAdd = suggestedIngredients.filter(ing => ing.selected);
    addShoppingItems(toAdd.map(ing => ({
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      inventoryId: ing.inventoryId,
      recipeSource: dishName,
    })));
    setIsRecipeModalOpen(false);
    setSuggestedIngredients([]);
    setDishName('');
  };

  const handleCloseRecipeModal = () => {
    setIsRecipeModalOpen(false);
    setSuggestedIngredients([]);
    setDishName('');
    setAiError(null);
  };

  const pendingItems = shoppingList.filter(s => !s.isBought);
  const boughtItems = shoppingList.filter(s => s.isBought);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f0f0f0] font-sans pb-24">
      {/* Header */}
      <header className="bg-[#161616] border-b border-white/5 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              {activeTab === 'shopping' ? '買い物リスト' : '在庫管理'}
            </h1>
            {activeTab === 'shopping' && pendingItems.length > 0 && (
              <p className="text-xs text-[#8e8e93] mt-0.5">{pendingItems.length}件残り</p>
            )}
          </div>
          {activeTab === 'shopping' && boughtItems.length > 0 && (
            <button
              onClick={clearBoughtItems}
              className="text-xs font-medium text-[#f59e0b] bg-[#f59e0b]/10 px-3 py-1.5 rounded-full border border-[#f59e0b]/20"
            >
              完了分を削除
            </button>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'shopping' ? (
            <motion.div
              key="shopping"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* 料理から追加ボタン */}
              <button
                onClick={() => setIsRecipeModalOpen(true)}
                className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-[#f59e0b]/15 to-[#f59e0b]/5 border border-[#f59e0b]/25 rounded-2xl text-left active:scale-[0.98] transition-transform"
              >
                <div className="w-10 h-10 bg-[#f59e0b]/20 rounded-xl flex items-center justify-center shrink-0">
                  <ChefHat size={20} className="text-[#f59e0b]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#f5f5f5]">献立から食材を追加</p>
                  <p className="text-xs text-[#8e8e93] mt-0.5">料理名を入力すると食材を自動提案</p>
                </div>
                <Sparkles size={16} className="text-[#f59e0b]/60" />
              </button>

              {/* 手動追加 */}
              <div className="bg-[#1c1c1e] rounded-2xl border border-white/5 p-3 flex gap-2">
                <input
                  type="text"
                  placeholder="買うものを追加..."
                  className="flex-1 bg-transparent px-2 outline-none text-sm placeholder:text-[#4a4a4a] text-[#f0f0f0]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      addShoppingItem(e.currentTarget.value);
                      e.currentTarget.value = '';
                      e.currentTarget.blur();
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement);
                    if (input?.value) { addShoppingItem(input.value); input.value = ''; input.blur(); }
                  }}
                  className="p-2 bg-[#f59e0b] text-black rounded-xl active:scale-95 transition-transform"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* リスト */}
              <div className="space-y-2">
                {shoppingList.length === 0 ? (
                  <div className="text-center py-16 text-[#4a4a4a]">
                    <ShoppingCart className="mx-auto mb-3 opacity-20" size={48} />
                    <p className="text-sm">リストは空です</p>
                    <p className="text-xs mt-1 opacity-60">献立から食材を追加してみよう</p>
                  </div>
                ) : (
                  <>
                    {pendingItems.map(item => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center gap-3 p-4 bg-[#1c1c1e] rounded-2xl border border-white/5"
                      >
                        <button onClick={() => toggleBought(item.id)}>
                          <Circle className="text-[#3a3a3a]" size={24} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#f0f0f0] truncate">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.recipeSource && (
                              <span className="text-[10px] text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded-full">
                                {item.recipeSource}
                              </span>
                            )}
                            {item.inventoryId && !item.recipeSource && (
                              <span className="text-[10px] text-[#8e8e93]">在庫連動</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteShoppingItem(item.id)}
                          className="p-2 text-[#3a3a3a] hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))}

                    {boughtItems.length > 0 && (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#4a4a4a] px-2 pt-2">購入済み</p>
                        {boughtItems.map(item => (
                          <motion.div
                            key={item.id}
                            layout
                            className="flex items-center gap-3 p-4 bg-[#161616] rounded-2xl border border-white/[0.03] opacity-50"
                          >
                            <button onClick={() => toggleBought(item.id)}>
                              <CheckCircle2 className="text-emerald-500" size={24} />
                            </button>
                            <p className="flex-1 text-sm line-through text-[#6a6a6a] truncate">{item.name}</p>
                            <button
                              onClick={() => deleteShoppingItem(item.id)}
                              className="p-2 text-[#3a3a3a] hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </motion.div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {CATEGORIES.map(cat => {
                const items = inventory.filter(i => i.category === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat} className="space-y-2">
                    <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#4a4a4a] px-1 flex items-center gap-2">
                      <span>{CATEGORY_EMOJI[cat]}</span>
                      <span>{cat}</span>
                    </h2>
                    <div className="space-y-2">
                      {items.map(item => (
                        <div
                          key={item.id}
                          className="bg-[#1c1c1e] rounded-2xl border border-white/5 overflow-hidden"
                        >
                          <div className="p-4 flex items-center gap-4">
                            <div className="flex-1 cursor-pointer" onClick={() => handleOpenInventoryModal(item)}>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm text-[#f0f0f0]">{item.name}</p>
                                {item.quantity <= item.threshold && (
                                  <AlertTriangle size={13} className="text-[#f59e0b]" />
                                )}
                              </div>
                              <p className="text-xs text-[#4a4a4a] mt-0.5">
                                残り少なくなったら通知: {item.threshold}{item.unit}
                              </p>
                            </div>

                            <div className="flex items-center bg-[#252525] rounded-xl p-1 gap-1">
                              <button
                                onClick={() => updateInventoryItem(item.id, { quantity: Math.max(0, item.quantity - 1) })}
                                className="p-2 hover:bg-[#333] rounded-lg transition-colors text-[#8e8e93]"
                              >
                                <Minus size={14} />
                              </button>
                              <div className="w-12 text-center">
                                <span className={`text-sm font-bold ${item.quantity <= item.threshold ? 'text-[#f59e0b]' : 'text-[#f0f0f0]'}`}>
                                  {item.quantity}
                                </span>
                                <span className="text-[10px] ml-0.5 text-[#4a4a4a]">{item.unit}</span>
                              </div>
                              <button
                                onClick={() => updateInventoryItem(item.id, { quantity: item.quantity + 1 })}
                                className="p-2 hover:bg-[#333] rounded-lg transition-colors text-[#8e8e93]"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {inventory.length === 0 && (
                <div className="text-center py-16 text-[#4a4a4a]">
                  <Package className="mx-auto mb-3 opacity-20" size={48} />
                  <p className="text-sm">在庫データがありません</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FAB (在庫タブ) */}
      {activeTab === 'inventory' && (
        <button
          onClick={() => handleOpenInventoryModal()}
          className="fixed bottom-24 right-6 w-14 h-14 bg-[#f59e0b] text-black rounded-full shadow-lg shadow-[#f59e0b]/20 flex items-center justify-center z-20 active:scale-95 transition-transform"
        >
          <Plus size={28} />
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#161616]/90 backdrop-blur-md border-t border-white/5 px-6 py-3 pb-safe z-30">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <button
            onClick={() => setActiveTab('shopping')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'shopping' ? 'text-[#f59e0b]' : 'text-[#3a3a3a]'}`}
          >
            <ShoppingCart size={24} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">買い物</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'inventory' ? 'text-[#f59e0b]' : 'text-[#3a3a3a]'}`}
          >
            <Package size={24} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">在庫</span>
          </button>
        </div>
      </nav>

      {/* === 料理から食材提案モーダル === */}
      <AnimatePresence>
        {isRecipeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseRecipeModal}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-[#1c1c1e] rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden"
              style={{ maxHeight: '90vh' }}
            >
              {/* モーダルヘッダー */}
              <div className="p-6 pb-4 border-b border-white/5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#f59e0b]/20 rounded-xl flex items-center justify-center">
                      <ChefHat size={18} className="text-[#f59e0b]" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#f0f0f0]">献立から食材追加</h2>
                      <p className="text-xs text-[#8e8e93]">在庫と照合して提案します</p>
                    </div>
                  </div>
                  <button onClick={handleCloseRecipeModal} className="p-2 bg-[#252525] rounded-full">
                    <X size={18} className="text-[#8e8e93]" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                <div className="p-6 space-y-4">
                  {/* 料理名入力 */}
                  {suggestedIngredients.length === 0 && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={dishName}
                          onChange={e => setDishName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleFetchIngredients()}
                          placeholder="例: 豚の生姜焼き、麻婆豆腐..."
                          className="flex-1 bg-[#252525] border border-white/5 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#f59e0b]/40 text-[#f0f0f0] placeholder:text-[#3a3a3a]"
                          autoFocus
                        />
                        <button
                          onClick={handleFetchIngredients}
                          disabled={!dishName.trim() || isLoadingIngredients}
                          className="px-4 bg-[#f59e0b] text-black font-bold rounded-2xl disabled:opacity-30 active:scale-95 transition-transform flex items-center gap-2"
                        >
                          {isLoadingIngredients ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Sparkles size={18} />
                          )}
                        </button>
                      </div>

                      {isLoadingIngredients && (
                        <div className="text-center py-8">
                          <Loader2 size={32} className="animate-spin text-[#f59e0b] mx-auto mb-3" />
                          <p className="text-sm text-[#8e8e93]">食材を調べています...</p>
                        </div>
                      )}

                      {aiError && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                          <p className="text-sm text-red-400">{aiError}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 食材リスト */}
                  {suggestedIngredients.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#f0f0f0]">「{dishName}」の食材</p>
                          <p className="text-xs text-[#8e8e93] mt-0.5">
                            {suggestedIngredients.filter(i => i.selected).length}件を追加予定
                          </p>
                        </div>
                        <button
                          onClick={() => { setSuggestedIngredients([]); setDishName(''); }}
                          className="text-xs text-[#8e8e93] underline underline-offset-2"
                        >
                          やり直す
                        </button>
                      </div>

                      {/* 追加が必要な食材 */}
                      {suggestedIngredients.some(i => !i.stockSufficient) && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#f59e0b]">
                            不足 / なし
                          </p>
                          {suggestedIngredients
                            .filter(i => !i.stockSufficient)
                            .map((ing, idx) => {
                              const realIdx = suggestedIngredients.indexOf(ing);
                              return (
                                <button
                                  key={idx}
                                  onClick={() => toggleIngredientSelection(realIdx)}
                                  className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-colors ${
                                    ing.selected
                                      ? 'bg-[#f59e0b]/10 border-[#f59e0b]/30'
                                      : 'bg-[#252525] border-white/5'
                                  }`}
                                >
                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                                    ing.selected ? 'bg-[#f59e0b] border-[#f59e0b]' : 'border-[#3a3a3a]'
                                  }`}>
                                    {ing.selected && <Check size={14} className="text-black" />}
                                  </div>
                                  <div className="flex-1 text-left">
                                    <p className="text-sm font-medium text-[#f0f0f0]">{ing.name}</p>
                                    <p className="text-xs text-[#4a4a4a]">{ing.quantity}{ing.unit}</p>
                                  </div>
                                  {!ing.inStock && (
                                    <span className="text-[10px] bg-[#3a3a3a] text-[#8e8e93] px-2 py-1 rounded-full">在庫なし</span>
                                  )}
                                  {ing.inStock && !ing.stockSufficient && (
                                    <span className="text-[10px] bg-[#f59e0b]/10 text-[#f59e0b] px-2 py-1 rounded-full">残り少</span>
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      )}

                      {/* 在庫が十分な食材 */}
                      {suggestedIngredients.some(i => i.stockSufficient) && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/60">
                            在庫あり
                          </p>
                          {suggestedIngredients
                            .filter(i => i.stockSufficient)
                            .map((ing, idx) => {
                              const realIdx = suggestedIngredients.indexOf(ing);
                              return (
                                <button
                                  key={idx}
                                  onClick={() => toggleIngredientSelection(realIdx)}
                                  className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-colors ${
                                    ing.selected
                                      ? 'bg-[#f59e0b]/10 border-[#f59e0b]/30'
                                      : 'bg-[#1a1a1a] border-white/[0.03] opacity-50'
                                  }`}
                                >
                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                                    ing.selected ? 'bg-[#f59e0b] border-[#f59e0b]' : 'border-[#2a2a2a] bg-emerald-500/20'
                                  }`}>
                                    {ing.selected ? (
                                      <Check size={14} className="text-black" />
                                    ) : (
                                      <Check size={14} className="text-emerald-500" />
                                    )}
                                  </div>
                                  <div className="flex-1 text-left">
                                    <p className="text-sm font-medium text-[#8e8e93]">{ing.name}</p>
                                    <p className="text-xs text-[#3a3a3a]">{ing.quantity}{ing.unit}</p>
                                  </div>
                                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full">在庫OK</span>
                                </button>
                              );
                            })}
                        </div>
                      )}

                      {/* 追加ボタン */}
                      <button
                        onClick={handleAddSelectedIngredients}
                        disabled={suggestedIngredients.filter(i => i.selected).length === 0}
                        className="w-full bg-[#f59e0b] text-black font-bold rounded-2xl p-4 active:scale-[0.98] transition-transform disabled:opacity-30 mt-2"
                      >
                        {suggestedIngredients.filter(i => i.selected).length}件を買い物リストに追加
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* === 在庫アイテム編集モーダル === */}
      <AnimatePresence>
        {isInventoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeInventoryModal}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-[#1c1c1e] rounded-t-[32px] sm:rounded-[32px] shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[#f0f0f0]">
                  {editingItem ? 'アイテムを編集' : '在庫を追加'}
                </h2>
                <button onClick={closeInventoryModal} className="p-2 bg-[#252525] rounded-full">
                  <X size={20} className="text-[#8e8e93]" />
                </button>
              </div>

              <form onSubmit={handleInventorySubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#4a4a4a] mb-2 block">名前</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#252525] border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-[#f59e0b]/40 text-[#f0f0f0] placeholder:text-[#3a3a3a]"
                    placeholder="例: 卵"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#4a4a4a] mb-2 block">カテゴリ</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value as Category })}
                      className="w-full bg-[#252525] border border-white/5 rounded-2xl p-4 text-sm outline-none text-[#f0f0f0]"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#4a4a4a] mb-2 block">単位</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={e => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full bg-[#252525] border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-[#f59e0b]/40 text-[#f0f0f0]"
                      placeholder="個、本、袋..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#4a4a4a] mb-2 block">現在の在庫</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#252525] border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-[#f59e0b]/40 text-[#f0f0f0]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#4a4a4a] mb-2 block">通知しきい値</label>
                    <input
                      type="number"
                      value={formData.threshold}
                      onChange={e => setFormData({ ...formData, threshold: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#252525] border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-[#f59e0b]/40 text-[#f0f0f0]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  {editingItem && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('削除しますか？')) {
                          deleteInventoryItem(editingItem.id);
                          closeInventoryModal();
                        }
                      }}
                      className="p-4 text-red-500 bg-red-500/10 rounded-2xl"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 bg-[#f59e0b] text-black font-bold rounded-2xl p-4 active:scale-[0.98] transition-transform"
                  >
                    {editingItem ? '更新する' : '保存する'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
