"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Trophy, Briefcase, Users, Settings, X, LogOut, User, ChevronLeft, ChevronRight, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    isDesktop: boolean;
}

const navigation = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Overview & analytics'
    },
    {
        name: 'Skills',
        href: '/dashboard/skills',
        icon: Trophy,
        description: 'Manage skill tokens'
    },
    {
        name: 'Jobs',
        href: '/dashboard/jobs',
        icon: Briefcase,
        description: 'Browse opportunities'
    },
    {
        name: 'Companies',
        href: '/dashboard/companies',
        icon: Users,
        description: 'Company profiles'
    },
    {
        name: 'Notifications',
        href: '/dashboard/notifications',
        icon: Bell,
        description: 'View all notifications'
    },
    {
        name: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
        description: 'Account settings'
    },
];

export function Sidebar({ isOpen, onToggle, onClose, isCollapsed, onToggleCollapse, isDesktop }: SidebarProps) {
    const pathname = usePathname();
    const { user, disconnectWallet } = useAuth();

    const handleSignOut = async () => {
        await disconnectWallet();
    };

    const handleNavClick = () => {
        // Close mobile sidebar when navigation link is clicked
        if (!isDesktop) {
            onClose();
        }
    };

    // Determine sidebar visibility and position based on screen size
    const getSidebarTransform = () => {
        if (isDesktop) {
            // Desktop: always visible, just change width
            return { x: 0, width: isCollapsed ? 80 : 280 };
        } else {
            // Mobile: slide in/out
            return { x: isOpen ? 0 : -280, width: 280 };
        }
    };

    const sidebarTransform = getSidebarTransform();

    return (
        <>
            {/* Mobile overlay - only show on mobile when sidebar is open */}
            <AnimatePresence>
                {!isDesktop && isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.div
                initial={false}
                animate={sidebarTransform}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={cn(
                    "fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800",
                    "flex flex-col h-full",
                    // Shadow only on mobile or when not collapsed on desktop
                    isDesktop ? "shadow-none" : "shadow-xl"
                )}
            >
                {/* Header */}
                <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-3 min-w-0" onClick={handleNavClick}>
                        <Logo size={isCollapsed ? "sm" : "md"} showText={!isCollapsed} showSubtitle={false} />
                    </Link>

                    {/* Desktop collapse toggle button */}
                    {isDesktop && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onToggleCollapse}
                            className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            {isCollapsed ? (
                                <ChevronRight className="ml-8 h-4 w-4" />
                            ) : (
                                <ChevronLeft className="h-4 w-4" />
                            )}
                        </Button>
                    )}

                    {/* Mobile close button */}
                    {!isDesktop && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={handleNavClick}
                                className={cn(
                                    "group flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200",
                                    "hover:bg-slate-100 dark:hover:bg-slate-800",
                                    isActive
                                        ? 'bg-hedera-100 dark:bg-hedera-900/50 text-hedera-700 dark:text-hedera-300 shadow-sm'
                                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "flex-shrink-0 h-5 w-5 transition-colors",
                                        isActive
                                            ? 'text-hedera-600 dark:text-hedera-400'
                                            : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                                    )}
                                />
                                {!isCollapsed && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="ml-3 min-w-0 flex-1"
                                    >
                                        <span className="truncate">{item.name}</span>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {item.description}
                                        </p>
                                    </motion.div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User info */}
                <div className="border-t border-slate-200 dark:border-slate-800 p-3">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-white" />
                        </div>
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex-1 min-w-0"
                            >
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                    {user?.accountId || 'Not connected'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {user?.balance || '0'} ℏ
                                </p>
                            </motion.div>
                        )}
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-shrink-0"
                            >
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSignOut}
                                    className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-red-600"
                                >
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </>
    );
}