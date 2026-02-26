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
  ChevronRight, 
  Settings,
  CheckCircle2,
  Circle,
  AlertTriangle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStorage } from './hooks/useAppStorage';
import { Category, InventoryItem } from './types';

const CATEGORIES: Category[] = ['食品', '日用品', '調味料', '飲料', 'その他'];

export default function App() {
  const [activeTab, setActiveTab] = useState<'shopping' | 'inventory'>('shopping');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const {
    inventory,
    shoppingList,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    addShoppingItem,
    toggleBought,
    deleteShoppingItem,
    clearBoughtItems,
  } = useAppStorage();

  // フォームの状態
  const [formData, setFormData] = useState({
    name: '',
    category: '食品' as Category,
    quantity: 1,
    unit: '個',
    threshold: 1,
    memo: ''
  });

  const handleOpenModal = (item?: InventoryItem) => {
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
      setFormData({
        name: '',
        category: '食品',
        quantity: 1,
        unit: '個',
        threshold: 1,
        memo: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateInventoryItem(editingItem.id, formData);
    } else {
      addInventoryItem(formData);
    }
    closeModal();
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] font-sans pb-24">
      {/* Header */}
      <header className="bg-white border-b border-black/5 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight">
            {activeTab === 'shopping' ? '買い物リスト' : '在庫管理'}
          </h1>
          {activeTab === 'shopping' && shoppingList.some(s => s.isBought) && (
            <button 
              onClick={clearBoughtItems}
              className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full"
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
              className="space-y-3"
            >
              {/* 手動追加入力 */}
              <div className="bg-white rounded-2xl shadow-sm p-3 flex gap-2 border border-black/5">
                <input 
                  type="text" 
                  placeholder="買うものを追加..."
                  className="flex-1 bg-transparent px-2 outline-none text-base"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      addShoppingItem(e.currentTarget.value);
                      e.currentTarget.value = '';
                      // 入力後にフォーカスを外すことでキーボードを閉じ、ズームをリセットしやすくする
                      e.currentTarget.blur();
                    }
                  }}
                />
                <button className="p-2 bg-black text-white rounded-xl">
                  <Plus size={18} />
                </button>
              </div>

              {/* リスト表示 */}
              <div className="space-y-2">
                {shoppingList.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <ShoppingCart className="mx-auto mb-2 opacity-20" size={48} />
                    <p className="text-sm">リストは空です</p>
                  </div>
                ) : (
                  shoppingList
                    .sort((a, b) => Number(a.isBought) - Number(b.isBought) || b.createdAt - a.createdAt)
                    .map(item => (
                    <div 
                      key={item.id}
                      className={`flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm border border-black/5 transition-opacity ${item.isBought ? 'opacity-50' : ''}`}
                    >
                      <button onClick={() => toggleBought(item.id)}>
                        {item.isBought ? (
                          <CheckCircle2 className="text-emerald-500" size={24} />
                        ) : (
                          <Circle className="text-gray-300" size={24} />
                        )}
                      </button>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${item.isBought ? 'line-through' : ''}`}>
                          {item.name}
                        </p>
                        {item.inventoryId && (
                          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                            在庫連動中
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => deleteShoppingItem(item.id)}
                        className="p-2 text-gray-300 hover:text-red-500"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* カテゴリ別表示 */}
              {CATEGORIES.map(cat => {
                const items = inventory.filter(i => i.category === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat} className="space-y-2">
                    <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 px-2">
                      {cat}
                    </h2>
                    <div className="space-y-2">
                      {items.map(item => (
                        <div 
                          key={item.id}
                          className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden"
                        >
                          <div className="p-4 flex items-center gap-4">
                            <div className="flex-1" onClick={() => handleOpenModal(item)}>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm">{item.name}</p>
                                {item.quantity <= item.threshold && (
                                  <AlertTriangle size={14} className="text-amber-500" />
                                )}
                              </div>
                              <p className="text-xs text-gray-400">
                                しきい値: {item.threshold}{item.unit}
                              </p>
                            </div>
                            
                            <div className="flex items-center bg-gray-50 rounded-xl p-1 gap-1">
                              <button 
                                onClick={() => updateInventoryItem(item.id, { quantity: Math.max(0, item.quantity - 1) })}
                                className="p-2 hover:bg-white rounded-lg transition-colors"
                              >
                                <Minus size={16} />
                              </button>
                              <div className="w-10 text-center">
                                <span className="text-sm font-bold">{item.quantity}</span>
                                <span className="text-[10px] ml-0.5">{item.unit}</span>
                              </div>
                              <button 
                                onClick={() => updateInventoryItem(item.id, { quantity: item.quantity + 1 })}
                                className="p-2 hover:bg-white rounded-lg transition-colors"
                              >
                                <Plus size={16} />
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
                <div className="text-center py-12 text-gray-400">
                  <Package className="mx-auto mb-2 opacity-20" size={48} />
                  <p className="text-sm">在庫データがありません</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Button */}
      {activeTab === 'inventory' && (
        <button 
          onClick={() => handleOpenModal()}
          className="fixed bottom-24 right-6 w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center z-20 active:scale-95 transition-transform"
        >
          <Plus size={28} />
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-black/5 px-6 py-3 pb-safe z-30">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <button 
            onClick={() => setActiveTab('shopping')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'shopping' ? 'text-black' : 'text-gray-300'}`}
          >
            <ShoppingCart size={24} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">買い物</span>
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'inventory' ? 'text-black' : 'text-gray-300'}`}
          >
            <Package size={24} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">在庫</span>
          </button>
        </div>
      </nav>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl p-8 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                  {editingItem ? 'アイテムを編集' : '新しいアイテム'}
                </h2>
                <button onClick={closeModal} className="p-2 bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">名前</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-base outline-none focus:ring-2 ring-black/5"
                    placeholder="例: 牛乳"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">カテゴリ</label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value as Category})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 text-base outline-none"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">単位</label>
                    <input 
                      type="text" 
                      value={formData.unit}
                      onChange={e => setFormData({...formData, unit: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 text-base outline-none"
                      placeholder="個、本、袋など"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">現在の在庫</label>
                    <input 
                      type="number" 
                      value={formData.quantity}
                      onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 text-base outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">通知しきい値</label>
                    <input 
                      type="number" 
                      value={formData.threshold}
                      onChange={e => setFormData({...formData, threshold: parseInt(e.target.value) || 0})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 text-base outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  {editingItem && (
                    <button 
                      type="button"
                      onClick={() => {
                        if (confirm('削除しますか？')) {
                          deleteInventoryItem(editingItem.id);
                          closeModal();
                        }
                      }}
                      className="p-4 text-red-500 bg-red-50 rounded-2xl"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                  <button 
                    type="submit"
                    className="flex-1 bg-black text-white font-bold rounded-2xl p-4 active:scale-95 transition-transform"
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
