import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';

// Mock data - would come from API in real app
const siteStats = {
  total: 247,
  active: 234,
  warning: 8,
  offline: 5,
};

const recentSites = [
  { id: '1', name: 'NYC-Tower-001', location: 'New York, NY', status: 'active', lastUpdate: '2 min ago' },
  { id: '2', name: 'LON-Tower-042', location: 'London, UK', status: 'warning', lastUpdate: '5 min ago' },
  { id: '3', name: 'TOK-Tower-087', location: 'Tokyo, JP', status: 'active', lastUpdate: '1 min ago' },
  { id: '4', name: 'SYD-Tower-023', location: 'Sydney, AU', status: 'active', lastUpdate: '3 min ago' },
];

export const SiteOverview = () => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'offline': return <Activity className="w-4 h-4 text-destructive" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default' as const;
      case 'warning': return 'secondary' as const;
      case 'offline': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  return (
    <Card className="p-6 bg-gradient-panel border-dashboard-border shadow-lg">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-foreground">Site Overview</h3>
          <p className="text-sm text-muted-foreground">Current status of all sites</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-background/50 rounded-lg border border-dashboard-border">
            <div className="text-2xl font-bold text-primary">{siteStats.total}</div>
            <div className="text-xs text-muted-foreground">Total Sites</div>
          </div>
          
          <div className="text-center p-3 bg-background/50 rounded-lg border border-dashboard-border">
            <div className="text-2xl font-bold text-success">{siteStats.active}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          
          <div className="text-center p-3 bg-background/50 rounded-lg border border-dashboard-border">
            <div className="text-2xl font-bold text-warning">{siteStats.warning}</div>
            <div className="text-xs text-muted-foreground">Warnings</div>
          </div>
          
          <div className="text-center p-3 bg-background/50 rounded-lg border border-dashboard-border">
            <div className="text-2xl font-bold text-destructive">{siteStats.offline}</div>
            <div className="text-xs text-muted-foreground">Offline</div>
          </div>
        </div>

        {/* Recent Sites */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-foreground">Recent Activity</h4>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          
          <div className="space-y-3">
            {recentSites.map((site) => (
              <div key={site.id} className="flex items-center justify-between p-3 bg-background/30 rounded-lg border border-dashboard-border">
                <div className="flex items-center gap-3">
                  {getStatusIcon(site.status)}
                  <div>
                    <div className="text-sm font-medium text-foreground">{site.name}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {site.location}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={getStatusVariant(site.status)} className="mb-1">
                    {site.status}
                  </Badge>
                  <div className="text-xs text-muted-foreground">{site.lastUpdate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};