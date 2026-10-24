import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  HospitalExecutiveKPIs,
  WardOccupancySummary,
  SystemSettings,
  NotificationItem,
  OperationalEvent,
} from '../types/hospital.ts';
import { api } from '../services/api.ts';

interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
}

interface HospitalContextType {
  kpis: HospitalExecutiveKPIs | null;
  wardSummaries: WardOccupancySummary[];
  settings: SystemSettings | null;
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  feedEvents: OperationalEvent[];
  connectionStatus: 'connected' | 'reconnecting' | 'offline';
  lastSyncTime: Date | null;
  isDataStale: boolean;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  selectedWardFilter: string;
  setSelectedWardFilter: (wardId: string) => void;
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  refreshData: () => Promise<void>;
  acknowledgeNotification: (id: string) => Promise<void>;
  toasts: Toast[];
  addToast: (type: Toast['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
  resetDemo: () => Promise<void>;
}

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);

export const HospitalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [kpis, setKpis] = useState<HospitalExecutiveKPIs | null>(null);
  const [wardSummaries, setWardSummaries] = useState<WardOccupancySummary[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [feedEvents, setFeedEvents] = useState<OperationalEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'offline'>('connected');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());
  const [isDataStale, setIsDataStale] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('today');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast['type'], title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshData = useCallback(async () => {
    try {
      const [statsData, notifs, feed] = await Promise.all([
        api.getStats(),
        api.getNotifications(),
        api.getFeed(),
      ]);

      setKpis(statsData.kpis);
      setWardSummaries(statsData.wardSummaries);
      setSettings(statsData.settings);
      setNotifications(notifs);
      setFeedEvents(feed);
      setLastSyncTime(new Date());
      setIsDataStale(false);
      setConnectionStatus('connected');
    } catch (err) {
      console.error('Failed fetching hospital stats:', err);
      setConnectionStatus('offline');
    }
  }, []);

  // Periodic stale check (every 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastSyncTime && settings) {
        const diffMinutes = (Date.now() - lastSyncTime.getTime()) / 60000;
        if (diffMinutes > (settings.dataStaleThresholdMinutes || 20)) {
          setIsDataStale(true);
        }
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [lastSyncTime, settings]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Server-Sent Events (SSE) Live Sync
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        setConnectionStatus('connected');
      };

      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          setLastSyncTime(new Date());
          setIsDataStale(false);

          if (payload.type === 'operational_event') {
            const newEvt: OperationalEvent = payload.data;
            setFeedEvents((prev) => [newEvt, ...prev.slice(0, 199)]);
            if (newEvt.priority === 'CRITICAL' || newEvt.priority === 'URGENT') {
              addToast(
                newEvt.priority === 'CRITICAL' ? 'error' : 'warning',
                `${newEvt.title}`,
                newEvt.description
              );
            }
          } else if (payload.type === 'notification') {
            const notif: NotificationItem = payload.data;
            setNotifications((prev) => [notif, ...prev]);
            addToast(
              notif.priority === 'CRITICAL' ? 'error' : 'warning',
              notif.title,
              notif.message
            );
          } else if (payload.type === 'stats_updated') {
            setKpis(payload.data);
          } else if (payload.type === 'wards_updated') {
            setWardSummaries(payload.data);
          } else if (payload.type === 'database_reset') {
            refreshData();
            addToast('info', 'System Reset', 'Demo database restored to default state.');
          }
        } catch {
          // ignore keepalive comments
        }
      };

      eventSource.onerror = () => {
        setConnectionStatus('reconnecting');
        if (eventSource) eventSource.close();
        reconnectTimeout = setTimeout(connectSSE, 4000);
      };
    };

    connectSSE();

    // Fallback polling every 20 seconds to guarantee fresh view
    const pollingInterval = setInterval(() => {
      refreshData();
    }, 20000);

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(pollingInterval);
    };
  }, [addToast, refreshData]);

  const acknowledgeNotification = async (id: string) => {
    try {
      const updated = await api.acknowledgeNotification(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
      addToast('success', 'Acknowledged', 'Notification acknowledged.');
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    }
  };

  const resetDemo = async () => {
    try {
      await api.resetDemoData();
      await refreshData();
      addToast('success', 'Reset Complete', 'Standard Juaboso Government Hospital demo data restored.');
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    }
  };

  const unreadNotificationCount = notifications.filter((n) => !n.read || !n.acknowledged).length;

  return (
    <HospitalContext.Provider
      value={{
        kpis,
        wardSummaries,
        settings,
        notifications,
        unreadNotificationCount,
        feedEvents,
        connectionStatus,
        lastSyncTime,
        isDataStale,
        globalSearch,
        setGlobalSearch,
        selectedWardFilter,
        setSelectedWardFilter,
        selectedPeriod,
        setSelectedPeriod,
        refreshData,
        acknowledgeNotification,
        toasts,
        addToast,
        removeToast,
        resetDemo,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => {
  const context = useContext(HospitalContext);
  if (!context) {
    throw new Error('useHospital must be used within a HospitalProvider');
  }
  return context;
};
