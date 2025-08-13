"use client";

import { motion } from "framer-motion";
import {
  DashboardOverview,
  SkillTokensWidget,
  JobPoolsWidget,
  ReputationWidget,
  TransactionHistoryWidget
} from "@/components/dashboard";
import { useAuth } from "@/hooks/useAuth";

interface DashboardPageProps { }

// Dashboard page component with proper sidebar layout
export default function DashboardPage({ }: DashboardPageProps) {
  const { isConnected } = useAuth();

  return (
    <div className="w-full">
      {/* Dashboard Container - No centering, works with sidebar */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">

        {/* Dashboard Overview Section - Full Width */}
        <div className="mb-8 lg:mb-12">
          <DashboardOverview />
        </div>

        {/* Main Dashboard Content - Only show when connected */}
        {isConnected ? (
          <div className="space-y-8 lg:space-y-12">

            {/* Primary Dashboard Grid - Skills and Jobs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8"
            >
              {/* Skills Management - Takes up more space */}
              <div className="xl:col-span-8 space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <SkillTokensWidget />
                </div>
              </div>

              {/* Job Opportunities - Sidebar style */}
              <div className="xl:col-span-4 space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <JobPoolsWidget />
                </div>
              </div>
            </motion.div>

            {/* Secondary Dashboard Grid - Reputation and Transactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8"
            >
              {/* AI Reputation Tracking */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <ReputationWidget />
              </div>

              {/* Blockchain Transaction History */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <TransactionHistoryWidget />
              </div>
            </motion.div>

          </div>
        ) : (
          /* Connection Prompt - Centered when not connected */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center min-h-[60vh]"
          >
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-hedera-100 to-hedera-200 dark:from-hedera-900/30 dark:to-hedera-800/30 rounded-full flex items-center justify-center">
                <div className="w-10 h-10 bg-gradient-to-br from-hedera-500 to-hedera-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Connect Your Wallet
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Connect your Hedera wallet to access your TalentChain Pro dashboard and start building your professional reputation.
              </p>
              <div className="inline-flex items-center gap-2 text-sm text-hedera-600 dark:text-hedera-400">
                <div className="w-2 h-2 bg-hedera-500 rounded-full animate-pulse"></div>
                Waiting for wallet connection...
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}

