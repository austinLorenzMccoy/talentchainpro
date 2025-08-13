"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Star,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Send,
  Loader2,
  Building2,
  Trophy,
  TrendingUp
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DashboardWidget } from "./dashboard-widget";
import { useJobPools, useSkillTokens } from "@/hooks/useDashboardData";
import { useAuth } from "@/hooks/useAuth";
import { JobPoolInfo, PoolStatus } from "@/lib/types/wallet";
import { cn } from "@/lib/utils";

interface JobPoolsWidgetProps {
  className?: string;
}

export function JobPoolsWidget({ className }: JobPoolsWidgetProps) {
  const { user } = useAuth();
  const { jobPools, isLoading, error, refetch, applyToPool, leavePool } = useJobPools();
  const { skillTokens } = useSkillTokens();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent"); // recent, salary, applicants

  // Application dialog state
  const [selectedPool, setSelectedPool] = useState<JobPoolInfo | null>(null);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [selectedSkillTokens, setSelectedSkillTokens] = useState<number[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationError, setApplicationError] = useState<string | null>(null);

  // Filter and sort job pools
  const filteredAndSortedPools = useMemo(() => {
    return jobPools
      .filter(pool => {
        const matchesSearch =
          pool.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pool.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" ||
          (statusFilter === "active" && pool.status === PoolStatus.Active) ||
          (statusFilter === "completed" && pool.status === PoolStatus.Completed) ||
          (statusFilter === "paused" && pool.status === PoolStatus.Paused);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "salary":
            return parseFloat(b.salary.replace(/[^\d.]/g, '')) - parseFloat(a.salary.replace(/[^\d.]/g, ''));
          case "applicants":
            return b.applicants.length - a.applicants.length;
          case "recent":
          default:
            return b.createdAt - a.createdAt;
        }
      });
  }, [jobPools, searchTerm, statusFilter, sortBy]);

  const getStatusConfig = (status: PoolStatus) => {
    switch (status) {
      case PoolStatus.Active:
        return {
          label: "Active",
          color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
          icon: CheckCircle2
        };
      case PoolStatus.Completed:
        return {
          label: "Completed",
          color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
          icon: CheckCircle2
        };
      case PoolStatus.Paused:
        return {
          label: "Paused",
          color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
          icon: Clock
        };
      case PoolStatus.Cancelled:
        return {
          label: "Cancelled",
          color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
          icon: XCircle
        };
      default:
        return {
          label: "Unknown",
          color: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
          icon: AlertCircle
        };
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - (timestamp * 1000); // Convert to milliseconds
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const isUserApplied = (pool: JobPoolInfo) => {
    return pool.applicants.includes(user?.accountId || '');
  };

  const canApplyToPool = (pool: JobPoolInfo) => {
      return pool.status === PoolStatus.Active &&
    !isUserApplied(pool) &&
    user?.accountId !== pool.company;
  };

  const handleApplyToPool = async () => {
    if (!selectedPool || selectedSkillTokens.length === 0) return;

    setIsApplying(true);
    setApplicationError(null);

    try {
      const result = await applyToPool(selectedPool.id, selectedSkillTokens);

      if (result.success) {
        setIsApplicationDialogOpen(false);
        setSelectedPool(null);
        setSelectedSkillTokens([]);
        refetch(); // Refresh the pools list
      } else {
        setApplicationError(result.error || 'Failed to apply to job pool');
      }
    } catch (err) {
      setApplicationError(err instanceof Error ? err.message : 'Failed to apply to job pool');
    } finally {
      setIsApplying(false);
    }
  };

  const handleLeavePool = async (poolId: number) => {
    try {
      const result = await leavePool(poolId);
      if (result.success) {
        refetch(); // Refresh the pools list
      }
    } catch (err) {
      console.error('Failed to leave pool:', err);
    }
  };

  const openApplicationDialog = (pool: JobPoolInfo) => {
    setSelectedPool(pool);
    setSelectedSkillTokens([]);
    setApplicationError(null);
    setIsApplicationDialogOpen(true);
  };

  return (
    <DashboardWidget
      title="Job Opportunities"
      description="Browse and apply to blockchain talent opportunities"
      icon={Briefcase}
      className={className}
      headerActions={
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" onClick={refetch} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <TrendingUp className="w-4 h-4" />
            )}
          </Button>
          <Button size="sm" className="bg-hedera-600 hover:bg-hedera-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Create Pool</span>
          </Button>
        </div>
      }
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search companies or job descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-32">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recent</SelectItem>
            <SelectItem value="salary">Salary</SelectItem>
            <SelectItem value="applicants">Applicants</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Job Pools List */}
      {isLoading && jobPools.length === 0 ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2" />
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-32" />
                </div>
                <div className="w-20 h-6 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full mb-2" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <p className="text-red-600 dark:text-red-400 font-medium mb-2">Failed to load job pools</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            Try Again
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedPools.map((pool, index) => {
              const statusConfig = getStatusConfig(pool.status);
              const StatusIcon = statusConfig.icon;
              const userApplied = isUserApplied(pool);
              const canApply = canApplyToPool(pool);

              return (
                <motion.div
                  key={pool.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="group hover:shadow-lg hover:border-hedera-300 dark:hover:border-hedera-600 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4 flex-1 min-w-0">
                          {/* Company Icon */}
                          <div className="w-12 h-12 bg-gradient-to-br from-hedera-100 to-hedera-200 dark:from-hedera-800/30 dark:to-hedera-700/30 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-6 h-6 text-hedera-600 dark:text-hedera-400" />
                          </div>

                          {/* Job Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-hedera-600 dark:group-hover:text-hedera-400 transition-colors truncate">
                                {pool.company}
                              </h3>
                              <Badge className={cn("text-xs", statusConfig.color)}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                            </div>

                            <p className="text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                              {pool.description}
                            </p>

                            {/* Job Details */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                              <div className="flex items-center space-x-1">
                                <DollarSign className="w-4 h-4" />
                                <span>{pool.salary}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Users className="w-4 h-4" />
                                <span>{pool.applicants.length} applicants</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatTimeAgo(pool.createdAt)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Trophy className="w-4 h-4" />
                                <span>{pool.requiredSkills.length} skills needed</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {userApplied ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLeavePool(pool.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Leave
                            </Button>
                          ) : canApply ? (
                            <Button
                              size="sm"
                              onClick={() => openApplicationDialog(pool)}
                              className="bg-hedera-600 hover:bg-hedera-700 text-white"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Apply
                            </Button>
                          ) : null}

                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Required Skills */}
                      {pool.requiredSkills.length > 0 && (
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                            <Star className="w-4 h-4" />
                            <span>Required Skills:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {pool.requiredSkills.slice(0, 3).map((skillId, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                Skill #{skillId}
                              </Badge>
                            ))}
                            {pool.requiredSkills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{pool.requiredSkills.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Empty State */}
          {filteredAndSortedPools.length === 0 && !isLoading && !error && (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {jobPools.length === 0 ? "No job pools available" : "No pools match your filters"}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {jobPools.length === 0
                  ? "Check back later for new opportunities or create your own job pool"
                  : "Try adjusting your search terms or filters"
                }
              </p>
              {jobPools.length === 0 ? (
                <Button className="bg-hedera-600 hover:bg-hedera-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Job Pool
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setSortBy("recent");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Application Dialog */}
      <Dialog open={isApplicationDialogOpen} onOpenChange={setIsApplicationDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply to Job Pool</DialogTitle>
            <DialogDescription>
              Select your skill tokens to demonstrate your qualifications for this position
            </DialogDescription>
          </DialogHeader>

          {selectedPool && (
            <div className="space-y-4">
              {/* Pool Info */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                  {selectedPool.company}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  {selectedPool.description}
                </p>
                <div className="flex items-center space-x-4 text-xs text-slate-500">
                  <span>💰 {selectedPool.salary}</span>
                  <span>👥 {selectedPool.applicants.length} applicants</span>
                </div>
              </div>

              {/* Required Skills */}
              <div>
                <h5 className="font-medium text-slate-900 dark:text-white mb-2">
                  Required Skills:
                </h5>
                <div className="flex flex-wrap gap-2">
                  {selectedPool.requiredSkills.map((skillId) => (
                    <Badge key={skillId} variant="outline">
                      Skill #{skillId}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Skill Token Selection */}
              <div>
                <h5 className="font-medium text-slate-900 dark:text-white mb-3">
                  Select Your Skills:
                </h5>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {skillTokens.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                      You need to create skill tokens before applying to jobs
                    </p>
                  ) : (
                    skillTokens.map((skill) => (
                      <div key={skill.tokenId} className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        <Checkbox
                          id={`skill-${skill.tokenId}`}
                          checked={selectedSkillTokens.includes(skill.tokenId)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSkillTokens(prev => [...prev, skill.tokenId]);
                            } else {
                              setSelectedSkillTokens(prev => prev.filter(id => id !== skill.tokenId));
                            }
                          }}
                        />
                        <label htmlFor={`skill-${skill.tokenId}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-900 dark:text-white">
                              {skill.category}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Level {skill.level}
                            </Badge>
                          </div>
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Error Display */}
              {applicationError && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-sm text-red-600 dark:text-red-400">{applicationError}</p>
                  </div>
                </div>
              )}

              {/* Apply Button */}
              <Button
                onClick={handleApplyToPool}
                disabled={selectedSkillTokens.length === 0 || isApplying || skillTokens.length === 0}
                className="w-full bg-hedera-600 hover:bg-hedera-700"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Apply with {selectedSkillTokens.length} skill{selectedSkillTokens.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardWidget>
  );
}

export default JobPoolsWidget;