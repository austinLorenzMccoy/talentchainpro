"use client";

import { motion } from "framer-motion";
import { WifiOff } from "lucide-react";

interface WalletConnectionPromptProps {
    title?: string;
    description?: string;
    className?: string;
}

export function WalletConnectionPrompt({
    title = "Connect Your Wallet",
    description = "Connect your Hedera wallet to access this page and start building your professional reputation.",
    className = ""
}: WalletConnectionPromptProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`flex items-center justify-center min-h-[60vh] ${className}`}
        >
            <div className="text-center max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <WifiOff className="w-8 h-8 text-slate-400" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                    {title}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                    {description}
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-hedera-600 dark:text-hedera-400">
                    <div className="w-2 h-2 bg-hedera-500 rounded-full animate-pulse"></div>
                    Waiting for wallet connection...
                </div>
            </div>
        </motion.div>
    );
}
