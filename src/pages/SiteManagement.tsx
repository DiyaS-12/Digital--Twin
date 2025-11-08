import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IFCUpload } from '@/components/upload/IFCUpload';
import { SitesList } from '@/components/sites/SitesList';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus } from 'lucide-react';

const SiteManagement = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1);
    setUploadDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Site Management</h1>
            <p className="text-muted-foreground">Manage and monitor all telecom tower sites</p>
          </div>

          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add New Site
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload IFC File</DialogTitle>
              </DialogHeader>
              <IFCUpload onUploadComplete={handleUploadComplete} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search & Filters */}
        <Card className="p-6 bg-gradient-panel border-dashboard-border">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search sites by name or location..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">Filter by Status</Button>
            <Button variant="outline">Filter by Location</Button>
          </div>
        </Card>

        {/* Sites List */}
        <Card className="p-6 bg-gradient-panel border-dashboard-border">
          <SitesList refreshTrigger={refreshTrigger}/>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SiteManagement;
