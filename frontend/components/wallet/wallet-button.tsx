"use client";

import React, { useState, useEffect } from 'react';
import { Wallet, ChevronDown, Loader2, User, LogOut, ExternalLink, Sparkles, AlertCircle, Wifi, WifiOff, LayoutDashboard } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface WalletButtonProps {
  variant?: 'default' | 'compact' | 'icon';
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
  const pathname = usePathname();

  // Check if we're on a dashboard page
  const isOnDashboard = pathname?.startsWith('/dashboard');

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

  const [availableWallets, setAvailableWallets] = useState<WalletType[]>([]);

  useEffect(() => {
    const loadAvailableWallets = async () => {
      const wallets = await getAvailableWallets();
      setAvailableWallets(wallets);
    };
    loadAvailableWallets();
  }, [getAvailableWallets]);

  const handleWalletAction = async (wallet: typeof walletOptions[0]) => {
    const isInstalled = availableWallets.includes(wallet.id);

    if (!isInstalled) {
      window.open(wallet.installUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      console.log(`Attempting to connect to ${wallet.id}...`);
      await connectWallet(wallet.id);
      console.log(`Successfully connected to ${wallet.id}!`);
      setIsDialogOpen(false);
    } catch (error) {
      console.error(`Failed to connect to ${wallet.id}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('timeout') || errorMessage.includes('connection')) {
        alert(`Connection failed: ${errorMessage}\n\nTry refreshing the page or checking if MetaMask is unlocked.`);
      } else {
        alert(`Failed to connect to ${wallet.id}: ${errorMessage}`);
      }
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

  // Connected state - Responsive dropdown
  if (isConnected && user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {/* Mobile - Icon only with status indicator */}
          <Button
            variant="outline"
            size={size}
            className={cn(
              "relative flex items-center transition-all duration-200",
              // Mobile: Icon only
              "w-9 h-9 p-0 sm:w-auto sm:px-3",
              // Desktop: Full display
              "sm:space-x-2",
              className
            )}
          >
            {/* Connection status indicator - Mobile */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full sm:hidden" />

            {/* Mobile content */}
            <div className="flex items-center sm:hidden">
              <Wallet className="h-4 w-4" />
            </div>

            {/* Desktop content */}
            <div className="hidden sm:flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getWalletIcon(user.walletType)}</span>
                <span className="hidden md:inline-block font-medium">
                  {formatAddress(user.walletAddress)}
                </span>
                <span className="hidden lg:inline-block text-xs text-muted-foreground">
                  {user.balance} HBAR
                </span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 sm:w-72">
          {/* Header with user info */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-hedera-500 to-hedera-600 rounded-full flex items-center justify-center">
                <span className="text-lg text-white">{getWalletIcon(user.walletType)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100">
                  {user.profile.name || 'Anonymous User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {formatAddress(user.walletAddress)}
                </p>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">Connected</span>
              </div>
            </div>
          </div>

          {/* Wallet details */}
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Balance:</span>
              <span className="font-semibold">{user.balance} HBAR</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Wallet:</span>
              <span className="font-medium capitalize">{user.walletType}</span>
            </div>
          </div>

          <DropdownMenuSeparator />

          {!isOnDashboard && (
            <Link href="/dashboard">
              <DropdownMenuItem className="p-3 cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Go to Dashboard
              </DropdownMenuItem>
            </Link>
          )}

          <DropdownMenuItem className="p-3">
            <User className="mr-2 h-4 w-4" />
            View Profile
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleDisconnect} className="p-3 text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300">
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect Wallet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Not connected state - Responsive connect button
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size={size}
          className={cn(
            "relative bg-gradient-to-r from-hedera-500 to-hedera-600 hover:from-hedera-600 hover:to-hedera-700 text-white transition-all duration-200",
            // Mobile: Icon only
            "w-9 h-9 p-0 sm:w-auto sm:px-4",
            // Loading state
            isLoading && "cursor-not-allowed",
            className
          )}
          disabled={isLoading}
        >
          {/* Disconnected status indicator - Mobile */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full sm:hidden" />

          {isLoading ? (
            <>
              {/* Mobile loading */}
              <Loader2 className="h-4 w-4 animate-spin sm:hidden" />
              {/* Desktop loading */}
              <div className="hidden sm:flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Connecting...</span>
              </div>
            </>
          ) : (
            <>
              {/* Mobile content */}
              <Wallet className="h-4 w-4 sm:hidden" />
              {/* Desktop content */}
              <div className="hidden sm:flex items-center">
                <Wallet className="mr-2 h-4 w-4" />
                <span>Connect Wallet</span>
              </div>
            </>
          )}
        </Button>
      </DialogTrigger>

      {/* Responsive dialog */}
      <DialogContent className="sm:max-w-md w-[95vw] max-w-sm sm:w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
        <DialogHeader className="text-center sm:text-left">
          <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-hedera-500 to-hedera-600 bg-clip-text text-transparent">
            Connect Your Wallet
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Choose your preferred wallet to connect to TalentChain Pro
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
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
                  className={cn(
                    "w-full p-4 sm:p-5 border-2 rounded-xl text-left transition-all duration-300",
                    isAvailable
                      ? 'border-slate-200 dark:border-slate-700 hover:border-hedera-400 dark:hover:border-hedera-500 hover:bg-hedera-50/50 dark:hover:bg-hedera-950/50 bg-white/50 dark:bg-slate-800/50'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 cursor-not-allowed opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl sm:text-2xl">{option.icon}</span>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                            {option.name}
                          </h3>
                          {option.recommended && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-hedera-100 text-hedera-800 dark:bg-hedera-900/30 dark:text-hedera-300 mt-1 sm:mt-0 self-start">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {option.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                      <div className="flex items-center space-x-1">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          isAvailable ? "bg-green-500" : "bg-red-500"
                        )} />
                        <span className={cn(
                          "text-xs font-medium",
                          isAvailable
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        )}>
                          {isAvailable ? "Available" : "Not Installed"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isAvailable && (
                    <div className="mt-3 p-2 sm:p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                          {option.name} is not installed.{' '}
                          <a
                            href={option.installUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-red-700 dark:hover:text-red-300 font-medium"
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

        {/* Info section - Responsive */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="w-2 h-2 bg-hedera-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1 text-sm sm:text-base">
                Why Connect a Wallet?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
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