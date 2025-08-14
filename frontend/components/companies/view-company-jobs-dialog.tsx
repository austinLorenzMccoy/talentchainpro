"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Building, MapPin, DollarSign, Clock, Users, Star, Briefcase, Filter, Search, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useAuth } from "@/hooks/useAuth";

interface CompanyJob {
    id: number;
    title: string;
    type: string;
    salary: string;
    location: string;
    posted: string;
    skills: string[];
    description: string;
    experience: string;
    remote: boolean;
    urgent: boolean;
    department: string;
    benefits: string[];
    requirements: string[];
    responsibilities: string[];
}

interface CompanyJobs {
    id: number;
    name: string;
    industry: string;
    size: string;
    location: string;
    website: string;
    description: string;
    rating: number;
    reviews: number;
    openPositions: number;
    hiringStatus: "actively-hiring" | "selective-hiring" | "not-hiring";
    jobs: CompanyJob[];
}

interface ViewCompanyJobsDialogProps {
    company: CompanyJobs;
    triggerButton?: React.ReactNode;
    onJobApplied?: (jobId: number) => void;
}

// Mock company jobs data - will be replaced with real API calls
const getCompanyJobs = (companyId: number): CompanyJob[] => [
    {
        id: 1,
        title: "Senior React Developer",
        type: "Full-time",
        salary: "$120k - $180k",
        location: "San Francisco, CA",
        posted: "2 days ago",
        skills: ["React", "TypeScript", "Node.js", "AWS"],
        description: "We're looking for a senior React developer to join our team and help build the next generation of web applications.",
        experience: "5+ years",
        remote: true,
        urgent: true,
        department: "Engineering",
        benefits: ["Health Insurance", "Remote Work", "Stock Options", "Flexible Hours"],
        requirements: [
            "5+ years of experience with React and modern JavaScript",
            "Strong understanding of TypeScript and ES6+ features",
            "Experience with Node.js and backend development"
        ],
        responsibilities: [
            "Develop and maintain high-quality React applications",
            "Collaborate with cross-functional teams",
            "Mentor junior developers"
        ]
    },
    {
        id: 2,
        title: "Product Manager",
        type: "Full-time",
        salary: "$130k - $200k",
        location: "New York, NY",
        posted: "1 week ago",
        skills: ["Product Management", "Agile", "Data Analysis", "User Research"],
        description: "Lead product strategy and execution for our core platform features.",
        experience: "7+ years",
        remote: false,
        urgent: false,
        department: "Product",
        benefits: ["Health Insurance", "Stock Options", "Professional Development", "Team Events"],
        requirements: [
            "7+ years of product management experience",
            "Strong analytical and strategic thinking",
            "Experience with agile methodologies"
        ],
        responsibilities: [
            "Define product vision and strategy",
            "Lead cross-functional product teams",
            "Analyze market trends and user feedback"
        ]
    },
    {
        id: 3,
        title: "DevOps Engineer",
        type: "Contract",
        salary: "$80k - $120k",
        location: "Remote",
        posted: "3 days ago",
        skills: ["Docker", "Kubernetes", "AWS", "Terraform"],
        description: "Help us build and maintain scalable infrastructure for our cloud-based applications.",
        experience: "4+ years",
        remote: true,
        urgent: false,
        department: "Engineering",
        benefits: ["Remote Work", "Competitive Salary", "Professional Certifications"],
        requirements: [
            "4+ years of DevOps or infrastructure experience",
            "Strong knowledge of Docker and Kubernetes",
            "Experience with AWS cloud services"
        ],
        responsibilities: [
            "Design and implement cloud infrastructure",
            "Automate deployment and scaling processes",
            "Monitor system performance and reliability"
        ]
    },
    {
        id: 4,
        title: "UI/UX Designer",
        type: "Full-time",
        salary: "$90k - $130k",
        location: "Austin, TX",
        posted: "5 days ago",
        skills: ["Figma", "Adobe Creative Suite", "User Research", "Prototyping"],
        description: "Create beautiful and intuitive user experiences for our digital products.",
        experience: "4+ years",
        remote: false,
        urgent: false,
        department: "Design",
        benefits: ["Health Insurance", "Creative Freedom", "Professional Development", "Design Tools"],
        requirements: [
            "4+ years of UI/UX design experience",
            "Proficiency in Figma and Adobe Creative Suite",
            "Experience with user research and usability testing"
        ],
        responsibilities: [
            "Create user-centered design solutions",
            "Conduct user research and usability testing",
            "Design high-fidelity prototypes"
        ]
    }
];

export function ViewCompanyJobsDialog({
    company,
    triggerButton,
    onJobApplied
}: ViewCompanyJobsDialogProps) {
    const { isConnected } = useAuth();
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
    const [selectedType, setSelectedType] = useState("All Types");
    const [selectedExperience, setSelectedExperience] = useState("All Levels");
    const [appliedJobs, setAppliedJobs] = useState<number[]>([]);

    const companyJobs = getCompanyJobs(company.id);

    // Filter jobs based on search and filters
    const filteredJobs = companyJobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesDepartment = selectedDepartment === "All Departments" || job.department === selectedDepartment;
        const matchesType = selectedType === "All Types" || job.type === selectedType;
        const matchesExperience = selectedExperience === "All Levels" ||
            (selectedExperience === "Entry" && job.experience.includes("1-2")) ||
            (selectedExperience === "Mid-level" && job.experience.includes("3-4")) ||
            (selectedExperience === "Senior" && job.experience.includes("5+")) ||
            (selectedExperience === "Lead" && job.experience.includes("7+"));

        return matchesSearch && matchesDepartment && matchesType && matchesExperience;
    });

    const departments = ["All Departments", ...Array.from(new Set(companyJobs.map(job => job.department)))];
    const jobTypes = ["All Types", ...Array.from(new Set(companyJobs.map(job => job.type)))];
    const experienceLevels = ["All Levels", "Entry", "Mid-level", "Senior", "Lead"];

    const handleQuickApply = (jobId: number) => {
        if (!isConnected) {
            alert("Please connect your wallet to apply for jobs");
            return;
        }

        setAppliedJobs(prev => [...prev, jobId]);
        if (onJobApplied) {
            onJobApplied(jobId);
        }
    };

    const getJobTypeColor = (type: string) => {
        switch (type) {
            case "Full-time":
                return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
            case "Part-time":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
            case "Contract":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
            case "Internship":
                return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
            default:
                return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400";
        }
    };

    return (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button size="sm" className="bg-hedera-600 hover:bg-hedera-700">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Jobs
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-hedera-600 to-web3-pink-600 bg-clip-text text-transparent">
                                Jobs at {company.name}
                            </DialogTitle>
                            <DialogDescription className="text-slate-600 dark:text-slate-400 mt-2">
                                Browse and apply to open positions at {company.name}
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            <Badge variant="secondary" className="text-sm">
                                {company.openPositions} open positions
                            </Badge>
                            <Badge className={company.hiringStatus === "actively-hiring" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"}>
                                {company.hiringStatus === "actively-hiring" ? "Actively Hiring" : "Selective Hiring"}
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Company Summary */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{company.name}</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{company.industry} • {company.size}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{company.location}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        {company.rating}/5.0 ({company.reviews} reviews)
                                    </span>
                                </div>
                                <div className="text-right">
                                    <a
                                        href={company.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-hedera-600 hover:text-hedera-700 dark:text-hedera-400 dark:hover:text-hedera-300 underline"
                                    >
                                        Visit Website
                                    </a>
                                </div>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
                                {company.description}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Filters and Search */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search jobs, skills..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept} value={dept}>
                                                {dept}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={selectedType} onValueChange={setSelectedType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {jobTypes.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {experienceLevels.map((level) => (
                                            <SelectItem key={level} value={level}>
                                                {level}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Jobs List */}
                    <div className="space-y-4">
                        {filteredJobs.length > 0 ? (
                            filteredJobs.map((job) => (
                                <Card key={job.id} className="group hover:shadow-lg transition-all duration-300">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-hedera-500 to-web3-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <Briefcase className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white group-hover:text-hedera-600 transition-colors">
                                                            {job.title}
                                                        </h3>
                                                        {job.urgent && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                Urgent
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                                        <div className="flex items-center gap-1">
                                                            <Building className="w-4 h-4" />
                                                            {company.name}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="w-4 h-4" />
                                                            {job.location}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            {job.posted}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={getJobTypeColor(job.type)}>
                                                    {job.type}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {job.department}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-600 dark:text-slate-400">Experience</span>
                                                <span className="text-sm font-medium text-slate-900 dark:text-white">{job.experience}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-600 dark:text-slate-400">Salary</span>
                                                <span className="text-sm font-medium text-slate-900 dark:text-white">{job.salary}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-600 dark:text-slate-400">Remote</span>
                                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                                    {job.remote ? "Yes" : "No"}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                                            {job.description}
                                        </p>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {job.skills.map((skill) => (
                                                <Badge key={skill} variant="secondary" className="text-xs">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                <Clock className="w-4 h-4" />
                                                Posted {job.posted}
                                            </div>
                                            <div className="flex gap-2">
                                                {appliedJobs.includes(job.id) ? (
                                                    <Button variant="outline" className="text-green-600 border-green-600" disabled>
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Applied
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleQuickApply(job.id)}
                                                        className="bg-hedera-600 hover:bg-hedera-700"
                                                    >
                                                        <Briefcase className="w-4 h-4 mr-2" />
                                                        Quick Apply
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <Briefcase className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                    No jobs found
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Try adjusting your search criteria or check back later for new opportunities.
                                </p>
                                <Button
                                    onClick={() => {
                                        setSearchTerm("");
                                        setSelectedDepartment("All Departments");
                                        setSelectedType("All Types");
                                        setSelectedExperience("All Levels");
                                    }}
                                    variant="outline"
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        )}
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
                            View All Jobs
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
