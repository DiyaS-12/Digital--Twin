import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Wind, CloudRain, Thermometer, Fuel } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SensorData {
  siteId: string;
  siteName: string;
  wind: number;
  rain: number;
  temperature: number;
  fuel: number;
  timestamp: Date;
}

// Mock live data generator
const generateMockData = (): SensorData[] => {
  const sites = ['NYC-Tower-001', 'LON-Tower-042', 'TOK-Tower-087'];
  return sites.map(siteName => ({
    siteId: siteName.toLowerCase().replace(/-/g, '_'),
    siteName,
    wind: Math.round(Math.random() * 50 + 5),
    rain: Math.round(Math.random() * 20),
    temperature: Math.round(Math.random() * 40 - 10),
    fuel: Math.round(Math.random() * 100),
    timestamp: new Date(),
  }));
};

export const LiveDataPanel = () => {
  const [liveData, setLiveData] = useState<SensorData[]>(generateMockData());

  // Simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveData(generateMockData());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'wind': return <Wind className="w-4 h-4" />;
      case 'rain': return <CloudRain className="w-4 h-4" />;
      case 'temperature': return <Thermometer className="w-4 h-4" />;
      case 'fuel': return <Fuel className="w-4 h-4" />;
      default: return null;
    }
  };

  const getSensorColor = (type: string, value: number) => {
    switch (type) {
      case 'wind':
        if (value > 40) return 'text-destructive';
        if (value > 25) return 'text-warning';
        return 'text-success';
      case 'rain':
        if (value > 15) return 'text-destructive';
        if (value > 8) return 'text-warning';
        return 'text-success';
      case 'temperature':
        if (value > 35 || value < -5) return 'text-destructive';
        if (value > 30 || value < 0) return 'text-warning';
        return 'text-success';
      case 'fuel':
        if (value < 20) return 'text-destructive';
        if (value < 40) return 'text-warning';
        return 'text-success';
      default:
        return 'text-foreground';
    }
  };

  const getProgressColor = (type: string, value: number) => {
    const color = getSensorColor(type, value);
    if (color.includes('destructive')) return 'bg-destructive';
    if (color.includes('warning')) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <Card className="p-6 bg-gradient-panel border-dashboard-border shadow-lg">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Live Sensor Data</h3>
            <Badge variant="monitoring" className="animate-pulse">
              LIVE
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Real-time monitoring data</p>
        </div>

        {/* Live Data */}
        <div className="space-y-4">
          {liveData.map((site, index) => (
            <div key={`${site.siteId}-${index}`} className="p-4 bg-background/30 rounded-lg border border-dashboard-border">
              <div className="mb-3">
                <h4 className="text-sm font-medium text-foreground">{site.siteName}</h4>
                <p className="text-xs text-muted-foreground">
                  Updated {site.timestamp.toLocaleTimeString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Wind */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Wind className={`w-4 h-4 ${getSensorColor('wind', site.wind)}`} />
                    <span className="text-xs text-muted-foreground">Wind</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(site.wind / 50) * 100} 
                      className="flex-1 h-2"
                    />
                    <span className={`text-xs font-medium ${getSensorColor('wind', site.wind)}`}>
                      {site.wind} mph
                    </span>
                  </div>
                </div>

                {/* Rain */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CloudRain className={`w-4 h-4 ${getSensorColor('rain', site.rain)}`} />
                    <span className="text-xs text-muted-foreground">Rain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(site.rain / 20) * 100} 
                      className="flex-1 h-2"
                    />
                    <span className={`text-xs font-medium ${getSensorColor('rain', site.rain)}`}>
                      {site.rain} mm
                    </span>
                  </div>
                </div>

                {/* Temperature */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Thermometer className={`w-4 h-4 ${getSensorColor('temperature', site.temperature)}`} />
                    <span className="text-xs text-muted-foreground">Temp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={((site.temperature + 10) / 50) * 100} 
                      className="flex-1 h-2"
                    />
                    <span className={`text-xs font-medium ${getSensorColor('temperature', site.temperature)}`}>
                      {site.temperature}°C
                    </span>
                  </div>
                </div>

                {/* Fuel */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Fuel className={`w-4 h-4 ${getSensorColor('fuel', site.fuel)}`} />
                    <span className="text-xs text-muted-foreground">Fuel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={site.fuel} 
                      className="flex-1 h-2"
                    />
                    <span className={`text-xs font-medium ${getSensorColor('fuel', site.fuel)}`}>
                      {site.fuel}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};