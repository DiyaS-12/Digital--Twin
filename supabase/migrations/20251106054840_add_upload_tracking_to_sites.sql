ALTER TABLE public.sites
ADD COLUMN IF NOT EXISTS upload_status TEXT DEFAULT 'pending' CHECK (upload_status IN ('pending','uploading','processing','completed','failed')),
ADD COLUMN IF NOT EXISTS upload_stage TEXT DEFAULT 'supabase' CHECK (upload_stage IN ('supabase','autodesk','cesium')),
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS last_uploaded_at TIMESTAMP WITH TIME ZONE;

--optional helper function for updating upload status easily
CREATE OR REPLACE FUNCTION public.update_site_upload_status(
    p_site_id UUID,
    p_status TEXT,
    p_stage TEXT DEFAULT NULL,
    p_error TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.sites
    SET
        upload_status = p_status,
        upload_stage = COALESCE(p_stage, upload_stage),
        error_message = p_error,
        last_uploaded_at = CASE WHEN p_status = 'completed' THEN now() ELSE last_uploaded_at END,
        updated_at = now()
    WHERE id = p_site_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
