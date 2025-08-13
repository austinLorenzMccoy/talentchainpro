// "use client";

// import { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { 
//   Activity, 
//   ExternalLink, 
//   Filter, 
//   Search, 
//   Calendar, 
//   Clock,
//   CheckCircle2,
//   AlertCircle,
//   Loader2,
//   TrendingUp,
//   TrendingDown,
//   ArrowUpRight,
//   ArrowDownLeft,
//   Coins,
//   Hash,
//   Eye,
//   RefreshCw,
//   Download
// } from "lucide-react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { DashboardWidget } from "./dashboard-widget";
// import { useAuth } from "@/hooks/useAuth";
// import { cn } from "@/lib/utils";

// interface TransactionHistoryWidgetProps {
//   className?: string;
// }

// interface Transaction {
//   id: string;
//   type: 'skill_created' | 'skill_updated' | 'pool_created' | 'pool_applied' | 'pool_matched' | 'hbar_transfer' | 'contract_call';
//   status: 'success' | 'pending' | 'failed';
//   amount?: string;
//   timestamp: number;
//   transactionId: string;
//   description: string;
//   from?: string;
//   to?: string;
//   fee: string;
//   blockNumber?: number;
//   metadata?: Record<string, any>;
// }

// // Mock transaction data - would come from Hedera Mirror Node API
// const mockTransactions: Transaction[] = [
//   {
//     id: '1',
//     type: 'skill_created',
//     status: 'success',
//     timestamp: Date.now() - 3600000, // 1 hour ago
//     transactionId: '0.0.123456@1704142800.123456789',
//     description: 'Created React Development skill token',
//     to: '0.0.123456',
//     fee: '0.05',
//     blockNumber: 12345678,
//     metadata: { skillCategory: 'React Development', level: 8 }
//   },
//   {
//     id: '2',
//     type: 'pool_applied',
//     status: 'success',
//     timestamp: Date.now() - 7200000, // 2 hours ago
//     transactionId: '0.0.123456@1704139200.123456789',
//     description: 'Applied to Senior Frontend Developer position at DeFi Protocol',
//     fee: '0.02',
//     blockNumber: 12345650,
//     metadata: { poolId: 5, skillTokens: [1, 3, 7] }
//   },
//   {
//     id: '3',
//     type: 'hbar_transfer',
//     status: 'success',
//     amount: '150.00',
//     timestamp: Date.now() - 86400000, // 1 day ago
//     transactionId: '0.0.123456@1704056400.123456789',
//     description: 'Received payment from completed job match',
//     from: '0.0.654321',
//     to: '0.0.123456',
//     fee: '0.0001',
//     blockNumber: 12344000
//   },
//   {
//     id: '4',
//     type: 'skill_updated',
//     status: 'success',
//     timestamp: Date.now() - 172800000, // 2 days ago
//     transactionId: '0.0.123456@1703970000.123456789',
//     description: 'AI Oracle updated Smart Contracts skill to level 7',
//     fee: '0.01',
//     blockNumber: 12340000,
//     metadata: { skillId: 2, oldLevel: 6, newLevel: 7 }
//   },
//   {
//     id: '5',
//     type: 'pool_created',
//     status: 'pending',
//     amount: '50.00',
//     timestamp: Date.now() - 300000, // 5 minutes ago
//     transactionId: '0.0.123456@1704146400.123456789',
//     description: 'Creating job pool for Blockchain Developer position',
//     fee: '0.10',
//     metadata: { salary: '120000 HBAR', requiredSkills: [2, 4, 8] }
//   }
// ];

// export function TransactionHistoryWidget({ className }: TransactionHistoryWidgetProps) {
//   const { user, isConnected } = useAuth();
//   const [transactions, setTransactions] = useState<Transaction[]>([]);
//   const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const [searchTerm, setSearchTerm] = useState("");
//   const [typeFilter, setTypeFilter] = useState("all");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [sortBy, setSortBy] = useState("recent");

//   // Load transaction history
//   useEffect(() => {
//     if (isConnected && user) {
//       fetchTransactionHistory();
//     }
//   }, [isConnected, user]);

//   // Filter and sort transactions
//   useEffect(() => {
//     let filtered = transactions.filter(tx => {
//       const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                            tx.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
//       const matchesType = typeFilter === "all" || tx.type === typeFilter;
//       const matchesStatus = statusFilter === "all" || tx.status === statusFilter;

//       return matchesSearch && matchesType && matchesStatus;
//     });

//     // Sort transactions
//     filtered.sort((a, b) => {
//       switch (sortBy) {
//         case "amount":
//           return parseFloat(b.amount || "0") - parseFloat(a.amount || "0");
//         case "fee":
//           return parseFloat(b.fee) - parseFloat(a.fee);
//         case "recent":
//         default:
//           return b.timestamp - a.timestamp;
//       }
//     });

//     setFilteredTransactions(filtered);
//   }, [transactions, searchTerm, typeFilter, statusFilter, sortBy]);

//   const fetchTransactionHistory = async () => {
//     setIsLoading(true);
//     setError(null);

//     try {
//       // TODO: Replace with real Hedera Mirror Node API call
//               // const response = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${user.accountId}/transactions`);
//       // const data = await response.json();

//       // Mock API delay
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       // Use mock data for now
//       setTransactions(mockTransactions);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to fetch transaction history');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const getTransactionIcon = (type: Transaction['type']) => {
//     switch (type) {
//       case 'skill_created': return { icon: TrendingUp, color: "text-blue-600" };
//       case 'skill_updated': return { icon: ArrowUpRight, color: "text-green-600" };
//       case 'pool_created': return { icon: Coins, color: "text-purple-600" };
//       case 'pool_applied': return { icon: ArrowUpRight, color: "text-yellow-600" };
//       case 'pool_matched': return { icon: CheckCircle2, color: "text-green-600" };
//       case 'hbar_transfer': return { icon: ArrowDownLeft, color: "text-emerald-600" };
//       case 'contract_call': return { icon: Hash, color: "text-slate-600" };
//       default: return { icon: Activity, color: "text-slate-600" };
//     }
//   };

//   const getStatusConfig = (status: Transaction['status']) => {
//     switch (status) {
//       case 'success':
//         return { label: "Success", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" };
//       case 'pending':
//         return { label: "Pending", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" };
//       case 'failed':
//         return { label: "Failed", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" };
//     }
//   };

//   const formatTimeAgo = (timestamp: number) => {
//     const now = Date.now();
//     const diff = now - timestamp;
//     const minutes = Math.floor(diff / 60000);
//     const hours = Math.floor(diff / 3600000);
//     const days = Math.floor(diff / 86400000);

//     if (minutes < 1) return "Just now";
//     if (minutes < 60) return `${minutes}m ago`;
//     if (hours < 24) return `${hours}h ago`;
//     return `${days}d ago`;
//   };

//   const openInExplorer = (transactionId: string) => {
//     const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK === 'mainnet' ? '' : 'testnet.';
//     window.open(`https://${network}hashscan.io/transaction/${transactionId}`, '_blank');
//   };

//   const totalTransactionCount = transactions.length;
//   const pendingCount = transactions.filter(tx => tx.status === 'pending').length;
//   const totalFees = transactions.reduce((sum, tx) => sum + parseFloat(tx.fee), 0);

//   return (
//     <DashboardWidget
//       title="Transaction History"
//       description="Your complete blockchain activity and transaction timeline"
//       icon={Activity}
//       className={className}
//       headerActions={
//         <div className="flex items-center space-x-2">
//           <div className="hidden sm:flex items-center space-x-4 text-xs text-slate-600 dark:text-slate-400 mr-4">
//             <div className="flex items-center space-x-1">
//               <Hash className="w-3 h-3" />
//               <span>{totalTransactionCount}</span>
//             </div>
//             <div className="flex items-center space-x-1">
//               <Clock className="w-3 h-3" />
//               <span>{pendingCount} pending</span>
//             </div>
//             <div className="flex items-center space-x-1">
//               <Coins className="w-3 h-3" />
//               <span>{totalFees.toFixed(4)} ℏ fees</span>
//             </div>
//           </div>
//           <Button size="sm" variant="outline" onClick={fetchTransactionHistory} disabled={isLoading}>
//             {isLoading ? (
//               <Loader2 className="w-4 h-4 animate-spin" />
//             ) : (
//               <RefreshCw className="w-4 h-4" />
//             )}
//           </Button>
//           <Button size="sm" variant="outline">
//             <Download className="w-4 h-4" />
//           </Button>
//         </div>
//       }
//     >
//       {/* Filters */}
//       <div className="flex flex-col sm:flex-row gap-4 mb-6">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//           <Input
//             type="text"
//             placeholder="Search transactions..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10"
//           />
//         </div>

//         <Select value={typeFilter} onValueChange={setTypeFilter}>
//           <SelectTrigger className="w-full sm:w-40">
//             <Filter className="w-4 h-4 mr-2" />
//             <SelectValue />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">All Types</SelectItem>
//             <SelectItem value="skill_created">Skills Created</SelectItem>
//             <SelectItem value="skill_updated">Skills Updated</SelectItem>
//             <SelectItem value="pool_created">Pools Created</SelectItem>
//             <SelectItem value="pool_applied">Pool Applications</SelectItem>
//             <SelectItem value="hbar_transfer">HBAR Transfers</SelectItem>
//           </SelectContent>
//         </Select>

//         <Select value={statusFilter} onValueChange={setStatusFilter}>
//           <SelectTrigger className="w-full sm:w-32">
//             <SelectValue />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">All Status</SelectItem>
//             <SelectItem value="success">Success</SelectItem>
//             <SelectItem value="pending">Pending</SelectItem>
//             <SelectItem value="failed">Failed</SelectItem>
//           </SelectContent>
//         </Select>

//         <Select value={sortBy} onValueChange={setSortBy}>
//           <SelectTrigger className="w-full sm:w-32">
//             <SelectValue />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="recent">Recent</SelectItem>
//             <SelectItem value="amount">Amount</SelectItem>
//             <SelectItem value="fee">Fee</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       {/* Transaction List */}
//       {isLoading && transactions.length === 0 ? (
//         <div className="space-y-4">
//           {[...Array(5)].map((_, i) => (
//             <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 animate-pulse">
//               <div className="flex items-center space-x-4">
//                 <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
//                 <div className="flex-1">
//                   <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
//                   <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
//                 </div>
//                 <div className="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded" />
//               </div>
//             </div>
//           ))}
//         </div>
//       ) : error ? (
//         <div className="text-center py-8">
//           <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
//           <p className="text-red-600 dark:text-red-400 font-medium mb-2">Failed to load transactions</p>
//           <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{error}</p>
//           <Button onClick={fetchTransactionHistory} variant="outline">
//             Try Again
//           </Button>
//         </div>
//       ) : (
//         <div className="space-y-3">
//           <AnimatePresence mode="popLayout">
//             {filteredTransactions.map((transaction, index) => {
//               const { icon: Icon, color } = getTransactionIcon(transaction.type);
//               const statusConfig = getStatusConfig(transaction.status);

//               return (
//                 <motion.div
//                   key={transaction.id}
//                   layout
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, y: -20 }}
//                   transition={{ duration: 0.3, delay: index * 0.05 }}
//                 >
//                   <Card className="group hover:shadow-lg hover:border-hedera-300 dark:hover:border-hedera-600 transition-all duration-300">
//                     <CardContent className="p-4">
//                       <div className="flex items-start space-x-4">
//                         {/* Transaction Icon */}
//                         <div className={cn(
//                           "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
//                           transaction.status === 'success' ? "bg-green-100 dark:bg-green-900/30" :
//                           transaction.status === 'pending' ? "bg-yellow-100 dark:bg-yellow-900/30" :
//                           "bg-red-100 dark:bg-red-900/30"
//                         )}>
//                           <Icon className={cn("w-5 h-5", color)} />
//                         </div>

//                         {/* Transaction Details */}
//                         <div className="flex-1 min-w-0">
//                           <div className="flex items-start justify-between mb-2">
//                             <div className="flex-1 min-w-0">
//                               <p className="font-medium text-slate-900 dark:text-white truncate">
//                                 {transaction.description}
//                               </p>
//                               <div className="flex items-center space-x-2 mt-1">
//                                 <Badge className={cn("text-xs", statusConfig.color)}>
//                                   {statusConfig.label}
//                                 </Badge>
//                                 <span className="text-xs text-slate-500 dark:text-slate-400">
//                                   {formatTimeAgo(transaction.timestamp)}
//                                 </span>
//                               </div>
//                             </div>
//                             {transaction.amount && (
//                               <div className="text-right flex-shrink-0 ml-4">
//                                 <p className="font-bold text-green-600 dark:text-green-400">
//                                   +{transaction.amount} ℏ
//                                 </p>
//                               </div>
//                             )}
//                           </div>

//                           {/* Transaction ID and Actions */}
//                           <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
//                             <div className="flex items-center space-x-4">
//                               <span className="font-mono truncate max-w-32">
//                                 {transaction.transactionId}
//                               </span>
//                               <span>Fee: {transaction.fee} ℏ</span>
//                               {transaction.blockNumber && (
//                                 <span>Block: {transaction.blockNumber.toLocaleString()}</span>
//                               )}
//                             </div>

//                             <div className="flex items-center space-x-1">
//                               <Button
//                                 variant="ghost"
//                                 size="sm"
//                                 className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
//                                 onClick={() => openInExplorer(transaction.transactionId)}
//                               >
//                                 <ExternalLink className="w-3 h-3" />
//                               </Button>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 </motion.div>
//               );
//             })}
//           </AnimatePresence>

//           {/* Empty State */}
//           {filteredTransactions.length === 0 && !isLoading && !error && (
//             <div className="text-center py-12">
//               <Activity className="w-16 h-16 mx-auto text-slate-400 mb-4" />
//               <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
//                 {transactions.length === 0 ? "No transactions yet" : "No matching transactions"}
//               </h3>
//               <p className="text-slate-600 dark:text-slate-400 mb-6">
//                 {transactions.length === 0 
//                   ? "Your blockchain activity will appear here as you use TalentChain Pro"
//                   : "Try adjusting your search or filters"
//                 }
//               </p>
//               {transactions.length > 0 && (
//                 <Button 
//                   variant="outline"
//                   onClick={() => {
//                     setSearchTerm("");
//                     setTypeFilter("all");
//                     setStatusFilter("all");
//                   }}
//                 >
//                   Clear Filters
//                 </Button>
//               )}
//             </div>
//           )}
//         </div>
//       )}
//     </DashboardWidget>
//   );
// }

// export default TransactionHistoryWidget;

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ExternalLink,
  Filter,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  Hash,
  Eye,
  RefreshCw,
  Download,
  ChevronDown,
  Menu
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardWidget } from "./dashboard-widget";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface TransactionHistoryWidgetProps {
  className?: string;
}

interface Transaction {
  id: string;
  type: 'skill_created' | 'skill_updated' | 'pool_created' | 'pool_applied' | 'pool_matched' | 'hbar_transfer' | 'contract_call';
  status: 'success' | 'pending' | 'failed';
  amount?: string;
  timestamp: number;
  transactionId: string;
  description: string;
  from?: string;
  to?: string;
  fee: string;
  blockNumber?: number;
  metadata?: Record<string, any>;
}

// Mock transaction data - would come from Hedera Mirror Node API
const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'skill_created',
    status: 'success',
    timestamp: Date.now() - 3600000, // 1 hour ago
    transactionId: '0.0.123456@1704142800.123456789',
    description: 'Created React Development skill token',
    to: '0.0.123456',
    fee: '0.05',
    blockNumber: 12345678,
    metadata: { skillCategory: 'React Development', level: 8 }
  },
  {
    id: '2',
    type: 'pool_applied',
    status: 'success',
    timestamp: Date.now() - 7200000, // 2 hours ago
    transactionId: '0.0.123456@1704139200.123456789',
    description: 'Applied to Senior Frontend Developer position at DeFi Protocol',
    fee: '0.02',
    blockNumber: 12345650,
    metadata: { poolId: 5, skillTokens: [1, 3, 7] }
  },
  {
    id: '3',
    type: 'hbar_transfer',
    status: 'success',
    amount: '150.00',
    timestamp: Date.now() - 86400000, // 1 day ago
    transactionId: '0.0.123456@1704056400.123456789',
    description: 'Received payment from completed job match',
    from: '0.0.654321',
    to: '0.0.123456',
    fee: '0.0001',
    blockNumber: 12344000
  },
  {
    id: '4',
    type: 'skill_updated',
    status: 'success',
    timestamp: Date.now() - 172800000, // 2 days ago
    transactionId: '0.0.123456@1703970000.123456789',
    description: 'AI Oracle updated Smart Contracts skill to level 7',
    fee: '0.01',
    blockNumber: 12340000,
    metadata: { skillId: 2, oldLevel: 6, newLevel: 7 }
  },
  {
    id: '5',
    type: 'pool_created',
    status: 'pending',
    amount: '50.00',
    timestamp: Date.now() - 300000, // 5 minutes ago
    transactionId: '0.0.123456@1704146400.123456789',
    description: 'Creating job pool for Blockchain Developer position',
    fee: '0.10',
    metadata: { salary: '120000 HBAR', requiredSkills: [2, 4, 8] }
  }
];

export function TransactionHistoryWidget({ className }: TransactionHistoryWidgetProps) {
  const { user, isConnected } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  // Load transaction history
  useEffect(() => {
    if (isConnected && user) {
      fetchTransactionHistory();
    }
  }, [isConnected, user]);

  // Filter and sort transactions
  useEffect(() => {
    let filtered = transactions.filter(tx => {
      const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || tx.type === typeFilter;
      const matchesStatus = statusFilter === "all" || tx.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "amount":
          return parseFloat(b.amount || "0") - parseFloat(a.amount || "0");
        case "fee":
          return parseFloat(b.fee) - parseFloat(a.fee);
        case "recent":
        default:
          return b.timestamp - a.timestamp;
      }
    });

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, typeFilter, statusFilter, sortBy]);

  const fetchTransactionHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with real Hedera Mirror Node API call
      // const response = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${user.accountId}/transactions`);
      // const data = await response.json();

      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Use mock data for now
      setTransactions(mockTransactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transaction history');
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'skill_created': return { icon: TrendingUp, color: "text-blue-600" };
      case 'skill_updated': return { icon: ArrowUpRight, color: "text-green-600" };
      case 'pool_created': return { icon: Coins, color: "text-purple-600" };
      case 'pool_applied': return { icon: ArrowUpRight, color: "text-yellow-600" };
      case 'pool_matched': return { icon: CheckCircle2, color: "text-green-600" };
      case 'hbar_transfer': return { icon: ArrowDownLeft, color: "text-emerald-600" };
      case 'contract_call': return { icon: Hash, color: "text-slate-600" };
      default: return { icon: Activity, color: "text-slate-600" };
    }
  };

  const getStatusConfig = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return { label: "Success", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" };
      case 'pending':
        return { label: "Pending", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" };
      case 'failed':
        return { label: "Failed", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" };
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const openInExplorer = (transactionId: string) => {
    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK === 'mainnet' ? '' : 'testnet.';
    window.open(`https://${network}hashscan.io/transaction/${transactionId}`, '_blank');
  };

  const totalTransactionCount = transactions.length;
  const pendingCount = transactions.filter(tx => tx.status === 'pending').length;
  const totalFees = transactions.reduce((sum, tx) => sum + parseFloat(tx.fee), 0);

  return (
    <DashboardWidget
      title="Transaction History"
      description="Your complete blockchain activity and transaction timeline"
      icon={Activity}
      className={className}
      headerActions={
        <div className="flex items-center space-x-2">
          {/* Stats - Hidden on mobile, show on larger screens */}
          <div className="hidden lg:flex items-center space-x-4 text-xs text-slate-600 dark:text-slate-400 mr-4">
            <div className="flex items-center space-x-1">
              <Hash className="w-3 h-3" />
              <span className="hidden xl:inline">{totalTransactionCount}</span>
              <span className="xl:hidden">{totalTransactionCount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span className="hidden xl:inline">{pendingCount} pending</span>
              <span className="xl:hidden">{pendingCount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Coins className="w-3 h-3" />
              <span className="hidden xl:inline">{totalFees.toFixed(4)} ℏ fees</span>
              <span className="xl:hidden">{totalFees.toFixed(2)} ℏ</span>
            </div>
          </div>

          {/* Action buttons */}
          <Button
            size="sm"
            variant="outline"
            onClick={fetchTransactionHistory}
            disabled={isLoading}
            className="hidden sm:flex"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="hidden md:flex"
          >
            <Download className="w-4 h-4" />
          </Button>

          {/* Mobile menu button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden"
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      }
    >
      {/* Mobile stats panel */}
      <div className="lg:hidden bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 mb-4">
        <div className="grid grid-cols-3 gap-4 text-center text-xs">
          <div className="flex flex-col items-center space-y-1">
            <Hash className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="font-medium text-slate-900 dark:text-white">{totalTransactionCount}</span>
            <span className="text-slate-600 dark:text-slate-400">Total</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="font-medium text-slate-900 dark:text-white">{pendingCount}</span>
            <span className="text-slate-600 dark:text-slate-400">Pending</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <Coins className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="font-medium text-slate-900 dark:text-white">{totalFees.toFixed(4)} ℏ</span>
            <span className="text-slate-600 dark:text-slate-400">Fees</span>
          </div>
        </div>
      </div>

      {/* Mobile action buttons */}
      <div className="sm:hidden flex space-x-2 mb-4">
        <Button
          size="sm"
          variant="outline"
          onClick={fetchTransactionHistory}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
        <Button size="sm" variant="outline" className="flex-1">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters - Responsive layout */}
      <div className={cn(
        "transition-all duration-300 overflow-hidden mb-6",
        showFilters || window.innerWidth >= 640 ? "max-h-96 opacity-100" : "max-h-0 opacity-0 sm:max-h-96 sm:opacity-100"
      )}>
        {/* Search bar - Full width on mobile */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filter controls - Stack on mobile, inline on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <Filter className="w-4 h-4 mr-2 flex-shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="skill_created">Skills Created</SelectItem>
              <SelectItem value="skill_updated">Skills Updated</SelectItem>
              <SelectItem value="pool_created">Pools Created</SelectItem>
              <SelectItem value="pool_applied">Pool Applications</SelectItem>
              <SelectItem value="hbar_transfer">HBAR Transfers</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
              <SelectItem value="fee">Fee</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear filters button - spans full width on mobile when in single column */}
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setTypeFilter("all");
              setStatusFilter("all");
              setSortBy("recent");
            }}
            className="sm:col-span-1 lg:col-span-1"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Transaction List */}
      {isLoading && transactions.length === 0 ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full max-w-xs mb-2" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-32" />
                </div>
                <div className="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 px-4">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <p className="text-red-600 dark:text-red-400 font-medium mb-2">Failed to load transactions</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-md mx-auto">{error}</p>
          <Button onClick={fetchTransactionHistory} variant="outline">
            Try Again
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTransactions.map((transaction, index) => {
              const { icon: Icon, color } = getTransactionIcon(transaction.type);
              const statusConfig = getStatusConfig(transaction.status);

              return (
                <motion.div
                  key={transaction.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="group hover:shadow-lg hover:border-hedera-300 dark:hover:border-hedera-600 transition-all duration-300">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        {/* Transaction Icon */}
                        <div className={cn(
                          "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                          transaction.status === 'success' ? "bg-green-100 dark:bg-green-900/30" :
                            transaction.status === 'pending' ? "bg-yellow-100 dark:bg-yellow-900/30" :
                              "bg-red-100 dark:bg-red-900/30"
                        )}>
                          <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", color)} />
                        </div>

                        {/* Transaction Details */}
                        <div className="flex-1 min-w-0">
                          {/* Main content row */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="font-medium text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                                {transaction.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <Badge className={cn("text-xs px-2 py-0.5", statusConfig.color)}>
                                  {statusConfig.label}
                                </Badge>
                                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                  {formatTimeAgo(transaction.timestamp)}
                                </span>
                              </div>
                            </div>
                            {transaction.amount && (
                              <div className="text-right flex-shrink-0">
                                <p className="font-bold text-green-600 dark:text-green-400 text-sm sm:text-base">
                                  +{transaction.amount} ℏ
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Transaction ID and Actions - Responsive */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                              <span className="font-mono truncate max-w-[180px] sm:max-w-[200px]">
                                {transaction.transactionId}
                              </span>
                              <div className="flex items-center gap-3 text-xs">
                                <span>Fee: {transaction.fee} ℏ</span>
                                {transaction.blockNumber && (
                                  <span className="hidden sm:inline">
                                    Block: {transaction.blockNumber.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 sm:h-8 sm:w-8 p-0 opacity-60 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                onClick={() => openInExplorer(transaction.transactionId)}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Block number on mobile */}
                          {transaction.blockNumber && (
                            <div className="sm:hidden text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Block: {transaction.blockNumber.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Empty State */}
          {filteredTransactions.length === 0 && !isLoading && !error && (
            <div className="text-center py-12 px-4">
              <Activity className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {transactions.length === 0 ? "No transactions yet" : "No matching transactions"}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                {transactions.length === 0
                  ? "Your blockchain activity will appear here as you use TalentChain Pro"
                  : "Try adjusting your search or filters"
                }
              </p>
              {transactions.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setTypeFilter("all");
                    setStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </DashboardWidget>
  );
}

export default TransactionHistoryWidget;