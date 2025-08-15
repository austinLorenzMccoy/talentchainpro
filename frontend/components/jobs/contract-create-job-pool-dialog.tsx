"use client";

import { useState, useEffect } from "react";
import { Briefcase, Plus, Minus, Calendar, DollarSign, MapPin, Users, Clock, Loader2, Target, CheckCircle, AlertTriangle } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

interface ContractJobPoolForm {
    title: string;
    description: string;
    jobType: number; // 0=FullTime, 1=PartTime, 2=Contract, 3=Freelance
    requiredSkills: string[]; // skill categories
    minimumLevels: number[]; // minimum levels for each skill
    salaryMin: number; // in tinybar
    salaryMax: number; // in tinybar
    deadline: number; // unix timestamp
    location: string;
    isRemote: boolean;
    stakeAmount: number; // in tinybar for msg.value
}

interface ContractCreateJobPoolDialogProps {
    onPoolCreated?: (poolData: ContractJobPoolForm) => void;
    triggerButton?: React.ReactNode;
}

const jobTypes = [
    { value: 0, label: "Full-time", description: "Permanent full-time position", color: "from-blue-500 to-cyan-500" },
    { value: 1, label: "Part-time", description: "Part-time position", color: "from-green-500 to-emerald-500" },
    { value: 2, label: "Contract", description: "Fixed-term contract", color: "from-purple-500 to-violet-500" },
    { value: 3, label: "Freelance", description: "Project-based freelance", color: "from-orange-500 to-red-500" }
];

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

const levelLabels = {
    1: "Beginner", 2: "Beginner+", 3: "Developing", 4: "Competent", 5: "Intermediate",
    6: "Proficient", 7: "Advanced", 8: "Superior", 9: "Master", 10: "Legendary"
};

export function ContractCreateJobPoolDialog({
    onPoolCreated,
    triggerButton
}: ContractCreateJobPoolDialogProps) {
    const { user, isConnected } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState<ContractJobPoolForm>({
        title: "",
        description: "",
        jobType: 0,
        requiredSkills: [],
        minimumLevels: [],
        salaryMin: 0,
        salaryMax: 0,
        deadline: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000), // 30 days from now
        location: "",
        isRemote: false,
        stakeAmount: 100000000 // 1 HBAR in tinybar
    });
    
    // Helper functions
    const hbarToTinybar = (hbar: number): number => Math.floor(hbar * 100_000_000);
    const tinybarToHbar = (tinybar: number): number => tinybar / 100_000_000;
    
    const addSkillRequirement = () => {
        if (formData.requiredSkills.length < 10) { // Reasonable limit
            setFormData(prev => ({
                ...prev,
                requiredSkills: [...prev.requiredSkills, ""],
                minimumLevels: [...prev.minimumLevels, 5] // Default to intermediate
            }));
        }
    };
    
    const removeSkillRequirement = (index: number) => {
        setFormData(prev => ({
            ...prev,
            requiredSkills: prev.requiredSkills.filter((_, i) => i !== index),
            minimumLevels: prev.minimumLevels.filter((_, i) => i !== index)
        }));
    };
    
    const updateSkillCategory = (index: number, category: string) => {
        setFormData(prev => ({
            ...prev,
            requiredSkills: prev.requiredSkills.map((skill, i) => i === index ? category : skill)
        }));
    };
    
    const updateMinimumLevel = (index: number, level: number) => {
        setFormData(prev => ({
            ...prev,
            minimumLevels: prev.minimumLevels.map((lvl, i) => i === index ? level : lvl)
        }));
    };
    
    const handleCreatePool = async () => {
        if (!isConnected || !user?.accountId) {
            alert("Please connect your wallet to create a job pool");
            return;
        }
        
        // Validation
        if (!formData.title.trim() || !formData.description.trim()) {
            alert("Please provide a title and description");
            return;
        }
        
        if (formData.requiredSkills.length === 0 || formData.requiredSkills.some(skill => !skill.trim())) {
            alert("Please add at least one valid skill requirement");
            return;
        }
        
        if (formData.salaryMin >= formData.salaryMax) {
            alert("Maximum salary must be greater than minimum salary");
            return;
        }
        
        setIsCreating(true);
        try {
            const contractData: ContractJobPoolForm = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                jobType: formData.jobType,
                requiredSkills: formData.requiredSkills.filter(skill => skill.trim()),
                minimumLevels: formData.minimumLevels.slice(0, formData.requiredSkills.length),
                salaryMin: formData.salaryMin,
                salaryMax: formData.salaryMax,
                deadline: formData.deadline,
                location: formData.location.trim(),
                isRemote: formData.isRemote,
                stakeAmount: formData.stakeAmount
            };
            
            console.log('🎯 Contract-Perfect Job Pool Creation:', contractData);
            
            // TODO: Implement actual smart contract call
            // const result = await talentPoolContract.createPool(
            //     contractData.title,
            //     contractData.description,
            //     contractData.jobType,
            //     contractData.requiredSkills,
            //     contractData.minimumLevels,
            //     contractData.salaryMin,
            //     contractData.salaryMax,
            //     contractData.deadline,
            //     contractData.location,
            //     contractData.isRemote,
            //     { value: contractData.stakeAmount }
            // );
            
            // Simulate success
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            if (onPoolCreated) {
                onPoolCreated(contractData);
            }
            
            // Reset and close
            setFormData({
                title: "",
                description: "",
                jobType: 0,
                requiredSkills: [],
                minimumLevels: [],
                salaryMin: 0,
                salaryMax: 0,
                deadline: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
                location: "",
                isRemote: false,
                stakeAmount: 100000000
            });
            setIsDialogOpen(false);
            
        } catch (error) {
            console.error('❌ Job pool creation failed:', error);
            alert('Failed to create job pool. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };
    
    const selectedJobType = jobTypes.find(jt => jt.value === formData.jobType);
    const isFormValid = formData.title.trim() && formData.description.trim() && 
                       formData.requiredSkills.length > 0 && formData.salaryMin < formData.salaryMax;
    
    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button className="bg-gradient-to-r from-hedera-600 to-web3-pink-600 hover:from-hedera-700 hover:to-web3-pink-700 text-white shadow-lg">
                        <Briefcase className="w-4 h-4 mr-2" />
                        Create Job Pool
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-hedera-500 to-web3-pink-500 rounded-xl flex items-center justify-center">
                            <Briefcase className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-hedera-600 to-web3-pink-600 bg-clip-text text-transparent">
                                Create Job Pool
                            </DialogTitle>
                            <DialogDescription className="text-slate-600 dark:text-slate-400">
                                Deploy a smart contract-based talent pool on Hedera
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Target className="w-5 h-5 text-hedera-600" />
                                Job Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <Label htmlFor="title">Job Title *</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g., Senior Blockchain Developer"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="jobType">Job Type *</Label>
                                    <Select 
                                        value={formData.jobType.toString()} 
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, jobType: parseInt(value) }))}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {jobTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value.toString()}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${type.color}`} />
                                                        <div>
                                                            <div className="font-medium">{type.label}</div>
                                                            <div className="text-xs text-slate-500">{type.description}</div>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="location">Location</Label>
                                    <div className="relative mt-1">
                                        <MapPin className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                                        <Input
                                            id="location"
                                            placeholder="San Francisco, CA"
                                            value={formData.location}
                                            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <Label htmlFor="description">Job Description *</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe the role, responsibilities, and what you're looking for in detail..."
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={4}
                                    className="mt-1"
                                />
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="isRemote"
                                    checked={formData.isRemote}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isRemote: e.target.checked }))}
                                    className="rounded border-gray-300"
                                />
                                <Label htmlFor="isRemote" className="text-sm">
                                    Remote work available
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Skill Requirements */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Users className="w-5 h-5 text-hedera-600" />
                                    Skill Requirements
                                </CardTitle>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addSkillRequirement}
                                    disabled={formData.requiredSkills.length >= 10}
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Skill
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {formData.requiredSkills.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                    <p>No skill requirements added yet</p>
                                    <p className="text-sm">Click "Add Skill" to define required expertise</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {formData.requiredSkills.map((skill, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <div className="flex-1">
                                                <Select 
                                                    value={skill} 
                                                    onValueChange={(value) => updateSkillCategory(index, value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select skill category" />
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
                                            <div className="w-32">
                                                <Select 
                                                    value={formData.minimumLevels[index]?.toString() || "5"} 
                                                    onValueChange={(value) => updateMinimumLevel(index, parseInt(value))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
                                                            <SelectItem key={level} value={level.toString()}>
                                                                L{level} - {levelLabels[level as keyof typeof levelLabels]}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeSkillRequirement(index)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Compensation & Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <DollarSign className="w-5 h-5 text-hedera-600" />
                                Compensation & Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="salaryMin">Minimum Salary (tinybar) *</Label>
                                    <Input
                                        id="salaryMin"
                                        type="number"
                                        placeholder="500000000"
                                        value={formData.salaryMin || ""}
                                        onChange={(e) => setFormData(prev => ({ ...prev, salaryMin: parseInt(e.target.value) || 0 }))}
                                        className="mt-1"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        ≈ {tinybarToHbar(formData.salaryMin).toFixed(2)} HBAR
                                    </p>
                                </div>
                                <div>
                                    <Label htmlFor="salaryMax">Maximum Salary (tinybar) *</Label>
                                    <Input
                                        id="salaryMax"
                                        type="number"
                                        placeholder="1000000000"
                                        value={formData.salaryMax || ""}
                                        onChange={(e) => setFormData(prev => ({ ...prev, salaryMax: parseInt(e.target.value) || 0 }))}
                                        className="mt-1"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        ≈ {tinybarToHbar(formData.salaryMax).toFixed(2)} HBAR
                                    </p>
                                </div>
                                <div>
                                    <Label htmlFor="deadline">Application Deadline *</Label>
                                    <Input
                                        id="deadline"
                                        type="datetime-local"
                                        value={new Date(formData.deadline * 1000).toISOString().slice(0, 16)}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            deadline: Math.floor(new Date(e.target.value).getTime() / 1000) 
                                        }))}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="stakeAmount">Pool Stake (tinybar) *</Label>
                                    <Input
                                        id="stakeAmount"
                                        type="number"
                                        placeholder="100000000"
                                        value={formData.stakeAmount || ""}
                                        onChange={(e) => setFormData(prev => ({ ...prev, stakeAmount: parseInt(e.target.value) || 0 }))}
                                        className="mt-1"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        ≈ {tinybarToHbar(formData.stakeAmount).toFixed(2)} HBAR stake required
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contract Preview */}
                    {isFormValid && (
                        <Card className="border-hedera-200 dark:border-hedera-800 bg-gradient-to-r from-hedera-50/50 to-web3-pink-50/50 dark:from-hedera-950/30 dark:to-web3-pink-950/30">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-hedera-900 dark:text-hedera-100 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Smart Contract Parameters Ready
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                    <div>
                                        <span className="text-slate-600 dark:text-slate-400">Job Type:</span>
                                        <p className="font-medium">{selectedJobType?.label}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-600 dark:text-slate-400">Skills:</span>
                                        <p className="font-medium">{formData.requiredSkills.length} required</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-600 dark:text-slate-400">Salary Range:</span>
                                        <p className="font-medium">{tinybarToHbar(formData.salaryMax - formData.salaryMin).toFixed(1)} HBAR</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-600 dark:text-slate-400">Stake:</span>
                                        <p className="font-medium">{tinybarToHbar(formData.stakeAmount).toFixed(1)} HBAR</p>
                                    </div>
                                </div>
                                
                                {formData.requiredSkills.length > 0 && (
                                    <div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Required Skills & Levels:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {formData.requiredSkills.map((skill, index) => (
                                                skill && (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        {skill} L{formData.minimumLevels[index]}
                                                    </Badge>
                                                )
                                            ))}
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
                            disabled={isCreating}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreatePool}
                            disabled={!isConnected || !isFormValid || isCreating}
                            className="flex-1 bg-gradient-to-r from-hedera-600 to-web3-pink-600 hover:from-hedera-700 hover:to-web3-pink-700 text-white"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating Pool...
                                </>
                            ) : (
                                <>
                                    <Briefcase className="w-4 h-4 mr-2" />
                                    Create Job Pool
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
