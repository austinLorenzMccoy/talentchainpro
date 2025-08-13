"use client";

import { motion } from "framer-motion";
import { LucideIcon, Trophy, Clock, CheckCircle, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  gradient?: string;
  iconBg?: string;
  iconColor?: string;
  delay?: number;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  gradient = "from-blue-400 to-blue-600",
  iconBg = "bg-blue-100 dark:bg-blue-900/30",
  iconColor = "text-blue-600 dark:text-blue-400",
  delay = 0,
  className,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm h-full">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
          <div className="absolute inset-0 bg-gradient-to-br from-current/5 to-transparent" />
        </div>

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-hedera-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardContent className="p-5 sm:p-6 h-full flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              {/* Title */}
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 truncate">
                {title}
              </p>

              {/* Value */}
              <div className="flex items-baseline space-x-3 mb-3">
                <motion.p
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: delay + 0.2 }}
                  className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight"
                >
                  {value}
                </motion.p>

                {/* Trend Indicator */}
                {trend && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: delay + 0.3 }}
                    className={cn(
                      "text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap",
                      trend.isPositive
                        ? "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30"
                        : "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30"
                    )}
                  >
                    {trend.isPositive ? "+" : ""}{trend.value}%
                  </motion.div>
                )}
              </div>

              {/* Description */}
              {description && (
                <p className="text-sm text-slate-500 dark:text-slate-500 leading-relaxed mb-2">
                  {description}
                </p>
              )}

              {/* Trend Label */}
              {trend && (
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-auto">
                  {trend.label}
                </p>
              )}
            </div>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, delay: delay + 0.1, type: "spring" }}
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                iconBg
              )}
            >
              <Icon className={cn("w-6 h-6", iconColor)} />
            </motion.div>
          </div>

          {/* Bottom Border Accent */}
          <div className={cn(
            "absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r",
            gradient
          )} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Pre-configured stats cards for common dashboard metrics
 */
export function SkillTokensStatsCard({
  value,
  trend,
  delay = 0,
  className
}: {
  value: number;
  trend?: { value: number; label: string; isPositive: boolean };
  delay?: number;
  className?: string;
}) {
  return (
    <StatsCard
      title="Skill Tokens"
      value={value}
      icon={Trophy}
      description="Verified blockchain credentials"
      trend={trend}
      gradient="from-blue-400 to-blue-600"
      iconBg="bg-blue-100 dark:bg-blue-900/30"
      iconColor="text-blue-600 dark:text-blue-400"
      delay={delay}
      className={className}
    />
  );
}

export function ActiveApplicationsStatsCard({
  value,
  trend,
  delay = 0,
  className
}: {
  value: number;
  trend?: { value: number; label: string; isPositive: boolean };
  delay?: number;
  className?: string;
}) {
  return (
    <StatsCard
      title="Active Applications"
      value={value}
      icon={Clock}
      description="Pending job applications"
      trend={trend}
      gradient="from-orange-400 to-orange-600"
      iconBg="bg-orange-100 dark:bg-orange-900/30"
      iconColor="text-orange-600 dark:text-orange-400"
      delay={delay}
      className={className}
    />
  );
}

export function CompletedMatchesStatsCard({
  value,
  trend,
  delay = 0,
  className
}: {
  value: number;
  trend?: { value: number; label: string; isPositive: boolean };
  delay?: number;
  className?: string;
}) {
  return (
    <StatsCard
      title="Completed Matches"
      value={value}
      icon={CheckCircle}
      description="Successful job matches"
      trend={trend}
      gradient="from-green-400 to-green-600"
      iconBg="bg-green-100 dark:bg-green-900/30"
      iconColor="text-green-600 dark:text-green-400"
      delay={delay}
      className={className}
    />
  );
}

export function ReputationStatsCard({
  value,
  trend,
  delay = 0,
  className
}: {
  value: number;
  trend?: { value: number; label: string; isPositive: boolean };
  delay?: number;
  className?: string;
}) {
  return (
    <StatsCard
      title="Reputation Score"
      value={`${value}%`}
      icon={Star}
      description="AI-verified professional score"
      trend={trend}
      gradient="from-purple-400 to-purple-600"
      iconBg="bg-purple-100 dark:bg-purple-900/30"
      iconColor="text-purple-600 dark:text-purple-400"
      delay={delay}
      className={className}
    />
  );
}

export default StatsCard;