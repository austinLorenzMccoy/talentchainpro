"use client";

import { motion } from "framer-motion";
import { Menu, Bell, User, Search, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import WalletButton from "@/components/wallet/wallet-button";
import { useAuth } from "@/hooks/useAuth";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopNavigationProps {
    onSidebarToggle: () => void;
    sidebarCollapsed: boolean;
}

export function TopNavigation({ onSidebarToggle, sidebarCollapsed }: TopNavigationProps) {
    const { user, disconnectWallet } = useAuth();

    const handleSignOut = async () => {
        await disconnectWallet();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-6 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-4 sm:px-6"
        >
            {/* Mobile menu button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onSidebarToggle}
                className="lg:hidden h-9 w-9 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open sidebar</span>
            </Button>

            {/* Search */}
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <div className="flex flex-1 items-center">
                    <div className="relative w-full max-w-lg">
                        <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 h-5 w-5 text-slate-400" />
                        <Input
                            type="search"
                            placeholder="Search skills, jobs, companies..."
                            className="w-full pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-hedera-500"
                        />
                    </div>
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-x-4 lg:gap-x-6">
                {/* Notifications */}
                <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
                    <Bell className="h-5 w-5" />
                    <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                        3
                    </Badge>
                </Button>

                {/* Wallet button */}
                <WalletButton size="sm" />
            </div>
        </motion.div>
    );
}

