"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Trophy, 
  Briefcase, 
  Clock, 
  CheckCircle, 
  Plus,
  ArrowUpRight,
  Star,
  Users,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useHederaWallet } from "@/hooks/useHederaWallet";
import { DashboardStats, UserProfile, SkillTokenInfo, JobPoolInfo } from "@/lib/types/wallet";

interface DashboardPageProps {}

// Mock data - will be replaced with real API calls
const mockStats: DashboardStats = {
  totalSkillTokens: 8,
  totalJobPools: 12,
  activeApplications: 3,
  completedMatches: 2,
  reputationScore: 87,
};

const mockSkillTokens: SkillTokenInfo[] = [
  {
    tokenId: 1,
    category: "React Development",
    level: 8,
    uri: "ipfs://...",
    owner: "0.0.123456"
  },
  {
    tokenId: 2,
    category: "Smart Contracts",
    level: 6,
    uri: "ipfs://...",
    owner: "0.0.123456"
  },
  {
    tokenId: 3,
    category: "UI/UX Design",
    level: 7,
    uri: "ipfs://...",
    owner: "0.0.123456"
  },
];

const mockActiveApplications = [
  {
    id: 1,
    company: "DeFi Protocol",
    position: "Senior Frontend Developer",
    salary: "120,000 HBAR",
    status: "Under Review",
    appliedAt: "2024-01-10"
  },
  {
    id: 2,
    company: "Hedera Foundation",
    position: "Blockchain Developer",
    salary: "150,000 HBAR",
    status: "Interview Scheduled",
    appliedAt: "2024-01-08"
  }
];

export default function DashboardPage({}: DashboardPageProps) {
  const { wallet, isConnected } = useHederaWallet();
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [skillTokens, setSkillTokens] = useState<SkillTokenInfo[]>(mockSkillTokens);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isConnected && wallet) {
      // TODO: Fetch real data from backend
      fetchDashboardData();
    }
  }, [isConnected, wallet]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with real API calls
      // const userStats = await getUserStats(wallet.accountId);
      // const userSkills = await getUserSkillTokens(wallet.accountId);
      // setStats(userStats);
      // setSkillTokens(userSkills);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSkillLevelColor = (level: number) => {
    if (level >= 8) return "text-green-600 bg-green-100";
    if (level >= 6) return "text-blue-600 bg-blue-100";
    if (level >= 4) return "text-yellow-600 bg-yellow-100";
    return "text-gray-600 bg-gray-100";
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
              <CardDescription>
                Connect your wallet to access your TalentChain Pro dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                You need to connect a Hedera-compatible wallet to view your skills, applications, and manage your professional profile.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Welcome back! 👋
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Here's your TalentChain Pro overview
            </p>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Skill Tokens</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {stats.totalSkillTokens}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Active Applications</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {stats.activeApplications}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                    <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Completed Matches</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {stats.completedMatches}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-green-400 to-green-600" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Reputation Score</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {stats.reputationScore}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <Progress value={stats.reputationScore} className="mt-2" />
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-purple-400 to-purple-600" />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Skill Tokens */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Trophy className="w-5 h-5 text-blue-600" />
                        <span>Your Skills</span>
                      </CardTitle>
                      <CardDescription>
                        Manage and showcase your verified skill tokens
                      </CardDescription>
                    </div>
                    <Button size="sm" className="bg-hedera-600 hover:bg-hedera-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Skill
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {skillTokens.map((skill, index) => (
                    <motion.div
                      key={skill.tokenId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-white">
                            {skill.category}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Token ID: {skill.tokenId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={`font-medium ${getSkillLevelColor(skill.level)}`}>
                          Level {skill.level}
                        </Badge>
                        <ArrowUpRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Briefcase className="w-5 h-5 text-green-600" />
                    <span>Active Applications</span>
                  </CardTitle>
                  <CardDescription>
                    Track your job applications and status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockActiveApplications.map((application, index) => (
                    <motion.div
                      key={application.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-hedera-300 dark:hover:border-hedera-600 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-slate-900 dark:text-white text-sm">
                          {application.position}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {application.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                        {application.company}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                        {application.salary}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        Applied {application.appliedAt}
                      </p>
                    </motion.div>
                  ))}
                  
                  <Button variant="outline" className="w-full mt-4">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Browse Jobs
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>
                Your latest blockchain transactions and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No recent transactions</p>
                <p className="text-sm">Start by creating a skill token or applying to jobs</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}