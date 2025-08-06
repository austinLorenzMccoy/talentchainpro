"use client";

import { motion } from "framer-motion";

export function NavbarBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Main gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-hedera-50/90 to-white/95 dark:from-hedera-950/95 dark:via-hedera-900/90 dark:to-hedera-950/95" />
      
      {/* Animated gradient orbs */}
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-4 left-1/4 w-32 h-32 bg-gradient-to-r from-hedera-400/20 to-web3-pink-400/20 rounded-full blur-2xl"
      />
      
      <motion.div
        animate={{
          x: [0, -30, 0],
          y: [0, 15, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute -bottom-4 right-1/3 w-24 h-24 bg-gradient-to-r from-success-400/20 to-hedera-500/20 rounded-full blur-2xl"
      />
      
      {/* Geometric patterns */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="navPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="currentColor" className="text-hedera-500" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#navPattern)" />
        </svg>
      </div>
      
      {/* Web3 hexagon elements */}
      <div className="absolute top-0 right-0 w-16 h-16 opacity-10 dark:opacity-20">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 2L54 16V48L32 62L10 48V16L32 2Z" stroke="currentColor" strokeWidth="1" className="text-hedera-500" />
        </svg>
      </div>
      
      <div className="absolute bottom-0 left-0 w-12 h-12 opacity-10 dark:opacity-20 rotate-45">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 1L41 12V36L24 47L7 36V12L24 1Z" stroke="currentColor" strokeWidth="1" className="text-web3-pink-500" />
        </svg>
      </div>
    </div>
  );
}

export function FloatingOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-20 left-10 w-64 h-64 bg-gradient-conic from-hedera-500/10 via-web3-pink-500/10 to-success-500/10 rounded-full blur-3xl"
      />
      
      <motion.div
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
          rotate: [360, 180, 0]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-conic from-success-500/10 via-hedera-500/10 to-web3-pink-500/10 rounded-full blur-3xl"
      />
    </div>
  );
}