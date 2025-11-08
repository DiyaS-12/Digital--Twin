import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Activity, AlertTriangle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UploadStatus } from './UploadStatus';

interface Site {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  ifc_site_id: string;
  status: string;
  sensors_count: number;
  created_at: string;
  updated_at: string;
  ifc_file_path: string;
  user_id: string;
  oss_urn?: string;
  upload_status?: string;
  upload_stage?: string;        // ✅ new
  error_message?: string;       // ✅ new
  last_uploaded_at?: string;    // ✅ new
}

interface SitesListProps {
  refreshTrigger?: number;
  //onRetryUpload?: (site: Site) => void;
}

export const SitesList = ({ refreshTrigger }: SitesListProps) => {
  const navigate = useNavigate();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [fileToRetry, setFileToRetry] = useState<Site | null>(null);

  const fetchSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sites:', error);
        toast.error('Failed to load sites');
        return;
      }

      setSites(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load sites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [refreshTrigger]);
  const handleDelete = async (id: string) => {
    if(!confirm('Are you sure you want to delete this site?')) return;
    try{
      const {error} = await supabase.from('sites').delete().eq('id', id);
      if (error) throw error;
      toast.success('Site deleted successfully');
      setSites((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete site');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="w-4 h-4 text-success" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'offline': return <Activity className="w-4 h-4 text-destructive" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };
  const onRetryUpload = async (site: Site) => {
  try {
    // Reset upload status to pending
    const res: any = await (supabase as any).rpc('update_site_upload_status', {
      p_site_id: site.id,
      p_status: 'pending',
      p_stage: 'supabase',
      p_error: null,
    });

    if (res.error) throw res.error;

    toast.success('Upload reset to pending');
    fetchSites();
  } catch (err: any) {
    console.error('Retry error:', err);
    toast.error('Failed to reset upload');
  }
};

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success' as const;
      case 'warning': return 'warning' as const;
      case 'offline': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  const formatCoordinates = (lat: number, lng: number) => {
    if (!lat || !lng) return 'Not specified';
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hour ago`;
    return `${Math.floor(diffMins / 1440)} day ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading sites...</div>
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-3 bg-muted/20 rounded-full mb-4">
          <MapPin className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No Sites Yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload your first IFC file to get started with site management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">All Sites</h2>
        <p className="text-sm text-muted-foreground">Total: {sites.length} sites</p>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Site Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Coordinates</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sensors</TableHead>
            <TableHead>Last Update</TableHead>
            <TableHead>Upload Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sites.map((site) => (
            <TableRow key={site.id}>
              <TableCell className="font-medium">{site.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {site.location || 'Not specified'}
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {formatCoordinates(site.latitude, site.longitude)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(site.status)}
                  <Badge variant={getStatusVariant(site.status)}>
                    {site.status}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {site.sensors_count > 0 ? `${site.sensors_count} active` : 'No data'}
                </span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {getRelativeTime(site.updated_at)}
              </TableCell>
              <TableCell>
                <UploadStatus
                  status={site.upload_status}
                  stage={site.upload_stage}
                  error={site.error_message}
                  onRetry={() => onRetryUpload(site)}/>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/viewer/${site.id}`)}
                    disabled={!site.oss_urn || site.status === 'processing'}
                  >
                    {site.status === 'processing' ? 'Processing...' : 'View in 3D'}
                  </Button>
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button 
                    variant="ghost"
                    size='sm'
                    className='text-destructive hover:bg-destructive/10'
                    onClick={() => handleDelete(site.id)}
                  >
                    <Trash2 className='w-4 h-4'/>
                  </Button>
                  {site.upload_status === 'failed' && (
                    <Button variant='outline' size='sm' onClick={() => onRetryUpload?.(site)}>
                      Retry Upload
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};