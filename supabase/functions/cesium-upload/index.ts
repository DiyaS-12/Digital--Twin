import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { glbData, uploadLocation, fileName } = await req.json();
    const { bucket, prefix, sessionToken } = uploadLocation;

    // ✅ Construct correct Cesium Ion S3 URL
    const s3Url = `https://${bucket}/${prefix}${fileName}`;
    console.log("Uploading to:", s3Url);

    // Convert base64 → Uint8Array
    const binaryString = atob(glbData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // ✅ Upload to Cesium’s pre-signed S3 URL
    const uploadRes = await fetch(s3Url, {
      method: "PUT",
      headers: {
        "Content-Type": "model/gltf-binary",
        "x-amz-security-token": sessionToken,
      },
      body: bytes,
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      throw new Error(`Cesium S3 upload failed: ${uploadRes.status} - ${errorText}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "GLB uploaded successfully to Cesium." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Upload failed:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
