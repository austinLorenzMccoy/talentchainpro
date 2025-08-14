"use client";

import { useState } from "react";
import { ExternalLink, Award, Target, Calendar, TrendingUp, Star, BookOpen, Users, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { SkillTokenInfo } from "@/lib/types/wallet";

interface ViewSkillTokenDialogProps {
    skill: SkillTokenInfo;
    triggerButton?: React.ReactNode;
}

// Mock data for skill details - will be replaced with real API calls
const getSkillDetails = (skill: SkillTokenInfo) => ({
    createdAt: "2024-01-15",
    lastUpdated: "2024-03-20",
    endorsements: 12,
    reviews: 8,
    averageRating: 4.8,
    totalHours: 1200,
    projects: [
        { name: "E-commerce Platform", description: "Built a full-stack e-commerce solution", impact: "High" },
        { name: "Mobile App", description: "Developed a cross-platform mobile application", impact: "Medium" },
        { name: "API Integration", description: "Integrated multiple third-party APIs", impact: "High" }
    ],
    certifications: [
        { name: "AWS Certified Developer", issuer: "Amazon Web Services", date: "2023-12-01" },
        { name: "Google Cloud Professional", issuer: "Google", date: "2023-08-15" }
    ],
    achievements: [
        "Led development team of 5 developers",
        "Reduced API response time by 40%",
        "Achieved 99.9% uptime for production systems"
    ],
    skills: ["JavaScript", "React", "Node.js", "AWS", "Docker", "MongoDB"],
    experience: "5+ years of professional experience in web development with focus on scalable applications and modern frameworks.",
    evidence: "Demonstrated expertise through successful delivery of multiple enterprise-level applications, leading development teams, and contributing to open-source projects."
});

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

export function ViewSkillTokenDialog({
    skill,
    triggerButton
}: ViewSkillTokenDialogProps) {
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const skillDetails = getSkillDetails(skill);

    const getSkillLevelColor = (level: number) => {
        if (level >= 8) return { bg: 'bg-gradient-to-r from-hedera-500 to-web3-pink-500', text: 'text-white', border: 'border-hedera-200' };
        if (level >= 6) return { bg: 'bg-gradient-to-r from-hedera-400 to-web3-pink-400', text: 'text-white', border: 'border-hedera-200' };
        if (level >= 4) return { bg: 'bg-gradient-to-r from-success-400 to-hedera-400', text: 'text-white', border: 'border-success-200' };
        return { bg: 'bg-gradient-to-r from-warning-400 to-success-400', text: 'text-white', border: 'border-warning-200' };
    };

    const colorConfig = getSkillLevelColor(skill.level);

    return (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button variant="ghost" size="sm" className="flex-1">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-hedera-600 to-web3-pink-600 bg-clip-text text-transparent">
                                Skill Token Details
                            </DialogTitle>
                            <DialogDescription className="text-slate-600 dark:text-slate-400 mt-2">
                                Comprehensive view of your skill token and achievements
                            </DialogDescription>
                        </div>
                        <div className={`w-20 h-20 ${colorConfig.bg} rounded-xl flex items-center justify-center border-2 ${colorConfig.border}`}>
                            <Award className="w-10 h-10 text-white" />
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Header Info */}
                    <div className="bg-gradient-to-r from-hedera-50 to-web3-pink-50 dark:from-hedera-950/30 dark:to-web3-pink-950/30 p-6 rounded-lg border border-hedera-200 dark:border-hedera-800">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                    {skill.category}
                                </h3>
                                <Badge className={`${colorConfig.bg} ${colorConfig.text} border-0 text-sm px-3 py-1`}>
                                    Level {skill.level}
                                </Badge>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                    {levelDescriptions[skill.level as keyof typeof levelDescriptions]}
                                </p>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-hedera-600" />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        Created: {skillDetails.createdAt}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-hedera-600" />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        Updated: {skillDetails.lastUpdated}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-hedera-600" />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        {skillDetails.endorsements} endorsements
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        Rating: {skillDetails.averageRating}/5.0
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-hedera-600" />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        {skillDetails.totalHours} hours
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-hedera-600" />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        Token #{skill.tokenId}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Skill Progress */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-hedera-600" />
                            Skill Progress
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Current Level Progress</span>
                                <span className="text-slate-900 dark:text-white">{skill.level * 10}%</span>
                            </div>
                            <Progress value={skill.level * 10} className="h-3" />
                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span>Level 1</span>
                                <span>Level 10</span>
                            </div>
                        </div>
                    </div>

                    {/* Experience & Evidence */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-hedera-600" />
                                Experience Summary
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                {skillDetails.experience}
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <Eye className="w-4 h-4 text-hedera-600" />
                                Evidence of Expertise
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                {skillDetails.evidence}
                            </p>
                        </div>
                    </div>

                    {/* Skills & Technologies */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <Target className="w-4 h-4 text-hedera-600" />
                            Related Skills & Technologies
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {skillDetails.skills.map((skillName) => (
                                <Badge key={skillName} variant="secondary" className="text-xs">
                                    {skillName}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Projects */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-hedera-600" />
                            Notable Projects
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {skillDetails.projects.map((project, index) => (
                                <div key={index} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium text-slate-900 dark:text-white">
                                            {project.name}
                                        </h4>
                                        <Badge 
                                            variant={project.impact === 'High' ? 'default' : 'secondary'}
                                            className="text-xs"
                                        >
                                            {project.impact} Impact
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {project.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Certifications */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <Award className="w-4 h-4 text-hedera-600" />
                            Certifications
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {skillDetails.certifications.map((cert, index) => (
                                <div key={index} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <h4 className="font-medium text-slate-900 dark:text-white mb-1">
                                        {cert.name}
                                    </h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                        {cert.issuer}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-500">
                                        {cert.date}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Achievements */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <Star className="w-4 h-4 text-hedera-600" />
                            Key Achievements
                        </h3>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <ul className="space-y-2">
                                {skillDetails.achievements.map((achievement, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <div className="w-1.5 h-1.5 bg-hedera-500 rounded-full mt-2 flex-shrink-0"></div>
                                        {achievement}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Blockchain Info */}
                    <div className="bg-gradient-to-r from-slate-50 to-hedera-50 dark:from-slate-800/50 dark:to-hedera-950/30 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4 text-hedera-600" />
                            Blockchain Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-slate-600 dark:text-slate-400">Token ID:</span>
                                <p className="font-mono text-slate-900 dark:text-white">#{skill.tokenId}</p>
                            </div>
                            <div>
                                <span className="text-slate-600 dark:text-slate-400">Owner Address:</span>
                                <p className="font-mono text-slate-900 dark:text-white">{skill.owner}</p>
                            </div>
                            <div>
                                <span className="text-slate-600 dark:text-slate-400">Token URI:</span>
                                <p className="font-mono text-slate-900 dark:text-white break-all">{skill.uri}</p>
                            </div>
                            <div>
                                <span className="text-slate-600 dark:text-slate-400">Network:</span>
                                <p className="font-medium text-slate-900 dark:text-white">Hedera Testnet</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button
                            variant="outline"
                            onClick={() => setIsViewDialogOpen(false)}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Close
                        </Button>
                        <Button
                            className="bg-gradient-to-r from-hedera-600 to-web3-pink-600 hover:from-hedera-700 hover:to-web3-pink-700 text-white"
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View on Explorer
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
