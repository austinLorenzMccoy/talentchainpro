"use client";

import { useState, useEffect } from "react";
import { Edit3, TrendingUp, Award, Target, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
import { SkillTokenInfo } from "@/lib/types/wallet";

interface UpdateSkillTokenDialogProps {
    skill: SkillTokenInfo;
    onSkillUpdated?: (updatedSkill: SkillTokenInfo) => void;
    isLoading?: boolean;
    setIsLoading?: (loading: boolean) => void;
    triggerButton?: React.ReactNode;
}

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

const levelDescriptions = {
    1: "Beginner - Basic understanding and knowledge",
    2: "Elementary - Can work with assistance",
    3: "Intermediate - Can work independently on simple tasks",
    4: "Upper Intermediate - Can handle moderate complexity",
    5: "Advanced - Proficient in most aspects",
    6: "Upper Advanced - Expert level with deep knowledge",
    7: "Professional - Industry standard expertise",
    8: "Expert - Recognized authority in the field",
    9: "Master - Exceptional skill and innovation",
    10: "Grandmaster - Legendary expertise and contribution"
};

export function UpdateSkillTokenDialog({
    skill,
    onSkillUpdated,
    isLoading: externalLoading,
    setIsLoading: externalSetLoading,
    triggerButton
}: UpdateSkillTokenDialogProps) {
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
    const [internalLoading, setInternalLoading] = useState(false);

    // Use external loading state if provided, otherwise use internal
    const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;
    const setIsLoading = externalSetLoading || setInternalLoading;

    // Form state for updating skill
    const [updatedSkill, setUpdatedSkill] = useState({
        category: skill.category,
        level: skill.level,
        evidence: "",
        description: "",
        achievements: "",
        certifications: "",
        projects: ""
    });

    // Reset form when skill changes
    useEffect(() => {
        setUpdatedSkill({
            category: skill.category,
            level: skill.level,
            evidence: "",
            description: "",
            achievements: "",
            certifications: "",
            projects: ""
        });
    }, [skill]);

    const handleUpdateSkill = async () => {
        setIsLoading(true);
        try {
            const skillData = {
                ...skill,
                category: updatedSkill.category,
                level: updatedSkill.level,
                evidence: updatedSkill.evidence,
                description: updatedSkill.description,
                achievements: updatedSkill.achievements,
                certifications: updatedSkill.certifications,
                projects: updatedSkill.projects
            };

            // TODO: Implement skill update via smart contract
            // const result = await updateSkillToken(skillData);

            console.log('Updating skill token:', skillData);

            // Call the callback if provided
            if (onSkillUpdated) {
                onSkillUpdated(skillData);
            }

            // Close dialog and reset form
            setIsUpdateDialogOpen(false);
            setUpdatedSkill({
                category: skill.category,
                level: skill.level,
                evidence: "",
                description: "",
                achievements: "",
                certifications: "",
                projects: ""
            });

        } catch (error) {
            console.error('Failed to update skill:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getSkillLevelColor = (level: number) => {
        if (level >= 8) return { bg: 'bg-gradient-to-r from-hedera-500 to-web3-pink-500', text: 'text-white', border: 'border-hedera-200' };
        if (level >= 6) return { bg: 'bg-gradient-to-r from-hedera-400 to-web3-pink-400', text: 'text-white', border: 'border-hedera-200' };
        if (level >= 4) return { bg: 'bg-gradient-to-r from-success-400 to-hedera-400', text: 'text-white', border: 'border-success-200' };
        return { bg: 'bg-gradient-to-r from-warning-400 to-success-400', text: 'text-white', border: 'border-warning-200' };
    };

    const colorConfig = getSkillLevelColor(updatedSkill.level);

    return (
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button variant="ghost" size="sm" className="flex-1">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Update
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-hedera-600 to-web3-pink-600 bg-clip-text text-transparent">
                                Update Skill Token
                            </DialogTitle>
                            <DialogDescription className="text-slate-600 dark:text-slate-400 mt-2">
                                Enhance your skill level and add supporting evidence
                            </DialogDescription>
                        </div>
                        <div className={`w-16 h-16 ${colorConfig.bg} rounded-xl flex items-center justify-center border-2 ${colorConfig.border}`}>
                            <Award className="w-8 h-8 text-white" />
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Current Skill Info */}
                    <div className="bg-gradient-to-r from-hedera-50 to-web3-pink-50 dark:from-hedera-950/30 dark:to-web3-pink-950/30 p-4 rounded-lg border border-hedera-200 dark:border-hedera-800">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4 text-hedera-600" />
                            Current Skill Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-slate-600 dark:text-slate-400">Category:</span>
                                <p className="font-medium text-slate-900 dark:text-white">{skill.category}</p>
                            </div>
                            <div>
                                <span className="text-slate-600 dark:text-slate-400">Current Level:</span>
                                <Badge className={`${colorConfig.bg} ${colorConfig.text} border-0`}>
                                    Level {skill.level}
                                </Badge>
                            </div>
                            <div>
                                <span className="text-slate-600 dark:text-slate-400">Token ID:</span>
                                <p className="font-mono text-slate-900 dark:text-white">#{skill.tokenId}</p>
                            </div>
                            <div>
                                <span className="text-slate-600 dark:text-slate-400">Owner:</span>
                                <p className="font-mono text-slate-900 dark:text-white">{skill.owner}</p>
                            </div>
                        </div>
                    </div>

                    {/* Update Form */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="category">Skill Category</Label>
                                <Select
                                    value={updatedSkill.category}
                                    onValueChange={(value) => setUpdatedSkill({ ...updatedSkill, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {skillCategories.map((category) => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="level">Skill Level</Label>
                                <Select
                                    value={updatedSkill.level.toString()}
                                    onValueChange={(value) => setUpdatedSkill({ ...updatedSkill, level: parseInt(value) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
                                            <SelectItem key={level} value={level.toString()}>
                                                Level {level}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Level Description */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-hedera-600" />
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                    Level {updatedSkill.level} Description
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {levelDescriptions[updatedSkill.level as keyof typeof levelDescriptions]}
                            </p>
                        </div>

                        {/* Level Progress */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Progress to Next Level</span>
                                <span className="text-slate-900 dark:text-white">{updatedSkill.level * 10}%</span>
                            </div>
                            <Progress value={updatedSkill.level * 10} className="h-3" />
                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span>Level 1</span>
                                <span>Level 10</span>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="evidence">Evidence of Skill</Label>
                            <Textarea
                                id="evidence"
                                placeholder="Describe your experience, projects, or achievements that demonstrate this skill level..."
                                value={updatedSkill.evidence}
                                onChange={(e) => setUpdatedSkill({ ...updatedSkill, evidence: e.target.value })}
                                rows={3}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">Skill Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Provide a detailed description of your expertise in this area..."
                                value={updatedSkill.description}
                                onChange={(e) => setUpdatedSkill({ ...updatedSkill, description: e.target.value })}
                                rows={3}
                                className="mt-1"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="achievements">Key Achievements</Label>
                                <Input
                                    id="achievements"
                                    placeholder="e.g., Awards, recognition, milestones..."
                                    value={updatedSkill.achievements}
                                    onChange={(e) => setUpdatedSkill({ ...updatedSkill, achievements: e.target.value })}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="certifications">Certifications</Label>
                                <Input
                                    id="certifications"
                                    placeholder="e.g., AWS, Google, Microsoft..."
                                    value={updatedSkill.certifications}
                                    onChange={(e) => setUpdatedSkill({ ...updatedSkill, certifications: e.target.value })}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="projects">Notable Projects</Label>
                            <Textarea
                                id="projects"
                                placeholder="Describe key projects that showcase this skill..."
                                value={updatedSkill.projects}
                                onChange={(e) => setUpdatedSkill({ ...updatedSkill, projects: e.target.value })}
                                rows={2}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button
                            variant="outline"
                            onClick={() => setIsUpdateDialogOpen(false)}
                            disabled={isLoading}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateSkill}
                            disabled={isLoading}
                            className="bg-gradient-to-r from-hedera-600 to-web3-pink-600 hover:from-hedera-700 hover:to-web3-pink-700 text-white"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isLoading ? 'Updating...' : 'Update Skill'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
