/**
 * Real-time updates hook for dashboard components
 * Provides WebSocket integration and event-driven updates
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useAuth } from './useAuth';

interface RealtimeEvent {
  type: 'skill_created' | 'skill_updated' | 'pool_created' | 'pool_applied' | 'pool_matched' | 'transaction_confirmed';
  data: any;
  timestamp: number;
  userId?: string;
}

interface UseRealTimeUpdatesReturn {
  isConnected: boolean;
  lastEvent: RealtimeEvent | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  subscribe: (eventType: string, callback: (event: RealtimeEvent) => void) => () => void;
  emit: (eventType: string, data: any) => void;
}

// WebSocket configuration
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export function useRealTimeUpdates(): UseRealTimeUpdatesReturn {
  const { user, isConnected: walletConnected } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventCallbacksRef = useRef<Map<string, Set<(event: RealtimeEvent) => void>>>(new Map());
  const reconnectAttemptsRef = useRef(0);
  
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<UseRealTimeUpdatesReturn['connectionStatus']>('disconnected');

  const connect = useCallback(() => {
    if (!walletConnected || !user?.accountId) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setConnectionStatus('connecting');
      const wsUrl = `${WS_BASE_URL}/ws?user_id=${encodeURIComponent(user.accountId)}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('📡 WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        
        // Send authentication/identification message
        ws.send(JSON.stringify({
          type: 'auth',
          user_id: user.accountId,
          timestamp: Date.now()
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data: RealtimeEvent = JSON.parse(event.data);
          console.log('📡 Received real-time event:', data);
          
          setLastEvent(data);
          
          // Notify all subscribers
          const callbacks = eventCallbacksRef.current.get(data.type);
          if (callbacks) {
            callbacks.forEach(callback => {
              try {
                callback(data);
              } catch (error) {
                console.error('Error in event callback:', error);
              }
            });
          }
          
          // Notify all subscribers listening to all events
          const allCallbacks = eventCallbacksRef.current.get('*');
          if (allCallbacks) {
            allCallbacks.forEach(callback => {
              try {
                callback(data);
              } catch (error) {
                console.error('Error in event callback:', error);
              }
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('📡 WebSocket disconnected');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect if it wasn't a manual close
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS && walletConnected) {
          reconnectAttemptsRef.current += 1;
          console.log(`📡 Attempting to reconnect... (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_DELAY);
        }
      };

      ws.onerror = (error) => {
        console.error('📡 WebSocket error:', error);
        setConnectionStatus('error');
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('📡 Failed to connect WebSocket:', error);
      setConnectionStatus('error');
    }
  }, [walletConnected, user?.accountId]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    reconnectAttemptsRef.current = 0;
  }, []);

  const subscribe = useCallback((eventType: string, callback: (event: RealtimeEvent) => void) => {
    if (!eventCallbacksRef.current.has(eventType)) {
      eventCallbacksRef.current.set(eventType, new Set());
    }
    
    eventCallbacksRef.current.get(eventType)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = eventCallbacksRef.current.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          eventCallbacksRef.current.delete(eventType);
        }
      }
    };
  }, []);

  const emit = useCallback((eventType: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: eventType,
        data,
        timestamp: Date.now(),
        userId: user?.accountId
      }));
    }
  }, [user?.accountId]);

  // Connect when wallet is connected
  useEffect(() => {
    if (walletConnected && user?.accountId) {
      connect();
    } else {
      disconnect();
    }
    
    return () => {
      disconnect();
    };
  }, [walletConnected, user?.accountId, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      eventCallbacksRef.current.clear();
    };
  }, [disconnect]);

  // Heartbeat to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const heartbeat = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }));
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(heartbeat);
  }, [isConnected]);

  return {
    isConnected,
    lastEvent,
    connectionStatus,
    subscribe,
    emit,
  };
}

/**
 * Hook for subscribing to specific real-time events
 */
export function useRealtimeEvent(
  eventType: string, 
  callback: (event: RealtimeEvent) => void,
  dependencies: any[] = []
) {
  const { subscribe } = useRealTimeUpdates();
  
  useEffect(() => {
    const unsubscribe = subscribe(eventType, callback);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, subscribe, ...dependencies]);
}

/**
 * Hook for automatic dashboard data refresh on relevant events
 */
export function useDashboardRealtimeSync(
  refreshCallback: () => void,
  dependencies: any[] = []
) {
  const { subscribe } = useRealTimeUpdates();
  
  useEffect(() => {
    // Subscribe to events that should trigger dashboard refresh
    const relevantEvents = [
      'skill_created',
      'skill_updated', 
      'pool_created',
      'pool_applied',
      'pool_matched',
      'transaction_confirmed'
    ];
    
    const unsubscribeFunctions = relevantEvents.map(eventType =>
      subscribe(eventType, (event) => {
        console.log(`🔄 Dashboard refresh triggered by ${event.type}`);
        refreshCallback();
      })
    );
    
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe, refreshCallback, ...dependencies]);
}