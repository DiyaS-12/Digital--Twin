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

    const clientId = Deno.env.get('APS_CLIENT_ID');
    const clientSecret = Deno.env.get('APS_CLIENT_SECRET');

    // Get APS token
    const tokenResponse = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        grant_type: 'client_credentials',
        scope: 'data:read bucket:read',
      }),
    });

    const { access_token } = await tokenResponse.json();
    const bucketKey = `telecomtwin_${user.id.replace(/-/g, '_').toLowerCase()}`;

    console.log(`Listing objects in bucket: ${bucketKey}`);

    // List objects in the bucket
    const listResponse = await fetch(
      `https://developer.api.autodesk.com/oss/v2/buckets/${bucketKey}/objects`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    if (!listResponse.ok) {
      if (listResponse.status === 404) {
        // Bucket doesn't exist yet
        return new Response(
          JSON.stringify({ items: [] }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
      const errorText = await listResponse.text();
      console.error('List objects error:', errorText);
      throw new Error(`Failed to list objects: ${listResponse.status}`);
    }

    const data = await listResponse.json();
    
    // Transform the data to include URNs
    const items = (data.items || []).map((item: any) => ({
      objectKey: item.objectKey,
      objectId: item.objectId,
      urn: btoa(item.objectId).replace(/=/g, ''),
      size: item.size,
      contentType: item.contentType,
      location: item.location,
      createdDate: item.createdDate,
    }));

    console.log(`Found ${items.length} objects`);

    return new Response(
      JSON.stringify({ items }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in aps-list-models:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});