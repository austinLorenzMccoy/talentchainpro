"use client";

import { useState, useEffect } from "react";
import { Building2, DollarSign, MapPin, Clock, Users, Star, Plus, X, Save, Briefcase, Target, Calendar, FileText, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useSkillTokens } from "@/hooks/useDashboardData";

interface CreateJobPoolForm {
    title: string;
    company: string;
    description: string;
    salary: string;
    salaryType: "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "project";
    location: string;
    remote: boolean;
    hybrid: boolean;
    jobType: "full-time" | "part-time" | "contract" | "internship" | "freelance";
    experience: "entry" | "junior" | "mid-level" | "senior" | "lead" | "executive";
    duration: string;
    startDate: string;
    requiredSkills: number[];
    preferredSkills: number[];
    benefits: string[];
    requirements: string[];
    responsibilities: string[];
    maxApplicants: number;
    applicationDeadline: string;
    poolType: "public" | "private" | "invite-only";
    budget: string;
    urgency: "low" | "medium" | "high" | "urgent";
}

interface CreateJobPoolDialogProps {
    triggerButton?: React.ReactNode;
    onPoolCreated?: (pool: any) => void;
}

const salaryTypes = [
    { value: "hourly", label: "Per Hour" },
    { value: "daily", label: "Per Day" },
    { value: "weekly", label: "Per Week" },
    { value: "monthly", label: "Per Month" },
    { value: "yearly", label: "Per Year" },
    { value: "project", label: "Per Project" }
];

const jobTypes = [
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "contract", label: "Contract" },
    { value: "internship", label: "Internship" },
    { value: "freelance", label: "Freelance" }
];

const experienceLevels = [
    { value: "entry", label: "Entry Level (0-2 years)" },
    { value: "junior", label: "Junior (2-4 years)" },
    { value: "mid-level", label: "Mid-level (4-6 years)" },
    { value: "senior", label: "Senior (6-8 years)" },
    { value: "lead", label: "Lead (8-10 years)" },
    { value: "executive", label: "Executive (10+ years)" }
];

const poolTypes = [
    { value: "public", label: "Public - Visible to all users" },
    { value: "private", label: "Private - Company network only" },
    { value: "invite-only", label: "Invite-only - Selected candidates" }
];

const urgencyLevels = [
    { value: "low", label: "Low - Flexible timeline" },
    { value: "medium", label: "Medium - Standard timeline" },
    { value: "high", label: "High - Urgent need" },
    { value: "urgent", label: "Urgent - Immediate start" }
];

const commonBenefits = [
    "Health Insurance",
    "Dental Insurance",
    "Vision Insurance",
    "Life Insurance",
    "401k/Retirement Plan",
    "Stock Options",
    "Remote Work",
    "Flexible Hours",
    "Paid Time Off",
    "Professional Development",
    "Gym Membership",
    "Transportation Allowance",
    "Meal Allowance",
    "Childcare Support",
    "Wellness Programs"
];

export function CreateJobPoolDialog({
    triggerButton,
    onPoolCreated
}: CreateJobPoolDialogProps) {
    const { user, isConnected } = useAuth();
    const { skillTokens } = useSkillTokens();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<CreateJobPoolForm>({
        title: "",
        company: user?.profile?.companyName || "",
        description: "",
        salary: "",
        salaryType: "yearly",
        location: "",
        remote: false,
        hybrid: false,
        jobType: "full-time",
        experience: "mid-level",
        duration: "",
        startDate: "",
        requiredSkills: [],
        preferredSkills: [],
        benefits: [],
        requirements: [],
        responsibilities: [],
        maxApplicants: 50,
        applicationDeadline: "",
        poolType: "public",
        budget: "",
        urgency: "medium"
    });

    const totalSteps = 4;

    const updateFormData = (field: keyof CreateJobPoolForm, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const nextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleCreatePool = async () => {
        if (!isConnected) {
            alert("Please connect your wallet to create a job pool");
            return;
        }

        if (!formData.title || !formData.description || formData.requiredSkills.length === 0) {
            alert("Please fill in all required fields");
            return;
        }

        setIsCreating(true);
        try {
            // TODO: Implement job pool creation via smart contract
            // const result = await createJobPool({
            //     ...formData,
            //     companyId: user?.accountId,
            //     createdAt: Date.now()
            // });

            const newPool = {
                id: Date.now(), // Temporary ID
                title: formData.title,
                company: formData.company,
                description: formData.description,
                requiredSkills: formData.requiredSkills,
                salary: formData.salary,
                duration: parseInt(formData.duration) || 0,
                stakeAmount: formData.budget || "0",
                status: "active" as const,
                applicants: [],
                createdAt: Date.now()
            };

            console.log('Creating job pool:', newPool);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Call the callback if provided
            if (onPoolCreated) {
                onPoolCreated(newPool);
            }

            // Close dialog and reset form
            setIsCreateDialogOpen(false);
            setCurrentStep(1);
            setFormData({
                title: "",
                company: user?.profile?.companyName || "",
                description: "",
                salary: "",
                salaryType: "yearly",
                location: "",
                remote: false,
                hybrid: false,
                jobType: "full-time",
                experience: "mid-level",
                duration: "",
                startDate: "",
                requiredSkills: [],
                preferredSkills: [],
                benefits: [],
                requirements: [],
                responsibilities: [],
                maxApplicants: 50,
                applicationDeadline: "",
                poolType: "public",
                budget: "",
                urgency: "medium"
            });

        } catch (error) {
            console.error('Failed to create job pool:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const toggleSkill = (skillId: number, isRequired: boolean = true) => {
        if (isRequired) {
            setFormData(prev => ({
                ...prev,
                requiredSkills: prev.requiredSkills.includes(skillId)
                    ? prev.requiredSkills.filter(id => id !== skillId)
                    : [...prev.requiredSkills, skillId]
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                preferredSkills: prev.preferredSkills.includes(skillId)
                    ? prev.preferredSkills.filter(id => id !== skillId)
                    : [...prev.preferredSkills, skillId]
            }));
        }
    };

    const toggleBenefit = (benefit: string) => {
        setFormData(prev => ({
            ...prev,
            benefits: prev.benefits.includes(benefit)
                ? prev.benefits.filter(b => b !== benefit)
                : [...prev.benefits, benefit]
        }));
    };

    const addRequirement = () => {
        const newRequirement = prompt("Enter a new requirement:");
        if (newRequirement && newRequirement.trim()) {
            setFormData(prev => ({
                ...prev,
                requirements: [...prev.requirements, newRequirement.trim()]
            }));
        }
    };

    const addResponsibility = () => {
        const newResponsibility = prompt("Enter a new responsibility:");
        if (newResponsibility && newResponsibility.trim()) {
            setFormData(prev => ({
                ...prev,
                responsibilities: [...prev.responsibilities, newResponsibility.trim()]
            }));
        }
    };

    const removeRequirement = (index: number) => {
        setFormData(prev => ({
            ...prev,
            requirements: prev.requirements.filter((_, i) => i !== index)
        }));
    };

    const removeResponsibility = (index: number) => {
        setFormData(prev => ({
            ...prev,
            responsibilities: prev.responsibilities.filter((_, i) => i !== index)
        }));
    };

    const getStepProgress = () => {
        return (currentStep / totalSteps) * 100;
    };

    const renderStep1 = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-hedera-600" />
                Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                        id="title"
                        placeholder="e.g., Senior React Developer"
                        value={formData.title}
                        onChange={(e) => updateFormData("title", e.target.value)}
                        className="mt-1"
                    />
                </div>
                <div>
                    <Label htmlFor="company">Company Name *</Label>
                    <Input
                        id="company"
                        placeholder="Your company name"
                        value={formData.company}
                        onChange={(e) => updateFormData("company", e.target.value)}
                        className="mt-1"
                    />
                </div>
            </div>

            <div>
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                    id="description"
                    placeholder="Provide a detailed description of the role, responsibilities, and what you're looking for..."
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    rows={4}
                    className="mt-1"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="salary">Salary/Compensation *</Label>
                    <Input
                        id="salary"
                        placeholder="e.g., 120000"
                        value={formData.salary}
                        onChange={(e) => updateFormData("salary", e.target.value)}
                        className="mt-1"
                    />
                </div>
                <div>
                    <Label htmlFor="salaryType">Salary Type</Label>
                    <Select value={formData.salaryType} onValueChange={(value) => updateFormData("salaryType", value)}>
                        <SelectTrigger className="mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {salaryTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                        id="location"
                        placeholder="e.g., San Francisco, CA or Remote"
                        value={formData.location}
                        onChange={(e) => updateFormData("location", e.target.value)}
                        className="mt-1"
                    />
                </div>
                <div>
                    <Label htmlFor="jobType">Job Type</Label>
                    <Select value={formData.jobType} onValueChange={(value) => updateFormData("jobType", value)}>
                        <SelectTrigger className="mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {jobTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="remote"
                        checked={formData.remote}
                        onCheckedChange={(checked) => updateFormData("remote", checked)}
                    />
                    <Label htmlFor="remote">Remote Work Available</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="hybrid"
                        checked={formData.hybrid}
                        onCheckedChange={(checked) => updateFormData("hybrid", checked)}
                    />
                    <Label htmlFor="hybrid">Hybrid Work Available</Label>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-hedera-600" />
                Requirements & Skills
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="experience">Experience Level</Label>
                    <Select value={formData.experience} onValueChange={(value) => updateFormData("experience", value)}>
                        <SelectTrigger className="mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {experienceLevels.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                    {level.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="maxApplicants">Max Applicants</Label>
                    <Input
                        id="maxApplicants"
                        type="number"
                        placeholder="50"
                        value={formData.maxApplicants}
                        onChange={(e) => updateFormData("maxApplicants", parseInt(e.target.value))}
                        className="mt-1"
                    />
                </div>
            </div>

            <div>
                <Label>Required Skills *</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Select the skills that are mandatory for this position
                </p>
                <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                    {skillTokens.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                            No skill tokens available. Create some skills first.
                        </p>
                    ) : (
                        skillTokens.map((skill) => (
                            <div key={skill.tokenId} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <Checkbox
                                    id={`required-${skill.tokenId}`}
                                    checked={formData.requiredSkills.includes(skill.tokenId)}
                                    onCheckedChange={() => toggleSkill(skill.tokenId, true)}
                                />
                                <label htmlFor={`required-${skill.tokenId}`} className="flex-1 cursor-pointer">
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

            <div>
                <Label>Preferred Skills</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Select additional skills that would be beneficial but not required
                </p>
                <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                    {skillTokens.map((skill) => (
                        <div key={skill.tokenId} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <Checkbox
                                id={`preferred-${skill.tokenId}`}
                                checked={formData.preferredSkills.includes(skill.tokenId)}
                                onCheckedChange={() => toggleSkill(skill.tokenId, false)}
                            />
                            <label htmlFor={`preferred-${skill.tokenId}`} className="flex-1 cursor-pointer">
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
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-hedera-600" />
                Details & Benefits
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="duration">Duration</Label>
                    <Input
                        id="duration"
                        placeholder="e.g., 6 months, Permanent, Project-based"
                        value={formData.duration}
                        onChange={(e) => updateFormData("duration", e.target.value)}
                        className="mt-1"
                    />
                </div>
                <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => updateFormData("startDate", e.target.value)}
                        className="mt-1"
                    />
                </div>
            </div>

            <div>
                <Label>Benefits & Perks</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {commonBenefits.map((benefit) => (
                        <div key={benefit} className="flex items-center space-x-2">
                            <Checkbox
                                id={`benefit-${benefit}`}
                                checked={formData.benefits.includes(benefit)}
                                onCheckedChange={() => toggleBenefit(benefit)}
                            />
                            <Label htmlFor={`benefit-${benefit}`} className="text-sm cursor-pointer">
                                {benefit}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <Label>Requirements</Label>
                <div className="space-y-2">
                    {formData.requirements.map((req, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <Input
                                value={req}
                                onChange={(e) => {
                                    const newRequirements = [...formData.requirements];
                                    newRequirements[index] = e.target.value;
                                    updateFormData("requirements", newRequirements);
                                }}
                                className="flex-1"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeRequirement(index)}
                                className="text-red-600 hover:text-red-700"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addRequirement}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Requirement
                    </Button>
                </div>
            </div>

            <div>
                <Label>Responsibilities</Label>
                <div className="space-y-2">
                    {formData.responsibilities.map((resp, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <Input
                                value={resp}
                                onChange={(e) => {
                                    const newResponsibilities = [...formData.responsibilities];
                                    newResponsibilities[index] = e.target.value;
                                    updateFormData("responsibilities", newResponsibilities);
                                }}
                                className="flex-1"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeResponsibility(index)}
                                className="text-red-600 hover:text-red-700"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addResponsibility}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Responsibility
                    </Button>
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-hedera-600" />
                Pool Settings & Review
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="poolType">Pool Visibility</Label>
                    <Select value={formData.poolType} onValueChange={(value) => updateFormData("poolType", value)}>
                        <SelectTrigger className="mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {poolTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="urgency">Urgency Level</Label>
                    <Select value={formData.urgency} onValueChange={(value) => updateFormData("urgency", value)}>
                        <SelectTrigger className="mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {urgencyLevels.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                    {level.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="budget">Budget Range</Label>
                    <Input
                        id="budget"
                        placeholder="e.g., $50k - $100k"
                        value={formData.budget}
                        onChange={(e) => updateFormData("budget", e.target.value)}
                        className="mt-1"
                    />
                </div>
                <div>
                    <Label htmlFor="applicationDeadline">Application Deadline</Label>
                    <Input
                        id="applicationDeadline"
                        type="date"
                        value={formData.applicationDeadline}
                        onChange={(e) => updateFormData("applicationDeadline", e.target.value)}
                        className="mt-1"
                    />
                </div>
            </div>

            {/* Review Section */}
            <Card>
                <CardContent className="p-4">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Pool Summary</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Job Title:</span>
                            <span className="font-medium">{formData.title || "Not specified"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Company:</span>
                            <span className="font-medium">{formData.company || "Not specified"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Salary:</span>
                            <span className="font-medium">
                                {formData.salary ? `${formData.salary} (${formData.salaryType})` : "Not specified"}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Required Skills:</span>
                            <span className="font-medium">{formData.requiredSkills.length} skills</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Job Type:</span>
                            <span className="font-medium capitalize">{formData.jobType}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Experience:</span>
                            <span className="font-medium capitalize">{formData.experience}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button size="sm" className="bg-gradient-to-r from-hedera-600 to-hedera-700 hover:from-hedera-700 hover:to-hedera-800 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Pool
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-4">
                    <div>
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-hedera-600 to-web3-pink-600 bg-clip-text text-transparent">
                            Create Job Pool
                        </DialogTitle>
                        <DialogDescription className="text-slate-600 dark:text-slate-400 mt-2">
                            Create a new talent pool to attract qualified candidates for your position
                        </DialogDescription>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-hedera-500 to-web3-pink-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getStepProgress()}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                        <span>Step {currentStep} of {totalSteps}</span>
                        <span>{Math.round(getStepProgress())}% Complete</span>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Step Content */}
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 4 && renderStep4()}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button
                            variant="outline"
                            onClick={prevStep}
                            disabled={currentStep === 1}
                        >
                            Previous
                        </Button>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsCreateDialogOpen(false)}
                                disabled={isCreating}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>

                            {currentStep < totalSteps ? (
                                <Button
                                    onClick={nextStep}
                                    className="bg-hedera-600 hover:bg-hedera-700"
                                >
                                    Next
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleCreatePool}
                                    disabled={isCreating || !formData.title || !formData.description || formData.requiredSkills.length === 0}
                                    className="bg-gradient-to-r from-hedera-600 to-web3-pink-600 hover:from-hedera-700 hover:to-web3-pink-700 text-white"
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Creating Pool...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Create Job Pool
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
