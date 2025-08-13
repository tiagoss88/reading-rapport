-- Fix storage bucket configuration for medidor-fotos
-- Make the bucket public so photos can be accessed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'medidor-fotos';

-- Create RLS policies for the medidor-fotos bucket
CREATE POLICY "Allow public access to medidor-fotos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'medidor-fotos');

CREATE POLICY "Allow authenticated users to upload to medidor-fotos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'medidor-fotos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update their uploads in medidor-fotos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'medidor-fotos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete their uploads in medidor-fotos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'medidor-fotos' AND auth.role() = 'authenticated');