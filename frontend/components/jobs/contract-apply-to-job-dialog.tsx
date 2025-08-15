"use client";

import { useState, useEffect } from "react";
import { Send, FileText, Trophy, Clock, Loader2, CheckCircle, AlertTriangle, User, Briefcase, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { useAuth } from "@/hooks/useAuth";

interface ContractJobApplication {
    poolId: number;
    coverLetter: string;
    proposedSalary: number; // in tinybar
    skillTokenIds: number[]; // skill token IDs as proof
    portfolioUri: string; // URI to portfolio/resume
    availabilityDate: number; // unix timestamp
    estimatedCompletionTime: number; // in days for contract work
    stakeAmount: number; // in tinybar for msg.value
}

interface JobPool {
    id: number;
    title: string;
    company: string;
    jobType: number;
    requiredSkills: string[];
    minimumLevels: number[];
    salaryMin: number;
    salaryMax: number;
    deadline: number;
    location: string;
    isRemote: boolean;
    description: string;
}

interface UserSkillToken {
    id: number;
    category: string;
    level: number;
    uri: string;
    verified: boolean;
}

interface ContractApplyToJobDialogProps {
    jobPool: JobPool;
    onApplicationSubmitted?: (applicationData: ContractJobApplication) => void;
    triggerButton?: React.ReactNode;
}

const jobTypeLabels = {
    0: "Full-time",
    1: "Part-time", 
    2: "Contract",
    3: "Freelance"
};

const levelLabels = {
    1: "Beginner", 2: "Beginner+", 3: "Developing", 4: "Competent", 5: "Intermediate",
    6: "Proficient", 7: "Advanced", 8: "Superior", 9: "Master", 10: "Legendary"
};

export function ContractApplyToJobDialog({
    jobPool,
    onApplicationSubmitted,
    triggerButton
}: ContractApplyToJobDialogProps) {
    const { user, isConnected } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userSkillTokens, setUserSkillTokens] = useState<UserSkillToken[]>([]);
    const [formData, setFormData] = useState<ContractJobApplication>({
        poolId: jobPool.id,
        coverLetter: "",
        proposedSalary: Math.floor((jobPool.salaryMin + jobPool.salaryMax) / 2),
        skillTokenIds: [],
        portfolioUri: "",
        availabilityDate: Math.floor((Date.now() + 14 * 24 * 60 * 60 * 1000) / 1000), // 2 weeks
        estimatedCompletionTime: 30, // 30 days default
        stakeAmount: 50000000 // 0.5 HBAR in tinybar
    });
    
    // Helper functions
    const hbarToTinybar = (hbar: number): number => Math.floor(hbar * 100_000_000);
    const tinybarToHbar = (tinybar: number): number => tinybar / 100_000_000;
    
    // Load user's skill tokens on dialog open
    useEffect(() => {
        if (isDialogOpen && isConnected && user?.accountId) {
            loadUserSkillTokens();
        }
    }, [isDialogOpen, isConnected, user?.accountId]);
    
    const loadUserSkillTokens = async () => {
        try {
            // TODO: Load actual skill tokens from contract/backend
            // Mock data for now
            const mockSkillTokens: UserSkillToken[] = [
                { id: 1, category: "Frontend Development", level: 8, uri: "ipfs://skill1", verified: true },
                { id: 2, category: "Smart Contracts", level: 6, uri: "ipfs://skill2", verified: true },
                { id: 3, category: "UI/UX Design", level: 7, uri: "ipfs://skill3", verified: false },
            ];
            setUserSkillTokens(mockSkillTokens);
        } catch (error) {
            console.error('❌ Failed to load skill tokens:', error);
        }
    };
    
    const toggleSkillToken = (tokenId: number) => {
        setFormData(prev => ({
            ...prev,
            skillTokenIds: prev.skillTokenIds.includes(tokenId)
                ? prev.skillTokenIds.filter(id => id !== tokenId)
                : [...prev.skillTokenIds, tokenId]
        }));
    };
    
    const getRelevantSkillTokens = (): UserSkillToken[] => {
        return userSkillTokens.filter(token => 
            jobPool.requiredSkills.includes(token.category)
        );
    };
    
    const getSkillMatch = (skillCategory: string): { token: UserSkillToken | null; meets: boolean } => {
        const requiredIndex = jobPool.requiredSkills.indexOf(skillCategory);
        const requiredLevel = jobPool.minimumLevels[requiredIndex] || 1;
        const token = userSkillTokens.find(t => t.category === skillCategory) ?? null;
        
        return {
            token,
            meets: token ? token.level >= requiredLevel : false
        };
    };
    
    const calculateMatchScore = (): number => {
        const totalRequired = jobPool.requiredSkills.length;
        const matchingSkills = jobPool.requiredSkills.filter(skill => {
            const match = getSkillMatch(skill);
            return match.meets;
        }).length;
        
        return totalRequired > 0 ? Math.round((matchingSkills / totalRequired) * 100) : 0;
    };
    
    const handleSubmitApplication = async () => {
        if (!isConnected || !user?.accountId) {
            alert("Please connect your wallet to apply");
            return;
        }
        
        // Validation
        if (!formData.coverLetter.trim()) {
            alert("Please provide a cover letter");
            return;
        }
        
        if (formData.skillTokenIds.length === 0) {
            alert("Please select at least one skill token as proof of expertise");
            return;
        }
        
        if (formData.proposedSalary < jobPool.salaryMin || formData.proposedSalary > jobPool.salaryMax) {
            alert(`Proposed salary must be between ${tinybarToHbar(jobPool.salaryMin)} and ${tinybarToHbar(jobPool.salaryMax)} HBAR`);
            return;
        }
        
        setIsSubmitting(true);
        try {
            const contractData: ContractJobApplication = {
                poolId: jobPool.id,
                coverLetter: formData.coverLetter.trim(),
                proposedSalary: formData.proposedSalary,
                skillTokenIds: formData.skillTokenIds,
                portfolioUri: formData.portfolioUri.trim(),
                availabilityDate: formData.availabilityDate,
                estimatedCompletionTime: formData.estimatedCompletionTime,
                stakeAmount: formData.stakeAmount
            };
            
            console.log('🎯 Contract-Perfect Job Application:', contractData);
            
            // TODO: Implement actual smart contract call
            // const result = await talentPoolContract.applyToPool(
            //     contractData.poolId,
            //     contractData.coverLetter,
            //     contractData.proposedSalary,
            //     contractData.skillTokenIds,
            //     contractData.portfolioUri,
            //     contractData.availabilityDate,
            //     contractData.estimatedCompletionTime,
            //     { value: contractData.stakeAmount }
            // );
            
            // Simulate success
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            if (onApplicationSubmitted) {
                onApplicationSubmitted(contractData);
            }
            
            // Reset and close
            setFormData({
                poolId: jobPool.id,
                coverLetter: "",
                proposedSalary: Math.floor((jobPool.salaryMin + jobPool.salaryMax) / 2),
                skillTokenIds: [],
                portfolioUri: "",
                availabilityDate: Math.floor((Date.now() + 14 * 24 * 60 * 60 * 1000) / 1000),
                estimatedCompletionTime: 30,
                stakeAmount: 50000000
            });
            setIsDialogOpen(false);
            
        } catch (error) {
            console.error('❌ Application submission failed:', error);
            alert('Failed to submit application. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const matchScore = calculateMatchScore();
    const relevantTokens = getRelevantSkillTokens();
    const isFormValid = formData.coverLetter.trim() && formData.skillTokenIds.length > 0 &&
                       formData.proposedSalary >= jobPool.salaryMin && formData.proposedSalary <= jobPool.salaryMax;
    
    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button className="bg-gradient-to-r from-hedera-600 to-web3-pink-600 hover:from-hedera-700 hover:to-web3-pink-700 text-white shadow-lg">
                        <Send className="w-4 h-4 mr-2" />
                        Apply Now
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-hedera-500 to-web3-pink-500 rounded-xl flex items-center justify-center">
                            <Send className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-hedera-600 to-web3-pink-600 bg-clip-text text-transparent">
                                Apply to {jobPool.title}
                            </DialogTitle>
                            <DialogDescription className="text-slate-600 dark:text-slate-400">
                                Submit your blockchain-verified application
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Job Summary */}
                    <Card className="border-slate-200 dark:border-slate-700">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Briefcase className="w-5 h-5 text-hedera-600" />
                                Position Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                    <span className="text-slate-600 dark:text-slate-400">Type:</span>
                                    <p className="font-medium">{jobTypeLabels[jobPool.jobType as keyof typeof jobTypeLabels]}</p>
                                </div>
                                <div>
                                    <span className="text-slate-600 dark:text-slate-400">Location:</span>
                                    <p className="font-medium">{jobPool.isRemote ? "Remote" : jobPool.location}</p>
                                </div>
                                <div>
                                    <span className="text-slate-600 dark:text-slate-400">Salary Range:</span>
                                    <p className="font-medium">{tinybarToHbar(jobPool.salaryMin).toFixed(1)} - {tinybarToHbar(jobPool.salaryMax).toFixed(1)} HBAR</p>
                                </div>
                                <div>
                                    <span className="text-slate-600 dark:text-slate-400">Deadline:</span>
                                    <p className="font-medium">{new Date(jobPool.deadline * 1000).toLocaleDateString()}</p>
                                </div>
                            </div>
                            
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Required Skills:</p>
                                <div className="flex flex-wrap gap-2">
                                    {jobPool.requiredSkills.map((skill, index) => {
                                        const match = getSkillMatch(skill);
                                        const requiredLevel = jobPool.minimumLevels[index];
                                        
                                        return (
                                            <Badge 
                                                key={index} 
                                                variant={match.meets ? "default" : "secondary"}
                                                className={`text-xs ${match.meets ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}`}
                                            >
                                                {skill} L{requiredLevel}
                                                {match.meets && <CheckCircle className="w-3 h-3 ml-1" />}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Skill Match Analysis */}
                    <Card className={`border-2 ${matchScore >= 70 ? 'border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-950/20' : matchScore >= 50 ? 'border-yellow-200 bg-yellow-50/30 dark:border-yellow-800 dark:bg-yellow-950/20' : 'border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-950/20'}`}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Trophy className="w-5 h-5 text-hedera-600" />
                                    Skill Match Analysis
                                </CardTitle>
                                <Badge variant={matchScore >= 70 ? "default" : matchScore >= 50 ? "secondary" : "destructive"} className="text-lg px-3 py-1">
                                    {matchScore}% Match
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {relevantTokens.length > 0 ? (
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Your relevant skill tokens:</p>
                                    <div className="space-y-2">
                                        {relevantTokens.map((token) => {
                                            const match = getSkillMatch(token.category);
                                            const isSelected = formData.skillTokenIds.includes(token.id);
                                            
                                            return (
                                                <div 
                                                    key={token.id}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                                        isSelected 
                                                            ? 'border-hedera-300 bg-hedera-50 dark:border-hedera-700 dark:bg-hedera-950/30'
                                                            : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                                                    }`}
                                                    onClick={() => toggleSkillToken(token.id)}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSkillToken(token.id)}
                                                        className="rounded border-gray-300"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{token.category}</span>
                                                            <Badge variant="outline" className="text-xs">
                                                                L{token.level} - {levelLabels[token.level as keyof typeof levelLabels]}
                                                            </Badge>
                                                            {token.verified && (
                                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                            )}
                                                            {match.meets && (
                                                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                                    Meets Requirement
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500">Token ID: {token.id}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-slate-500">
                                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                    <p>No matching skill tokens found</p>
                                    <p className="text-sm">You may need to mint skill tokens for the required categories first</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Application Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileText className="w-5 h-5 text-hedera-600" />
                                Application Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="coverLetter">Cover Letter *</Label>
                                <Textarea
                                    id="coverLetter"
                                    placeholder="Explain why you're the perfect fit for this role and highlight your relevant experience..."
                                    value={formData.coverLetter}
                                    onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
                                    rows={6}
                                    className="mt-1"
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="proposedSalary">Proposed Salary (tinybar) *</Label>
                                    <Input
                                        id="proposedSalary"
                                        type="number"
                                        min={jobPool.salaryMin}
                                        max={jobPool.salaryMax}
                                        value={formData.proposedSalary || ""}
                                        onChange={(e) => setFormData(prev => ({ ...prev, proposedSalary: parseInt(e.target.value) || 0 }))}
                                        className="mt-1"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        ≈ {tinybarToHbar(formData.proposedSalary).toFixed(2)} HBAR
                                        <span className="ml-2 text-slate-400">
                                            (Range: {tinybarToHbar(jobPool.salaryMin).toFixed(1)} - {tinybarToHbar(jobPool.salaryMax).toFixed(1)} HBAR)
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <Label htmlFor="portfolioUri">Portfolio/Resume URI</Label>
                                    <Input
                                        id="portfolioUri"
                                        placeholder="https://portfolio.com or ipfs://..."
                                        value={formData.portfolioUri}
                                        onChange={(e) => setFormData(prev => ({ ...prev, portfolioUri: e.target.value }))}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="availabilityDate">Available From *</Label>
                                    <Input
                                        id="availabilityDate"
                                        type="date"
                                        value={new Date(formData.availabilityDate * 1000).toISOString().split('T')[0]}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            availabilityDate: Math.floor(new Date(e.target.value).getTime() / 1000) 
                                        }))}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="estimatedCompletionTime">Estimated Duration (days)</Label>
                                    <Input
                                        id="estimatedCompletionTime"
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={formData.estimatedCompletionTime || ""}
                                        onChange={(e) => setFormData(prev => ({ ...prev, estimatedCompletionTime: parseInt(e.target.value) || 30 }))}
                                        className="mt-1"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        For contract/project work
                                    </p>
                                </div>
                            </div>
                            
                            <div>
                                <Label htmlFor="stakeAmount">Application Stake (tinybar) *</Label>
                                <Input
                                    id="stakeAmount"
                                    type="number"
                                    placeholder="50000000"
                                    value={formData.stakeAmount || ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, stakeAmount: parseInt(e.target.value) || 0 }))}
                                    className="mt-1"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    ≈ {tinybarToHbar(formData.stakeAmount).toFixed(2)} HBAR stake (refunded if not selected)
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contract Preview */}
                    {isFormValid && (
                        <Card className="border-hedera-200 dark:border-hedera-800 bg-gradient-to-r from-hedera-50/50 to-web3-pink-50/50 dark:from-hedera-950/30 dark:to-web3-pink-950/30">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-hedera-900 dark:text-hedera-100 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Application Ready for Submission
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                    <div>
                                        <span className="text-slate-600 dark:text-slate-400">Skill Match:</span>
                                        <p className="font-medium">{matchScore}%</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-600 dark:text-slate-400">Tokens:</span>
                                        <p className="font-medium">{formData.skillTokenIds.length} selected</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-600 dark:text-slate-400">Salary:</span>
                                        <p className="font-medium">{tinybarToHbar(formData.proposedSalary).toFixed(1)} HBAR</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-600 dark:text-slate-400">Stake:</span>
                                        <p className="font-medium">{tinybarToHbar(formData.stakeAmount).toFixed(2)} HBAR</p>
                                    </div>
                                </div>
                                
                                {formData.skillTokenIds.length > 0 && (
                                    <div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Selected Skill Proofs:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {formData.skillTokenIds.map((tokenId) => {
                                                const token = userSkillTokens.find(t => t.id === tokenId);
                                                return token ? (
                                                    <Badge key={tokenId} variant="outline" className="text-xs">
                                                        {token.category} L{token.level}
                                                        {token.verified && <Star className="w-3 h-3 ml-1" />}
                                                    </Badge>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitApplication}
                            disabled={!isConnected || !isFormValid || isSubmitting}
                            className="flex-1 bg-gradient-to-r from-hedera-600 to-web3-pink-600 hover:from-hedera-700 hover:to-web3-pink-700 text-white"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Submit Application
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
