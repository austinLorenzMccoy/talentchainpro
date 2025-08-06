/**
 * Simplified wallet integration for testing
 */

import { WalletConnection, UseWalletReturn, WalletType } from '../types/wallet';
import { APP_CONFIG } from '../config/networks';

// Mock wallet connection for testing
const createMockConnection = (walletType: WalletType): WalletConnection => ({
  walletType,
  isConnected: true,
  accountId: '0.0.123456',
  evmAddress: '0x1234567890123456789012345678901234567890',
  balance: '1000.00',
  network: APP_CONFIG.network,
  metadata: {
    name: walletType === 'hashpack' ? 'HashPack' : 'MetaMask',
    icon: `/icons/${walletType}.svg`,
  },
});

class SimpleWallet {
  private connection: WalletConnection | null = null;

  isAvailable(): boolean {
    return typeof window !== 'undefined';
  }

  getConnection(): WalletConnection | null {
    // Try to get saved connection from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('talentchain_simple_connection');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.isConnected) {
            this.connection = parsed;
            return parsed;
          }
        } catch (error) {
          console.error('Failed to parse saved connection:', error);
          localStorage.removeItem('talentchain_simple_connection');
        }
      }
    }
    
    return this.connection;
  }

  async connect(walletType: WalletType = 'hashpack'): Promise<WalletConnection> {
    console.log(`🔄 Connecting to ${walletType} (mock)...`);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const connection = createMockConnection(walletType);
    this.connection = connection;
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('talentchain_simple_connection', JSON.stringify(connection));
    }
    
    console.log(`✅ ${walletType} connected successfully (mock):`, connection);
    return connection;
  }

  async disconnect(): Promise<void> {
    console.log('🔄 Disconnecting wallet (mock)...');
    
    this.connection = null;
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('talentchain_simple_connection');
    }
    
    console.log('✅ Wallet disconnected successfully (mock)');
  }
}

export const simpleWallet = new SimpleWallet();