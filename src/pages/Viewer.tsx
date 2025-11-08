import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

declare global {
  interface Window {
    Autodesk: any;
  }
}

const Viewer = () => {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<any>(null);
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    // Load Forge Viewer scripts
    const loadForgeViewer = () => {
      return new Promise((resolve, reject) => {
        if (window.Autodesk) {
          resolve(window.Autodesk);
          return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js';
        script.onload = () => resolve(window.Autodesk);
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const initViewer = async () => {
      try {
        // Fetch site data
        const { data: siteData, error: siteError } = await supabase
          .from('sites')
          .select('*')
          .eq('id', siteId)
          .single();

        if (siteError) throw siteError;
        setSite(siteData);

        if (!siteData.oss_urn) {
          toast.error('This site does not have a 3D model yet');
          return;
        }

        // Load Forge Viewer
        await loadForgeViewer();

        // Get viewer token
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke(
          'aps-viewer-token'
        );

        if (tokenError) throw tokenError;

        const options = {
          env: 'AutodeskProduction',
          api: 'derivativeV2',
          getAccessToken: (callback: (token: string, expire: number) => void) => {
            callback(tokenData.access_token, tokenData.expires_in);
          },
        };

        window.Autodesk.Viewing.Initializer(options, () => {
          const viewer = new window.Autodesk.Viewing.GuiViewer3D(viewerContainerRef.current);
          viewer.start();
          viewerRef.current = viewer;

          const documentId = `urn:${siteData.oss_urn}`;
          window.Autodesk.Viewing.Document.load(
            documentId,
            (doc: any) => {
              const viewables = doc.getRoot().getDefaultGeometry();
              viewer.loadDocumentNode(doc, viewables).then(() => {
                setLoading(false);
                toast.success('3D model loaded successfully');
              });
            },
            (errorCode: any) => {
              console.error('Document load error:', errorCode);
              setLoading(false);
              if (errorCode === 3) {
                toast.error('Model is still processing. Please try again in a few minutes.');
              } else {
                toast.error('Failed to load 3D model');
              }
            }
          );
        });
      } catch (error: any) {
        console.error('Viewer initialization error:', error);
        setLoading(false);
        toast.error(error.message || 'Failed to initialize viewer');
      }
    };

    initViewer();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.finish();
      }
    };
  }, [siteId]);

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            onClick={() => navigate('/sites')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sites
          </Button>
          {site && (
            <div>
              <h1 className="text-2xl font-bold text-foreground">{site.name}</h1>
              {site.location && (
                <p className="text-muted-foreground">{site.location}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 relative bg-card rounded-lg overflow-hidden border border-dashboard-border">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading 3D model...</p>
              </div>
            </div>
          )}
          <div ref={viewerContainerRef} className="w-full h-full" />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Viewer;