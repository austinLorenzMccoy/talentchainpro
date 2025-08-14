"use client";

import { useState } from "react";
import { Mail, Building, MapPin, Globe, Phone, Send, X, User, MessageSquare, FileText } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";

interface CompanyContact {
    id: number;
    name: string;
    industry: string;
    size: string;
    location: string;
    website: string;
    description: string;
    contactInfo: {
        email: string;
        phone: string;
        address: string;
        linkedin: string;
        twitter: string;
    };
    departments: string[];
    hiringStatus: "actively-hiring" | "selective-hiring" | "not-hiring";
}

interface ContactCompanyDialogProps {
    company: CompanyContact;
    triggerButton?: React.ReactNode;
    onContactSubmitted?: (contact: any) => void;
}

const contactReasons = [
    "General Inquiry",
    "Partnership Opportunity",
    "Investment Interest",
    "Media/PR Inquiry",
    "Career Opportunity",
    "Technical Collaboration",
    "Business Development",
    "Other"
];

const urgencyLevels = [
    "Low - General inquiry",
    "Medium - Business opportunity",
    "High - Time-sensitive matter",
    "Urgent - Immediate attention needed"
];

export function ContactCompanyDialog({
    company,
    triggerButton,
    onContactSubmitted
}: ContactCompanyDialogProps) {
    const { user, isConnected } = useAuth();
    const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [contactForm, setContactForm] = useState({
        reason: "",
        urgency: "Low - General inquiry",
        subject: "",
        message: "",
        fullName: user?.profile?.name || "",
        email: user?.profile?.email || "",
        phone: "",
        company: user?.profile?.companyName || "",
        position: user?.profile?.industry || "",
        linkedinUrl: "",
        portfolioUrl: "",
        preferredContactMethod: "email"
    });

    const handleSubmitContact = async () => {
        if (!isConnected) {
            alert("Please connect your wallet to contact companies");
            return;
        }

        if (!contactForm.subject || !contactForm.message) {
            alert("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            // TODO: Implement contact submission via smart contract or API
            // const result = await submitCompanyContact({
            //     companyId: company.id,
            //     userId: user?.accountId,
            //     contactData: contactForm
            // });

            const contactSubmission = {
                companyId: company.id,
                companyName: company.name,
                userId: user?.accountId,
                userProfile: user?.profile,
                contactData: contactForm,
                submittedAt: new Date().toISOString(),
                status: "pending"
            };

            console.log('Submitting company contact:', contactSubmission);

            // Call the callback if provided
            if (onContactSubmitted) {
                onContactSubmitted(contactSubmission);
            }

            // Close dialog and reset form
            setIsContactDialogOpen(false);
            setContactForm({
                reason: "",
                urgency: "Low - General inquiry",
                subject: "",
                message: "",
                fullName: user?.profile?.name || "",
                email: user?.profile?.email || "",
                phone: "",
                company: user?.profile?.companyName || "",
                position: user?.profile?.industry || "",
                linkedinUrl: "",
                portfolioUrl: "",
                preferredContactMethod: "email"
            });

        } catch (error) {
            console.error('Failed to submit contact:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getHiringStatusColor = (status: string) => {
        switch (status) {
            case "actively-hiring":
                return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
            case "selective-hiring":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
            case "not-hiring":
                return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
            default:
                return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400";
        }
    };

    const getHiringStatusText = (status: string) => {
        switch (status) {
            case "actively-hiring":
                return "Actively Hiring";
            case "selective-hiring":
                return "Selective Hiring";
            case "not-hiring":
                return "Not Hiring";
            default:
                return "Unknown";
        }
    };

    return (
        <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button variant="outline" size="sm">
                        <Mail className="w-4 h-4 mr-2" />
                        Contact
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-hedera-600 to-web3-pink-600 bg-clip-text text-transparent">
                                Contact {company.name}
                            </DialogTitle>
                            <DialogDescription className="text-slate-600 dark:text-slate-400 mt-2">
                                Get in touch with the company for inquiries, partnerships, or opportunities
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            <Badge className={getHiringStatusColor(company.hiringStatus)}>
                                {getHiringStatusText(company.hiringStatus)}
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Company Information */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Building className="w-5 h-5 text-hedera-600" />
                                About {company.name}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Building className="w-4 h-4 text-hedera-600" />
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                            {company.industry} • {company.size}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-hedera-600" />
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                            {company.location}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-hedera-600" />
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
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {company.description}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Form */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-hedera-600" />
                                Contact Form
                            </h3>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="reason">Reason for Contact *</Label>
                                        <Select
                                            value={contactForm.reason}
                                            onValueChange={(value) => setContactForm({ ...contactForm, reason: value })}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Select reason" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {contactReasons.map((reason) => (
                                                    <SelectItem key={reason} value={reason}>
                                                        {reason}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="urgency">Urgency Level *</Label>
                                        <Select
                                            value={contactForm.urgency}
                                            onValueChange={(value) => setContactForm({ ...contactForm, urgency: value })}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {urgencyLevels.map((level) => (
                                                    <SelectItem key={level} value={level}>
                                                        {level}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="subject">Subject *</Label>
                                    <Input
                                        id="subject"
                                        placeholder="Brief description of your inquiry..."
                                        value={contactForm.subject}
                                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="message">Message *</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Please provide detailed information about your inquiry, including any specific questions or requests..."
                                        value={contactForm.message}
                                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                        rows={4}
                                        className="mt-1"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="fullName">Full Name *</Label>
                                        <Input
                                            id="fullName"
                                            value={contactForm.fullName}
                                            onChange={(e) => setContactForm({ ...contactForm, fullName: e.target.value })}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={contactForm.email}
                                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            value={contactForm.phone}
                                            onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="company">Your Company</Label>
                                        <Input
                                            id="company"
                                            value={contactForm.company}
                                            onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="position">Your Position</Label>
                                        <Input
                                            id="position"
                                            value={contactForm.position}
                                            onChange={(e) => setContactForm({ ...contactForm, position: e.target.value })}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="preferredContactMethod">Preferred Contact Method</Label>
                                        <Select
                                            value={contactForm.preferredContactMethod}
                                            onValueChange={(value) => setContactForm({ ...contactForm, preferredContactMethod: value })}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="email">Email</SelectItem>
                                                <SelectItem value="phone">Phone</SelectItem>
                                                <SelectItem value="linkedin">LinkedIn</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
                                        <Input
                                            id="linkedinUrl"
                                            placeholder="https://linkedin.com/in/your-profile"
                                            value={contactForm.linkedinUrl}
                                            onChange={(e) => setContactForm({ ...contactForm, linkedinUrl: e.target.value })}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="portfolioUrl">Portfolio/Website</Label>
                                        <Input
                                            id="portfolioUrl"
                                            placeholder="https://your-portfolio.com"
                                            value={contactForm.portfolioUrl}
                                            onChange={(e) => setContactForm({ ...contactForm, portfolioUrl: e.target.value })}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Company Departments */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Building className="w-5 h-5 text-hedera-600" />
                                Company Departments
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {company.departments.map((dept) => (
                                    <Badge key={dept} variant="secondary" className="text-sm">
                                        {dept}
                                    </Badge>
                                ))}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                                Your inquiry will be routed to the most appropriate department based on your reason for contact.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button
                            variant="outline"
                            onClick={() => setIsContactDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitContact}
                            disabled={isSubmitting || !contactForm.subject || !contactForm.message || !isConnected}
                            className="bg-gradient-to-r from-hedera-600 to-web3-pink-600 hover:from-hedera-700 hover:to-web3-pink-700 text-white"
                        >
                            <Send className="w-4 h-4 mr-2" />
                            {isSubmitting ? 'Sending...' : 'Send Message'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
