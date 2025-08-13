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

// Dashboard page component with sophisticated architecture
export default function DashboardPage({ }: DashboardPageProps) {
  const { isConnected } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-hedera-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-hedera-950/30">
      <div className="container-wide mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 space-y-8">
        {/* Dashboard Overview Section */}
        <DashboardOverview />

        {/* Main Dashboard Grid */}
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8"
          >
            {/* Left Column - Skills Management */}
            <div className="xl:col-span-2 space-y-6 lg:space-y-8">
              <SkillTokensWidget />
            </div>

            {/* Right Column - Job Opportunities */}
            <div className="space-y-6 lg:space-y-8">
              <JobPoolsWidget />
            </div>
          </motion.div>
        )}

        {/* Additional Dashboard Sections */}
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8"
          >
            {/* AI Reputation Tracking */}
            <ReputationWidget />

            {/* Blockchain Transaction History */}
            <TransactionHistoryWidget />
          </motion.div>
        )}
      </div>
    </div>
  );
}

