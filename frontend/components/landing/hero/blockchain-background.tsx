"use client";

import { motion } from "framer-motion";

export function BlockchainBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Primary Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-hedera-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-hedera-950/50" />
      
      {/* Animated Hexagonal Grid */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern 
              id="hexagon-grid" 
              x="0" 
              y="0" 
              width="120" 
              height="104" 
              patternUnits="userSpaceOnUse"
            >
              <path 
                d="M60 5L90 25v40L60 85L30 65V25L60 5z" 
                stroke="currentColor" 
                strokeWidth="1" 
                fill="none" 
                className="text-hedera-600 dark:text-hedera-400"
              />
              <path 
                d="M0 52L30 72v40L0 132L-30 112V72L0 52z" 
                stroke="currentColor" 
                strokeWidth="1" 
                fill="none" 
                className="text-hedera-600 dark:text-hedera-400"
                opacity="0.5"
              />
              <path 
                d="M120 52L150 72v40L120 132L90 112V72L120 52z" 
                stroke="currentColor" 
                strokeWidth="1" 
                fill="none" 
                className="text-hedera-600 dark:text-hedera-400"
                opacity="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexagon-grid)" />
        </svg>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.sin(i) * 20, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
            className="absolute w-1 h-1 bg-hedera-400 dark:bg-hedera-500 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-hedera-200/20 to-pink-200/20 dark:from-hedera-800/20 dark:to-pink-800/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-l from-pink-200/20 to-hedera-200/20 dark:from-pink-800/20 dark:to-hedera-800/20 rounded-full blur-3xl" />
      
      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.02] dark:opacity-[0.08]">
        <motion.path
          d="M0,50 Q400,100 800,50 T1600,50"
          stroke="url(#connectionGradient)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M0,150 Q600,200 1200,150 T2400,150"
          stroke="url(#connectionGradient)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 10, repeat: Infinity, delay: 2, ease: "easeInOut" }}
        />
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" className="text-hedera-500" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="1" className="text-hedera-500" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-pink-500" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}