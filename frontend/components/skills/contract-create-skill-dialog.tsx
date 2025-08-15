"use client";

import { useState, useEffect } from "react";
import { Award, Sparkles, User, Hash, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface ContractSkillForm {
    recipient_address: string;
    category: string;
    level: number;
    uri: string;
}

interface ContractCreateSkillDialogProps {
    onSkillCreated?: (skillData: ContractSkillForm) => void;
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
    "Blockchain Development",
    "Cybersecurity",
    "Project Management",
    "Quality Assurance",
    "Cloud Architecture"
];

const levelDescriptions = {
    1: "Novice - Just starting to learn",
    2: "Beginner - Basic understanding",
    3: "Developing - Some practical experience", 
    4: "Competent - Can work independently",
    5: "Intermediate - Solid practical skills",
    6: "Proficient - Advanced practical skills",
    7: "Advanced - Expert level skills",
    8: "Superior - Industry expert",
    9: "Master - Thought leader",
    10: "Legendary - Pioneer in the field"
};

export function ContractCreateSkillDialog({
    onSkillCreated,
    triggerButton
}: ContractCreateSkillDialogProps) {
    const { user, isConnected } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState<ContractSkillForm>({
        recipient_address: "",
        category: "",
        level: 1,
        uri: ""
    });

    // Auto-populate recipient address when user connects
    useEffect(() => {
        if (user?.accountId) {
            setFormData(prev => ({ ...prev, recipient_address: user.accountId }));
        }
    }, [user?.accountId]);

    const handleCreateSkill = async () => {
        if (!isConnected || !user?.accountId) {
            alert("Please connect your wallet to create a skill token");
            return;
        }

        if (!formData.category || formData.level < 1 || formData.level > 10) {
            alert("Please fill in all required fields correctly");
            return;
        }

        setIsCreating(true);
        try {
            // Generate IPFS URI based on skill data
            const timestamp = Date.now();
            const skillSlug = formData.category.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const uri = `ipfs://skill-${skillSlug}-${timestamp}-level-${formData.level}`;

            const contractData: ContractSkillForm = {
                recipient_address: user.accountId,
                category: formData.category,
                level: formData.level,
                uri: uri
            };

            console.log('🎯 Contract-Perfect Skill Creation:', contractData);

            // TODO: Implement actual smart contract call
            // const result = await skillTokenContract.mintSkillToken(
            //     contractData.recipient_address,
            //     contractData.category, 
            //     contractData.level,
            //     contractData.uri
            // );

            // Simulate success
            await new Promise(resolve => setTimeout(resolve, 2000));

            if (onSkillCreated) {
                onSkillCreated(contractData);
            }

            // Reset and close
            setFormData({
                recipient_address: user.accountId,
                category: "",
                level: 1,
                uri: ""
            });
            setIsDialogOpen(false);

        } catch (error) {
            console.error('❌ Skill creation failed:', error);
            alert('Failed to create skill token. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    const getSkillLevelColor = (level: number) => {
        if (level >= 9) return "from-purple-500 to-pink-500";
        if (level >= 7) return "from-hedera-500 to-web3-pink-500";
        if (level >= 5) return "from-blue-500 to-hedera-500";
        if (level >= 3) return "from-green-500 to-blue-500";
        return "from-gray-400 to-green-500";
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button className="bg-gradient-to-r from-hedera-600 to-web3-pink-600 hover:from-hedera-700 hover:to-web3-pink-700 text-white shadow-lg">
                        <Award className="w-4 h-4 mr-2" />
                        Create Skill Token
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-hedera-500 to-web3-pink-500 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-hedera-600 to-web3-pink-600 bg-clip-text text-transparent">
                                Create Skill Token
                            </DialogTitle>
                            <DialogDescription className="text-slate-600 dark:text-slate-400">
                                Mint a soulbound skill token on Hedera
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Connection Status */}
                    <Card className="border-slate-200 dark:border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Recipient</span>
                                </div>
                                {isConnected ? (
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span className="text-sm font-mono text-slate-900 dark:text-white">
                                            {user?.accountId?.slice(0, 8)}...{user?.accountId?.slice(-6)}
                                        </span>
                                    </div>
                                ) : (
                                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                                        Connect Wallet
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Skill Category */}
                    <div className="space-y-2">
                        <Label htmlFor="category" className="text-sm font-medium text-slate-900 dark:text-white">
                            Skill Category *
                        </Label>
                        <Select 
                            value={formData.category} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                        >
                            <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 focus:border-hedera-500">
                                <SelectValue placeholder="Select your expertise area" />
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

                    {/* Skill Level */}
                    <div className="space-y-3">
                        <Label htmlFor="level" className="text-sm font-medium text-slate-900 dark:text-white">
                            Skill Level *
                        </Label>
                        <div className="space-y-3">
                            <Select 
                                value={formData.level.toString()} 
                                onValueChange={(value) => setFormData(prev => ({ ...prev, level: parseInt(value) }))}
                            >
                                <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 focus:border-hedera-500">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
                                        <SelectItem key={level} value={level.toString()}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getSkillLevelColor(level)}`} />
                                                <span>Level {level}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            
                            {formData.level > 0 && (
                                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getSkillLevelColor(formData.level)}`} />
                                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                                            Level {formData.level}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        {levelDescriptions[formData.level as keyof typeof levelDescriptions]}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Metadata URI Preview */}
                    {formData.category && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-900 dark:text-white">
                                Metadata URI Preview
                            </Label>
                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                                        ipfs://skill-{formData.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}-***-level-{formData.level}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contract Parameters Summary */}
                    {formData.category && isConnected && (
                        <Card className="border-hedera-200 dark:border-hedera-800 bg-gradient-to-r from-hedera-50/50 to-web3-pink-50/50 dark:from-hedera-950/30 dark:to-web3-pink-950/30">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-hedera-900 dark:text-hedera-100">
                                    Smart Contract Parameters
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-2">
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <span className="text-slate-600 dark:text-slate-400">recipient:</span>
                                        <p className="font-mono text-slate-900 dark:text-white truncate">
                                            {user?.accountId}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-slate-600 dark:text-slate-400">category:</span>
                                        <p className="font-medium text-slate-900 dark:text-white">
                                            {formData.category}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-slate-600 dark:text-slate-400">level:</span>
                                        <p className="font-medium text-slate-900 dark:text-white">
                                            {formData.level}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-slate-600 dark:text-slate-400">uri:</span>
                                        <p className="font-mono text-slate-900 dark:text-white">
                                            ipfs://...
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            disabled={isCreating}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateSkill}
                            disabled={!isConnected || !formData.category || formData.level < 1 || isCreating}
                            className="flex-1 bg-gradient-to-r from-hedera-600 to-web3-pink-600 hover:from-hedera-700 hover:to-web3-pink-700 text-white"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Minting...
                                </>
                            ) : (
                                <>
                                    <Award className="w-4 h-4 mr-2" />
                                    Create Token
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
