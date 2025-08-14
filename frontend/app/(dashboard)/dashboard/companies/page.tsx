"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Building,
    Search,
    MapPin,
    Users,
    Globe,
    Star,
    ExternalLink,
    Mail,
    Phone,
    Calendar,
    TrendingUp,
    Award,
    Briefcase,
    Heart,
    HeartOff
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
import { WalletConnectionPrompt } from "@/components/dashboard/wallet-connection-prompt";

// Mock company data - will be replaced with real API calls
const mockCompanies = [
    {
        id: 1,
        name: "TechCorp Inc.",
        industry: "Technology",
        size: "500-1000 employees",
        location: "San Francisco, CA",
        founded: "2015",
        website: "https://techcorp.com",
        description: "Leading technology company specializing in AI and machine learning solutions for enterprise clients.",
        rating: 4.5,
        reviews: 128,
        openPositions: 12,
        skills: ["AI/ML", "Cloud Computing", "Data Science", "Software Engineering"],
        benefits: ["Health Insurance", "Remote Work", "Stock Options", "Flexible Hours"],
        featured: true,
        verified: true
    },
    {
        id: 2,
        name: "Hedera Labs",
        industry: "Blockchain",
        size: "100-250 employees",
        location: "Remote",
        founded: "2020",
        website: "https://hederalabs.com",
        description: "Innovative blockchain company building the future of decentralized applications on the Hedera network.",
        rating: 4.8,
        reviews: 89,
        openPositions: 8,
        skills: ["Blockchain", "Smart Contracts", "Hedera", "Web3"],
        benefits: ["Remote Work", "Crypto Payments", "Flexible Hours", "Learning Budget"],
        featured: true,
        verified: true
    },
    {
        id: 3,
        name: "Design Studio Pro",
        industry: "Design",
        size: "50-100 employees",
        location: "New York, NY",
        founded: "2018",
        website: "https://designstudiopro.com",
        description: "Creative design agency helping brands create meaningful digital experiences through innovative design solutions.",
        rating: 4.3,
        reviews: 67,
        openPositions: 5,
        skills: ["UI/UX Design", "Graphic Design", "Branding", "Prototyping"],
        benefits: ["Health Insurance", "Creative Freedom", "Professional Development", "Team Events"],
        featured: false,
        verified: true
    },
    {
        id: 4,
        name: "Cloud Solutions Ltd",
        industry: "Cloud Services",
        size: "250-500 employees",
        location: "Austin, TX",
        founded: "2016",
        website: "https://cloudsolutions.com",
        description: "Enterprise cloud infrastructure company providing scalable solutions for businesses of all sizes.",
        rating: 4.1,
        reviews: 156,
        openPositions: 15,
        skills: ["Cloud Computing", "DevOps", "Infrastructure", "Security"],
        benefits: ["Health Insurance", "Remote Work", "Competitive Salary", "401k"],
        featured: false,
        verified: true
    },
    {
        id: 5,
        name: "Green Energy Co",
        industry: "Renewable Energy",
        size: "1000+ employees",
        location: "Denver, CO",
        founded: "2012",
        website: "https://greenenergy.com",
        description: "Sustainable energy company focused on renewable energy solutions and environmental impact reduction.",
        rating: 4.6,
        reviews: 234,
        openPositions: 20,
        skills: ["Renewable Energy", "Engineering", "Sustainability", "Project Management"],
        benefits: ["Health Insurance", "Environmental Impact", "Professional Growth", "Competitive Benefits"],
        featured: true,
        verified: true
    }
];

const industries = ["All Industries", "Technology", "Blockchain", "Design", "Cloud Services", "Renewable Energy", "Finance", "Healthcare"];
const companySizes = ["All Sizes", "1-10", "11-50", "51-100", "101-250", "251-500", "501-1000", "1000+"];
const locations = ["All Locations", "San Francisco", "New York", "Remote", "Austin", "Denver", "Seattle", "Boston"];

export default function CompaniesPage() {
    const { isConnected } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIndustry, setSelectedIndustry] = useState("All Industries");
    const [selectedSize, setSelectedSize] = useState("All Sizes");
    const [selectedLocation, setSelectedLocation] = useState("All Locations");
    const [favoriteCompanies, setFavoriteCompanies] = useState<number[]>([]);

    // Filter companies based on search and filters
    const filteredCompanies = mockCompanies.filter(company => {
        const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesIndustry = selectedIndustry === "All Industries" || company.industry === selectedIndustry;
        const matchesSize = selectedSize === "All Sizes" || company.size === selectedSize;
        const matchesLocation = selectedLocation === "All Locations" ||
            company.location.toLowerCase().includes(selectedLocation.toLowerCase());

        return matchesSearch && matchesIndustry && matchesSize && matchesLocation;
    });

    const toggleFavorite = (companyId: number) => {
        setFavoriteCompanies(prev =>
            prev.includes(companyId)
                ? prev.filter(id => id !== companyId)
                : [...prev, companyId]
        );
    };

    if (!isConnected) {
        return (
            <WalletConnectionPrompt
                title="Connect to Browse Companies"
                description="Connect your Hedera wallet to explore company profiles and discover job opportunities."
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
                                Company Profiles
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-2">
                                Discover companies and explore their culture, benefits, and opportunities
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-sm">
                                {filteredCompanies.length} companies
                            </Badge>
                            <Button variant="outline" size="sm">
                                <Heart className="w-4 h-4 mr-2" />
                                Favorites ({favoriteCompanies.length})
                            </Button>
                        </div>
                    </div>
                </motion.div>

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
                                        placeholder="Search companies, industries, skills..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                {/* Industry Filter */}
                                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {industries.map((industry) => (
                                            <SelectItem key={industry} value={industry}>
                                                {industry}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Company Size Filter */}
                                <Select value={selectedSize} onValueChange={setSelectedSize}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companySizes.map((size) => (
                                            <SelectItem key={size} value={size}>
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Location Filter */}
                                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locations.map((location) => (
                                            <SelectItem key={location} value={location}>
                                                {location}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Companies Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                    {filteredCompanies.map((company, index) => (
                        <motion.div
                            key={company.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 * index }}
                        >
                            <Card className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${company.featured ? 'ring-2 ring-hedera-200 dark:ring-hedera-800' : ''
                                }`}>
                                <CardContent className="p-6">
                                    {/* Company Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-16 h-16 bg-gradient-to-br from-hedera-500 to-hedera-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <Building className="w-8 h-8 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white group-hover:text-hedera-600 transition-colors">
                                                        {company.name}
                                                    </h3>
                                                    {company.verified && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Verified
                                                        </Badge>
                                                    )}
                                                    {company.featured && (
                                                        <Badge className="text-xs bg-gradient-to-r from-hedera-500 to-hedera-600">
                                                            Featured
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                                    <div className="flex items-center gap-1">
                                                        <Briefcase className="w-4 h-4" />
                                                        {company.industry}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Users className="w-4 h-4" />
                                                        {company.size}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        {company.location}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Favorite Button */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleFavorite(company.id)}
                                            className={`h-8 w-8 p-0 ${favoriteCompanies.includes(company.id)
                                                    ? 'text-red-500 hover:text-red-600'
                                                    : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                        >
                                            {favoriteCompanies.includes(company.id) ? (
                                                <Heart className="w-4 h-4 fill-current" />
                                            ) : (
                                                <HeartOff className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>

                                    {/* Company Description */}
                                    <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                                        {company.description}
                                    </p>

                                    {/* Company Stats */}
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-1 mb-1">
                                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                <span className="font-semibold text-slate-900 dark:text-white">
                                                    {company.rating}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {company.reviews} reviews
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold text-slate-900 dark:text-white mb-1">
                                                {company.openPositions}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Open positions
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold text-slate-900 dark:text-white mb-1">
                                                {company.founded}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Founded
                                            </p>
                                        </div>
                                    </div>

                                    {/* Skills */}
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                                            Key Skills
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {company.skills.map((skill) => (
                                                <Badge key={skill} variant="secondary" className="text-xs">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Benefits */}
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                                            Benefits
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {company.benefits.map((benefit) => (
                                                <Badge key={benefit} variant="outline" className="text-xs">
                                                    {benefit}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                            <Calendar className="w-4 h-4" />
                                            Founded {company.founded}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm">
                                                <Mail className="w-4 h-4 mr-2" />
                                                Contact
                                            </Button>
                                            <Button size="sm" className="bg-hedera-600 hover:bg-hedera-700">
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                View Jobs
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}

                    {/* Empty State */}
                    {filteredCompanies.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="col-span-full text-center py-12"
                        >
                            <Building className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                No companies found
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                Try adjusting your search criteria or check back later for new companies.
                            </p>
                            <Button
                                onClick={() => {
                                    setSearchTerm("");
                                    setSelectedIndustry("All Industries");
                                    setSelectedSize("All Sizes");
                                    setSelectedLocation("All Locations");
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
