import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('APS_CLIENT_ID');
    const clientSecret = Deno.env.get('APS_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('APS credentials not configured');
    }

    console.log('Requesting APS token...');

    const response = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: 'data:read data:write data:create bucket:create bucket:read',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('APS auth error:', errorText);
      throw new Error(`APS authentication failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('APS token obtained successfully');

    return new Response(
      JSON.stringify({ 
        access_token: data.access_token,
        expires_in: data.expires_in 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in aps-auth:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});