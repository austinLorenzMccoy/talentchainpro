"use client";

import { useState, useEffect } from "react";
import { Award, Star, Target, Send, X, CheckCircle, AlertCircle, FileText, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
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
import { useAuth } from "@/hooks/useAuth";
import { SkillTokenInfo } from "@/lib/types/wallet";

interface JobApplication {
    id: number;
    title: string;
    company: string;
    location: string;
    type: string;
    salary: string;
    skills: string[];
    experience: string;
    remote: boolean;
}

interface ApplyWithSkillsDialogProps {
    job: JobApplication;
    triggerButton?: React.ReactNode;
    onApplicationSubmitted?: (application: any) => void;
}

// Mock user skills - will be replaced with real data from wallet
const mockUserSkills: SkillTokenInfo[] = [
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
    }
];

export function ApplyWithSkillsDialog({
    job,
    triggerButton,
    onApplicationSubmitted
}: ApplyWithSkillsDialogProps) {
    const { user, isConnected } = useAuth();
    const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
    const [coverLetter, setCoverLetter] = useState("");
    const [expectedSalary, setExpectedSalary] = useState("");
    const [availability, setAvailability] = useState("immediate");
    const [portfolioUrl, setPortfolioUrl] = useState("");
    const [linkedinUrl, setLinkedinUrl] = useState("");
    const [githubUrl, setGithubUrl] = useState("");

    // Filter skills that match job requirements
    const matchingSkills = mockUserSkills.filter(skill =>
        job.skills.some(jobSkill =>
            skill.category.toLowerCase().includes(jobSkill.toLowerCase()) ||
            jobSkill.toLowerCase().includes(skill.category.toLowerCase())
        )
    );

    // Calculate skill match percentage
    const skillMatchPercentage = matchingSkills.length > 0
        ? Math.round((matchingSkills.length / job.skills.length) * 100)
        : 0;

    // Calculate average skill level
    const averageSkillLevel = matchingSkills.length > 0
        ? Math.round(matchingSkills.reduce((sum, skill) => sum + skill.level, 0) / matchingSkills.length)
        : 0;

    const handleSkillToggle = (skillId: number) => {
        setSelectedSkills(prev =>
            prev.includes(skillId)
                ? prev.filter(id => id !== skillId)
                : [...prev, skillId]
        );
    };

    const handleSubmitApplication = async () => {
        if (!isConnected) {
            alert("Please connect your wallet to apply");
            return;
        }

        if (selectedSkills.length === 0) {
            alert("Please select at least one skill to showcase");
            return;
        }

        setIsSubmitting(true);
        try {
            // TODO: Implement application submission via smart contract
            // const result = await submitJobApplication({
            //     jobId: job.id,
            //     userId: user?.accountId,
            //     selectedSkills,
            //     coverLetter,
            //     expectedSalary,
            //     availability,
            //     portfolioUrl,
            //     linkedinUrl,
            //     githubUrl
            // });

            const application = {
                jobId: job.id,
                jobTitle: job.title,
                company: job.company,
                userId: user?.accountId,
                selectedSkills: mockUserSkills.filter(skill => selectedSkills.includes(skill.tokenId)),
                coverLetter,
                expectedSalary,
                availability,
                portfolioUrl,
                linkedinUrl,
                githubUrl,
                submittedAt: new Date().toISOString(),
                status: "pending"
            };

            console.log('Submitting job application:', application);

            // Call the callback if provided
            if (onApplicationSubmitted) {
                onApplicationSubmitted(application);
            }

            // Close dialog and reset form
            setIsApplyDialogOpen(false);
            setSelectedSkills([]);
            setCoverLetter("");
            setExpectedSalary("");
            setAvailability("immediate");
            setPortfolioUrl("");
            setLinkedinUrl("");
            setGithubUrl("");

        } catch (error) {
            console.error('Failed to submit application:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getSkillLevelColor = (level: number) => {
        if (level >= 8) return { bg: 'bg-gradient-to-r from-hedera-500 to-web3-pink-500', text: 'text-white' };
        if (level >= 6) return { bg: 'bg-gradient-to-r from-hedera-400 to-web3-pink-400', text: 'text-white' };
        if (level >= 4) return { bg: 'bg-gradient-to-r from-success-400 to-hedera-400', text: 'text-white' };
        return { bg: 'bg-gradient-to-r from-warning-400 to-success-400', text: 'text-white' };
    };

    return (
        <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button size="sm" className="bg-hedera-600 hover:bg-hedera-700">
                        <Award className="w-4 h-4 mr-2" />
                        Apply with Skills
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-4">
                    <div>
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-hedera-600 to-web3-pink-600 bg-clip-text text-transparent">
                            Apply with Skills
                        </DialogTitle>
                        <DialogDescription className="text-slate-600 dark:text-slate-400 mt-2">
                            Showcase your verified skills and submit your application for {job.title} at {job.company}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Job Summary */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">{job.title}</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{job.company} • {job.location}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{job.type} • {job.salary}</p>
                                </div>
                                <Badge variant="outline">{job.remote ? "Remote" : "On-site"}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Skill Match Analysis */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-hedera-600" />
                                Skill Match Analysis
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-hedera-600 mb-1">{skillMatchPercentage}%</div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Skill Match</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-hedera-600 mb-1">{matchingSkills.length}</div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Matching Skills</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-hedera-600 mb-1">{averageSkillLevel}</div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Avg. Skill Level</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Skill Match Score</span>
                                    <span className="text-slate-900 dark:text-white">{skillMatchPercentage}%</span>
                                </div>
                                <Progress value={skillMatchPercentage} className="h-3" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Select Skills to Showcase */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Award className="w-5 h-5 text-hedera-600" />
                                Select Skills to Showcase
                            </h3>

                            {matchingSkills.length > 0 ? (
                                <div className="space-y-3">
                                    {matchingSkills.map((skill) => {
                                        const colorConfig = getSkillLevelColor(skill.level);
                                        const isSelected = selectedSkills.includes(skill.tokenId);

                                        return (
                                            <div
                                                key={skill.tokenId}
                                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                                                        ? 'border-hedera-500 bg-hedera-50 dark:bg-hedera-950/30'
                                                        : 'border-slate-200 dark:border-slate-700 hover:border-hedera-300'
                                                    }`}
                                                onClick={() => handleSkillToggle(skill.tokenId)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 ${colorConfig.bg} rounded-lg flex items-center justify-center`}>
                                                            <Star className="w-5 h-5 text-white" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-slate-900 dark:text-white">
                                                                {skill.category}
                                                            </h4>
                                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                                Level {skill.level} • Token #{skill.tokenId}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={`${colorConfig.bg} ${colorConfig.text} border-0`}>
                                                            Level {skill.level}
                                                        </Badge>
                                                        {isSelected && (
                                                            <CheckCircle className="w-5 h-5 text-hedera-500" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                    <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                                        No Matching Skills Found
                                    </h4>
                                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                                        You don't have any skills that match the job requirements. Consider creating new skill tokens or upgrading existing ones.
                                    </p>
                                    <Button variant="outline" onClick={() => setIsApplyDialogOpen(false)}>
                                        Create Skills First
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Application Details */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-hedera-600" />
                                Application Details
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="coverLetter">Cover Letter</Label>
                                    <Textarea
                                        id="coverLetter"
                                        placeholder="Explain why you're the perfect fit for this role and how your skills align with the requirements..."
                                        value={coverLetter}
                                        onChange={(e) => setCoverLetter(e.target.value)}
                                        rows={4}
                                        className="mt-1"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="expectedSalary">Expected Salary</Label>
                                        <Input
                                            id="expectedSalary"
                                            placeholder="e.g., $80k - $100k"
                                            value={expectedSalary}
                                            onChange={(e) => setExpectedSalary(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="availability">Availability</Label>
                                        <Select value={availability} onValueChange={setAvailability}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="immediate">Immediate</SelectItem>
                                                <SelectItem value="2-weeks">2 weeks</SelectItem>
                                                <SelectItem value="1-month">1 month</SelectItem>
                                                <SelectItem value="3-months">3 months</SelectItem>
                                                <SelectItem value="flexible">Flexible</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                                        <Input
                                            id="portfolioUrl"
                                            placeholder="https://your-portfolio.com"
                                            value={portfolioUrl}
                                            onChange={(e) => setPortfolioUrl(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                                        <Input
                                            id="linkedinUrl"
                                            placeholder="https://linkedin.com/in/your-profile"
                                            value={linkedinUrl}
                                            onChange={(e) => setLinkedinUrl(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="githubUrl">GitHub URL</Label>
                                        <Input
                                            id="githubUrl"
                                            placeholder="https://github.com/your-username"
                                            value={githubUrl}
                                            onChange={(e) => setGithubUrl(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Application Summary */}
                    {selectedSkills.length > 0 && (
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-hedera-600" />
                                    Application Summary
                                </h3>

                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-slate-600 dark:text-slate-400">Skills Showcased:</span>
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                {selectedSkills.length} skill tokens
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-slate-600 dark:text-slate-400">Application Type:</span>
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                Skill-based application
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-slate-600 dark:text-slate-400">Cover Letter:</span>
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                {coverLetter ? `${coverLetter.length} characters` : 'Not provided'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-slate-600 dark:text-slate-400">Availability:</span>
                                            <p className="font-medium text-slate-900 dark:text-white capitalize">
                                                {availability.replace('-', ' ')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button
                            variant="outline"
                            onClick={() => setIsApplyDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitApplication}
                            disabled={isSubmitting || selectedSkills.length === 0 || !isConnected}
                            className="bg-gradient-to-r from-hedera-600 to-web3-pink-600 hover:from-hedera-700 hover:to-web3-pink-700 text-white"
                        >
                            <Send className="w-4 h-4 mr-2" />
                            {isSubmitting ? 'Submitting...' : 'Submit Application'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
