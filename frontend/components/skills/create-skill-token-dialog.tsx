"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface CreateSkillTokenDialogProps {
    onSkillCreated?: (skillData: any) => void;
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

export function CreateSkillTokenDialog({
    onSkillCreated,
    isLoading: externalLoading,
    setIsLoading: externalSetLoading,
    triggerButton
}: CreateSkillTokenDialogProps) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [internalLoading, setInternalLoading] = useState(false);

    // Use external loading state if provided, otherwise use internal
    const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;
    const setIsLoading = externalSetLoading || setInternalLoading;

    // Form state for creating new skill
    const [newSkill, setNewSkill] = useState({
        category: "",
        customCategory: "",
        initialLevel: 1,
        evidence: "",
        description: ""
    });

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

            // Call the callback if provided
            if (onSkillCreated) {
                onSkillCreated(skillData);
            }

            // Close dialog and reset form
            setIsCreateDialogOpen(false);
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

    const resetForm = () => {
        setNewSkill({
            category: "",
            customCategory: "",
            initialLevel: 1,
            evidence: "",
            description: ""
        });
    };

    const handleDialogChange = (open: boolean) => {
        setIsCreateDialogOpen(open);
        if (!open) {
            resetForm();
        }
    };

    return (
        <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button className="bg-hedera-600 hover:bg-hedera-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Skill Token
                    </Button>
                )}
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
                        <Select value={newSkill.category} onValueChange={(value) => setNewSkill({ ...newSkill, category: value })}>
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
                                onChange={(e) => setNewSkill({ ...newSkill, customCategory: e.target.value })}
                                placeholder="Enter custom skill category"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="level">Initial Level (1-10)</Label>
                        <Select value={newSkill.initialLevel.toString()} onValueChange={(value) => setNewSkill({ ...newSkill, initialLevel: parseInt(value) })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
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
                            onChange={(e) => setNewSkill({ ...newSkill, evidence: e.target.value })}
                            placeholder="Provide links to your work, certifications, or portfolio"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={newSkill.description}
                            onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
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
    );
}
