"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Zap,
  Shield,
  Users,
  TrendingUp,
  ChevronDown,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavbarBackground } from "@/components/ui/background-elements";
import { Logo } from "@/components/ui/logo";
import WalletButton from "@/components/wallet/wallet-button";
import { MobileMenu } from "@/components/navigation/mobile-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigationItems = [
  {
    name: "Solutions",
    items: [
      { name: "Skill Tokens", icon: Shield, description: "Verifiable soulbound credentials" },
      { name: "AI Matching", icon: Zap, description: "Smart talent discovery" },
      { name: "Reputation", icon: TrendingUp, description: "Build your professional score" },
      { name: "Community", icon: Users, description: "Connect with talents" }
    ]
  },
  { name: "Marketplace", href: "/marketplace" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Docs", href: "/docs", external: true }
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled
            ? 'backdrop-blur-md bg-white/80 dark:bg-hedera-950/80 border-b border-gray-200/20 dark:border-hedera-800/30 shadow-lg'
            : 'backdrop-blur-sm bg-white/60 dark:bg-hedera-950/60 border-b border-transparent'
          }`}
      >
        <NavbarBackground />

        <div className="relative z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              {/* Logo Section */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex items-center min-w-0 flex-1 lg:flex-none"
              >
                <Logo size="md" showText={true} />
              </motion.div>

              {/* Desktop Navigation */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="hidden lg:flex items-center space-x-8"
              >
                {navigationItems.map((item, index) => (
                  <div key={item.name}>
                    {item.items ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-700 dark:text-slate-300 hover:text-hedera-600 dark:hover:text-hedera-400 font-medium transition-all duration-200 hover:bg-hedera-50/50 dark:hover:bg-hedera-900/20"
                          >
                            {item.name}
                            <ChevronDown className="w-4 h-4 ml-1 transition-transform group-data-[state=open]:rotate-180" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="center"
                          className="w-64 bg-white/95 dark:bg-hedera-950/95 backdrop-blur-xl border-gray-200/20 dark:border-hedera-800/30 shadow-2xl"
                        >
                          {item.items.map((subItem) => (
                            <DropdownMenuItem
                              key={subItem.name}
                              className="flex items-start space-x-3 p-4 hover:bg-hedera-50/50 dark:hover:bg-hedera-900/30 cursor-pointer"
                            >
                              <div className="w-8 h-8 bg-gradient-to-br from-hedera-100 to-hedera-200 dark:from-hedera-800 dark:to-hedera-700 rounded-lg flex items-center justify-center">
                                <subItem.icon className="w-4 h-4 text-hedera-600 dark:text-hedera-400" />
                              </div>
                              <div>
                                <div className="font-medium text-slate-900 dark:text-white">{subItem.name}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{subItem.description}</div>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-700 dark:text-slate-300 hover:text-hedera-600 dark:hover:text-hedera-400 font-medium transition-all duration-200 hover:bg-hedera-50/50 dark:hover:bg-hedera-900/20 px-3 py-2 rounded-md inline-flex items-center"
                      >
                        {item.name}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    ) : (
                      <Link href={item.href || '#'} className="inline-block">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`text-slate-700 dark:text-slate-300 hover:text-hedera-600 dark:hover:text-hedera-400 font-medium transition-all duration-200 hover:bg-hedera-50/50 dark:hover:bg-hedera-900/20 ${pathname === item.href ? 'bg-hedera-100/80 dark:bg-hedera-900/40 text-hedera-700 dark:text-hedera-300' : ''
                            }`}
                        >
                          {item.name}
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </motion.div>

              {/* Right Section */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex items-center space-x-2 sm:space-x-4"
              >
                {/* Network Status Indicator */}
                <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-success-50/50 dark:bg-success-900/20 border border-success-200/30 dark:border-success-800/30">
                  <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-success-700 dark:text-success-400">Hedera Testnet</span>
                </div>

                {/* Theme Toggle - Always Visible */}
                <ThemeToggle />

                {/* Connect Wallet Button - Icon only on mobile */}
                <div className="hidden sm:block">
                  <WalletButton />
                </div>
                <div className="block sm:hidden">
                  <WalletButton size="sm" className="px-2" />
                </div>

                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden p-2 hover:bg-hedera-50/50 dark:hover:bg-hedera-900/20 border border-gray-200 dark:border-gray-700"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                  ) : (
                    <Menu className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
}