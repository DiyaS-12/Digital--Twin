import { useRef, useEffect, useState } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { supabase } from "@/integrations/supabase/client";

interface Site {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: "active" | "warning" | "error" | "unknown" | string;
  location?: string;
  description?: string;
  ifc_file_path?: string;
  ifc_site_id?: number | null; // ✅ number (converted from bigint)
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return Cesium.Color.LIME;
    case "warning":
      return Cesium.Color.ORANGE;
    case "error":
      return Cesium.Color.RED;
    default:
      return Cesium.Color.GREEN;
  }
};

const getStatusSize = (status: string) => {
  switch (status) {
    case "error":
      return 15;
    case "warning":
      return 12;
    case "active":
      return 10;
    default:
      return 8;
  }
};

export const Globe3D = () => {
  const cesiumContainer = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const ION_TOKEN =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4MDQ5M2FkMy0zZWY1LTRhMWItODNlYi1lYTA3OTE1NWE4ZDciLCJpZCI6MzUwNjY5LCJpYXQiOjE3NjA1MTM4MTJ9.uWoHR83JvEwAj3VtZ_NHwgfP6sH8p89y_T2WZngHc1g";

  // ---------------- Initialize Cesium Viewer ----------------
  useEffect(() => {
    if (!cesiumContainer.current || typeof Cesium === "undefined") return;
    Cesium.Ion.defaultAccessToken = ION_TOKEN;

    const viewer = new Cesium.Viewer(cesiumContainer.current, {
      baseLayerPicker: true,
      animation: true,
      timeline: true,
      fullscreenButton: true,
      geocoder: true,
      homeButton: true,
      infoBox: true,
      sceneModePicker: true,
      selectionIndicator: true,
      navigationHelpButton: true,
    });

    viewerRef.current = viewer;
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString("#0f172a");
    viewer.scene.globe.enableLighting = true;

    const fetchSites = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("sites")
        .select("*")
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      if (error) {
        console.error("❌ Supabase error fetching sites:", error);
        setLoading(false);
        return;
      }

      // ✅ Convert bigint IDs (returned as strings) to numbers
      const formattedSites: Site[] = (data || []).map((s: any) => ({
        ...s,
        ifc_site_id: s.ifc_site_id ? Number(s.ifc_site_id) : null,
      }));

      setSites(formattedSites);

      viewer.entities.removeAll();
      viewer.scene.primitives.removeAll();

      // ✅ Add markers and load tilesets
      for (const s of formattedSites) {
        // Add point marker
        viewer.entities.add({
          id: s.id,
          name: s.name,
          position: Cesium.Cartesian3.fromDegrees(
            Number(s.longitude),
            Number(s.latitude),
            0
          ),
          point: {
            pixelSize: getStatusSize(s.status),
            color: getStatusColor(s.status),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
          label: {
            text: s.name,
            font: "bold 14px sans-serif",
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            show: true,
          },
        });

        // Load 3D Tileset directly if exists
        if (s.ifc_site_id) {
          try {
            console.log(`🟢 Loading 3D Tileset for ${s.name}: Asset ${s.ifc_site_id}`);
            const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(s.ifc_site_id);
            viewer.scene.primitives.add(tileset);
          } catch (err) {
            console.error(`❌ Failed to load tileset for ${s.name}:`, err);
          }
        }
      }

      // Fit camera to all site markers
      if (formattedSites.length > 0) {
        const positions = formattedSites.map((site) =>
          Cesium.Cartesian3.fromDegrees(Number(site.longitude), Number(site.latitude))
        );
        try {
          viewer.camera.flyTo({
            destination: Cesium.Rectangle.fromCartesianArray(positions),
            duration: 2,
          });
        } catch (err) {
          console.warn("⚠️ Camera flyTo failed:", err);
        }
      }

      setLoading(false);
    };

    fetchSites();

    // ✅ Real-time updates
    const channel = supabase
      .channel("sites-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sites" },
        fetchSites
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);
  // -----------------------------------------------------------

  return (
    <div className="w-full h-full relative">
      <div
        ref={cesiumContainer}
        style={{ width: "100%", height: "100%", minHeight: "400px" }}
      />

      {loading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0, 0, 0, 0.8)",
            padding: "12px 20px",
            borderRadius: 8,
            color: "#fff",
            fontSize: 14,
            zIndex: 10,
          }}
        >
          Loading sites and 3D models...
        </div>
      )}
    </div>
  );
};

export default Globe3D;
