import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Globe, 
  Upload, 
  BarChart3, 
  Users, 
  Settings, 
  AlertTriangle,
  Building2,
  Activity,
  Box,
  Cpu
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const navigationItems = [
  { icon: Globe, label: 'Global View', path: '/' },
  { icon: Building2, label: 'Site Management', path: '/sites' },
  { icon: Box, label: '3D Models', path: '/models-library' },
  { icon: Activity, label: 'Live Monitoring', path: '/monitoring' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Upload, label: 'Upload IFC', path: '/upload' },
  { icon: AlertTriangle, label: 'Alerts', path: '/alerts' },
  { icon: Cpu, label: 'Sensor Data', path: '/sensors' },
  { icon: Users, label: 'User Management', path: '/users' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">TelecomTwin</h1>
            <p className="text-xs text-sidebar-foreground/60">Digital Twin Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Button
              key={item.path}
              variant={isActive ? 'default' : 'ghost'}
              className={cn(
                "w-full justify-start text-left gap-3 h-12",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              onClick={() => navigate(item.path)}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/60 text-center">
          Version 1.0.0
        </div>
      </div>
    </div>
  );
};