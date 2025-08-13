"use client";

import { motion } from "framer-motion";
import { RefreshCw, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  SkillTokensStatsCard,
  ActiveApplicationsStatsCard,
  CompletedMatchesStatsCard,
  ReputationStatsCard,
} from "./stats-card";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/hooks/useAuth";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { cn } from "@/lib/utils";

interface DashboardOverviewProps {
  className?: string;
}

export function DashboardOverview({ className }: DashboardOverviewProps) {
  const { user, isConnected } = useAuth();
  const { stats, isLoading, error, refetch, lastUpdated } = useDashboardData();
  const { isConnected: realtimeConnected, connectionStatus } = useRealTimeUpdates();

  // Show connection prompt if not connected
  if (!isConnected) {
    return (
      <div className={cn("space-y-6", className)}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Connect your Hedera wallet to access your TalentChain Pro dashboard and manage your professional identity.
          </p>
          <Button className="bg-hedera-600 hover:bg-hedera-700">
            Connect Wallet
          </Button>
        </motion.div>
      </div>
    );
  }

  // Show loading state
  if (isLoading && !stats) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Header Skeleton */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-64 mb-2 animate-pulse" />
          <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-96 animate-pulse" />
        </motion.div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-2 animate-pulse" />
                  <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16 animate-pulse" />
                </div>
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-32 animate-pulse" />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 sm:space-y-8", className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
            Welcome back! 👋
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600 dark:text-slate-400">
            <span>Here's your TalentChain Pro overview</span>
            <div className="flex items-center gap-4">
              {/* Real-time Connection Status */}
              <div className="flex items-center gap-2">
                {realtimeConnected ? (
                  <Wifi className="w-4 h-4 text-success-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-slate-400" />
                )}
                <span className={cn(
                  "text-xs",
                  realtimeConnected ? "text-success-600 dark:text-success-400" : "text-slate-500"
                )}>
                  {connectionStatus === 'connected' && 'Live'}
                  {connectionStatus === 'connecting' && 'Connecting...'}
                  {connectionStatus === 'disconnected' && 'Offline'}
                  {connectionStatus === 'error' && 'Error'}
                </span>
              </div>

              {/* Last Updated */}
              {lastUpdated && (
                <div className="flex items-center gap-2">
                  <span>Updated {lastUpdated.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Network Status */}
          <Badge
            variant="outline"
            className="bg-success-50/50 dark:bg-success-900/20 border-success-200/30 dark:border-success-800/30 text-success-700 dark:text-success-400"
          >
            <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse mr-2" />
            Hedera Network
          </Badge>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
            className="hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              {error}
              <Button
                variant="link"
                size="sm"
                onClick={refetch}
                className="p-0 ml-2 h-auto text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SkillTokensStatsCard
            value={stats.totalSkillTokens}
            trend={
              stats.totalSkillTokens > 0
                ? { value: 12, label: "vs last month", isPositive: true }
                : undefined
            }
            delay={0.1}
          />

          <ActiveApplicationsStatsCard
            value={stats.activeApplications}
            trend={
              stats.activeApplications > 0
                ? { value: 8, label: "new this week", isPositive: true }
                : undefined
            }
            delay={0.2}
          />

          <CompletedMatchesStatsCard
            value={stats.completedMatches}
            trend={
              stats.completedMatches > 0
                ? { value: 25, label: "success rate", isPositive: true }
                : undefined
            }
            delay={0.3}
          />

          <ReputationStatsCard
            value={Math.round(stats.reputationScore)}
            trend={
              stats.reputationScore > 0
                ? {
                  value: Math.round(stats.reputationScore / 10),
                  label: "points this month",
                  isPositive: true
                }
                : undefined
            }
            delay={0.4}
          />
        </div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex flex-wrap gap-3"
      >
        <Button className="bg-hedera-600 hover:bg-hedera-700 text-white">
          Create Skill Token
        </Button>
        <Button variant="outline" className="hover:bg-slate-50 dark:hover:bg-slate-800">
          Browse Jobs
        </Button>
        <Button variant="outline" className="hover:bg-slate-50 dark:hover:bg-slate-800">
          Submit Work for Evaluation
        </Button>
      </motion.div>

      {/* Pro Tip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-gradient-to-r from-hedera-50 to-pink-50 dark:from-hedera-950/20 dark:to-pink-950/20 rounded-xl p-6 border border-hedera-200/50 dark:border-hedera-800/50"
      >
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-gradient-to-br from-hedera-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">💡</span>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
              Pro Tip: Maximize Your Reputation
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Regularly submit your work for AI evaluation to increase your skill levels and reputation score.
              Higher reputation scores lead to better job matches and higher earning potential.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default DashboardOverview;