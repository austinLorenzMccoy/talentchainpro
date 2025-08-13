"use client";

import { motion } from "framer-motion";
import { LucideIcon, MoreVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DashboardWidgetProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  actions?: Array<{
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  }>;
  headerActions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  delay?: number;
  noPadding?: boolean;
}

export function DashboardWidget({
  title,
  description,
  icon: Icon,
  children,
  actions,
  headerActions,
  className,
  contentClassName,
  delay = 0,
  noPadding = false,
}: DashboardWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={cn("h-full", className)}
    >
      <Card className="h-full flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg hover:border-hedera-300/50 dark:hover:border-hedera-600/50 transition-all duration-300">
        {/* Header */}
        <CardHeader className={cn(
          "flex-shrink-0 pb-4",
          noPadding ? "p-4 sm:p-6" : ""
        )}>
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center space-x-3 min-w-0">
              {Icon && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: delay + 0.1
                  }}
                  className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-hedera-100 to-hedera-200 dark:from-hedera-800/30 dark:to-hedera-700/30 rounded-lg flex items-center justify-center"
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-hedera-600 dark:text-hedera-400" />
                </motion.div>
              )}
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {title}
                </CardTitle>
                {description && (
                  <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {description}
                  </CardDescription>
                )}
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {headerActions}

              {actions && actions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <MoreVertical className="w-4 h-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {actions.map((action, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={action.onClick}
                        className="cursor-pointer"
                      >
                        {action.icon && (
                          <action.icon className="w-4 h-4 mr-2" />
                        )}
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className={cn(
          "flex-1 flex flex-col min-h-0",
          noPadding ? "p-0" : "pt-0",
          contentClassName
        )}>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default DashboardWidget;