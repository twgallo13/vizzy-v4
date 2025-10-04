import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, User, RefreshCw } from 'lucide-react';
import { useAuditLog } from '@/lib/audit';

interface StatusPanelProps {
  className?: string;
}

interface SystemStatus {
  timestamp: string;
  uptime: string;
  version: string;
  environment: string;
  services: {
    database: 'healthy' | 'degraded' | 'down';
    cache: 'healthy' | 'degraded' | 'down';
    export: 'healthy' | 'degraded' | 'down';
  };
}

export function StatusPanel({ className }: StatusPanelProps) {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getRecentAuditLogs } = useAuditLog();

  const fetchStatus = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call to /status endpoint
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockStatus: SystemStatus = {
        timestamp: new Date().toISOString(),
        uptime: '2 days, 14 hours',
        version: 'v1.2.3',
        environment: 'production',
        services: {
          database: 'healthy',
          cache: 'healthy',
          export: 'healthy'
        }
      };
      
      setStatus(mockStatus);
    } catch (err) {
      setError('Failed to fetch system status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const recentAuditLogs = getRecentAuditLogs(10);

  const getServiceBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'degraded': return 'secondary';
      case 'down': return 'destructive';
      default: return 'outline';
    }
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleString();
  };

  const getActionIcon = (action: string) => {
    if (action.includes('user')) return <User className="h-3 w-3" />;
    if (action.includes('export')) return <Activity className="h-3 w-3" />;
    return <Clock className="h-3 w-3" />;
  };

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* System Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-lg">System Status</CardTitle>
            <CardDescription>Live operational health and recent activity</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchStatus}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 p-2 bg-red-50 border border-red-200 rounded">
              {error}
            </div>
          )}
          
          {status && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Status</div>
                  <Badge variant="default" className="text-xs">
                    Operational
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Uptime</div>
                  <div className="text-sm">{status.uptime}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Version</div>
                  <div className="text-sm font-mono">{status.version}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Environment</div>
                  <Badge variant="secondary" className="text-xs">
                    {status.environment}
                  </Badge>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="text-sm font-medium text-muted-foreground mb-2">Services</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(status.services).map(([service, serviceStatus]) => (
                    <Badge 
                      key={service} 
                      variant={getServiceBadgeVariant(serviceStatus)}
                      className="text-xs"
                    >
                      {service}: {serviceStatus}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Last updated: {formatTimestamp(status.timestamp)}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Audit Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>
            Last {Math.min(recentAuditLogs.length, 10)} audit log entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentAuditLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent activity to display</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAuditLogs.map((log) => (
                <div 
                  key={log.logId} 
                  className="flex items-center justify-between p-2 hover:bg-muted/20 rounded text-sm"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getActionIcon(log.action)}
                    <span className="font-medium truncate">
                      {log.action.replace(/_/g, ' ').toLowerCase()}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {log.targetId.length > 15 ? `${log.targetId.substring(0, 15)}...` : log.targetId}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {log.source}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}