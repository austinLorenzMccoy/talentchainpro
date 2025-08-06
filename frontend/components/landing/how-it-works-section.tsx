"use client";

import { motion } from "framer-motion";
import { ArrowRight, Wallet, Award, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

const steps = [
  {
    step: "01",
    title: "Connect Your Wallet",
    description: "Link your Hedera wallet (HashPack, MetaMask, or WalletConnect) to get started with TalentChain Pro.",
    icon: Wallet
  },
  {
    step: "02",
    title: "Create Skill Tokens",
    description: "Mint soulbound NFTs representing your verified skills and experience, backed by evidence and peer validation.",
    icon: Award
  },
  {
    step: "03",
    title: "Build Your Reputation",
    description: "Complete projects, receive ratings, and build an immutable reputation that travels with you across platforms.",
    icon: TrendingUp
  }
];

export function HowItWorksSection() {
  return (
    <section className="relative py-8 sm:py-12 lg:py-16 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-950 dark:to-slate-900/50 overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="works-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M40 10L65 25v30L40 70L15 55V25L40 10z" stroke="currentColor" strokeWidth="0.3" fill="none" className="text-slate-400" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#works-pattern)" />
        </svg>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-6 sm:mb-8 lg:mb-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-hedera-50 dark:bg-hedera-950/50 border border-hedera-200/30 dark:border-hedera-800/30 mb-3 sm:mb-4"
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
              Simple Process
            </span>
          </motion.div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-black tracking-tight leading-tight mb-2 sm:mb-3">
            <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-100 dark:to-white bg-clip-text text-transparent">
              How
            </span>{" "}
            <span className="relative text-hedera-600 dark:text-hedera-400 font-extrabold">
              <span className="relative z-10">TalentChain Pro</span>
              <span className="absolute -inset-1 bg-hedera-100/20 dark:bg-hedera-900/20 blur-sm rounded-lg -z-10"></span>
            </span>{" "}
            <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-100 dark:to-white bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-lg sm:max-w-xl lg:max-w-2xl mx-auto leading-relaxed">
            Get started in minutes with our streamlined onboarding process
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <Card className="group relative text-center p-4 sm:p-6 lg:p-8 h-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60 hover:border-hedera-300/50 dark:hover:border-hedera-700/50 hover:shadow-xl hover:shadow-hedera-500/10 transition-all duration-300">
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-hedera-500 to-hedera-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
                  {/* Subtle pulse ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-hedera-300/40 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-pink-600 dark:text-pink-400 mb-2 sm:mb-3 group-hover:scale-105 transition-transform duration-300">{step.step}</div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3 group-hover:text-hedera-600 dark:group-hover:text-hedera-400 transition-colors duration-300">{step.title}</h3>
                <p className="text-xs sm:text-sm lg:text-base text-slate-600 dark:text-slate-300 leading-relaxed">{step.description}</p>
              </Card>
              
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-5 transform -translate-y-1/2 z-10">
                  <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-lg">
                    <ArrowRight className="w-5 h-5 text-hedera-600 dark:text-hedera-400" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}