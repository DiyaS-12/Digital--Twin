import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Eye, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Site {
  id: string;
  name: string;
  location: string | null;
  oss_urn: string | null;
  created_at: string;
  ifc_file_path: string | null;
}

const ModelsLibrary = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all sites from database
      const { data: sitesData, error: sitesError } = await supabase
        .from('sites')
        .select('*')
        .order('created_at', { ascending: false });

      if (sitesError) throw sitesError;
      setSites(sitesData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.message || 'Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = (site: Site) => {
    if (!site.oss_urn) {
      return {
        label: 'Upload Failed',
        icon: AlertCircle,
        variant: 'destructive' as const,
        canView: false,
      };
    }
    return {
      label: 'Ready',
      icon: CheckCircle,
      variant: 'default' as const,
      canView: true,
    };
  };

  const handleViewModel = (site: Site) => {
    const statusInfo = getStatusInfo(site);
    if (statusInfo.canView) {
      navigate(`/viewer/${site.id}`);
    } else {
      toast.error('This model failed to upload. Please try uploading again.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">3D Models Library</h1>
          <p className="text-muted-foreground">
            All uploaded site models
          </p>
        </div>

        {sites.length === 0 ? (
          <Card className="p-12 text-center bg-gradient-panel border-dashboard-border">
            <p className="text-muted-foreground">
              No models found. Upload an IFC file to get started.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map((site) => {
              const statusInfo = getStatusInfo(site);
              const StatusIcon = statusInfo.icon;
              
              return (
                <Card
                  key={site.id}
                  className="p-6 bg-gradient-panel border-dashboard-border hover:shadow-lg transition-shadow"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-foreground">
                          {site.name}
                        </h3>
                        {site.location && (
                          <p className="text-sm text-muted-foreground">{site.location}</p>
                        )}
                      </div>
                      <Badge variant={statusInfo.variant} className="gap-1">
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(site.created_at)}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={() => handleViewModel(site)}
                        className="w-full gap-2"
                        disabled={!statusInfo.canView}
                      >
                        <Eye className="w-4 h-4" />
                        {statusInfo.canView ? 'View in 3D' : 'Upload Failed'}
                      </Button>
                      {!statusInfo.canView && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          Try uploading this site again
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ModelsLibrary;