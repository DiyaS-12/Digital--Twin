import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { convertIFCToGLTF } from './convertIFCToGLTF';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

interface IFCUploadProps {
  onUploadComplete?: () => void;
  retrySite?: {
    id: string;
    name: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    ifc_file_path?: string;
    oss_urn?: string;
  };
}

export const IFCUpload = ({ onUploadComplete, retrySite }: IFCUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ION_TOKEN =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4MDQ5M2FkMy0zZWY1LTRhMWItODNlYi1lYTA3OTE1NWE4ZDciLCJpZCI6MzUwNjY5LCJpYXQiOjE3NjA1MTM4MTJ9.uWoHR83JvEwAj3VtZ_NHwgfP6sH8p89y_T2WZngHc1g";

  //Prefill for retry
  useEffect(() => {
    if (retrySite) {
      setSiteName(retrySite.name);
      setLocation(retrySite.location || '');
      setCoordinates({
        lat: retrySite.latitude?.toString() || '',
        lng: retrySite.longitude?.toString() || '',
      });
    }
  }, [retrySite]);
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.ifc')) {
      toast.error('Please select a valid IFC file');
      return;
    }

    if (!siteName.trim()) {
      toast.error('Please enter a site name');
      return;
    }

    setIsUploading(true);
    setUploadSuccess(false);

    try {
      // ✅ 1️⃣ Check Auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error('Please sign in to upload files');
        return;
      }

      // ✅ 2️⃣ Upload to Supabase
      const timestamp = Date.now();
      const filename = `${user.id}/${timestamp}_${file.name}`;
      toast.info('Uploading to Supabase Storage...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ifc-files')
        .upload(filename, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload file');
        return;
      }

      // ✅ 3️⃣ Process with Autodesk APS
      toast.info('Processing with Autodesk...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in again');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aps-upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('APS upload error:', errorData);
        toast.error('Failed to process with Autodesk');
        return;
      }

      const apsData = await response.json();
      if (!apsData.urn) {
        console.error('No URN in response:', apsData);
        toast.error('Failed to process file with Autodesk');
        return;
      }

      // ✅ 4️⃣ Convert IFC → GLB
      toast.info('Converting IFC to GLTF (GLB)...');
      const glbBlob = await convertIFCToGLTF(file);
      const glbFileName = file.name.replace(/\.ifc$/i, '.glb');
      console.log(`🧩 Converted IFC → GLB: ${glbFileName}`);
      console.log(`📦 Size: ${(glbBlob.size / 1024 / 1024).toFixed(2)} MB`);

      // ✅ 5️⃣ Create Cesium Asset
      toast.info("Creating Cesium Ion asset...");
      const lat = parseFloat(coordinates.lat) || 25.2854;
      const lng = parseFloat(coordinates.lng) || 51.5310;
      const assetRes = await fetch("https://api.cesium.com/v1/assets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ION_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: siteName || "IFC Upload",
          description: `Uploaded from Supabase - ${user.id}`,
          type: "3DTILES",
          options: { 
            sourceType: "3D_MODEL" ,
            position: [lng, lat, 0],
            clampToTerrain: true
          },
        }),
      });

      const asset = await assetRes.json();

      if (!asset.uploadLocation || !asset.uploadLocation.endpoint) {
        console.error("Failed to create Cesium asset:", asset);
        const errorMessage =
          asset?.message ||
          asset?.errors?.[0]?.title ||
          asset?.errors?.detail ||
          "Failed to create Ion asset. Please verify Ion token and permissions.";
        toast.error(`Cesium asset creation failed: ${errorMessage}`);
        return;
      }

      // ✅ 6️⃣ Create tileset.json for 3DTILES
      /*const tilesetJson = {
        asset: {
          version: "1.0",
          tilesetVersion: "1.0.0"
        },
        geometricError: 500,
        root: {
          boundingVolume: {
            region: [
              parseFloat(coordinates.lng) || 51.5310,
              parseFloat(coordinates.lat) || 25.2854,
              parseFloat(coordinates.lng) + 0.001 || 51.5320,
              parseFloat(coordinates.lat) + 0.001 || 25.2864,
              0,
              100
            ]
          },
          geometricError: 100,
          refine: "ADD",
          content: {
            uri: glbFileName
          }
        }
      };*/

      // ✅ 7️⃣ Upload files to Cesium (S3)
      toast.info("Uploading files to Cesium Ion...");

      const { endpoint, bucket, prefix, accessKey, secretAccessKey, sessionToken } =
        asset.uploadLocation;

      const s3 = new S3Client({
        region: "us-east-1",
        endpoint,
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey,
          sessionToken,
        },
      });

      // Upload GLB
      const glbKey = `${prefix}${glbFileName}`;
      const glbArrayBuffer = await glbBlob.arrayBuffer();
      
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: glbKey,
        Body: new Uint8Array(glbArrayBuffer),
        ContentType: "model/gltf-binary",
      }));

      // Upload tileset.json
      /*const tilesetKey = `${prefix}tileset.json`;
      const tilesetBlob = new Blob([JSON.stringify(tilesetJson, null, 2)], {
        type: "application/json"
      });
      const tilesetArrayBuffer = await tilesetBlob.arrayBuffer();*/

      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: glbKey,
        Body: new Uint8Array(glbArrayBuffer),
        ContentType: "model/gltf-binary",
      }));

      toast.success("✅ Files successfully uploaded to Cesium!");

      // ✅ 8️⃣ Finalize Cesium upload
      toast.info("Finalizing Cesium upload...");
      await fetch(asset.onComplete.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" ,
          "Authorization": `Bearer ${ION_TOKEN}`, 
        },
        body: JSON.stringify(asset.onComplete.fields),
      });

      // ✅ Extract Cesium asset ID
      const cesiumAssetId = asset?.assetMetadata?.id ?? asset?.id ?? "Unknown";
      console.log("✅ Cesium Asset finalized with ID:", cesiumAssetId);

      // ✅ 9️⃣ Save site info in Supabase
      const latitude = coordinates.lat ? parseFloat(coordinates.lat) : null;
      const longitude = coordinates.lng ? parseFloat(coordinates.lng) : null;

      const { error: dbError } = await supabase.from('sites').insert({
        name: siteName,
        location: location || null,
        latitude,
        longitude,
        ifc_file_path: uploadData.path,
        oss_urn: apsData.urn, 
        status: 'processing',
        user_id: user.id,
        ifc_site_id: cesiumAssetId,
      });

      if (dbError) {
        console.error('Database error:', dbError);
        toast.error(`DB Error: ${dbError.message}`);
        return;
      }

      setUploadSuccess(true);
      toast.success('Site created! Model is being processed by Autodesk and Cesium.');

      // ✅ Reset form
      setSiteName('');
      setLocation('');
      setCoordinates({ lat: '', lng: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';

      onUploadComplete?.();

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };
  // Retry function
  const retryUpload = async () => {
    if(!retrySite || !retrySite.ifc_file_path) {
      toast.error("No file available for retry");
      return;
    }
    try {
      const { data: fileData, error } = await supabase.storage
        .from('ifc-files')
        .download(retrySite.ifc_file_path);
      if (error || !fileData) throw error || new Error("File not found in storage");
      const fileBlob = new File([fileData], retrySite.ifc_file_path.split("/").pop() || "file.ifc");
      await handleFileUpload({ target: {files: [fileBlob]}} as any);
    } catch (err) {
      console.error("Retry upload error:", err);
      toast.error("Failed to retry upload");
    }
  };
  return (
    <Card className="p-6 bg-gradient-panel border-dashboard-border">
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Upload className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Upload IFC File
          </h3>
          <p className="text-sm text-muted-foreground">
            Upload your telecom tower site IFC model file
          </p>
        </div>

        {uploadSuccess && (
          <Alert className="border-success/20 bg-success/5">
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              IFC file uploaded successfully! The site has been added to your dashboard.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="siteName">Site Name *</Label>
            <Input
              id="siteName"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="e.g., Qatar Tower A"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Doha, Qatar"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                value={coordinates.lat}
                onChange={(e) =>
                  setCoordinates((prev) => ({ ...prev, lat: e.target.value }))
                }
                placeholder="e.g., 25.2854"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                value={coordinates.lng}
                onChange={(e) =>
                  setCoordinates((prev) => ({ ...prev, lng: e.target.value }))
                }
                placeholder="e.g., 51.5310"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="ifcFile">IFC File *</Label>
            <div className="mt-1">
              <Input
                ref={fileInputRef}
                id="ifcFile"
                type="file"
                accept=".ifc"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
          </div>
        </div>

        {isUploading && (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Uploading IFC file and processing with Autodesk & Cesium...
            </AlertDescription>
          </Alert>
        )}
        {retrySite && (
          <Button onClick={retryUpload} variant="outline" size="sm">
            Retry Upload
          </Button>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-4 h-4" />
          <span>Only .ifc files are supported. Maximum file size: 50MB</span>
        </div>
      </div>
    </Card>
  );
};
