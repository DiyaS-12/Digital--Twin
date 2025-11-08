-- Create sites table
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  ifc_file_path TEXT,
  oss_urn TEXT,
  ifc_site_id TEXT,
  status TEXT DEFAULT 'active',
  sensors_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sites
CREATE POLICY "Users can view their own sites"
  ON public.sites
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sites"
  ON public.sites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sites"
  ON public.sites
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sites"
  ON public.sites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.sites
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for IFC files
INSERT INTO storage.buckets (id, name, public)
VALUES ('ifc-files', 'ifc-files', false);

-- Storage policies for ifc-files bucket
CREATE POLICY "Users can upload their own IFC files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'ifc-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own IFC files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'ifc-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own IFC files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'ifc-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );