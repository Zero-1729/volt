import React, { createContext, useContext } from 'react';
import type { WalletAPI } from '../services/walletAPI';
import { walletApi } from '../services/walletService';

const WalletContext = createContext<WalletAPI | null>(null);

export const WalletProvider: React.FC<{ children: React.ReactNode; api?: WalletAPI }> = ({ children, api }) => {
  const value = api !== undefined ? api : walletApi;
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = (): WalletAPI => {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('[Context] useWallet must be used within a WalletProvider');
    }
  return ctx;
};