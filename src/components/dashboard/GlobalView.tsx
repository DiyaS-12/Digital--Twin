import { Card } from '@/components/ui/card';
import { Globe3D } from './Globe3D';
import { SiteOverview } from './SiteOverview';
import { LiveDataPanel } from './LiveDataPanel';

export const GlobalView = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Global Site Overview</h1>
        <p className="text-muted-foreground">Monitor all telecom tower sites worldwide in real-time</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D Globe Viewer */}
        <div className="lg:col-span-2">
          <Card className="p-6 bg-gradient-panel border-dashboard-border shadow-lg">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground">3D Site Map</h2>
              <p className="text-sm text-muted-foreground">Interactive globe showing all tower locations</p>
            </div>
            <div className="aspect-video rounded-lg overflow-hidden bg-dashboard-bg">
              <Globe3D />
            </div>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          <SiteOverview />
          {/*<LiveDataPanel />*/}
        </div>
      </div>
    </div>
  );
};