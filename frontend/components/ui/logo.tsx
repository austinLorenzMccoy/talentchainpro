"use client";

import { motion } from "framer-motion";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  showSubtitle?: boolean;
}

export function Logo({ size = "md", showText = true, showSubtitle = true, className = "" }: LogoProps) {
  const sizeConfig = {
    sm: { icon: "w-8 h-8", text: "text-sm sm:text-base", subtitle: "text-[10px]" },
    md: { icon: "w-8 h-8 sm:w-10 sm:h-10", text: "text-base sm:text-lg", subtitle: "text-[10px] sm:text-xs" },
    lg: { icon: "w-12 h-12 sm:w-16 sm:h-16", text: "text-xl sm:text-2xl", subtitle: "text-xs sm:text-sm" },
    xl: { icon: "w-16 h-16 sm:w-20 sm:h-20", text: "text-xl sm:text-2xl", subtitle: "text-xs sm:text-sm" }
  };

  const config = sizeConfig[size];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`flex items-center space-x-2 sm:space-x-3 min-w-0 ${className}`}
    >
      {/* Sophisticated Logo Icon */}
      <div className="relative group">
        {/* Main Logo Container */}
        <div className={`${config.icon} relative bg-gradient-to-br from-hedera-500 via-hedera-600 to-hedera-700 rounded-xl flex items-center justify-center shadow-lg shadow-hedera-500/25 overflow-hidden`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="logo-pattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                  <circle cx="4" cy="4" r="0.5" fill="currentColor" className="text-white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#logo-pattern)" />
            </svg>
          </div>

          {/* Central Icon - Blockchain/Chain Links */}
          <div className="relative z-10 flex items-center justify-center">
            <svg
              width="60%"
              height="60%"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              {/* Talent Chain Symbol - Interconnected hexagons */}
              <g className="text-white" fill="currentColor">
                {/* Top Hexagon */}
                <path d="M12 2L15.5 4V8L12 10L8.5 8V4L12 2Z" opacity="0.9" />
                {/* Middle Left Hexagon */}
                <path d="M6 8L9.5 10V14L6 16L2.5 14V10L6 8Z" opacity="0.7" />
                {/* Middle Right Hexagon */}
                <path d="M18 8L21.5 10V14L18 16L14.5 14V10L18 8Z" opacity="0.7" />
                {/* Bottom Hexagon */}
                <path d="M12 14L15.5 16V20L12 22L8.5 20V16L12 14Z" opacity="0.9" />

                {/* Connection Lines */}
                <path d="M12 10L12 14" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                <path d="M9.5 12L14.5 12" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
              </g>
            </svg>
          </div>

          {/* Animated Glow Rings */}
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute inset-1 border border-white/20 rounded-lg"
          />
          <motion.div
            animate={{ rotate: -360, scale: [1, 0.9, 1] }}
            transition={{
              rotate: { duration: 15, repeat: Infinity, ease: "linear" },
              scale: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }
            }}
            className="absolute inset-2 border border-white/10 rounded-lg"
          />
        </div>

        {/* Animated Glow Effect */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`absolute inset-0 ${config.icon} bg-gradient-to-br from-hedera-400 to-hedera-600 rounded-xl blur-sm -z-10`}
        />

        {/* Particle Effects */}
        <div className="absolute -inset-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -20, 0],
                x: [0, Math.sin(i) * 10, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
              className={`absolute w-1 h-1 bg-hedera-400 rounded-full`}
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Logo Text */}
      {showText && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col min-w-0 flex-1 leading-none"
        >
          {/* Main Brand Name - Mature & Stylish Design */}
          <div className="flex flex-col">
            {/* Desktop Layout - Professional inline */}
            <div className="hidden sm:flex items-baseline space-x-0.5">
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                className={`${config.text} font-black bg-gradient-to-r from-hedera-600 via-hedera-500 to-hedera-700 bg-clip-text text-transparent tracking-normal leading-none`}
                style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
              >
                Talent
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                className={`${config.text} font-black bg-gradient-to-r from-pink-600 via-pink-500 to-pink-700 bg-clip-text text-transparent tracking-normal leading-none`}
                style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
              >
                Chain
              </motion.span>
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className={`${size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-sm' : 'text-xs'} font-bold text-hedera-600 dark:text-hedera-400 opacity-80 tracking-wide ml-1.5`}
                style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
              >
                PRO
              </motion.span>
            </div>

            {/* Mobile Layout - PRO underneath as requested */}
            <div className="flex flex-col sm:hidden">
              <div className="flex items-baseline space-x-0.5">
                <motion.span
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                  className={`${config.text} font-black bg-gradient-to-r from-hedera-600 via-hedera-500 to-hedera-700 bg-clip-text text-transparent tracking-normal leading-none`}
                  style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
                >
                  Talent
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                  className={`${config.text} font-black bg-gradient-to-r from-pink-600 via-pink-500 to-pink-700 bg-clip-text text-transparent tracking-normal leading-none`}
                  style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
                >
                  Chain
                </motion.span>
              </div>
              <motion.span
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className={`${size === 'sm' ? 'text-[9px]' : 'text-[10px]'} font-semibold text-hedera-600 dark:text-hedera-400 opacity-70 tracking-widest uppercase mt-0.5`}
                style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif', letterSpacing: '0.15em' }}
              >
                PRO
              </motion.span>
            </div>
          </div>

          {/* Original Stylish Tagline */}
          {showSubtitle && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className={`${config.subtitle} text-slate-500 dark:text-slate-400 font-medium tracking-wide hidden sm:block leading-none mt-0.5 opacity-75`}
              style={{ letterSpacing: '0.1em' }}
            >
              Web3 Talent Ecosystem
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}