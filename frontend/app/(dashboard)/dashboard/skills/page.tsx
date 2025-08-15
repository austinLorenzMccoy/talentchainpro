"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Search,
  Filter,
  ArrowUpRight,
  Edit3,
  ExternalLink,
  Star,
  Award,
  BookOpen,
  Target,
  TrendingUp,
  Plus
} from "lucide-react";
import { Card, CardContent, } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { SkillTokenInfo } from "@/lib/types/wallet";
import { ContractCreateSkillDialog } from "@/components/skills/contract-create-skill-dialog";
import { UpdateSkillTokenDialog } from "@/components/skills/update-skill-token-dialog";
import { ViewSkillTokenDialog } from "@/components/skills/view-skill-token-dialog";
import { WalletConnectionPrompt } from "@/components/dashboard/wallet-connection-prompt";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data - will be replaced with real API calls
const mockSkillTokens: SkillTokenInfo[] = [
  {
    tokenId: 1,
    category: "React Development",
    level: 8,
    uri: "ipfs://QmReactSkill123",
    owner: "0.0.123456"
  },
  {
    tokenId: 2,
    category: "Smart Contracts",
    level: 6,
    uri: "ipfs://QmSolidity456",
    owner: "0.0.123456"
  },
  {
    tokenId: 3,
    category: "UI/UX Design",
    level: 7,
    uri: "ipfs://QmDesign789",
    owner: "0.0.123456"
  },
  {
    tokenId: 4,
    category: "Node.js",
    level: 9,
    uri: "ipfs://QmNodeJS321",
    owner: "0.0.123456"
  },
  {
    tokenId: 5,
    category: "Python",
    level: 5,
    uri: "ipfs://QmPython654",
    owner: "0.0.123456"
  },
  {
    tokenId: 6,
    category: "DevOps",
    level: 4,
    uri: "ipfs://QmDevOps987",
    owner: "0.0.123456"
  }
];

const skillCategories = [
  "Frontend Development",
  "Backend Development",
  "Smart Contracts",
  "UI/UX Design",
  "DevOps",
  "Data Science",
  "Mobile Development",
  "Game Development",
  "Cybersecurity",
  "Project Management"
];

export default function SkillsPage() {
  const { user, isConnected } = useAuth();
  const [skills, setSkills] = useState<SkillTokenInfo[]>(mockSkillTokens);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isConnected && user) {
      fetchUserSkills();
    }
  }, [isConnected, user]);

  if (!isConnected) {
    return (
      <WalletConnectionPrompt
        title="Connect to Manage Skills"
        description="Connect your Hedera wallet to create and manage your skill tokens."
      />
    );
  }

  const fetchUserSkills = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with real API call
      // const userSkills = await getUserSkillTokens(user.accountId);
      // setSkills(userSkills);
    } catch (error) {
      console.error('Failed to fetch skills:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSkillLevelColor = (level: number) => {
    if (level >= 8) return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", border: "border-green-200 dark:border-green-800" };
    if (level >= 6) return { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" };
    if (level >= 4) return { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", border: "border-yellow-200 dark:border-yellow-800" };
    return { bg: "bg-gray-100 dark:bg-gray-900/30", text: "text-gray-700 dark:text-gray-300", border: "border-gray-200 dark:border-gray-800" };
  };

  const getSkillIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('react') || lower.includes('frontend')) return <BookOpen className="w-5 h-5" />;
    if (lower.includes('smart') || lower.includes('contract')) return <Award className="w-5 h-5" />;
    if (lower.includes('design') || lower.includes('ui')) return <Target className="w-5 h-5" />;
    return <Trophy className="w-5 h-5" />;
  };

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || skill.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const averageLevel = skills.length > 0 ? skills.reduce((acc, skill) => acc + skill.level, 0) / skills.length : 0;

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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Your Skills 🏆
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Manage your blockchain-verified skill tokens
                </p>
              </div>

              <ContractCreateSkillDialog />
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Skills</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{skills.length}</p>
                </div>
                <Trophy className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Average Level</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{averageLevel.toFixed(1)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Expert Level</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {skills.filter(s => s.level >= 8).length}
                  </p>
                </div>
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Categories</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {new Set(skills.map(s => s.category)).size}
                  </p>
                </div>
                <Award className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {skillCategories.map((category) => (
                <SelectItem key={category} value={category.toLowerCase()}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSkills.map((skill, index) => {
            const colorConfig = getSkillLevelColor(skill.level);

            return (
              <motion.div
                key={skill.tokenId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 ${colorConfig.bg} ${colorConfig.border} border rounded-lg flex items-center justify-center`}>
                          <div className={colorConfig.text}>
                            {getSkillIcon(skill.category)}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-hedera-600 transition-colors">
                            {skill.category}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Token #{skill.tokenId}
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-hedera-600 transition-colors" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Skill Level</span>
                        <Badge className={`${colorConfig.bg} ${colorConfig.text} border-0`}>
                          Level {skill.level}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Progress</span>
                          <span className="text-slate-900 dark:text-white">{skill.level * 10}%</span>
                        </div>
                        <Progress value={skill.level * 10} className="h-2" />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <UpdateSkillTokenDialog 
                        skill={skill}
                        onSkillUpdated={(updatedSkill) => {
                          setSkills(prev => prev.map(s => 
                            s.tokenId === updatedSkill.tokenId ? updatedSkill : s
                          ));
                        }}
                      />
                      <ViewSkillTokenDialog skill={skill} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filteredSkills.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No skills found
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {searchTerm || selectedCategory !== "all"
                ? "Try adjusting your search or filters"
                : "Create your first skill token to get started"
              }
            </p>
            {!searchTerm && selectedCategory === "all" && (
              <ContractCreateSkillDialog
                triggerButton={
                  <Button className="bg-hedera-600 hover:bg-hedera-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Skill
                  </Button>
                }
                onSkillCreated={(skillData) => {
                  console.log('New skill created:', skillData);
                  // In a real app, this would refresh the skills list
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}