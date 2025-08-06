"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Trophy, 
  Plus, 
  Search, 
  Filter,
  ArrowUpRight,
  Edit3,
  ExternalLink,
  Star,
  Award,
  BookOpen,
  Target,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useHederaWallet } from "@/hooks/useHederaWallet";
import { SkillTokenInfo } from "@/lib/types/wallet";

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
  const { wallet, isConnected } = useHederaWallet();
  const [skills, setSkills] = useState<SkillTokenInfo[]>(mockSkillTokens);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for creating new skill
  const [newSkill, setNewSkill] = useState({
    category: "",
    customCategory: "",
    initialLevel: 1,
    evidence: "",
    description: ""
  });

  useEffect(() => {
    if (isConnected && wallet) {
      fetchUserSkills();
    }
  }, [isConnected, wallet]);

  const fetchUserSkills = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with real API call
      // const userSkills = await getUserSkillTokens(wallet.accountId);
      // setSkills(userSkills);
    } catch (error) {
      console.error('Failed to fetch skills:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSkill = async () => {
    setIsLoading(true);
    try {
      const skillData = {
        category: newSkill.category === "custom" ? newSkill.customCategory : newSkill.category,
        level: newSkill.initialLevel,
        uri: `ipfs://skill-${Date.now()}`, // Temporary URI
        evidence: newSkill.evidence,
        description: newSkill.description
      };

      // TODO: Implement skill creation via smart contract
      // const result = await createSkillToken(skillData);
      
      console.log('Creating skill token:', skillData);
      
      // Mock success
      const newSkillToken: SkillTokenInfo = {
        tokenId: skills.length + 1,
        category: skillData.category,
        level: skillData.level,
        uri: skillData.uri,
        owner: wallet?.accountId || ""
      };
      
      setSkills([...skills, newSkillToken]);
      setIsCreateDialogOpen(false);
      
      // Reset form
      setNewSkill({
        category: "",
        customCategory: "",
        initialLevel: 1,
        evidence: "",
        description: ""
      });
      
    } catch (error) {
      console.error('Failed to create skill:', error);
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
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-hedera-600 hover:bg-hedera-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Skill Token
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Skill Token</DialogTitle>
                    <DialogDescription>
                      Mint a new soulbound token representing your skill
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Skill Category</Label>
                      <Select value={newSkill.category} onValueChange={(value) => setNewSkill({...newSkill, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a skill category" />
                        </SelectTrigger>
                        <SelectContent>
                          {skillCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Custom Category</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {newSkill.category === "custom" && (
                      <div className="space-y-2">
                        <Label htmlFor="customCategory">Custom Category</Label>
                        <Input
                          id="customCategory"
                          value={newSkill.customCategory}
                          onChange={(e) => setNewSkill({...newSkill, customCategory: e.target.value})}
                          placeholder="Enter custom skill category"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="level">Initial Level (1-10)</Label>
                      <Select value={newSkill.initialLevel.toString()} onValueChange={(value) => setNewSkill({...newSkill, initialLevel: parseInt(value)})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({length: 10}, (_, i) => i + 1).map((level) => (
                            <SelectItem key={level} value={level.toString()}>
                              Level {level} - {level <= 3 ? 'Beginner' : level <= 6 ? 'Intermediate' : level <= 8 ? 'Advanced' : 'Expert'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="evidence">Evidence/Portfolio Links</Label>
                      <Textarea
                        id="evidence"
                        value={newSkill.evidence}
                        onChange={(e) => setNewSkill({...newSkill, evidence: e.target.value})}
                        placeholder="Provide links to your work, certifications, or portfolio"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newSkill.description}
                        onChange={(e) => setNewSkill({...newSkill, description: e.target.value})}
                        placeholder="Describe your experience and expertise in this skill"
                        rows={3}
                      />
                    </div>

                    <Button 
                      onClick={handleCreateSkill} 
                      disabled={!newSkill.category || isLoading}
                      className="w-full bg-hedera-600 hover:bg-hedera-700"
                    >
                      {isLoading ? 'Creating...' : 'Create Skill Token'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
                      <Button variant="ghost" size="sm" className="flex-1">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Update
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View
                      </Button>
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
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-hedera-600 hover:bg-hedera-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Skill
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}