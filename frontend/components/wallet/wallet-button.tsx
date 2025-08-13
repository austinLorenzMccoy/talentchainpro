"use client";

import React, { useState } from 'react';
import { Wallet, ChevronDown, Loader2, User, LogOut, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { WalletType } from '@/lib/wallet/wallet-connector';
import { motion } from 'framer-motion';

interface WalletButtonProps {
  variant?: 'default' | 'compact';
  size?: 'sm' | 'lg';
  className?: string;
}

const WalletButton: React.FC<WalletButtonProps> = ({
  variant = 'default',
  size = 'lg',
  className = ''
}) => {
  const {
    user,
    isConnected,
    isLoading,
    connectWallet,
    disconnectWallet,
    getAvailableWallets
  } = useAuth();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const walletOptions = [

    {
      name: 'MetaMask',
      id: WalletType.METAMASK,
      description: 'EVM compatible wallet',
      icon: '🦊',
      color: 'from-orange-500 to-orange-600',
      installUrl: 'https://metamask.io',
      recommended: false
    },
    {
      name: 'WalletConnect',
      id: WalletType.WALLETCONNECT,
      description: 'Multi-wallet support',
      icon: '🔌',
      color: 'from-blue-500 to-blue-600',
      installUrl: 'https://walletconnect.com',
      recommended: false
    }
  ];

  const availableWallets = getAvailableWallets();

  const handleWalletAction = async (wallet: typeof walletOptions[0]) => {
    const isInstalled = availableWallets.includes(wallet.id);

    if (!isInstalled) {
      // Redirect to installation page
      window.open(wallet.installUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Try to connect to installed wallet
    try {
      console.log(`Attempting to connect to ${wallet.id}...`);
      await connectWallet(wallet.id);
      console.log(`Successfully connected to ${wallet.id}!`);
      setIsDialogOpen(false);
    } catch (error) {
      console.error(`Failed to connect to ${wallet.id}:`, error);
      alert(`Failed to connect to ${wallet.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  // Format address for display
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Get wallet icon based on type
  const getWalletIcon = (walletType: WalletType) => {
    switch (walletType) {
      case WalletType.HASHPACK:
        return '🔗';
      case WalletType.METAMASK:
        return '🦊';
      case WalletType.WALLETCONNECT:
        return '🔌';
      default:
        return '💼';
    }
  };

  // If connected, show user info dropdown
  if (isConnected && user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={size} className={`flex items-center space-x-2 ${className}`}>
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getWalletIcon(user.walletType)}</span>
              <span className="hidden sm:inline-block">
                {formatAddress(user.walletAddress)}
              </span>
              <span className="hidden lg:inline-block text-xs text-muted-foreground">
                {user.balance} HBAR
              </span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="p-2">
            <div className="flex items-center space-x-2 p-2">
              <User className="h-4 w-4" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.profile.name || 'Anonymous User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {formatAddress(user.walletAddress)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 text-xs">
              <span className="text-muted-foreground">Balance:</span>
              <span className="font-medium">{user.balance} HBAR</span>
            </div>
            <div className="flex items-center justify-between p-2 text-xs">
              <span className="text-muted-foreground">Wallet:</span>
              <span className="font-medium capitalize">{user.walletType}</span>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDisconnect} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // If not connected, show connect button
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size={size}
          className={`bg-gradient-to-r from-hedera-500 to-hedera-600 hover:from-hedera-600 hover:to-hedera-700 text-white ${className}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-hedera-500 to-hedera-600 bg-clip-text text-transparent">
            Connect Your Wallet
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Choose your preferred wallet to connect to TalentChain Pro
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {walletOptions.map((option) => {
            const isAvailable = availableWallets.includes(option.id);

            return (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.button
                  onClick={() => handleWalletAction(option)}
                  disabled={!isAvailable}
                  whileHover={isAvailable ? { scale: 1.02 } : {}}
                  whileTap={isAvailable ? { scale: 0.98 } : {}}
                  className={`w-full p-5 border-2 rounded-xl text-left transition-all duration-300 ${isAvailable
                    ? 'border-slate-200 dark:border-slate-700 hover:border-hedera-400 dark:hover:border-hedera-500 hover:bg-hedera-50/50 dark:hover:bg-hedera-950/50 bg-white/50 dark:bg-slate-800/50'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 cursor-not-allowed opacity-60'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{option.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                            {option.name}
                          </h3>
                          {option.recommended && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-hedera-100 text-hedera-800 dark:bg-hedera-900/30 dark:text-hedera-300">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {option.description}
                        </p>
                      </div>
                    </div>

                    {isAvailable ? (
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-xs text-green-600 dark:text-green-400">Available</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        <span className="text-xs text-red-600 dark:text-red-400">Not Installed</span>
                      </div>
                    )}
                  </div>

                  {!isAvailable && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {option.name} is not installed.
                          <a
                            href={option.installUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline ml-1 hover:text-red-700 dark:hover:text-red-300"
                          >
                            Install now
                          </a>
                        </p>
                      </div>
                    </div>
                  )}
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-hedera-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                Why Connect a Wallet?
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Connect your wallet to access your skill tokens, manage your reputation,
                and participate in the decentralized talent ecosystem on Hedera.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletButton;