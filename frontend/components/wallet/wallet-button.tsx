"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { useHederaWallet } from "@/hooks/useHederaWallet";
import { WalletType } from "@/lib/types/wallet";
import { getAccountExplorerUrl } from "@/lib/config/networks";

interface WalletButtonProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const WALLET_OPTIONS = [
  {
    type: 'hashpack' as WalletType,
    name: 'HashPack',
    description: 'Official Hedera wallet',
    icon: '/icons/hashpack.svg',
    recommended: true,
  },
  {
    type: 'metamask' as WalletType,
    name: 'MetaMask',
    description: 'Popular Ethereum wallet',
    icon: '/icons/metamask.svg',
    recommended: false,
  },
];

export function WalletButton({ size = "md", className = "" }: WalletButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const {
    wallet,
    isConnecting,
    error,
    connect,
    disconnect,
    isConnected,
    isHashPackAvailable,
    isMetaMaskAvailable
  } = useHederaWallet();

  const sizeConfig = {
    sm: { button: "h-9 px-3 text-sm", icon: "w-4 h-4" },
    md: { button: "h-10 px-4 text-sm", icon: "w-4 h-4" },
    lg: { button: "h-12 px-6 text-base", icon: "w-5 h-5" }
  };

  const isMobileMode = className.includes("px-2");
  const config = {
    ...sizeConfig[size],
    button: isMobileMode ? "h-9 px-2 text-sm" : sizeConfig[size].button
  };

  const handleConnect = async (walletType: WalletType) => {
    try {
      // Check if wallet is available before attempting connection
      const isAvailable = getWalletAvailability(walletType);
      if (!isAvailable) {
        const walletName = walletType === 'hashpack' ? 'HashPack' : 'MetaMask';
        throw new Error(`${walletName} is not installed. Please install the extension first.`);
      }

      await connect(walletType);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Connection failed:', error);
      // Error will be handled by the useHederaWallet hook
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const copyAddress = () => {
    if (wallet?.accountId) {
      navigator.clipboard.writeText(wallet.accountId);
      // You could add a toast notification here
    }
  };

  const getWalletAvailability = (type: WalletType) => {
    switch (type) {
      case 'hashpack':
        return isHashPackAvailable;
      case 'metamask':
        return isMetaMaskAvailable;
      default:
        return false;
    }
  };

  const formatAddress = (address: string) => {
    if (address.startsWith('0.0.')) {
      return address;
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isConnected && wallet) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={size === "md" ? "default" : size}
            className={`relative group bg-white/90 dark:bg-slate-900/90 border-pink-200/50 dark:border-pink-800/50 hover:border-pink-300 dark:hover:border-pink-700 hover:bg-pink-50/50 dark:hover:bg-pink-950/50 transition-all duration-300 ${config.button} ${className}`}
          >
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-hedera-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className={`relative z-10 flex items-center ${isMobileMode ? 'space-x-1' : 'space-x-2'}`}>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {!isMobileMode ? (
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatAddress(wallet.accountId)}
                </span>
              ) : (
                <Wallet className={`${config.icon} text-slate-700 dark:text-slate-300`} />
              )}
              <ChevronDown className={`${config.icon} text-slate-500 dark:text-slate-400 transition-transform group-data-[state=open]:rotate-180`} />
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-pink-200/20 dark:border-pink-800/30 shadow-2xl"
        >
          <div className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-white">
                  {wallet.metadata?.name || wallet.walletType}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Connected</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Balance:</span>
                <span className="font-medium text-slate-900 dark:text-white">{wallet.balance} HBAR</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Network:</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-slate-900 dark:text-white capitalize">{wallet.network}</span>
                </div>
              </div>
            </div>
          </div>

          <DropdownMenuSeparator className="bg-pink-200/30 dark:bg-pink-800/30" />

          <DropdownMenuItem
            onClick={copyAddress}
            className="flex items-center space-x-3 p-3 hover:bg-pink-50/50 dark:hover:bg-pink-950/50 cursor-pointer"
          >
            <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="text-slate-900 dark:text-white">Copy Address</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => window.open(getAccountExplorerUrl(wallet.accountId, wallet.network), '_blank')}
            className="flex items-center space-x-3 p-3 hover:bg-pink-50/50 dark:hover:bg-pink-950/50 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="text-slate-900 dark:text-white">View on Explorer</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-pink-200/30 dark:bg-pink-800/30" />

          <DropdownMenuItem
            onClick={handleDisconnect}
            className="flex items-center space-x-3 p-3 hover:bg-red-50/50 dark:hover:bg-red-950/50 cursor-pointer text-red-600 dark:text-red-400"
          >
            <LogOut className="w-4 h-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={className}
        >
          <Button
            disabled={isConnecting}
            className={`relative group bg-hedera-600 hover:bg-hedera-700 text-white shadow-lg shadow-hedera-500/25 hover:shadow-hedera-600/30 transition-all duration-300 font-medium ${config.button}`}
          >
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-hedera-500 rounded-md blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />

            <div className={`relative z-10 flex items-center ${isMobileMode ? 'justify-center' : 'space-x-2'}`}>
              {isConnecting ? (
                <Loader2 className={`${config.icon} animate-spin`} />
              ) : (
                <Wallet className={`${config.icon}`} />
              )}
              {!isMobileMode && (
                <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
              )}
            </div>

            {/* Animated border */}
            <motion.div
              className="absolute inset-0 border-2 border-hedera-400/50 rounded-md"
              initial={{ opacity: 0, scale: 1 }}
              whileHover={{
                opacity: [0, 1, 0],
                scale: [1, 1.05, 1],
                transition: { duration: 1.5, repeat: Infinity }
              }}
            />
          </Button>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
            Connect Wallet
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400 text-base">
            Choose a wallet to connect to TalentChain Pro
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {WALLET_OPTIONS.map((option) => {
            const isAvailable = getWalletAvailability(option.type);

            return (
              <motion.button
                key={option.type}
                onClick={() => handleConnect(option.type)}
                disabled={!isAvailable || isConnecting}
                whileHover={isAvailable ? { scale: 1.02 } : {}}
                whileTap={isAvailable ? { scale: 0.98 } : {}}
                className={`w-full p-5 border-2 rounded-xl text-left transition-all duration-300 ${isAvailable
                  ? 'border-slate-200 dark:border-slate-700 hover:border-hedera-400 dark:hover:border-hedera-500 hover:bg-hedera-50/50 dark:hover:bg-hedera-950/50 bg-white/50 dark:bg-slate-800/50'
                  : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 cursor-not-allowed opacity-60'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isAvailable
                      ? 'bg-gradient-to-br from-hedera-500 to-hedera-600 dark:from-hedera-400 dark:to-hedera-500'
                      : 'bg-slate-200 dark:bg-slate-700'
                      }`}>
                      <span className="text-lg font-bold text-white dark:text-white">
                        {option.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <span className="font-semibold text-slate-900 dark:text-white text-lg">
                          {option.name}
                        </span>
                        {option.recommended && (
                          <span className="px-3 py-1 bg-gradient-to-r from-hedera-500 to-hedera-600 text-white text-xs font-medium rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {option.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!isAvailable && (
                      <AlertCircle className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    )}
                    {isConnecting && (
                      <Loader2 className="w-5 h-5 text-hedera-500 animate-spin" />
                    )}
                  </div>
                </div>

                {!isAvailable && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {option.name} is not installed.
                        <a
                          href={option.type === 'hashpack' ? 'https://hashpack.com' : 'https://metamask.io'}
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
            );
          })}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
            </div>
          </motion.div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
            By connecting a wallet, you agree to our{' '}
            <a href="/terms" className="underline hover:text-slate-700 dark:hover:text-slate-300">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="underline hover:text-slate-700 dark:hover:text-slate-300">
              Privacy Policy
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}