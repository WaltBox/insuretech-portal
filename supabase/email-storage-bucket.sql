-- Create storage bucket for email images
-- Run this in Supabase SQL Editor

-- Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'email-assets',
  'email-assets',
  true, -- Public bucket so images can be accessed in emails
  5242880, -- 5MB file size limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for public read access
-- Allow anyone to read files from the email-assets bucket
CREATE POLICY "Public Access for Email Assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'email-assets');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload email assets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'email-assets' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update files
CREATE POLICY "Authenticated users can update email assets"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'email-assets' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete email assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'email-assets' 
  AND auth.role() = 'authenticated'
);



