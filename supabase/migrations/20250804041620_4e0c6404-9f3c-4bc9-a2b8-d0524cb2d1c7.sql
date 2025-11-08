-- Create sites table for storing telecom tower site data
CREATE TABLE public.sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  ifc_site_id TEXT,
  ifc_file_path TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'warning', 'offline')),
  sensors_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- Create policies for sites access
CREATE POLICY "Users can view all sites" 
ON public.sites 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own sites" 
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

-- Create storage bucket for IFC files
INSERT INTO storage.buckets (id, name, public) VALUES ('ifc-files', 'ifc-files', false);

-- Create storage policies for IFC files
CREATE POLICY "Users can view IFC files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'ifc-files');

CREATE POLICY "Users can upload IFC files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'ifc-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own IFC files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'ifc-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own IFC files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'ifc-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
