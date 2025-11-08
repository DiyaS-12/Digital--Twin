import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('Authenticated user:', user.id);

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;

    if (!file || !fileName) {
      throw new Error('File and fileName are required');
    }

    console.log(`Uploading file: ${fileName}, size: ${file.size} bytes`);

    // Get APS token
    const clientId = Deno.env.get('APS_CLIENT_ID');
    const clientSecret = Deno.env.get('APS_CLIENT_SECRET');

    const tokenResponse = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        grant_type: 'client_credentials',
        scope: 'data:read data:write data:create bucket:create bucket:read',
      }),
    });

    const { access_token } = await tokenResponse.json();
    const bucketKey = `telecomtwin_${user.id.replace(/-/g, '_').toLowerCase()}`;

    console.log(`Using bucket: ${bucketKey}`);

    // Create bucket if it doesn't exist
    await fetch(`https://developer.api.autodesk.com/oss/v2/buckets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bucketKey: bucketKey,
        policyKey: 'transient',
      }),
    });

    // Upload file using S3 Signed URL flow (Direct-to-S3)
    const fileBuffer = await file.arrayBuffer();
    const objectName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    console.log(`Requesting S3 signed upload URL for ${objectName}`);
    const signedUrlResp = await fetch(
      `https://developer.api.autodesk.com/oss/v2/buckets/${bucketKey}/objects/${objectName}/signeds3upload`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    if (!signedUrlResp.ok) {
      const errorText = await signedUrlResp.text();
      console.error('Signed S3 upload URL error:', signedUrlResp.status, errorText);
      throw new Error(`Failed to get signed S3 upload URL: ${signedUrlResp.status}`);
    }

    const { uploadKey, urls } = await signedUrlResp.json();
    const signedUrl = urls?.[0];
    if (!signedUrl) {
      throw new Error('No signed URL returned for upload');
    }

    console.log('Uploading to S3 using signed URL');
    const s3UploadResp = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(file.size),
      },
      body: fileBuffer,
    });

    if (!s3UploadResp.ok) {
      const errorText = await s3UploadResp.text();
      console.error('S3 upload error:', s3UploadResp.status, errorText);
      throw new Error(`Failed to upload to S3: ${s3UploadResp.status}`);
    }

    // Capture the ETag from S3 (may be quoted)
    const etagHeader = s3UploadResp.headers.get('etag') || s3UploadResp.headers.get('ETag');
    const cleanedETag = etagHeader ? etagHeader.replace(/\"/g, '').replace(/"/g, '') : undefined;

    console.log('Completing S3 upload on OSS');
    const completeResp = await fetch(
      `https://developer.api.autodesk.com/oss/v2/buckets/${bucketKey}/objects/${objectName}/signeds3upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploadKey,
          size: file.size,
          ...(cleanedETag ? { eTags: [cleanedETag] } : {}),
        }),
      }
    );

    if (!completeResp.ok) {
      const errorText = await completeResp.text();
      console.error('Complete upload error:', completeResp.status, errorText);
      throw new Error(`Failed to complete upload: ${completeResp.status}`);
    }

    const completeData = await completeResp.json();
    const objectId: string = completeData.objectId;
    const urn = btoa(objectId).replace(/=/g, '');

    console.log(`File uploaded, URN: ${urn}`);

    // Trigger translation to SVF2
    const translationResponse = await fetch(
      'https://developer.api.autodesk.com/modelderivative/v2/designdata/job',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
          'x-ads-force': 'true',
        },
        body: JSON.stringify({
          input: {
            urn: urn,
          },
          output: {
            formats: [
              {
                type: 'svf2',
                views: ['2d', '3d'],
              },
            ],
          },
        }),
      }
    );

    if (!translationResponse.ok) {
      const errorText = await translationResponse.text();
      console.error('Translation error:', errorText);
      throw new Error(`Failed to start translation: ${translationResponse.status}`);
    }

    const translationData = await translationResponse.json();
    console.log('Translation started:', translationData);

    return new Response(
      JSON.stringify({ 
        urn: urn,
        objectId: objectId,
        bucketKey: bucketKey,
        status: 'processing',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in aps-upload:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});