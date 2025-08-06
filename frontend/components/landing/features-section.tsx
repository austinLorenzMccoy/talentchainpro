"use client";

import { motion } from "framer-motion";
import { Shield, Users, TrendingUp, Lock, Zap, Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Shield,
    title: "Soulbound Skill Tokens",
    description: "Non-transferable NFTs that represent verified skills, creating permanent and trustworthy credentials on Hedera blockchain.",
    color: "text-hedera-600 dark:text-hedera-400"
  },
  {
    icon: Users,
    title: "AI-Powered Matching",
    description: "Advanced algorithms analyze skills, experience, and project requirements to match talents with perfect opportunities.",
    color: "text-pink-600 dark:text-pink-400"
  },
  {
    icon: TrendingUp,
    title: "Dynamic Reputation",
    description: "Build and maintain your professional reputation through transparent, on-chain records of work quality and achievements.",
    color: "text-warning-600 dark:text-warning-400"
  },
  {
    icon: Lock,
    title: "Secure & Transparent",
    description: "Every transaction and skill verification is recorded on Hedera's secure, fast, and environmentally friendly network.",
    color: "text-hedera-600 dark:text-hedera-400"
  },
  {
    icon: Zap,
    title: "Instant Verification",
    description: "Get your skills verified by our network of trusted oracles in minutes, not days or weeks.",
    color: "text-pink-600 dark:text-pink-400"
  },
  {
    icon: Award,
    title: "Proof of Work",
    description: "Showcase your completed projects and receive recognition through our comprehensive work evaluation system.",
    color: "text-warning-600 dark:text-warning-400"
  }
];

export function FeaturesSection() {
  return (
    <section className="relative py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-950 overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="features-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M30 5L50 20v30L30 65L10 50V20L30 5z" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-hedera-500" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#features-pattern)" />
        </svg>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12 lg:mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-hedera-50 dark:bg-hedera-950/50 border border-hedera-200/30 dark:border-hedera-800/30 mb-4 sm:mb-6"
          >
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="text-hedera-600 dark:text-hedera-400"
            >
              <g fill="currentColor">
                <path d="M12 2L15.5 4V8L12 10L8.5 8V4L12 2Z" opacity="0.9" />
                <path d="M6 8L9.5 10V14L6 16L2.5 14V10L6 8Z" opacity="0.7" />
                <path d="M18 8L21.5 10V14L18 16L14.5 14V10L18 8Z" opacity="0.7" />
                <path d="M12 14L15.5 16V20L12 22L8.5 20V16L12 14Z" opacity="0.9" />
                <path d="M12 10L12 14" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                <path d="M9.5 12L14.5 12" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
              </g>
            </svg>
            <span className="text-xs sm:text-sm font-medium text-hedera-700 dark:text-hedera-300">
              Core Features
            </span>
          </motion.div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight leading-tight mb-3 sm:mb-4">
            <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-100 dark:to-white bg-clip-text text-transparent">
              Revolutionizing Talent with
            </span>
            <br />
            <span className="relative text-hedera-600 dark:text-hedera-400 font-extrabold">
              <span className="relative z-10">Blockchain Technology</span>
              <span className="absolute -inset-1 bg-hedera-100/20 dark:bg-hedera-900/20 blur-sm rounded-lg -z-10"></span>
            </span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-lg sm:max-w-xl lg:max-w-2xl mx-auto leading-relaxed">
            Experience the next generation of talent management with our innovative Web3 solutions
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="group relative h-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-800/50 hover:border-hedera-300/50 dark:hover:border-hedera-700/50 hover:shadow-lg hover:shadow-hedera-500/10 transition-all duration-300">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-current/10 to-current/20 flex items-center justify-center ${feature.color} mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-hedera-600 dark:group-hover:text-hedera-400 transition-colors duration-300">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}