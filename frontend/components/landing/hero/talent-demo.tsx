"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  Shield, 
  Zap, 
  Users, 
  TrendingUp, 
  Award,
  CheckCircle,
  LucideIcon
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

interface DemoStep {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  angle: number;
}

const demoSteps: DemoStep[] = [
  {
    id: 1,
    title: "Skill Verification",
    description: "AI oracles verify your skills",
    icon: Shield,
    color: "from-hedera-500 to-hedera-600",
    angle: 0
  },
  {
    id: 2,
    title: "Token Minting",
    description: "Soulbound skill tokens created",
    icon: Award,
    color: "from-pink-500 to-pink-600",
    angle: 60
  },
  {
    id: 3,
    title: "AI Matching",
    description: "Smart talent discovery",
    icon: Zap,
    color: "from-purple-500 to-purple-600",
    angle: 120
  },
  {
    id: 4,
    title: "Reputation Building",
    description: "Build professional score",
    icon: TrendingUp,
    color: "from-emerald-500 to-emerald-600",
    angle: 180
  },
  {
    id: 5,
    title: "Community Connect",
    description: "Connect with talents",
    icon: Users,
    color: "from-blue-500 to-blue-600",
    angle: 240
  },
  {
    id: 6,
    title: "Success Achievement",
    description: "Complete talent journey",
    icon: CheckCircle,
    color: "from-orange-500 to-orange-600",
    angle: 300
  }
];

export function TalentDemo(): JSX.Element {
  const [activeStep, setActiveStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveStep((prev) => (prev + 1) % demoSteps.length);
        setIsAnimating(false);
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getPosition = (angle: number, radius: number) => {
    const radian = (angle * Math.PI) / 180;
    return {
      x: Math.cos(radian) * radius,
      y: Math.sin(radian) * radius,
    };
  };

  return (
    <div className="relative w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] md:w-[400px] md:h-[400px] lg:w-[450px] lg:h-[450px] xl:w-[500px] xl:h-[500px] mx-auto">
      {/* Main Circle Border */}
      <div className="absolute inset-0 rounded-full border-2 border-slate-200/20 dark:border-slate-700/20" 
           style={{
             background: 'conic-gradient(from 0deg, rgba(0,122,255,0.05), rgba(255,20,147,0.05), rgba(139,69,19,0.05), rgba(0,122,255,0.05))'
           }} />
      
      {/* Inner Circle Guide */}
      <div className="absolute inset-8 sm:inset-12 lg:inset-16 rounded-full border border-slate-200/15 dark:border-slate-700/15" />

      {/* Central Hub */}
        <motion.div 
          className="absolute rounded-full bg-gradient-to-br from-hedera-500 to-pink-500 shadow-2xl flex items-center justify-center z-30"
          style={{
            width: 'clamp(64px, 20vw, 112px)',
            height: 'clamp(64px, 20vw, 112px)',
            top: '40%',
            left: '40%',
            transform: 'translate(-50%, -50%)'
          }}
          animate={{ 
            scale: isAnimating ? 1.08 : 1,
            boxShadow: isAnimating 
              ? "0 25px 50px rgba(0, 122, 255, 0.3)" 
              : "0 15px 35px rgba(0, 122, 255, 0.15)"
          }}
          transition={{ duration: 0.5 }}
        >
          {/* Debug border to verify centering */}
          <div className="absolute inset-0 rounded-full border border-red-500 opacity-20" />
          <div className="flex items-center justify-center w-full h-full">
            <Logo size="xl" showText={false} />
          </div>
        
        {/* Central Pulse Ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-white/25"
          animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.div>

      {/* Demo Steps */}
      {demoSteps.map((step, index) => {
        const IconComponent = step.icon;
        const isActive = index === activeStep;
        const isPrevious = index === (activeStep - 1 + demoSteps.length) % demoSteps.length;
        const radius = typeof window !== 'undefined' ? 
          Math.min(160, Math.max(80, window.innerWidth * 0.15)) : 160;
        const position = getPosition(step.angle - 90, radius);
        
        return (
          <motion.div
            key={step.id}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              x: position.x,
              y: position.y,
            }}
            animate={{
              scale: isActive ? 1.15 : isPrevious ? 1.05 : 0.95,
              opacity: isActive ? 1 : isPrevious ? 0.85 : 0.6,
            }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            {/* Connection Line */}
            <motion.div
              className="absolute top-1/2 left-1/2 w-32 h-0.5 -translate-y-1/2 origin-left"
              style={{
                rotate: step.angle - 90,
                x: -64,
                background: `linear-gradient(to right, ${isActive ? 'rgba(0,122,255,0.4)' : 'rgba(100,116,139,0.2)'}, transparent)`
              }}
              animate={{
                opacity: isActive ? 0.6 : 0.25,
                scaleX: isActive ? 1 : 0.85,
              }}
              transition={{ duration: 0.5 }}
            />

            {/* Step Node */}
            <motion.div 
              className={`relative w-10 h-10 sm:w-14 sm:h-14 lg:w-18 lg:h-18 rounded-full bg-gradient-to-br ${step.color} shadow-xl flex items-center justify-center border-2 border-white/20`}
              animate={{
                boxShadow: isActive 
                  ? "0 20px 40px rgba(0, 0, 0, 0.12)" 
                  : "0 10px 25px rgba(0, 0, 0, 0.06)"
              }}
            >
              <IconComponent className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
              
              {/* Active Ring Animation */}
              <AnimatePresence>
                {isActive && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-white/40"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      exit={{ scale: 1, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border border-white/25"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 2, opacity: 0 }}
                      exit={{ scale: 1, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                    />
                  </>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Step Info Tooltip - Positioned outward */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute z-[60]"
                  style={{
                    // Position tooltip outward from center, away from central hub
                    left: position.x > 0 ? '90px' : position.x < 0 ? '-230px' : '-70px',
                    top: position.y > 50 ? '-90px' : position.y < -50 ? '90px' : '-20px',
                  }}
                >
                  <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg p-2 sm:p-3 shadow-xl border border-white/40 dark:border-slate-700/40 min-w-[120px] sm:min-w-[140px] text-center">
                    <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white mb-1">
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                  {/* Tooltip Arrow pointing toward the step node */}
                  <div 
                    className="absolute w-0 h-0"
                    style={{
                      // Arrow points from tooltip toward the step node
                      ...(position.x > 0 ? {
                        left: '-6px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        borderTop: '6px solid transparent',
                        borderBottom: '6px solid transparent',
                        borderRight: '6px solid rgba(255,255,255,0.95)',
                      } : position.x < 0 ? {
                        right: '-6px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        borderTop: '6px solid transparent',
                        borderBottom: '6px solid transparent',
                        borderLeft: '6px solid rgba(255,255,255,0.95)',
                      } : position.y > 0 ? {
                        top: '-6px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderBottom: '6px solid rgba(255,255,255,0.95)',
                      } : {
                        bottom: '-6px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '6px solid rgba(255,255,255,0.95)',
                      })
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Animated Progress Ring */}
      <div className="absolute z-40 inset-4 sm:inset-6 lg:inset-8 pointer-events-none">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="95"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            className="text-slate-200/30 dark:text-slate-700/30"
          />
          <motion.circle
            cx="100"
            cy="100"
            r="95"
            stroke="url(#progressGradient)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            animate={{
              strokeDasharray: "596",
              strokeDashoffset: 596 - (596 * (activeStep + 1)) / demoSteps.length,
            }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
          <defs>
            <linearGradient id="progressGradient" gradientUnits="objectBoundingBox">
              <stop offset="0%" stopColor="currentColor" className="text-hedera-500" />
              <stop offset="50%" stopColor="currentColor" className="text-pink-500" />
              <stop offset="100%" stopColor="currentColor" className="text-hedera-500" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Step Counter - Centered */}
      <motion.div 
        className="absolute -bottom-12 sm:-bottom-16 left-1/2 -translate-x-1/2 text-center"
        animate={{ opacity: isAnimating ? 0.7 : 1 }}
      >
        <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 sm:mb-3">
          Step {activeStep + 1} of {demoSteps.length}
        </div>
        <div className="flex space-x-2 justify-center">
          {demoSteps.map((_, index) => (
            <motion.div
              key={index}
              className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors duration-300"
              animate={{
                backgroundColor: index === activeStep
                  ? '#007aff'
                  : index < activeStep
                  ? '#007aff60'
                  : '#94a3b8'
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}