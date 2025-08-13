"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Menu, Bell, Search, CheckCircle, AlertCircle, Info, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import WalletButton from "@/components/wallet/wallet-button";

interface TopNavigationProps {
  onSidebarToggle: () => void;
  sidebarCollapsed: boolean;
}

// Mock notification data - replace with real data from your backend
const notifications = [
  {
    id: 1,
    type: 'success',
    title: 'Skill Token Created',
    message: 'Your Blockchain Development skill token has been successfully minted',
    time: '2 minutes ago',
    read: false
  },
  {
    id: 2,
    type: 'info',
    title: 'New Job Opportunity',
    message: 'A new Smart Contract Developer position matches your skills',
    time: '1 hour ago',
    read: false
  },
  {
    id: 3,
    type: 'warning',
    title: 'Reputation Update',
    message: 'Your AI reputation score has been updated based on recent work',
    time: '3 hours ago',
    read: true
  },
  {
    id: 4,
    type: 'success',
    title: 'Application Submitted',
    message: 'Your application for Senior Developer at TechCorp has been submitted',
    time: '1 day ago',
    read: true
  }
];

export function TopNavigation({ onSidebarToggle, sidebarCollapsed }: TopNavigationProps) {
  const router = useRouter();

  const handleViewAllNotifications = () => {
    router.push('/dashboard/notifications');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs font-bold"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
            <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} unread
                  </Badge>
                )}
              </div>
            </div>

            <div className="py-1">
              {notifications.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <Bell className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No notifications yet
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-3 px-3 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800",
                      !notification.read && "bg-hedera-50/50 dark:bg-hedera-900/20"
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm font-medium leading-tight",
                          !notification.read
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-700 dark:text-slate-300"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-hedera-500 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 dark:text-slate-500">
                        <Clock className="w-3 h-3" />
                        {notification.time}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="px-3 py-2">
                  <Button variant="ghost" onClick={handleViewAllNotifications} size="sm" className="w-full text-xs text-hedera-600 dark:text-hedera-400 hover:text-hedera-700 dark:hover:text-hedera-300">
                    View all notifications
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Wallet button */}
        <WalletButton size="sm" />
      </div>
    </motion.div>
  );
}

