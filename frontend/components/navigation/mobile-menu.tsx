"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Shield, Users, TrendingUp, ExternalLink, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/wallet/wallet-button";
import { Logo } from "@/components/ui/logo";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  {
    name: "Solutions",
    items: [
      { name: "Skill Tokens", icon: Shield, description: "Verifiable soulbound credentials", href: "/skill-tokens" },
      { name: "AI Matching", icon: Zap, description: "Smart talent discovery", href: "/ai-matching" },
      { name: "Reputation", icon: TrendingUp, description: "Build your professional score", href: "/reputation" },
      { name: "Community", icon: Users, description: "Connect with talents", href: "/community" }
    ]
  },
  { name: "Marketplace", href: "/marketplace" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Docs", href: "/docs", external: true }
];

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Mobile Menu Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-gray-200/20 dark:border-slate-800/30 shadow-2xl z-50 lg:hidden overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="mobile-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M30 5L50 20v30L30 65L10 50V20L30 5z" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-hedera-500" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#mobile-pattern)" />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200/20 dark:border-slate-800/30">
                <Logo size="sm" showText={true} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </Button>
              </div>

              {/* Navigation Items */}
              <div className="flex-1 overflow-y-auto p-6 space-y-2">
                {navigationItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                  >
                    {item.items ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {item.name}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                        
                        <div className="space-y-2 ml-4 border-l-2 border-hedera-200/30 dark:border-hedera-800/30 pl-4">
                          {item.items.map((subItem, subIndex) => (
                            <motion.a
                              key={subItem.name}
                              href={subItem.href}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: (index * 0.1) + (subIndex * 0.05), duration: 0.3 }}
                              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-hedera-50/50 dark:hover:bg-hedera-950/30 transition-colors duration-200 group"
                              onClick={onClose}
                            >
                              <div className="w-8 h-8 bg-gradient-to-br from-hedera-100 to-hedera-200 dark:from-hedera-800 dark:to-hedera-700 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                <subItem.icon className="w-4 h-4 text-hedera-600 dark:text-hedera-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-slate-900 dark:text-white group-hover:text-hedera-600 dark:group-hover:text-hedera-400 transition-colors">
                                  {subItem.name}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                  {subItem.description}
                                </div>
                              </div>
                            </motion.a>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <a
                        href={item.href}
                        className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors duration-200 group"
                        onClick={onClose}
                      >
                        <span className="font-medium text-slate-900 dark:text-white group-hover:text-hedera-600 dark:group-hover:text-hedera-400 transition-colors">
                          {item.name}
                        </span>
                        {item.external ? (
                          <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-hedera-500 transition-colors" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-hedera-500 transition-colors" />
                        )}
                      </a>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Footer with Wallet Button */}
              <div className="p-6 border-t border-gray-200/20 dark:border-slate-800/30 space-y-4">
                <WalletButton size="lg" className="w-full" />
                
                {/* Network Status */}
                <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Hedera Testnet</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}