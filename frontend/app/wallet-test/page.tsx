"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WalletType, walletConnector, WalletConnector } from '@/lib/wallet/wallet-connector';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

export default function WalletTestPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<string>('Not connected');
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<any>({});
    const [availableWallets, setAvailableWallets] = useState<WalletType[]>([]);

    useEffect(() => {
        checkEnvironmentVariables();
        checkAvailableWallets();
        checkConnectionStatus();
    }, []);

    const checkConnectionStatus = () => {
        const currentConnection = walletConnector.getConnection();
        if (currentConnection) {
            setConnectionStatus(`Saved connection: ${currentConnection.type} - ${currentConnection.address.slice(0, 6)}...${currentConnection.address.slice(-4)}`);
        }
    };

    const checkEnvironmentVariables = () => {
        const envVars = {
            NEXT_PUBLIC_HEDERA_NETWORK: process.env.NEXT_PUBLIC_HEDERA_NETWORK,
            NEXT_PUBLIC_METAMASK_CHAIN_ID: process.env.NEXT_PUBLIC_METAMASK_CHAIN_ID,
            NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
            NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
            NODE_ENV: process.env.NODE_ENV,
        };
        setDebugInfo(envVars);
    };

    const checkAvailableWallets = async () => {
        try {
            const wallets = await WalletConnector.getAvailableWallets();
            setAvailableWallets(wallets);
        } catch (error) {
            console.error('Error checking available wallets:', error);
        }
    };

    const testMetaMaskConnection = async () => {
        setIsLoading(true);
        setError(null);
        setConnectionStatus('Testing connection...');

        try {
            console.log('🧪 Starting MetaMask connection test...');

            // Test if MetaMask is installed
            const isInstalled = WalletConnector.isMetaMaskInstalled();
            console.log('MetaMask installed:', isInstalled);

            if (!isInstalled) {
                throw new Error('MetaMask extension not found');
            }

            // Test if MetaMask is available
            const isAvailable = await WalletConnector.isMetaMaskAvailable();
            console.log('MetaMask available:', isAvailable);

            if (!isAvailable) {
                throw new Error('MetaMask is not available (might be locked)');
            }

            // Test connection
            const connection = await walletConnector.connect(WalletType.METAMASK);
            console.log('Connection successful:', connection);

            setConnectionStatus(`Connected to ${connection.address}`);
        } catch (error) {
            console.error('MetaMask test failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            setConnectionStatus('Connection failed');
        } finally {
            setIsLoading(false);
        }
    };

    const testWalletConnect = async () => {
        setIsLoading(true);
        setError(null);
        setConnectionStatus('Testing WalletConnect...');

        try {
            const connection = await walletConnector.connect(WalletType.WALLETCONNECT);
            console.log('WalletConnect connection successful:', connection);
            setConnectionStatus(`Connected via WalletConnect to ${connection.address}`);
        } catch (error) {
            console.error('WalletConnect test failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            setConnectionStatus('WalletConnect failed');
        } finally {
            setIsLoading(false);
        }
    };

    const disconnect = () => {
        try {
            walletConnector.disconnect();
            setConnectionStatus('Disconnected');
            setError(null);
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    };

    const resetState = () => {
        try {
            walletConnector.resetConnectionState();
            setConnectionStatus('State reset');
            setError(null);
        } catch (error) {
            console.error('Reset error:', error);
        }
    };

    const restoreConnection = async () => {
        setIsLoading(true);
        setError(null);
        setConnectionStatus('Attempting to restore connection...');

        try {
            console.log('🔄 Attempting to restore connection...');
            const currentConnection = walletConnector.getConnection();

            if (currentConnection) {
                const canRestore = await walletConnector.canRestoreConnection();

                if (canRestore) {
                    const isHealthy = await walletConnector.checkConnectionHealth();

                    if (isHealthy) {
                        setConnectionStatus(`Connection restored to ${currentConnection.address}`);
                        console.log('✅ Connection restored successfully');
                    } else {
                        throw new Error('Connection is unhealthy');
                    }
                } else {
                    throw new Error('Connection cannot be restored (MetaMask might be locked)');
                }
            } else {
                throw new Error('No saved connection found');
            }
        } catch (error) {
            console.error('Error restoring connection:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            setConnectionStatus('Restore failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Wallet Connection Test
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Test and debug wallet connections for TalentChain Pro
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Environment Variables */}
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 hover:border-hedera-300/50 dark:hover:border-hedera-700/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            Environment Variables
                        </CardTitle>
                        <CardDescription>
                            Check if required environment variables are set
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {Object.entries(debugInfo).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {key}:
                                </span>
                                <Badge variant={value ? "default" : "destructive"}>
                                    {value ? value.toString() : "Not set"}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Available Wallets */}
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 hover:border-hedera-300/50 dark:hover:border-hedera-700/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Available Wallets
                        </CardTitle>
                        <CardDescription>
                            Wallets detected in the browser
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {availableWallets.map((wallet) => (
                                <Badge key={wallet} variant="outline" className="mr-2">
                                    {wallet}
                                </Badge>
                            ))}
                            {availableWallets.length === 0 && (
                                <p className="text-sm text-gray-500">No wallets detected</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Connection Status */}
            <Card className="mt-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 hover:border-hedera-300/50 dark:hover:border-hedera-700/50">
                <CardHeader>
                    <CardTitle>Connection Status</CardTitle>
                    <CardDescription>
                        Current wallet connection status
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm font-medium">Status:</span>
                        <Badge variant={connectionStatus.includes('Connected') ? "default" : "secondary"}>
                            {connectionStatus}
                        </Badge>

                        {/* Show saved connection info */}
                        {walletConnector.getConnection() && (
                            <div className="ml-4 flex items-center gap-2">
                                <span className="text-sm text-gray-600">Saved:</span>
                                <Badge variant="outline" className="text-xs">
                                    {walletConnector.getConnection()?.type} - {walletConnector.getConnection()?.address?.slice(0, 6)}...{walletConnector.getConnection()?.address?.slice(-4)}
                                </Badge>
                            </div>
                        )}
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex flex-wrap gap-3">
                        <Button
                            onClick={testMetaMaskConnection}
                            disabled={isLoading}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {isLoading ? 'Testing...' : 'Test MetaMask'}
                        </Button>

                        <Button
                            onClick={testWalletConnect}
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isLoading ? 'Testing...' : 'Test WalletConnect'}
                        </Button>

                        <Button
                            onClick={disconnect}
                            variant="outline"
                            disabled={isLoading}
                        >
                            Disconnect
                        </Button>

                        <Button
                            onClick={resetState}
                            variant="outline"
                            disabled={isLoading}
                        >
                            Reset State
                        </Button>

                        <Button
                            onClick={restoreConnection}
                            variant="outline"
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            Restore Connection
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Debug Information */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Debug Information</CardTitle>
                    <CardDescription>
                        Additional debugging information
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">Browser Info:</h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <p>User Agent: {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}</p>
                                <p>Location: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
                                <p>MetaMask: {typeof window !== 'undefined' ? (window.ethereum?.isMetaMask ? 'Detected' : 'Not detected') : 'N/A'}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">Wallet Connector State:</h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <p>Is Connected: {walletConnector.isConnected().toString()}</p>
                                <p>Connection: {walletConnector.getConnection() ? 'Active' : 'None'}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
