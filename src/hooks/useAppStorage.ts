/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { InventoryItem, ShoppingItem } from '../types';

const STORAGE_KEY_INVENTORY = 'family_inventory_v1';
const STORAGE_KEY_SHOPPING = 'family_shopping_v1';

export function useAppStorage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 初回読み込み
  useEffect(() => {
    const savedInventory = localStorage.getItem(STORAGE_KEY_INVENTORY);
    const savedShopping = localStorage.getItem(STORAGE_KEY_SHOPPING);

    if (savedInventory) setInventory(JSON.parse(savedInventory));
    if (savedShopping) setShoppingList(JSON.parse(savedShopping));
    
    setIsLoaded(true);
  }, []);

  // 保存
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(inventory));
    localStorage.setItem(STORAGE_KEY_SHOPPING, JSON.stringify(shoppingList));
  }, [inventory, shoppingList, isLoaded]);

  // 在庫としきい値をチェックして買い物リストと同期する内部関数
  const syncInventoryWithShopping = useCallback((item: InventoryItem) => {
    if (item.quantity <= item.threshold) {
      setShoppingList(prev => {
        // 既にリストにあるかチェック
        const exists = prev.find(s => s.inventoryId === item.id && !s.isBought);
        if (exists) return prev;

        const newItem: ShoppingItem = {
          id: crypto.randomUUID(),
          name: item.name,
          quantity: 1, // デフォルト1つ
          unit: item.unit,
          isBought: false,
          inventoryId: item.id,
          createdAt: Date.now(),
        };
        return [...prev, newItem];
      });
    } else {
      // 在庫がしきい値を超えた場合、自動追加された未購入のアイテムがあれば削除する
      setShoppingList(prev => prev.filter(s => !(s.inventoryId === item.id && !s.isBought)));
    }
  }, []);

  // --- 在庫操作 ---
  const addInventoryItem = (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: crypto.randomUUID(),
      updatedAt: Date.now(),
    };
    setInventory(prev => [...prev, newItem]);
    syncInventoryWithShopping(newItem);
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory(prev => {
      const newInventory = prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updates, updatedAt: Date.now() };
          // 更新後にチェック
          setTimeout(() => syncInventoryWithShopping(updated), 0);
          return updated;
        }
        return item;
      });
      return newInventory;
    });
  };

  const deleteInventoryItem = (id: string) => {
    setInventory(prev => prev.filter(item => item.id !== id));
    // 紐づく買い物リストも消す（任意だがシンプルにするため）
    setShoppingList(prev => prev.filter(s => s.inventoryId !== id));
  };

  // --- 買い物リスト操作 ---
  const addShoppingItem = (name: string) => {
    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name,
      quantity: 1,
      unit: '個',
      isBought: false,
      createdAt: Date.now(),
    };
    setShoppingList(prev => [...prev, newItem]);
  };

  const toggleBought = (id: string) => {
    setShoppingList(prev => prev.map(item => {
      if (item.id === id) {
        const newStatus = !item.isBought;
        
        // 購入完了になった場合、在庫を増やす
        if (newStatus && item.inventoryId) {
          updateInventoryItem(item.inventoryId, {
            // 在庫を1増やす（または必要分増やすロジック）
            quantity: inventory.find(i => i.id === item.inventoryId)?.quantity! + 1
          });
        }
        
        return { ...item, isBought: newStatus };
      }
      return item;
    }));
  };

  const deleteShoppingItem = (id: string) => {
    setShoppingList(prev => prev.filter(item => item.id !== id));
  };

  const clearBoughtItems = () => {
    setShoppingList(prev => prev.filter(item => !item.isBought));
  };

  return {
    inventory,
    shoppingList,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    addShoppingItem,
    toggleBought,
    deleteShoppingItem,
    clearBoughtItems,
  };
}
