"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Briefcase,
    Search,
    Filter,
    MapPin,
    Building,
    DollarSign,
    Clock,
    Users,
    Star,
    ExternalLink,
    Bookmark,
    BookmarkPlus,
    CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { CreateSkillTokenDialog } from "@/components/skills/create-skill-token-dialog";
import { ViewJobDetailsDialog } from "@/components/jobs/view-job-details-dialog";
import { ApplyWithSkillsDialog } from "@/components/jobs/apply-with-skills-dialog";
import { WalletConnectionPrompt } from "@/components/dashboard/wallet-connection-prompt";

// Mock job data - will be replaced with real API calls
const mockJobs = [
    {
        id: 1,
        title: "Senior React Developer",
        company: "TechCorp Inc.",
        location: "San Francisco, CA",
        type: "Full-time",
        salary: "$120k - $180k",
        posted: "2 days ago",
        skills: ["React", "TypeScript", "Node.js", "AWS"],
        description: "We're looking for a senior React developer to join our team and help build the next generation of web applications.",
        experience: "5+ years",
        remote: true,
        urgent: true,
        benefits: ["Health Insurance", "Remote Work", "Stock Options", "Flexible Hours", "Learning Budget"],
        requirements: [
            "5+ years of experience with React and modern JavaScript",
            "Strong understanding of TypeScript and ES6+ features",
            "Experience with Node.js and backend development",
            "Knowledge of AWS cloud services",
            "Experience with testing frameworks (Jest, React Testing Library)"
        ],
        responsibilities: [
            "Develop and maintain high-quality React applications",
            "Collaborate with cross-functional teams",
            "Mentor junior developers",
            "Participate in code reviews and technical discussions",
            "Contribute to architectural decisions"
        ],
        companyInfo: {
            description: "TechCorp Inc. is a leading technology company specializing in AI and machine learning solutions for enterprise clients. We're building the future of intelligent software.",
            size: "500-1000 employees",
            industry: "Technology",
            founded: "2015",
            website: "https://techcorp.com",
            rating: 4.5,
            reviews: 128
        },
        applicationProcess: {
            steps: [
                "Submit application with skill tokens",
                "Initial skill assessment",
                "Technical interview",
                "Team collaboration exercise",
                "Final interview with hiring manager"
            ],
            timeline: "2-3 weeks from application to offer",
            nextSteps: "Applications are reviewed within 48 hours. Qualified candidates will be contacted for next steps."
        }
    },
    {
        id: 2,
        title: "Blockchain Developer",
        company: "Hedera Labs",
        location: "Remote",
        type: "Contract",
        salary: "$80k - $120k",
        posted: "1 week ago",
        skills: ["Solidity", "Hedera", "Smart Contracts", "JavaScript"],
        description: "Join our team to build innovative blockchain solutions on the Hedera network.",
        experience: "3+ years",
        remote: true,
        urgent: false,
        benefits: ["Remote Work", "Crypto Payments", "Flexible Hours", "Learning Budget", "Conference Attendance"],
        requirements: [
            "3+ years of blockchain development experience",
            "Proficiency in Solidity and smart contract development",
            "Experience with Hedera Hashgraph or similar DLT platforms",
            "Strong JavaScript/TypeScript skills",
            "Understanding of cryptographic principles"
        ],
        responsibilities: [
            "Design and develop smart contracts on Hedera",
            "Implement blockchain integration solutions",
            "Write comprehensive tests for smart contracts",
            "Collaborate with frontend and backend teams",
            "Stay updated with blockchain technology trends"
        ],
        companyInfo: {
            description: "Hedera Labs is an innovative blockchain company building the future of decentralized applications on the Hedera network.",
            size: "100-250 employees",
            industry: "Blockchain",
            founded: "2020",
            website: "https://hederalabs.com",
            rating: 4.8,
            reviews: 89
        },
        applicationProcess: {
            steps: [
                "Submit application with blockchain skill tokens",
                "Smart contract code review",
                "Technical interview focusing on blockchain concepts",
                "Take-home assignment",
                "Final team interview"
            ],
            timeline: "3-4 weeks from application to offer",
            nextSteps: "Applications are reviewed weekly. Selected candidates will receive a take-home assignment."
        }
    },
    {
        id: 3,
        title: "UI/UX Designer",
        company: "Design Studio",
        location: "New York, NY",
        type: "Full-time",
        salary: "$90k - $130k",
        posted: "3 days ago",
        skills: ["Figma", "Adobe Creative Suite", "User Research", "Prototyping"],
        description: "Create beautiful and intuitive user experiences for our digital products.",
        experience: "4+ years",
        remote: false,
        urgent: false,
        benefits: ["Health Insurance", "Creative Freedom", "Professional Development", "Team Events", "Design Tools"],
        requirements: [
            "4+ years of UI/UX design experience",
            "Proficiency in Figma and Adobe Creative Suite",
            "Experience with user research and usability testing",
            "Strong portfolio showcasing web and mobile designs",
            "Understanding of design systems and component libraries"
        ],
        responsibilities: [
            "Create user-centered design solutions",
            "Conduct user research and usability testing",
            "Design high-fidelity prototypes",
            "Collaborate with product and engineering teams",
            "Maintain and evolve design systems"
        ],
        companyInfo: {
            description: "Design Studio is a creative design agency helping brands create meaningful digital experiences through innovative design solutions.",
            size: "50-100 employees",
            industry: "Design",
            founded: "2018",
            website: "https://designstudiopro.com",
            rating: 4.3,
            reviews: 67
        },
        applicationProcess: {
            steps: [
                "Submit application with design skill tokens",
                "Portfolio review",
                "Design challenge assignment",
                "Portfolio presentation",
                "Team collaboration interview"
            ],
            timeline: "2-3 weeks from application to offer",
            nextSteps: "Portfolio reviews happen weekly. Selected candidates will receive a design challenge."
        }
    },
    {
        id: 4,
        title: "DevOps Engineer",
        company: "Cloud Solutions",
        location: "Austin, TX",
        type: "Full-time",
        salary: "$100k - $150k",
        posted: "5 days ago",
        skills: ["Docker", "Kubernetes", "AWS", "Terraform"],
        description: "Help us build and maintain scalable infrastructure for our cloud-based applications.",
        experience: "4+ years",
        remote: true,
        urgent: false,
        benefits: ["Health Insurance", "Remote Work", "Competitive Salary", "401k", "Professional Certifications"],
        requirements: [
            "4+ years of DevOps or infrastructure experience",
            "Strong knowledge of Docker and Kubernetes",
            "Experience with AWS cloud services",
            "Proficiency in Infrastructure as Code (Terraform)",
            "Understanding of CI/CD pipelines"
        ],
        responsibilities: [
            "Design and implement cloud infrastructure",
            "Automate deployment and scaling processes",
            "Monitor system performance and reliability",
            "Collaborate with development teams",
            "Implement security best practices"
        ],
        companyInfo: {
            description: "Cloud Solutions is an enterprise cloud infrastructure company providing scalable solutions for businesses of all sizes.",
            size: "250-500 employees",
            industry: "Cloud Services",
            founded: "2016",
            website: "https://cloudsolutions.com",
            rating: 4.1,
            reviews: 156
        },
        applicationProcess: {
            steps: [
                "Submit application with DevOps skill tokens",
                "Technical assessment",
                "Infrastructure design interview",
                "Hands-on technical exercise",
                "Final team interview"
            ],
            timeline: "3-4 weeks from application to offer",
            nextSteps: "Technical assessments are scheduled within a week of application review."
        }
    }
];

const jobTypes = ["All Types", "Full-time", "Part-time", "Contract", "Internship"];
const experienceLevels = ["All Levels", "Entry", "Mid-level", "Senior", "Lead"];
const remoteOptions = ["All", "Remote", "On-site", "Hybrid"];

export default function JobsPage() {
    const { isConnected } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("All Types");
    const [selectedExperience, setSelectedExperience] = useState("All Levels");
    const [selectedRemote, setSelectedRemote] = useState("All");
    const [savedJobs, setSavedJobs] = useState<number[]>([]);
    const [submittedApplications, setSubmittedApplications] = useState<number[]>([]);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    // Filter jobs based on search and filters
    const filteredJobs = mockJobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesType = selectedType === "All Types" || job.type === selectedType;
        const matchesExperience = selectedExperience === "All Levels" ||
            (selectedExperience === "Entry" && job.experience.includes("1-2")) ||
            (selectedExperience === "Mid-level" && job.experience.includes("3-4")) ||
            (selectedExperience === "Senior" && job.experience.includes("5+")) ||
            (selectedExperience === "Lead" && job.experience.includes("7+"));

        const matchesRemote = selectedRemote === "All" ||
            (selectedRemote === "Remote" && job.remote) ||
            (selectedRemote === "On-site" && !job.remote) ||
            (selectedRemote === "Hybrid" && job.remote);

        return matchesSearch && matchesType && matchesExperience && matchesRemote;
    });

    const toggleSavedJob = (jobId: number) => {
        setSavedJobs(prev =>
            prev.includes(jobId)
                ? prev.filter(id => id !== jobId)
                : [...prev, jobId]
        );
    };

    if (!isConnected) {
        return (
            <WalletConnectionPrompt
                title="Connect to Browse Jobs"
                description="Connect your Hedera wallet to browse job opportunities and apply with your skill tokens."
            />
        );
    }

    return (
        <div className="w-full">
            <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                Job Opportunities
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-2">
                                Discover and apply to jobs that match your skills and experience
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-sm">
                                {filteredJobs.length} opportunities
                            </Badge>
                            <Button variant="outline" size="sm">
                                <BookmarkPlus className="w-4 h-4 mr-2" />
                                Saved Jobs ({savedJobs.length})
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Success Message */}
                {showSuccessMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg"
                    >
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-700 dark:text-green-300 font-medium">
                                Application submitted successfully! The company will review your skills and contact you soon.
                            </span>
                        </div>
                    </motion.div>
                )}

                {/* Filters and Search */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="mb-8"
                >
                    <Card>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search jobs, companies, skills..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                {/* Job Type Filter */}
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

                                {/* Experience Level Filter */}
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

                                {/* Remote Option Filter */}
                                <Select value={selectedRemote} onValueChange={setSelectedRemote}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {remoteOptions.map((option) => (
                                            <SelectItem key={option} value={option}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Jobs Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="space-y-6"
                >
                    {filteredJobs.map((job, index) => (
                        <motion.div
                            key={job.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 * index }}
                        >
                            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            {/* Job Header */}
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-hedera-500 to-hedera-600 rounded-lg flex items-center justify-center flex-shrink-0">
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
                                                            {job.company}
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

                                            {/* Job Details */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                        {job.salary}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                        {job.experience}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Star className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                                        {job.remote ? "Remote" : "On-site"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                                                {job.description}
                                            </p>

                                            {/* Skills */}
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {job.skills.map((skill) => (
                                                    <Badge key={skill} variant="secondary" className="text-xs">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2 ml-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleSavedJob(job.id)}
                                                className={`h-8 w-8 p-0 ${savedJobs.includes(job.id)
                                                    ? 'text-hedera-600 dark:text-hedera-400'
                                                    : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                            >
                                                {savedJobs.includes(job.id) ? (
                                                    <Bookmark className="w-4 h-4 fill-current" />
                                                ) : (
                                                    <BookmarkPlus className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Apply Button */}
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                            <Clock className="w-4 h-4" />
                                            Posted {job.posted}
                                        </div>
                                        <div className="flex gap-2">
                                            <ViewJobDetailsDialog job={job} />
                                            {submittedApplications.includes(job.id) ? (
                                                <Button size="sm" variant="outline" className="text-green-600 border-green-600" disabled>
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Applied
                                                </Button>
                                            ) : (
                                                <ApplyWithSkillsDialog
                                                    job={job}
                                                    onApplicationSubmitted={(application) => {
                                                        console.log('Application submitted:', application);
                                                        setSubmittedApplications(prev => [...prev, job.id]);
                                                        setShowSuccessMessage(true);
                                                        setTimeout(() => setShowSuccessMessage(false), 5000);
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}

                    {/* Empty State */}
                    {filteredJobs.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-center py-12"
                        >
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
                                    setSelectedType("All Types");
                                    setSelectedExperience("All Levels");
                                    setSelectedRemote("All");
                                }}
                                variant="outline"
                            >
                                Clear Filters
                            </Button>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
