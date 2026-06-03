
import React from 'react';
import { Bill, Transaction, Account } from './types';

export const INITIAL_BILLS: Bill[] = [
  { id: '1', name: 'Ev Kirası', amount: 15000, dueDate: '01 Oca', category: 'Barınma', autoPay: true, status: 'pending', icon: 'home', color: '#006c75', billType: 'subscription', isRecurring: true, linkedAccountId: '4' },
  { id: '2', name: 'Netflix 4K', amount: 189.99, dueDate: '12 Oca', category: 'Eğlence', autoPay: true, status: 'pending', icon: 'movie', color: '#ef4444', billType: 'subscription', isRecurring: true, linkedAccountId: '4' },
  { id: '3', name: 'IPhone 15 Taksidi', amount: 4500, dueDate: '25 Oca', category: 'Teknoloji', autoPay: false, status: 'pending', icon: 'smartphone', color: '#3b82f6', billType: 'debt', isRecurring: false, totalAmount: 54000, paidAmount: 18000, interestRate: 24.5, linkedAccountId: '1' },
  { id: '4', name: 'Spotify Aile', amount: 64.99, dueDate: '15 Oca', category: 'Eğlence', autoPay: true, status: 'pending', icon: 'music_note', color: '#1db954', billType: 'subscription', isRecurring: true, linkedAccountId: '4' },
  { id: '5', name: 'Kredi Kartı Borcu', amount: 12450, dueDate: '18 Oca', category: 'Finans', autoPay: false, status: 'needs_review', icon: 'credit_card', color: '#eab308', billType: 'debt', isRecurring: false, totalAmount: 12450, paidAmount: 0, interestRate: 45.0, linkedAccountId: '1' },
];

export const INITIAL_ACCOUNTS: Account[] = [
  { id: '1', accountName: 'Maaş Hesabı', bankName: 'Garanti BBVA', balance: 1250, currencyType: 'USD', valueInTRY: 42812.5, icon: 'attach_money', color: '#006c75' },
  { id: '2', accountName: 'Birikim', bankName: 'İş Bankası', balance: 800, currencyType: 'EUR', valueInTRY: 29696, icon: 'euro', color: '#2b8cee' },
  { id: '3', accountName: 'Yatırım Altın', bankName: 'Akbank', balance: 45, currencyType: 'GOLD', valueInTRY: 132750, icon: 'diamond', color: '#eab308' },
  { id: '4', accountName: 'Vadesiz TL', bankName: 'Yapı Kredi', balance: 15400, currencyType: 'TRY', valueInTRY: 15400, icon: 'account_balance_wallet', color: '#81c784' },
];

export const CHART_DATA = [
  { day: 'Pzt', income: 1200, expense: 800 },
  { day: 'Sal', income: 0, expense: 1200 },
  { day: 'Çar', income: 4500, expense: 2100 },
  { day: 'Per', income: 0, expense: 950 },
  { day: 'Cum', income: 15000, expense: 3200 },
  { day: 'Cmt', income: 0, expense: 4100 },
  { day: 'Paz', income: 0, expense: 1800 },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', title: 'Netflix Aboneliği', category: 'Eğlence', amount: -189.99, date: 'Bugün', type: 'expense', icon: 'movie' },
  { id: '2', title: 'Maaş Yatırımı', category: 'Gelir', amount: 45000, date: 'Dün', type: 'income', icon: 'payments' },
  { id: '3', title: 'Starbucks Kahve', category: 'Yemek', amount: -120, date: '24 Eki', type: 'expense', icon: 'local_cafe' },
  { id: '4', title: 'Migros Market', category: 'Market', amount: -1250.40, date: '22 Eki', type: 'expense', icon: 'shopping_bag' },
];

export const CATEGORIES = [
  { name: 'Kira', color: '#006c75', icon: 'home' },
  { name: 'Yemek', color: '#0ea5e9', icon: 'restaurant' },
  { name: 'Ulaşım', color: '#f43f5e', icon: 'directions_car' },
  { name: 'Market', color: '#10b981', icon: 'shopping_cart' },
  { name: 'Eğlence', color: '#ef4444', icon: 'movie' },
  { name: 'Faturalar', color: '#3b82f6', icon: 'receipt_long' },
  { name: 'Diğer', color: '#8b5cf6', icon: 'category' },
];

export const predictCategory = (title: string): string => {
  const lowerTitle = title.toLowerCase();
  for (const [category, keywords] of Object.entries({
    'Kira': ['kira', 'aidat', 'ev'],
    'Yemek': ['yemek', 'restoran', 'burger', 'pizza', 'cafe', 'kahve', 'starbucks'],
    'Ulaşım': ['benzin', 'taksi', 'uber', 'bilet', 'thy'],
    'Market': ['market', 'migros', 'bim', 'şok', 'getir'],
    'Eğlence': ['netflix', 'spotify', 'sinema', 'oyun'],
    'Faturalar': ['fatura', 'elektrik', 'su', 'doğalgaz', 'internet'],
  })) {
    if (keywords.some(keyword => lowerTitle.includes(keyword))) {
      return category;
    }
  }
  return 'Diğer';
};
