"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Github, Twitter, Linkedin } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const footerSections = [
  {
    title: "Platform",
    links: [
      { name: "Skill Tokens", href: "/skill-tokens" },
      { name: "AI Matching", href: "/ai-matching" },
      { name: "Reputation", href: "/reputation" },
      { name: "Dashboard", href: "/dashboard" }
    ]
  },
  {
    title: "Resources",
    links: [
      { name: "Documentation", href: "/docs", external: true },
      { name: "API Reference", href: "/api", external: true },
      { name: "Community", href: "/community" },
      { name: "Support", href: "/support" }
    ]
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "/about" },
      { name: "Blog", href: "/blog" },
      { name: "Careers", href: "/careers" },
      { name: "Press Kit", href: "/press" }
    ]
  }
];

const socialLinks = [
  { name: "Twitter", icon: Twitter, href: "https://twitter.com/talentchainpro" },
  { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com/company/talentchainpro" },
  { name: "GitHub", icon: Github, href: "https://github.com/talentchainpro" }
];

export function Footer() {
  return (
    <footer className="relative py-8 sm:py-12 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-t border-slate-200/50 dark:border-slate-800/50">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="footer-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M30 5L50 20v30L30 65L10 50V20L30 5z" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-slate-400" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footer-pattern)" />
        </svg>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Brand Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:col-span-2 space-y-3 sm:space-y-4"
          >
            <div className="flex items-center space-x-3">
              <Logo size="sm" showText={true} />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              Revolutionizing talent management with blockchain-secured skills, AI-powered matching, and verifiable professional reputation.
            </p>
            
            {/* Network Status */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-success-50/50 dark:bg-success-900/20 border border-success-200/30 dark:border-success-800/30 w-fit">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-success-700 dark:text-success-400">Hedera Testnet</span>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-3 pt-2">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-8 h-8 bg-slate-100 dark:bg-slate-800 hover:bg-hedera-100 dark:hover:bg-hedera-900/50 rounded-lg flex items-center justify-center transition-colors duration-200 group"
                >
                  <social.icon className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-hedera-600 dark:group-hover:text-hedera-400" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="space-y-3"
            >
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : "_self"}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="group inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-hedera-600 dark:hover:text-hedera-400 transition-colors duration-200"
                    >
                      {link.name}
                      {link.external && (
                        <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200/50 dark:border-slate-800/50"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
              <a href="/privacy" className="hover:text-hedera-600 dark:hover:text-hedera-400 transition-colors">Privacy Policy</a>
              <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
              <a href="/terms" className="hover:text-hedera-600 dark:hover:text-hedera-400 transition-colors">Terms of Service</a>
              <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
              <a href="/cookies" className="hover:text-hedera-600 dark:hover:text-hedera-400 transition-colors">Cookies</a>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
              <span>© 2024 TalentChain Pro. Built with</span>
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-hedera-500 to-pink-500"></div>
              <span>on Hedera</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}