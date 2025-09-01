import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Database 
} from 'lucide-react';

interface OfflineData {
  type: string;
  key: string;
  data: any;
  timestamp: number;
  sync_status: 'pending' | 'synced' | 'error';
}

export default function OfflineModeManager() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState<OfflineData[]>([]);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cacheSize, setCacheSize] = useState(0);
  const [storageUsage, setStorageUsage] = useState({ used: 0, quota: 0 });

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load offline data and cache info
    loadOfflineData();
    updateCacheInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadOfflineData = () => {
    try {
      const stored = localStorage.getItem('offline_data');
      if (stored) {
        setOfflineData(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  };

  const updateCacheInfo = async () => {
    try {
      // Estimate storage usage
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        setStorageUsage({
          used: estimate.usage || 0,
          quota: estimate.quota || 0
        });
      }

      // Calculate cache size
      const dataSize = JSON.stringify(offlineData).length;
      setCacheSize(dataSize);
    } catch (error) {
      console.error('Failed to get storage info:', error);
    }
  };

  const syncOfflineData = async () => {
    if (!isOnline || offlineData.length === 0) return;

    setIsSyncing(true);
    setSyncProgress(0);

    const pendingItems = offlineData.filter(item => item.sync_status === 'pending');
    
    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      
      try {
        // Simulate API sync - replace with actual sync logic
        await syncDataItem(item);
        
        // Update sync status
        setOfflineData(prev => prev.map(data => 
          data.key === item.key 
            ? { ...data, sync_status: 'synced' as const }
            : data
        ));

        setSyncProgress(((i + 1) / pendingItems.length) * 100);
      } catch (error) {
        console.error(`Failed to sync item ${item.key}:`, error);
        
        setOfflineData(prev => prev.map(data => 
          data.key === item.key 
            ? { ...data, sync_status: 'error' as const }
            : data
        ));
      }
    }

    setIsSyncing(false);
    updateCacheInfo();
  };

  const syncDataItem = async (item: OfflineData): Promise<void> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, this would make the appropriate API call
    // based on item.type (checkin, booking, profile_update, etc.)
    console.log(`Syncing ${item.type}:`, item.data);
  };

  const clearCache = () => {
    localStorage.removeItem('offline_data');
    setOfflineData([]);
    setCacheSize(0);
  };

  const downloadOfflineData = async () => {
    // Simulate downloading essential data for offline use
    const essentialData = [
      { type: 'member_profile', key: 'profile', data: { name: 'Current User' } },
      { type: 'class_schedule', key: 'schedule', data: { classes: [] } },
      { type: 'membership_info', key: 'membership', data: { plan: 'Premium' } }
    ];

    const offlineItems: OfflineData[] = essentialData.map(item => ({
      ...item,
      timestamp: Date.now(),
      sync_status: 'synced' as const
    }));

    setOfflineData(prev => [...prev, ...offlineItems]);
    localStorage.setItem('offline_data', JSON.stringify(offlineItems));
    updateCacheInfo();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const pendingCount = offlineData.filter(item => item.sync_status === 'pending').length;
  const storagePercent = storageUsage.quota > 0 ? (storageUsage.used / storageUsage.quota) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Offline Mode</h2>
          <p className="text-muted-foreground">
            Manage offline data and synchronization
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Badge variant="default" className="flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              Online
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1">
              <WifiOff className="w-3 h-3" />
              Offline
            </Badge>
          )}
        </div>
      </div>

      {!isOnline && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You're currently offline. Changes will be synced when you reconnect.
          </AlertDescription>
        </Alert>
      )}

      {pendingCount > 0 && isOnline && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            {pendingCount} items pending sync. 
            <Button 
              variant="link" 
              className="p-0 h-auto ml-1"
              onClick={syncOfflineData}
              disabled={isSyncing}
            >
              {isSyncing ? 'Syncing...' : 'Sync now'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sync Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Sync Status
            </CardTitle>
            <CardDescription>
              Current synchronization status and pending items
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSyncing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Syncing data...</span>
                  <span>{Math.round(syncProgress)}%</span>
                </div>
                <Progress value={syncProgress} />
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pending Items</span>
                <span className="font-medium">{pendingCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Cached</span>
                <span className="font-medium">{offlineData.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cache Size</span>
                <span className="font-medium">{formatBytes(cacheSize)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={syncOfflineData} 
                disabled={!isOnline || isSyncing || pendingCount === 0}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync All
              </Button>
              <Button 
                variant="outline" 
                onClick={clearCache}
                disabled={offlineData.length === 0}
              >
                Clear Cache
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Storage Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Storage Usage
            </CardTitle>
            <CardDescription>
              Local storage usage and management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used Storage</span>
                <span>{formatBytes(storageUsage.used)} / {formatBytes(storageUsage.quota)}</span>
              </div>
              <Progress value={storagePercent} />
              <p className="text-xs text-muted-foreground">
                {storagePercent.toFixed(1)}% of available storage used
              </p>
            </div>

            <Button 
              onClick={downloadOfflineData}
              disabled={!isOnline}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Offline Data
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Offline Data Items */}
      {offlineData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Offline Data Items</CardTitle>
            <CardDescription>
              Items stored locally for offline access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {offlineData.slice(0, 10).map((item, index) => (
                <div key={item.key} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(item.sync_status)}
                    <div>
                      <p className="font-medium text-sm capitalize">
                        {item.type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.sync_status}
                  </Badge>
                </div>
              ))}
              {offlineData.length > 10 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  ... and {offlineData.length - 10} more items
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}