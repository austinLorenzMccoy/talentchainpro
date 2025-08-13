"use client";

import React, { useState, useEffect } from 'react';
import { WalletConnector, WalletType } from '@/lib/wallet/wallet-connector';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export default function WalletTestPage() {
    const [availableWallets, setAvailableWallets] = useState<WalletType[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<string>('Not connected');
    const [error, setError] = useState<string>('');
    const [logs, setLogs] = useState<string[]>([]);
    const [isTesting, setIsTesting] = useState(false);

    const { user, isConnected, isLoading, connectWallet, disconnectWallet, getAvailableWallets } = useAuth();

    const addLog = (message: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    useEffect(() => {
        addLog('Page loaded');
        checkAvailableWallets();
    }, []);

    const checkAvailableWallets = () => {
        addLog('Checking available wallets...');

        // Check HashPack
        const hashpackInstalled = WalletConnector.isHashPackInstalled();
        addLog(`HashPack installed: ${hashpackInstalled}`);

        // Check MetaMask
        const metamaskInstalled = WalletConnector.isMetaMaskInstalled();
        addLog(`MetaMask installed: ${metamaskInstalled}`);

        // Get all available wallets
        const available = getAvailableWallets();
        setAvailableWallets(available);
        addLog(`Available wallets: ${available.join(', ')}`);
    };

    const testConnection = async (walletType: WalletType) => {
        setIsTesting(true);
        setError('');
        setConnectionStatus('Connecting...');

        try {
            addLog(`Testing connection to ${walletType}...`);
            await connectWallet(walletType);
            setConnectionStatus(`Connected to ${walletType}`);
            addLog(`Successfully connected to ${walletType}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            setConnectionStatus('Connection failed');
            addLog(`Failed to connect to ${walletType}: ${errorMessage}`);
        } finally {
            setIsTesting(false);
        }
    };

    const handleDisconnect = () => {
        try {
            disconnectWallet();
            setConnectionStatus('Disconnected');
            addLog('Wallet disconnected');
        } catch (error) {
            addLog(`Failed to disconnect: ${error}`);
        }
    };

    const clearLogs = () => {
        setLogs([]);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        🧪 Wallet Connection Test
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400">
                        Test your wallet connections and verify the implementation
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Wallet Detection */}
                    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Info className="w-5 h-5 text-blue-500" />
                                <span>Wallet Detection</span>
                            </CardTitle>
                            <CardDescription>
                                Check which wallets are available on your system
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-lg">🔗</span>
                                        <span className="font-medium">HashPack</span>
                                    </div>
                                    <Badge variant={availableWallets.includes(WalletType.HASHPACK) ? "default" : "secondary"}>
                                        {availableWallets.includes(WalletType.HASHPACK) ? "Available" : "Not Installed"}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-lg">🦊</span>
                                        <span className="font-medium">MetaMask</span>
                                    </div>
                                    <Badge variant={availableWallets.includes(WalletType.METAMASK) ? "default" : "secondary"}>
                                        {availableWallets.includes(WalletType.METAMASK) ? "Available" : "Not Installed"}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-lg">🔌</span>
                                        <span className="font-medium">WalletConnect</span>
                                    </div>
                                    <Badge variant="default">Always Available</Badge>
                                </div>
                            </div>

                            <Button
                                onClick={checkAvailableWallets}
                                variant="outline"
                                className="w-full"
                            >
                                Refresh Detection
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Connection Testing */}
                    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span>Connection Testing</span>
                            </CardTitle>
                            <CardDescription>
                                Test connections to available wallets
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Status: {connectionStatus}
                                </h3>
                                {error && (
                                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                        {error}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                {availableWallets.map(wallet => (
                                    <Button
                                        key={wallet}
                                        onClick={() => testConnection(wallet)}
                                        disabled={isTesting || isConnected}
                                        className="w-full"
                                        variant="outline"
                                    >
                                        {isTesting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Connecting...
                                            </>
                                        ) : (
                                            <>
                                                Connect to {wallet}
                                            </>
                                        )}
                                    </Button>
                                ))}
                            </div>

                            {isConnected && (
                                <Button
                                    onClick={handleDisconnect}
                                    variant="destructive"
                                    className="w-full"
                                >
                                    Disconnect
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Connection Status */}
                {isConnected && user && (
                    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span>Connected Wallet</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                    <div className="text-sm text-slate-500 dark:text-slate-400">Wallet Type</div>
                                    <div className="font-medium">{user.walletType}</div>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                    <div className="text-sm text-slate-500 dark:text-slate-400">Address</div>
                                    <div className="font-medium font-mono text-sm">
                                        {user.walletAddress.slice(0, 10)}...{user.walletAddress.slice(-8)}
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                    <div className="text-sm text-slate-500 dark:text-slate-400">Balance</div>
                                    <div className="font-medium">{user.balance} HBAR</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Logs */}
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center space-x-2">
                                <AlertCircle className="w-5 h-5 text-blue-500" />
                                <span>Connection Logs</span>
                            </CardTitle>
                            <Button onClick={clearLogs} variant="outline" size="sm">
                                Clear Logs
                            </Button>
                        </div>
                        <CardDescription>
                            Real-time logs of wallet connection attempts and status
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
                            {logs.length === 0 ? (
                                <div className="text-slate-500">No logs yet. Try connecting a wallet to see activity.</div>
                            ) : (
                                logs.map((log, index) => (
                                    <div key={index} className="mb-1">
                                        {log}
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Instructions */}
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardHeader>
                        <CardTitle className="text-blue-900 dark:text-blue-100">
                            💡 How to Test
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-blue-800 dark:text-blue-200">
                        <ol className="list-decimal list-inside space-y-2">
                            <li>Make sure you have the required environment variables set in <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">.env.local</code></li>
                            <li>Install HashPack and/or MetaMask browser extensions</li>
                            <li>Click "Refresh Detection" to check available wallets</li>
                            <li>Click "Connect to [Wallet]" to test the connection</li>
                            <li>Check the logs for detailed connection information</li>
                            <li>Verify the connection status and wallet information</li>
                        </ol>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
