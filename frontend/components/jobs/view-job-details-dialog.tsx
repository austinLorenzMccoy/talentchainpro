"use client";

import { useState } from "react";
import { ExternalLink, Building, MapPin, DollarSign, Clock, Users, Star, Calendar, FileText, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface JobDetails {
    id: number;
    title: string;
    company: string;
    location: string;
    type: string;
    salary: string;
    posted: string;
    skills: string[];
    description: string;
    experience: string;
    remote: boolean;
    urgent: boolean;
    benefits: string[];
    requirements: string[];
    responsibilities: string[];
    companyInfo: {
        description: string;
        size: string;
        industry: string;
        founded: string;
        website: string;
        rating: number;
        reviews: number;
    };
    applicationProcess: {
        steps: string[];
        timeline: string;
        nextSteps: string;
    };
}

interface ViewJobDetailsDialogProps {
    job: JobDetails;
    triggerButton?: React.ReactNode;
}

export function ViewJobDetailsDialog({
    job,
    triggerButton
}: ViewJobDetailsDialogProps) {
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

    return (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Details
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-hedera-600 to-web3-pink-600 bg-clip-text text-transparent">
                                {job.title}
                            </DialogTitle>
                            <DialogDescription className="text-slate-600 dark:text-slate-400 mt-2">
                                Comprehensive job details and company information
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            {job.urgent && (
                                <Badge variant="destructive" className="text-xs">
                                    Urgent
                                </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                                {job.type}
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Job Header */}
                    <div className="bg-gradient-to-r from-hedera-50 to-web3-pink-50 dark:from-hedera-950/30 dark:to-web3-pink-950/30 p-6 rounded-lg border border-hedera-200 dark:border-hedera-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="flex items-center gap-2">
                                <Building className="w-5 h-5 text-hedera-600" />
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Company</p>
                                    <p className="font-medium text-slate-900 dark:text-white">{job.company}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-hedera-600" />
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Location</p>
                                    <p className="font-medium text-slate-900 dark:text-white">{job.location}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-hedera-600" />
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Salary</p>
                                    <p className="font-medium text-slate-900 dark:text-white">{job.salary}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-hedera-600" />
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Posted</p>
                                    <p className="font-medium text-slate-900 dark:text-white">{job.posted}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Company Information */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Building className="w-5 h-5 text-hedera-600" />
                                About {job.company}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">Industry:</span>
                                        <p className="font-medium text-slate-900 dark:text-white">{job.companyInfo.industry}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">Company Size:</span>
                                        <p className="font-medium text-slate-900 dark:text-white">{job.companyInfo.size}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">Founded:</span>
                                        <p className="font-medium text-slate-900 dark:text-white">{job.companyInfo.founded}</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                            Rating: {job.companyInfo.rating}/5.0 ({job.companyInfo.reviews} reviews)
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">Website:</span>
                                        <a
                                            href={job.companyInfo.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-hedera-600 hover:text-hedera-700 dark:text-hedera-400 dark:hover:text-hedera-300 ml-2 underline"
                                        >
                                            Visit Website
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
                                {job.companyInfo.description}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Job Description */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-hedera-600" />
                                Job Description
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                                {job.description}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium text-slate-900 dark:text-white mb-3">Requirements</h4>
                                    <ul className="space-y-2">
                                        {job.requirements.map((req, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <CheckCircle className="w-4 h-4 text-hedera-500 mt-0.5 flex-shrink-0" />
                                                {req}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-900 dark:text-white mb-3">Responsibilities</h4>
                                    <ul className="space-y-2">
                                        {job.responsibilities.map((resp, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <CheckCircle className="w-4 h-4 text-hedera-500 mt-0.5 flex-shrink-0" />
                                                {resp}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Required Skills */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Star className="w-5 h-5 text-hedera-600" />
                                Required Skills
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {job.skills.map((skill) => (
                                    <Badge key={skill} variant="secondary" className="text-sm">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Benefits */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-hedera-600" />
                                Benefits & Perks
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {job.benefits.map((benefit, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-hedera-500" />
                                        <span className="text-slate-600 dark:text-slate-400">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Application Process */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-hedera-600" />
                                Application Process
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">Application Steps</h4>
                                    <ol className="space-y-2">
                                        {job.applicationProcess.steps.map((step, index) => (
                                            <li key={index} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                <div className="w-6 h-6 bg-hedera-100 dark:bg-hedera-900/50 text-hedera-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                                                    {index + 1}
                                                </div>
                                                {step}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">Timeline</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{job.applicationProcess.timeline}</p>
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">Next Steps</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{job.applicationProcess.nextSteps}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

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
                            Apply Now
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
