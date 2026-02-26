/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Category = '食品' | '日用品' | '調味料' | '飲料' | 'その他';

export interface InventoryItem {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  threshold: number; // この数値以下になったら買い物リストに追加
  memo?: string;
  updatedAt: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  isBought: boolean;
  inventoryId?: string; // 在庫アイテムと紐付いている場合
  createdAt: number;
}
