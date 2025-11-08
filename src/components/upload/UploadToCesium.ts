// uploadToCesium.ts
import { supabase } from "@/integrations/supabase/client";

const CESIUM_ION_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Upload IFC file from Supabase Storage to Cesium Ion.
 * Automatically updates Supabase DB with new Cesium asset ID.
 */
export async function uploadToCesium(siteId: string, ifcFilePath: string) {
  try {
    // 1️⃣ Get the site record
    const { data: siteData, error: fetchError } = await supabase
      .from("sites")
      .select("id, name, ifc_site_id")
      .eq("id", siteId)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    // 2️⃣ If already uploaded, skip
    if (siteData.ifc_site_id) {
      console.log(`⚠️ Site ${siteId} already has a Cesium asset (${siteData.ifc_site_id}), skipping upload.`);
      return siteData;
    }

    // 3️⃣ Create Cesium asset
    const assetRes = await fetch("https://api.cesium.com/v1/assets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CESIUM_ION_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `IFC Upload - ${siteData.name}`,
        type: "3DTILES",
        description: `IFC model for site ${siteData.name}`,
      }),
    });

    if (!assetRes.ok) throw new Error(`Failed to create Cesium asset: ${assetRes.statusText}`);
    const asset = await assetRes.json();
    console.log("✅ Created Cesium asset:", asset);

    // 4️⃣ Upload IFC file from Supabase Storage to Cesium
    const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/${ifcFilePath}`;
    const uploadUrl = asset.uploadLocation.url;

    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) throw new Error("Failed to fetch IFC file from Supabase.");

    const blob = await fileResponse.blob();

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": "application/octet-stream" },
    });

    if (!uploadRes.ok) throw new Error("File upload to Cesium failed.");

    console.log("✅ Uploaded IFC file to Cesium:", uploadRes.status);

    // 5️⃣ Update Supabase DB with Cesium asset ID
    const { error: updateError } = await supabase
      .from("sites")
      .update({
        ifc_site_id: asset.assetMetadata.id.toString(),
      })
      .eq("id", siteId);

    if (updateError) throw new Error(updateError.message);

    console.log(`🌍 Updated site ${siteId} with Cesium asset ID: ${asset.assetMetadata.id}`);

    return asset.assetMetadata;
  } catch (err: any) {
    console.error("❌ Error in uploadToCesium:", err.message || err);
    throw err;
  }
}
